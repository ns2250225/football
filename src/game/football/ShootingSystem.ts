import * as THREE from 'three';
import type { GameEngine } from '../core/GameEngine';
import type { Player } from '../player/Player';
import { Ball, ShotRuntime, formColor } from './Football';
import { ShotSpec, ShotForm } from '../types';
import { mergeShots } from '../skills/SkillRegistry';
import { FIELD, PHYS } from '../../utils/physics';
import { clamp } from '../../utils/math';
import { rand } from '../../utils/random';
import { AudioManager } from '../audio/AudioManager';
import { explosion, shockwave } from '../vfx/ExplosionEffect';
import { iceBurst, iceZone } from '../vfx/IceEffect';
import { fireBurst, fireTrail } from '../vfx/FireEffect';
import { lightningChain, sparkTrail } from '../vfx/LightningEffect';

export interface ShotAim { z: number | null; high: number }
export interface ShotOpts { header?: boolean; volley?: boolean; penalty?: boolean; target?: THREE.Vector3; noSkills?: boolean }

const RAINBOW: { form: ShotForm; spec: ShotSpec }[] = [
  { form: 'fire', spec: { burn: 1, explode: 1.8, power: 0.1 } },
  { form: 'thunder', spec: { chain: 1.8, speed: 0.15 } },
  { form: 'ice', spec: { freezeZone: 2.2 } },
];

/** 射门系统：力量、精度、蓄力、旋转弧线、技能形态与命中效果 */
export class ShotSystem {
  constructor(private e: GameEngine) {}

