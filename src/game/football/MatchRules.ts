import * as THREE from 'three';
import type { GameEngine } from '../core/GameEngine';
import type { Player } from '../player/Player';
import type { Ball } from './Football';
import { FIELD } from '../../utils/physics';
import { rand } from '../../utils/random';
import { clamp } from '../../utils/math';
import { AudioManager } from '../audio/AudioManager';

export type SetPieceType = 'kickoff' | 'throwIn' | 'corner' | 'goalKick' | 'freeKick' | 'penalty';
export const SP_NAME: Record<SetPieceType, string> = { kickoff: '开球', throwIn: '界外球', corner: '角球', goalKick: '球门球', freeKick: '任意球', penalty: '点球' };

export interface SetPiece { type: SetPieceType; side: 0 | 1; pos: THREE.Vector3; taker: Player; t: number }

/**
 * 比赛规则：开球、进球后重新开球、界外球、角球、球门球、犯规、任意球、点球、黄牌、红牌。
 * 5v5 简化规则：不设越位；界外球以手抛传球方式执行（只能传球）。
 */
export class MatchRules {
  pending: { type: SetPieceType; side: 0 | 1; pos: THREE.Vector3 } | null = null;
  deadT = 0;
  sp: SetPiece | null = null;
  lastFoulT = -10;
  constructor(private e: GameEngine) {}

  inBox(x: number, z: number, goalX: number): boolean {
    return Math.abs(x - goalX) < FIELD.boxDepth && Math.sign(goalX) * x > 0 && Math.abs(z) < FIELD.boxW / 2;
  }

  out(ball: Ball, kind: 'side' | 'goalLine', x: number, z: number, goalX: number) {
    const e = this.e;
    if (!ball.isMain) { ball.reset(0, rand.chance(0.5) ? 5 : -5); ball.vel.set(0, 6, 0); return; }
    const last = ball.lastTouch;
    const lastSide: 0 | 1 = last ? last.side : 0;
    ball.dead = true;
    if (kind === 'side') {
      const side = (1 - lastSide) as 0 | 1;
      this.schedule('throwIn', side, new THREE.Vector3(clamp(x, -FIELD.L / 2 + 1, FIELD.L / 2 - 1), 0, Math.sign(z) * (FIELD.W / 2 - 0.2)));
    } else {
      // 底线：防守方最后触球 → 角球；进攻方最后触球 → 球门球
      const defSide: 0 | 1 = e.ownGoalX(e.teams[0]) * goalX > 0 ? 0 : 1;
      if (lastSide === defSide) {
        const att = (1 - defSide) as 0 | 1;
        e.teams[att].stats.corners++;
        this.schedule('corner', att, new THREE.Vector3(Math.sign(goalX) * (FIELD.L / 2 - 0.4), 0, Math.sign(z || 1) * (FIELD.W / 2 - 0.4)));
      } else {
        this.schedule('goalKick', defSide, new THREE.Vector3(goalX - Math.sign(goalX) * 2.2, 0, 0));
      }
    }
    e.bus.emit('out', { kind });
  }

  schedule(type: SetPieceType, side: 0 | 1, pos: THREE.Vector3, delay = 1.1) {
    const e = this.e;
    this.pending = { type, side, pos };
    this.deadT = delay;
    e.setPhase('dead');
    AudioManager.play('whistle');
    e.toast(`${SP_NAME[type]}：${e.teams[side].def.name}`, side === 0 ? '#4ade80' : '#f87171');
  }

