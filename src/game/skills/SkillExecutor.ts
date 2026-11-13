import * as THREE from 'three';
import type { GameEngine } from '../core/GameEngine';
import type { Player } from '../player/Player';
import { Op, SkillDef } from '../types';
import { FIELD } from '../../utils/physics';
import { clamp } from '../../utils/math';
import { rand } from '../../utils/random';
import { AudioManager } from '../audio/AudioManager';
import { playSkillVfx } from '../vfx/SkillVfx';
import { iceBurst } from '../vfx/IceEffect';
import { lightningStrike } from '../vfx/LightningEffect';

export interface ExecCtx { self: Player; lv: number; def: SkillDef; victim?: Player; attacker?: Player }

/**
 * 数据驱动技能执行器：所有 92 个基础技能、20 个进化技能与 12 个大招
 * 均由同一组操作原语（buff/status/dash/pullBall/clone/…）组合而成。
 */
export class SkillExecutor {
  constructor(private e: GameEngine) {}

  run(ops: Op[], ctx: ExecCtx) {
    for (const op of ops) this.exec(op, ctx);
  }

  private opponentsNear(self: Player, r: number, includeGK = false): Player[] {
    return this.e.opponents(self).filter((o) => !o.sentOff && (includeGK || !o.isGK) && o.pos.distanceTo(self.pos) < r);
  }

  private legalClamp(v: THREE.Vector3) {
    // 合法位置：不能进入球门区域，也不能离开球场
    v.x = clamp(v.x, -FIELD.L / 2 + FIELD.smallBoxDepth + 0.3, FIELD.L / 2 - FIELD.smallBoxDepth - 0.3);
    v.z = clamp(v.z, -FIELD.W / 2 + 0.5, FIELD.W / 2 - 0.5);
    v.y = 0;
  }