  shoot(p: Player, charge: number, aim: ShotAim, extra: (ShotSpec | undefined)[] = [], opts: ShotOpts = {}): Ball | null {
    const e = this.e;
    const ball = e.balls.find((b) => b.owner === p) ?? e.balls.find((b) => !b.owner && b.pos.distanceTo(p.pos.clone().setY(b.pos.y)) < 1.5 && b.pos.y < 2.8);
    if (!ball) return null;
    const team = p.team;
    const gx = e.oppGoalX(team);
    const d = Math.sign(gx);
    const specs: (ShotSpec | undefined)[] = [...extra];
    if (!opts.noSkills) {
      if (p.side === 0) specs.push(...e.skills.collectShot(charge, p));
      else specs.push(...e.boss.collectShot(charge, p));
    }
    let spec = mergeShots(specs);
    if (spec.rainbow) {
      const r = rand.pick(RAINBOW);
      spec = mergeShots([spec, { ...r.spec, form: (spec.prio ?? 0) > 2 ? spec.form : r.form, prio: Math.max(2, spec.prio ?? 0) }]);
      if (!spec.form || (spec.prio ?? 0) <= 2) spec.form = r.form;
    }
    const gw = e.goalW / 2, gh = e.goalH;
    // 目标点
    const gk = e.opponents(p).find((x) => x.isGK && !x.sentOff);
    let tz: number;
    if (opts.target) tz = opts.target.z;
    else if (aim.z !== null) tz = clamp(aim.z, -1, 1) * (gw - 0.35);
    else { const gz = gk ? gk.pos.z : 0; tz = (gz > 0 ? -1 : 1) * rand.range(0.35, 0.85) * gw; if (Math.abs(gz) < 0.4) tz *= rand.chance(0.5) ? 1 : -1; }
    let ty = opts.target ? opts.target.y : spec.lob ? gh - 0.35 : clamp(0.25 + aim.high * (gh - 0.6) + charge * 0.35, 0.2, gh - 0.25);
    if (opts.header) ty = rand.range(0.3, 1.2);
    const target = new THREE.Vector3(gx + d * 0.6, ty, tz);
    // 力量
    const m = p.mods;
    const inBox = Math.abs(gx - p.pos.x) < FIELD.boxDepth && Math.abs(p.pos.z) < FIELD.boxW / 2;
    const long = !inBox;
    let pow = (16 + charge * 20) * p.shotPow * (1 + (spec.power ?? 0)) * e.params.ballPower;
    if (long) pow *= 1 + m.longShot; else pow *= 1 + m.boxShot * 0.7;
    if (opts.header) pow *= 0.6 + m.header * 0.5;
    const crit = (spec.crit ?? 0) > 0 || rand.chance(m.critChance);
    if (crit) { pow *= 1.35; spec.pierce = (spec.pierce ?? 0) + 0.15; }
    const speedMul = (1 + (spec.speed ?? 0)) * e.params.ballSpeed;
    let hs = clamp(pow * speedMul, 8, 50);
    // 精度
    const acc = clamp(p.shotAcc + (spec.accuracy ?? 0) * 0.5 + p.team.passive.shotAccBonus(charge) * 0.5, 0.15, 0.985);
    const errAng = rand.gauss() * (1 - acc) * 0.15 * (0.55 + charge * 0.6);
    let errY = rand.gauss() * (1 - acc) * 0.7;
    if (charge > 0.93 && !spec.lob) errY += (charge - 0.93) * 30 * (1.15 - acc);
    const from = ball.pos.clone();
    const flat = target.clone().sub(from).setY(0);
    const dist = Math.max(1, flat.length());
    let ang = Math.atan2(flat.z, flat.x) + errAng;
    // 弧线：初始方向外偏，旋转把足球拉回目标
    const curve = (spec.curve ?? 0) + (aim.z !== null ? Math.abs(aim.z) * 0.15 : 0.05);
    const cs = rand.chance(0.5) ? 1 : -1;
    ang += cs * 0.2 * (spec.curve ?? 0);
    if (spec.lob) hs *= 0.55;
    const t = dist / hs;
    const g = PHYS.GRAVITY * e.params.gravity;
    const vy = clamp((ty + errY - from.y) / t - 0.5 * g * t, -4, 26);
    ball.vel.set(Math.cos(ang) * hs, vy, Math.sin(ang) * hs);
    ball.spin.set(rand.range(-1, 1), cs * 10.5 * (spec.curve ?? 0) + rand.range(-curve, curve) * 2, rand.range(-1, 1));
    ball.owner = null;
    ball.touch(p, e.simT);
    ball.passTo = null; ball.magnet = null; ball.passFrom = null;
    // 射正判定（以误差后的瞄准点为准）
    const aimedZ = tz + Math.tan(errAng) * dist * (spec.homing ? 0.3 : 1);
    const onTarget = Math.abs(aimedZ) < gw && ty + errY < gh;
    const s: ShotRuntime = {
      by: p, side: p.side, spec, t: 0, target, startPos: from, hit: new Set(), refracted: 0, dipped: false, bounced: false, exploded: false,
      long, crit, gkDelay: (spec.afterimage ?? 0) * 0.45 + (spec.split ?? 0) * 0.03, form: spec.form, power: hs, onTargetCounted: false, decoys: [], header: !!opts.header,
    };
    for (let i = 0; i < (spec.split ?? 0); i++) s.decoys.push(new THREE.Vector3(rand.range(-1, 1), rand.range(-0.4, 0.6), rand.range(-1, 1)).multiplyScalar(0.35));
    ball.shot = s;
    p.touchCd = 0.35; p.kickLock = 0.3; p.stamina = Math.max(0, p.stamina - 4);
    p.playAnim(opts.header ? 'Header' : charge > 0.6 ? 'LongShoot' : 'Shoot');
    p.ms.shots++;
    p.team.stats.shots++;
    if (onTarget) { p.team.stats.onTarget++; s.onTargetCounted = true; }
    if (spec.curse && gk) { gk.addBuff({ gkSave: -spec.curse }, 5, 'curse'); e.fx.flash(gk.pos.clone().setY(1.6), '#6b21a8', 1.2, 0.5); e.particles.burst(gk.pos.clone().setY(1.5), ['#6b21a8', '#111'], 20, 3, 0.8, 0.15, 1); AudioManager.play('curse'); }
    // 特效与音效
    const col = formColor(spec.form);
    if (spec.form) {
      e.fx.flash(from, col, 1.4, 0.3);
      e.particles.burst(from, [col, '#ffffff'], 20, 7, 0.5, 0.18, 0);
      AudioManager.play(spec.form === 'fire' || spec.form === 'meteor' ? 'fire' : spec.form === 'thunder' || spec.form === 'light' ? 'zap' : spec.form === 'ice' ? 'ice' : spec.form === 'golden' ? 'golden' : 'shot_skill');
      if (p.side === 0) e.shake(0.25 + (spec.prio ?? 0) * 0.04);
    }
    if (crit) { e.toast('暴击射门！', '#f59e0b'); e.particles.burst(from, ['#fbbf24', '#ffffff'], 16, 6, 0.4, 0.14, 0); }
    AudioManager.play('kick', 0.6 + charge * 0.4);
    e.bus.emit('shot', { p, ball, long, onTarget, spec });
    if (onTarget) e.bus.emit('shotOnTarget', { p, ball });
    return ball;
  }