  foul(off: Player, vic: Player, severity: number) {
    const e = this.e;
    if (e.phase !== 'play' || e.simT - this.lastFoulT < 1) return;
    this.lastFoulT = e.simT;
    off.team.stats.fouls++; off.ms.fouls++;
    vic.applyStatus('knock', 0.9, 3, off.pos);
    e.bus.emit('foul', { off, vic });
    // 黄牌 / 红牌
    const r = rand.next();
    let card: 'yellow' | 'red' | null = null;
    if (!off.isGK && r < 0.015 + severity * 0.05) card = 'red';
    else if (r < 0.14 + severity * 0.25) { off.cards++; card = off.cards >= 2 ? 'red' : 'yellow'; }
    if (card) {
      e.recordCard(off, card);
      AudioManager.play('card');
      e.banner(card === 'yellow' ? '🟨 黄牌' : '🟥 红牌', `${off.team.def.name} ${off.name}`, card === 'yellow' ? '#facc15' : '#ef4444');
      if (card === 'red') e.sendOff(off);
    }
    // 受伤
    if (vic.side === 0 && rand.chance(0.06 + severity * 0.1)) { vic.injured = true; e.injuries.add(vic.rp.id); e.toast(`${vic.name} 受伤了！`, '#f97316'); }
    const pos = vic.pos.clone().setY(0);
    const vicSide = vic.side;
    const defGoal = e.ownGoalX(off.team);
    for (const b of e.balls) { if (b.owner) b.owner = null; }
    if (this.inBox(pos.x, pos.z, defGoal)) this.schedule('penalty', vicSide, new THREE.Vector3(defGoal - Math.sign(defGoal) * FIELD.penSpot, 0, 0), 1.6);
    else this.schedule('freeKick', vicSide, new THREE.Vector3(clamp(pos.x, -FIELD.L / 2 + 1, FIELD.L / 2 - 1), 0, clamp(pos.z, -FIELD.W / 2 + 1, FIELD.W / 2 - 1)));
  }

  startKickoff(side: 0 | 1) { this.schedule('kickoff', side, new THREE.Vector3(0, 0, 0), 0.6); }

  private chooseTaker(type: SetPieceType, side: 0 | 1, pos: THREE.Vector3): Player {
    const team = this.e.teams[side];
    const field = team.players.filter((p) => !p.sentOff && !p.isGK);
    if (type === 'goalKick') return team.players.find((p) => p.isGK && !p.sentOff) ?? field[0];
    if (type === 'kickoff') return field.find((p) => p.role === 'FW') ?? field[0];
    if (type === 'penalty') {
      const core = field.find((p) => p.isCore);
      if (core) return core;
      return [...field].sort((a, b) => b.shotAcc + b.shotPow - a.shotAcc - a.shotPow)[0];
    }
    if (side === 0 && this.e.controlled && !this.e.controlled.isGK && !this.e.controlled.sentOff && type === 'freeKick') {
      const core = field.find((p) => p.isCore); if (core) return core;
    }
    return [...field].sort((a, b) => a.pos.distanceTo(pos) - b.pos.distanceTo(pos))[0];
  }