  exec(op: Op, ctx: ExecCtx) {
    const e = this.e; const self = ctx.self; const color = ctx.def.color;
    switch (op.t) {
      case 'buff': {
        const targets = op.target === 'self' ? [self] : op.target === 'team' ? e.teammates(self, true) : e.teammates(self, true).filter((m) => m.pos.distanceTo(self.pos) < (op.radius ?? 8));
        for (const t of targets) if (!t.sentOff) t.addBuff(op.mods, op.dur, ctx.def.id);
        playSkillVfx(e.fx, ctx.def.vfx, self.pos, color, op.radius ?? (op.target === 'team' ? 6 : 2.5));
        break;
      }
      case 'status': {
        let targets: Player[] = [];
        if (op.target === 'oppNear') targets = this.opponentsNear(self, op.radius ?? 4);
        else if (op.target === 'oppAll') targets = e.opponents(self).filter((o) => !o.sentOff && !o.isGK);
        else if (op.target === 'victim' && ctx.victim) targets = [ctx.victim];
        else if (op.target === 'attacker' && ctx.attacker) targets = [ctx.attacker];
        for (const t of targets) {
          const ok = t.applyStatus(op.status, op.dur, op.power ?? 0, self.pos);
          if (!ok) continue;
          e.bus.emit('hit', { victim: t, attacker: self });
          if (op.status === 'knock' || op.status === 'stun' || op.status === 'freeze') for (const b of e.balls) if (b.owner === t) { b.owner = null; b.vel.copy(t.pos.clone().sub(self.pos).setY(0).normalize().multiplyScalar(5)); b.vel.y = 2; }
          if (op.status === 'freeze') iceBurst(e.fx, t.pos, 1.2);
          if (op.fx === 'thunder') lightningStrike(e.fx, t.pos);
        }
        playSkillVfx(e.fx, op.fx === 'ice' ? 'ice_burst' : op.fx === 'quake' ? 'quake' : op.fx === 'time' ? 'time' : op.fx === 'wind' ? 'whirl' : ctx.def.vfx, self.pos, color, op.radius ?? 3);
        break;
      }
      case 'dash': {
        const dir = self.dir();
        if (op.mode === 'blink') {
          const owned = e.balls.find((b) => b.owner === self);
          const to = self.pos.clone().addScaledVector(dir, op.dist); this.legalClamp(to);
          playSkillVfx(e.fx, 'blink', self.pos, color);
          self.pos.copy(to);
          if (owned) { owned.pos.set(to.x + dir.x * 0.6, owned.r, to.z + dir.z * 0.6); owned.vel.copy(self.vel); }
          playSkillVfx(e.fx, 'blink', to, color);
        } else if (op.mode === 'toBallPath') {
          const b = e.balls[0];
          let best = b.pos.clone(), bd = 1e9;
          for (let t = 0; t <= 1.2; t += 0.05) {
            const pt = b.pos.clone().addScaledVector(b.vel, t).setY(0);
            const d = pt.distanceTo(self.pos);
            if (d < op.dist && d < bd + t * 4) { bd = d; best = pt; }
          }
          this.startDash(self, best.sub(self.pos).setY(0), op.speed ?? 24, Math.min(op.dist, bd), 0, false);
        } else if (op.mode === 'toDefense') {
          const goal = new THREE.Vector3(e.ownGoalX(self.team) * 0.7, 0, 0);
          this.startDash(self, goal.sub(self.pos).setY(0), op.speed ?? 18, op.dist, 0, false);
        } else {
          const len = op.dist;
          this.startDash(self, dir, op.speed ?? 16, len, op.knock ?? 0, op.mode === 'fly');
        }
        playSkillVfx(e.fx, ctx.def.vfx, self.pos, color);
        break;
      }
      case 'pullBall': {
        const b = e.balls.filter((x) => !x.owner || x.owner.side !== self.side).sort((a, c) => a.pos.distanceTo(self.pos) - c.pos.distanceTo(self.pos))[0];
        if (b && b.pos.distanceTo(self.pos) < op.radius) {
          if (b.owner && b.owner.side !== self.side) { b.owner.applyStatus('stun', 0.4); b.owner = null; }
          b.pullT = op.dur; b.pullTo = self; b.pullPow = op.power; b.shot = null; b.passTo = null; b.magnet = null;
        }
        playSkillVfx(e.fx, 'pull', self.pos, color, op.radius);
        AudioManager.play('magnet');
        break;
      }
      case 'clone': for (let i = 0; i < op.count; i++) e.spawnClone(self, op.mode, op.dur, i, op.count); playSkillVfx(e.fx, 'phantom', self.pos, color); break;
      case 'nextPass': e.skills.nextPassT = Math.max(e.skills.nextPassT, op.dur); break;
      case 'jump': {
        const h = op.height * (1 + self.mods.jump);
        self.jumpV = Math.sqrt(2 * 19 * h); self.jumpsLeft = op.double ? 1 : 0;
        self.playAnim('Jump');
        playSkillVfx(e.fx, 'jump', self.pos, color);
        AudioManager.play('jump');
        break;
      }
      case 'swap': {
        const gx = e.oppGoalX(self.team);
        const mates = e.teammates(self).filter((m) => !m.sentOff && !m.isGK);
        mates.sort((a, b) => Math.abs(gx - a.pos.x) - Math.abs(gx - b.pos.x));
        const m = mates[0];
        if (m && Math.abs(gx - m.pos.x) < Math.abs(gx - self.pos.x)) {
          const a = self.pos.clone(); playSkillVfx(e.fx, 'swap', a, color); playSkillVfx(e.fx, 'swap', m.pos, color);
          const owned = e.balls.find((b) => b.owner === self);
          if (owned) owned.owner = m; // 足球不瞬移：原地交由队友控制
          self.pos.copy(m.pos); m.pos.copy(a);
        }
        break;
      }
      case 'recall': {
        const b = e.balls.filter((x) => !x.owner).sort((a, c) => a.pos.distanceTo(self.pos) - c.pos.distanceTo(self.pos))[0];
        if (b) {
          const to = self.pos.clone().sub(b.pos).setY(0);
          const d = to.length();
          to.normalize().multiplyScalar(Math.min(22, 8 + d * 0.9) * op.power);
          b.vel.set(to.x, Math.min(8, d * 0.35), to.z); b.shot = null; b.passTo = self;
          e.fx.bolt(b.pos, self.pos.clone().setY(1), color, 0.3);
        }
        AudioManager.play('magnet');
        break;
      }
      case 'nextShot': e.skills.nextShot = { spec: op.shot, t: op.dur, name: ctx.def.name }; e.toast(`下一次射门：${ctx.def.name}`, color); break;
      case 'shootNow': {
        if (e.balls.some((b) => b.owner === self)) e.shots.shoot(self, 0.85, { z: null, high: 0.35 }, [op.shot]);
        else { e.skills.nextShot = { spec: op.shot, t: 8, name: ctx.def.name }; e.toast(`下一次射门：${ctx.def.name}`, color); }
        break;
      }
      case 'float': for (const b of e.balls) if (b.pos.distanceTo(self.pos) < op.radius) { b.floatT = op.dur; if (b.owner && b.owner.side !== self.side) b.owner = null; b.vel.y = Math.max(b.vel.y, 4); } playSkillVfx(e.fx, 'float', self.pos, color, op.radius); break;
      case 'shield': self.shieldT = Math.max(self.shieldT, op.dur); self.shieldHits = Math.max(self.shieldHits, op.hits); AudioManager.play('shield'); break;
      case 'gk': {
        const gk = e.teams[self.side].players.find((p) => p.isGK && !p.sentOff);
        if (gk) { gk.addBuff(op.mods, op.dur, ctx.def.id); playSkillVfx(e.fx, 'gk_glow', gk.pos, color); }
        if (op.invincible) e.teams[self.side].gkInvT = Math.max(e.teams[self.side].gkInvT, op.dur);
        break;
      }
      case 'meteor': {
        const opps = e.opponents(self).filter((o) => !o.sentOff);
        const carrier = opps.find((o) => e.balls.some((b) => b.owner === o));
        let target = carrier ? carrier.pos.clone() : new THREE.Vector3(e.oppGoalX(self.team) * 0.75, 0, 0);
        // 寻找对手最密集位置
        let best = 0;
        for (const o of opps) { const n = opps.filter((x) => x.pos.distanceTo(o.pos) < op.radius).length; if (n > best) { best = n; target = o.pos.clone(); } }
        target.y = 0;
        AudioManager.play('rocket');
        e.fx.meteor(target, () => {
          AudioManager.play('explosion'); e.shake(1.2);
          for (const o of e.opponents(self)) if (!o.sentOff && o.pos.distanceTo(target) < op.radius) { o.applyStatus('knock', op.dur, 8, target); e.bus.emit('hit', { victim: o, attacker: self }); }
          for (const b of e.balls) if (b.pos.distanceTo(target) < op.radius) { if (b.owner && b.owner.side !== self.side) b.owner = null; b.vel.add(b.pos.clone().sub(target).setY(0).normalize().multiplyScalar(6)).setY(5); }
        });
        break;
      }
      case 'thunderAll': {
        e.opponents(self).filter((o) => !o.sentOff).forEach((o, i) => {
          e.delay(0.12 * i, () => { lightningStrike(e.fx, o.pos); AudioManager.play('thunder', 0.5); o.applyStatus('stun', o.isGK ? op.dur * 0.45 : op.dur); for (const b of e.balls) if (b.owner === o) b.owner = null; });
        });
        e.flashScreen('#fef08a');
        break;
      }
      case 'teleport': {
        const gx = e.oppGoalX(self.team);
        const owned = e.balls.find((b) => b.owner === self);
        let best: THREE.Vector3 | null = null, bestScore = -1;
        for (let i = 0; i < 12; i++) {
          const cand = new THREE.Vector3(gx - Math.sign(gx) * (FIELD.boxDepth + rand.range(1, 3)), 0, rand.range(-6, 6));
          this.legalClamp(cand);
          const free = Math.min(...e.opponents(self).filter((o) => !o.sentOff).map((o) => o.pos.distanceTo(cand)));
          if (free > bestScore) { bestScore = free; best = cand; }
        }
        if (best) {
          playSkillVfx(e.fx, 'blink', self.pos, '#7c3aed');
          self.pos.copy(best);
          self.heading = Math.atan2(0 - best.z, gx - best.x);
          if (owned) owned.pos.set(best.x + Math.sign(gx) * 0.6, owned.r, best.z);
          playSkillVfx(e.fx, 'blink', best, '#7c3aed');
          e.fx.ring(best, '#7c3aed', 0.3, 3, 0.5);
        }
        break;
      }
      case 'giant': self.giantT = op.dur; self.scale = op.scale; self.addBuff(op.mods, op.dur, ctx.def.id); e.shake(0.6); AudioManager.play('quake'); break;
      case 'tornado': {
        e.fx.tornado(() => self.pos, op.dur);
        const ticks = Math.floor(op.dur / 0.4);
        for (let i = 0; i < ticks; i++) e.delay(i * 0.4, () => {
          for (const o of this.opponentsNear(self, op.radius)) { o.applyStatus('knock', 0.6, 6, self.pos); for (const b of e.balls) if (b.owner === o) b.owner = null; }
          const b = e.balls.filter((x) => !x.owner).sort((a, c) => a.pos.distanceTo(self.pos) - c.pos.distanceTo(self.pos))[0];
          if (b && b.pos.distanceTo(self.pos) < op.radius * 2.5) { b.pullT = 0.5; b.pullTo = self; b.pullPow = 40; }
        });
        AudioManager.play('wind');
        break;
      }
      case 'storm': {
        const opps = e.opponents(self).filter((o) => !o.sentOff && !o.isGK);
        for (let i = 0; i < op.count; i++) {
          const target = opps[i % Math.max(1, opps.length)];
          if (!target) break;
          e.delay((op.dur / op.count) * i, () => e.fx.orb(self.pos.clone().setY(1.5), () => target.pos.clone().setY(1), rand.pick(['#f43f5e', '#fbbf24', '#38bdf8']), 0.55, () => { target.applyStatus('stun', 1.5); AudioManager.play('explosion', 0.4); for (const b of e.balls) if (b.owner === target) b.owner = null; }));
        }
        break;
      }
      case 'barrier': {
        const team = e.teams[self.side];
        if (e.barriers.some((b) => b.side === self.side && b.hits > 0)) break;
        const gx = e.ownGoalX(team);
        const handle = e.fx.barrier(gx - Math.sign(gx) * 0.6, e.goalW + 0.4, e.goalH + 0.3, 9999);
        e.barriers.push({ side: self.side, hits: op.hits, handle });
        break;
      }
      case 'postGuard': e.postGuard[e.ownGoalX(e.teams[self.side]) < 0 ? 0 : 1] = op.dur; playSkillVfx(e.fx, 'post', new THREE.Vector3(e.ownGoalX(e.teams[self.side]), 0, 0), color); break;
      case 'aura': for (const o of this.opponentsNear(self, op.radius)) { o.slowT = Math.max(o.slowT, op.dur); o.slowAmt = Math.max(o.slowAmt, op.slow); } break;
      case 'oppSlowAll': for (const o of e.opponents(self)) if (!o.sentOff) o.applyStatus('slow', op.dur, op.slow); playSkillVfx(e.fx, 'time', self.pos, color, 14); break;
      case 'cooldownCut': e.skills.cutCooldowns(op.amount); break;
    }
  }

  startDash(p: Player, dir: THREE.Vector3, speed: number, dist: number, knock: number, fly: boolean) {
    if (dir.lengthSq() < 0.001) dir = p.dir();
    dir.normalize();
    p.dashVel.copy(dir).multiplyScalar(speed);
    p.dashT = dist / speed;
    p.dashKnock = knock; p.dashHit.clear(); p.flying = fly;
    p.heading = Math.atan2(dir.z, dir.x);
    if (fly) { p.jumpV = Math.max(p.jumpV, 7); }
    p.playAnim('Sprint');
  }
}