  update(dt: number) {
    const e = this.e;
    for (const b of e.balls) {
      const s = b.shot;
      if (!s) continue;
      s.t += dt;
      const sp = spec(s);
      const col = formColor(s.form);
      // 飞行拖尾
      b.trailT -= dt;
      if (b.trailT <= 0) {
        b.trailT = 0.016;
        const size = s.form === 'meteor' ? 0.5 : s.form ? 0.28 : 0.16;
        if (s.form === 'fire' || s.form === 'meteor') fireTrail(e.fx, b.pos);
        else if (s.form === 'thunder' || s.form === 'light') sparkTrail(e.fx, b.pos);
        e.particles.trail(b.pos, s.form ? col : '#e5e7eb', size, s.form ? 0.4 : 0.22, 0.1);
        for (const dcy of s.decoys) e.particles.trail(b.pos.clone().addScaledVector(dcy, s.t * 8), '#c4b5fd', 0.25, 0.25, 0.05);
        if (s.form === 'phantom') for (let k = 1; k <= 3; k++) e.particles.trail(b.pos.clone().addScaledVector(b.vel, -0.03 * k), '#a78bfa', 0.32, 0.18, 0);
      }
      const hv = new THREE.Vector2(b.vel.x, b.vel.z);
      const hsp = hv.length();
      // 追踪修正（平衡：最大修正角度 0.55 rad）
      if (sp.homing && hsp > 5) {
        const to = new THREE.Vector2(s.target.x - b.pos.x, s.target.z - b.pos.z);
        const ang = Math.atan2(hv.y, hv.x), want = Math.atan2(to.y, to.x);
        let diff = want - ang; while (diff > Math.PI) diff -= Math.PI * 2; while (diff < -Math.PI) diff += Math.PI * 2;
        const used = (s as unknown as { homingUsed?: number }).homingUsed ?? 0;
        const step = clamp(diff, -sp.homing * 1.4 * dt, sp.homing * 1.4 * dt);
        if (Math.abs(used) < 0.55) {
          const na = ang + step;
          b.vel.x = Math.cos(na) * hsp; b.vel.z = Math.sin(na) * hsp;
          (s as unknown as { homingUsed: number }).homingUsed = used + Math.abs(step);
          const dy = s.target.y - b.pos.y; b.vel.y += clamp(dy, -1, 1) * sp.homing * 3 * dt;
        }
      }
      // 空间折射
      if (sp.refract && s.refracted < sp.refract && s.t > 0.2 + s.refracted * 0.2) {
        s.refracted++;
        const gk = e.teams[1 - s.side].players.find((x) => x.isGK);
        const tz = (gk && gk.pos.z > 0 ? -1 : 1) * (e.goalW / 2 - 0.5);
        s.target.z = tz;
        const to = new THREE.Vector2(s.target.x - b.pos.x, s.target.z - b.pos.z).normalize().multiplyScalar(hsp);
        b.vel.x = to.x; b.vel.z = to.y;
        e.fx.flash(b.pos, '#38bdf8', 1, 0.25); e.particles.burst(b.pos, ['#38bdf8', '#e0f2fe'], 12, 5, 0.3, 0.14, 0);
        AudioManager.play('blink', 0.6);
      }
      // 重力下坠
      if (sp.dip && !s.dipped) {
        const total = Math.abs(s.target.x - s.startPos.x);
        if (Math.abs(b.pos.x - s.startPos.x) > total * 0.58) { s.dipped = true; b.vel.y -= 7 * sp.dip; e.particles.burst(b.pos, ['#7c3aed', '#c4b5fd'], 10, 3, 0.3, 0.12, 0); }
      }
      // 沿途效果：冲击波 / 闪电 / 引力
      if (sp.shockwave || sp.chain || sp.attract) {
        for (const op of e.teams[1 - s.side].players) {
          if (op.sentOff || s.hit.has(op.id)) continue;
          const d = op.pos.distanceTo(new THREE.Vector3(b.pos.x, 0, b.pos.z));
          if (sp.shockwave && d < sp.shockwave && !op.isGK) { s.hit.add(op.id); op.applyStatus('knock', 0.7, 6, b.pos); shockwave(e.fx, op.pos, 1.6); e.bus.emit('hit', { victim: op, attacker: s.by }); }
          else if (sp.chain && d < sp.chain && (!op.isGK || d < 1.2)) { s.hit.add(op.id); op.applyStatus('stun', op.isGK ? 0.35 : 0.8); lightningChain(e.fx, b.pos, op.pos); AudioManager.play('zap', 0.5); }
          else if (sp.attract && d < sp.attract && !op.isGK) { s.hit.add(op.id); op.applyStatus('slow', 0.8, 0.45); const pull = b.pos.clone().sub(op.pos).setY(0).normalize().multiplyScalar(5); op.vel.add(pull); }
        }
      }
      if (s.t > 2.6 || (hsp < 5 && b.pos.y < 0.5 && s.t > 0.4)) {
        this.onImpact(b, 'stop');
        b.shot = null;
      }
    }
  }