  /** 定位球站位 */
  arrange(type: SetPieceType, side: 0 | 1, pos: THREE.Vector3, taker: Player) {
    const e = this.e;
    for (const t of e.teams) {
      for (const p of t.players) {
        if (p.sentOff) continue;
        p.vel.set(0, 0, 0); p.state = 'normal'; p.stateT = 0; p.knockT = 0; p.dashT = 0; p.flying = false; p.jumpY = 0; p.jumpV = 0;
        const d = t.dir;
        const own = -d * FIELD.L / 2;
        let x: number, z: number;
        if (type === 'kickoff') {
          const base: Record<string, [number, number]> = { GK: [-20.6, 0], DF: [-11, 0], MF: [-6, 0], FW: [-3, 0] };
          [x, z] = base[p.role];
          if (p.role === 'FW') z = p.slot === 3 ? -4 : 4;
          if (p.role === 'MF') z = -1.5;
          if (p.role === 'DF') z = 2;
          if (t.side === side && p === taker) { x = -0.4; z = 0; }
          else if (t.side !== side && Math.hypot(x, z) < FIELD.centerR + 0.6) { x = -(FIELD.centerR + 0.8); }
          x *= d;
          p.heading = d > 0 ? 0 : Math.PI;
        } else if (type === 'penalty') {
          if (p === taker) { x = pos.x - Math.sign(pos.x) * 0.9; z = 0; }
          else if (p.isGK && t.side !== side) { x = Math.sign(pos.x) * (FIELD.L / 2 - 0.3); z = 0; }
          else if (p.isGK) { x = own + d * 1; z = 0; }
          else { x = pos.x - Math.sign(pos.x) * (4 + p.slot * 0.8); z = (p.slot % 2 ? 1 : -1) * (FIELD.boxW / 2 + 1 + p.slot); }
          p.heading = Math.sign(pos.x) > 0 ? 0 : Math.PI;
        } else {
          const tgt = e.teamAI.formationTarget(p, pos, t.side === side);
          x = tgt.x; z = tgt.z;
          if (type === 'corner' && t.side === side && !p.isGK && p !== taker) {
            const gx = Math.sign(pos.x) * FIELD.L / 2;
            const spots = [[gx - Math.sign(gx) * 6, 0], [gx - Math.sign(gx) * 3.5, -2.5], [gx - Math.sign(gx) * 4, 3], [gx - Math.sign(gx) * 10, 1]];
            [x, z] = spots[p.slot % spots.length];
          }
          if (type === 'corner' && t.side !== side && !p.isGK) {
            const gx = Math.sign(pos.x) * FIELD.L / 2;
            const spots = [[gx - Math.sign(gx) * 2, -1.5], [gx - Math.sign(gx) * 5, 1.5], [gx - Math.sign(gx) * 4.5, -3], [gx - Math.sign(gx) * 8, 0]];
            [x, z] = spots[p.slot % spots.length];
          }
          if (type === 'goalKick' && t.side !== side) {
            const gx = pos.x + Math.sign(pos.x) * 2.2;
            if (this.inBox(x, z, gx)) x = gx - Math.sign(gx) * (FIELD.boxDepth + 1);
          }
          if (p === taker) {
            const toward = new THREE.Vector3(-pos.x, 0, -pos.z).normalize();
            if (type === 'goalKick' || type === 'freeKick') toward.set(d, 0, 0);
            x = pos.x - toward.x * 0.75; z = pos.z - toward.z * 0.75;
            p.heading = Math.atan2(toward.z, toward.x);
          }
          // 对手需离开足球 4.5 米
          if (t.side !== side && !p.isGK) {
            const dx = x - pos.x, dz = z - pos.z; const dd = Math.hypot(dx, dz);
            if (dd < 4.5) { const k = 4.5 / Math.max(0.1, dd); x = pos.x + dx * k; z = pos.z + dz * k; if (dd < 0.1) x = pos.x - d * 4.5; }
          }
        }
        p.pos.set(clamp(x, -FIELD.L / 2 + 0.3, FIELD.L / 2 - 0.3), 0, clamp(z, -FIELD.W / 2 + 0.3, FIELD.W / 2 - 0.3));
        if (p === taker && type === 'throwIn') p.pos.z = Math.sign(pos.z) * (FIELD.W / 2 + 0.1);
      }
    }
  }

  beginSetPiece() {
    const e = this.e;
    const pend = this.pending; if (!pend) return;
    this.pending = null;
    const taker = this.chooseTaker(pend.type, pend.side, pend.pos);
    this.arrange(pend.type, pend.side, pend.pos, taker);
    const main = e.balls[0];
    main.reset(pend.pos.x, pend.pos.z);
    if (pend.type === 'throwIn') main.pos.set(taker.pos.x, 1.6, taker.pos.z);
    for (let i = 1; i < e.balls.length; i++) if (pend.type === 'kickoff') e.balls[i].reset(0, i % 2 ? 6 : -6);
    if (pend.type !== 'throwIn') main.owner = taker;
    this.sp = { type: pend.type, side: pend.side, pos: pend.pos.clone(), taker, t: 0 };
    if (pend.side === 0 && !taker.isGK) e.switchTo(taker, false);
    else if (pend.side === 1) {
      const d = e.teams[0].players.filter((p) => !p.sentOff && !p.isGK).sort((a, b) => a.pos.distanceTo(pend.pos) - b.pos.distanceTo(pend.pos))[0];
      if (d) e.switchTo(d, false);
    }
    e.setPhase('setpiece');
    if (pend.type === 'kickoff') e.bus.emit('kickoff', { side: pend.side });
  }