  onBounce(b: Ball) {
    const s = b.shot; if (!s) return;
    s.bounced = true;
    if (spec(s).bounceTurn) {
      const gk = this.e.teams[1 - s.side].players.find((x) => x.isGK);
      const tz = (gk && gk.pos.z > 0 ? -1 : 1) * (this.e.goalW / 2 - 0.6);
      const hsp = b.speed() * 1.05;
      const to = new THREE.Vector2(s.target.x - b.pos.x, tz - b.pos.z).normalize().multiplyScalar(hsp);
      b.vel.x = to.x; b.vel.z = to.y; b.vel.y = Math.max(b.vel.y, 3);
      s.target.z = tz;
      this.e.particles.burst(b.pos, ['#34d399', '#ffffff'], 12, 4, 0.3, 0.12, 0);
    }
  }

  /** 命中效果：爆炸、冰冻区域、火焰 */
  onImpact(b: Ball, kind: 'post' | 'player' | 'net' | 'stop' | 'save', hitP?: Player) {
    const e = this.e; const s = b.shot; if (!s || s.exploded) return;
    const sp = spec(s);
    if (kind === 'stop' && !sp.explode && !sp.freezeZone) return;
    s.exploded = true;
    const pos = b.pos.clone();
    if (sp.explode) {
      const r = sp.explode;
      explosion(e.fx, pos, r, s.form === 'nuke' ? '#84cc16' : s.form === 'meteor' ? '#ff4500' : '#ff7a00');
      AudioManager.play('explosion');
      e.shake(Math.min(1.2, 0.3 + r * 0.12));
      for (const op of e.players) {
        if (op.sentOff || op.side === s.side) continue;
        const d = op.pos.distanceTo(new THREE.Vector3(pos.x, 0, pos.z));
        if (d < r) { op.applyStatus('knock', op.isGK ? 0.9 : 1.1, 7, pos); e.bus.emit('hit', { victim: op, attacker: s.by }); }
      }
    }
    if (sp.freezeZone) {
      const r = sp.freezeZone;
      iceBurst(e.fx, pos, r); iceZone(e.fx, pos, r, 2.2);
      AudioManager.play('ice');
      e.zones.push({ pos: new THREE.Vector3(pos.x, 0, pos.z), r, t: 2.2, slow: 0.5, side: 1 - s.side as 0 | 1, color: '#bae6fd' });
      for (const op of e.teams[1 - s.side].players) {
        if (op.sentOff) continue;
        const d = op.pos.distanceTo(new THREE.Vector3(pos.x, 0, pos.z));
        if (d < r && (!op.isGK || r >= 5)) op.applyStatus('freeze', 1.6);
      }
    }
    if (sp.burn && hitP && hitP.side !== s.side) { fireBurst(e.fx, hitP.pos.clone().setY(1)); hitP.applyStatus('knock', 0.6 * sp.burn, 5, b.pos); }
    void kind;
  }
}
function spec(s: ShotRuntime): ShotSpec { return s.spec; }