  canShoot(): boolean { const t = this.sp?.type; return t === 'freeKick' || t === 'penalty' || t === 'corner' || t === 'kickoff'; }

  /** 执行定位球 */
  take(action: 'pass' | 'long' | 'shoot', dir: THREE.Vector3 | null, charge = 0.7, aimZ: number | null = null) {
    const e = this.e; const sp = this.sp; if (!sp) return;
    const taker = sp.taker;
    const main = e.balls[0];
    if (sp.type !== 'throwIn') main.owner = taker;
    e.setPhase('play');
    this.sp = null;
    if (action === 'shoot' && this.canShoot()) e.shots.shoot(taker, charge, { z: aimZ, high: sp.type === 'penalty' ? rand.range(0.1, 0.7) : 0.4 }, [], { penalty: sp.type === 'penalty' });
    else e.passes.pass(taker, dir, action === 'long' || sp.type === 'corner' || sp.type === 'goalKick', { throwIn: sp.type === 'throwIn' });
    if (main.owner === taker) main.owner = null;
  }

  update(dt: number) {
    const e = this.e;
    if (e.phase === 'dead') {
      this.deadT -= dt;
      for (const p of e.players) p.vel.multiplyScalar(0.9);
      if (this.deadT <= 0) this.beginSetPiece();
      return;
    }
    if (e.phase !== 'setpiece' || !this.sp) return;
    const sp = this.sp;
    sp.t += dt;
    const main = e.balls[0];
    // 主罚者站定
    if (sp.type === 'throwIn') { main.pos.set(sp.taker.pos.x, 1.7, sp.taker.pos.z); main.vel.set(0, 0, 0); }
    else { main.pos.set(sp.pos.x, main.r, sp.pos.z); main.vel.set(0, 0, 0); main.owner = sp.taker; }
    // 对手保持距离
    for (const p of e.teams[1 - sp.side].players) {
      if (p.sentOff || p.isGK) continue;
      const dx = p.pos.x - sp.pos.x, dz = p.pos.z - sp.pos.z; const dd = Math.hypot(dx, dz);
      const min = sp.type === 'penalty' ? 0 : 4.2;
      if (dd < min && dd > 0.01) { p.pos.x = sp.pos.x + (dx / dd) * min; p.pos.z = sp.pos.z + (dz / dd) * min; }
    }
    const human = sp.side === 0 && sp.taker.ctrl;
    const delay = sp.type === 'kickoff' ? 0.9 : 1.1;
    if (!human && sp.t > delay + rand.range(0, 0.3)) this.aiTake();
    else if (human && sp.t > 9) this.take('pass', null);
  }

  aiTake() {
    const e = this.e; const sp = this.sp; if (!sp) return;
    const gx = e.oppGoalX(sp.taker.team);
    const dGoal = Math.abs(gx - sp.pos.x) + Math.abs(sp.pos.z) * 0.5;
    switch (sp.type) {
      case 'penalty': this.take('shoot', null, rand.range(0.7, 0.88), rand.range(-0.95, 0.95)); break;
      case 'freeKick': if (dGoal < 20 && rand.chance(0.55)) this.take('shoot', null, rand.range(0.65, 0.9)); else this.take(rand.chance(0.6) ? 'pass' : 'long', new THREE.Vector3(Math.sign(gx), 0, 0)); break;
      case 'corner': this.take('long', new THREE.Vector3(Math.sign(gx), 0, -Math.sign(sp.pos.z))); break;
      case 'goalKick': this.take(rand.chance(0.6) ? 'long' : 'pass', new THREE.Vector3(Math.sign(gx), 0, 0)); break;
      case 'kickoff': this.take('pass', new THREE.Vector3(-Math.sign(gx), 0, rand.range(-1, 1))); break;
      case 'throwIn': this.take('pass', new THREE.Vector3(Math.sign(gx) * 0.6, 0, -Math.sign(sp.pos.z))); break;
    }
  }
}
