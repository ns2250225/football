import * as THREE from 'three';
import type { GameEngine, TeamRuntime } from '../core/GameEngine';
import type { Player } from './Player';
import { TacticMode } from '../types';
import { FIELD } from '../../utils/physics';
import { clamp, lerp } from '../../utils/math';
import { rand } from '../../utils/random';

/** 球队 AI：阵型、攻防切换、战术选择与协同（逼抢人数、接应跑位） */
export class TeamAI {
  private t = 0;
  chasers: [Player[], Player[]] = [[], []];
  private chaseT = 0;
  constructor(private e: GameEngine) {}

  attacking(t: TeamRuntime): boolean {
    const b = this.e.balls[0];
    if (b.owner) return b.owner.side === t.side;
    if (b.passFrom && b.passFrom.side === t.side && this.e.simT - b.passTime < 2) return true;
    return !!b.lastTouch && b.lastTouch.side === t.side && b.speed() > 3;
  }

  decideMode(t: TeamRuntime): TacticMode {
    const e = this.e;
    if (t.side === 0 && e.tacticOverride) return e.tacticOverride;
    const base = t.def.defaultTactic;
    const diff = e.score[t.side] - e.score[1 - t.side];
    const rem = e.remainingFrac();
    if (diff > 0 && rem < 0.12 && e.period >= 2) return 'allBack';
    if (diff > 0 && rem < 0.3 && e.period >= 2) return 'defend';
    if (diff < 0 && rem < 0.45 && e.period >= 2) return t.side === 1 && t.aiSkill > 0.8 ? 'press' : 'attack';
    if (t.side === 1 && t.aiSkill > 0.9 && base !== 'possession' && rand.chance(0.3)) return 'press';
    return base;
  }

  formationTarget(p: Player, ball: THREE.Vector3, attacking: boolean): THREE.Vector3 {
    const t = p.team; const d = t.dir; const mode = t.aiMode;
    const bu = ball.x * d, bz = ball.z;
    const width = t.def.profile.width;
    let u = 0, z = 0;
    switch (p.role) {
      case 'GK': u = -20.8; z = clamp(bz * 0.2, -2, 2); break;
      case 'DF': u = attacking ? clamp(bu - 10, -16, 4) : clamp(bu - 6, -18.5, -3); z = bz * 0.55; break;
      case 'MF': u = attacking ? clamp(bu - 3, -10, 14) : clamp(bu - 4, -15, 6); z = attacking ? (bz > 0 ? bz - 6 : bz + 6) * 0.8 : bz * 0.65; break;
      case 'FW': {
        const left = p.slot === 3 || p.slot === 7;
        u = attacking ? clamp(bu + (left ? 7 : 5), 0, 18) : clamp(bu + (left ? 3 : 1), -7, 9);
        z = (left ? -1 : 1) * (4 + width * 5);
        break;
      }
    }
    if (!p.isGK) {
      if (mode === 'attack') u += 3;
      else if (mode === 'defend') u -= 4;
      else if (mode === 'press') u += 2;
      else if (mode === 'allBack') { u -= 7; if (p.role === 'FW') u = Math.min(u, -2); }
      else if (mode === 'counter' && !attacking && p.role === 'FW') u = Math.max(u, 4);
      else if (mode === 'possession' && (p.role === 'MF' || p.role === 'FW')) { u = lerp(u, bu, 0.25); z = lerp(z, bz, 0.25); }
      if (t.passive.kind === 'precise' && (p.role === 'DF' || p.role === 'MF')) z *= 0.7;
      // 无球跑动扰动
      const k = this.e.simT * 0.6 + p.id * 1.7;
      u += Math.sin(k) * 1.2; z += Math.cos(k * 0.8) * 1.5;
    }
    u = clamp(u, -FIELD.L / 2 + 0.8, FIELD.L / 2 - 1.5);
    return new THREE.Vector3(u * d, 0, clamp(z, -FIELD.W / 2 + 1, FIELD.W / 2 - 1));
  }

  update(dt: number) {
    const e = this.e;
    this.t -= dt;
    if (this.t <= 0) {
      this.t = 0.5;
      for (const t of e.teams) t.aiMode = this.decideMode(t);
    }
    this.chaseT -= dt;
    if (this.chaseT <= 0) {
      this.chaseT = 0.15;
      for (const t of e.teams) {
        const b = e.balls[0];
        const own = b.owner && b.owner.side === t.side;
        if (own) { this.chasers[t.side] = []; continue; }
        const interest = b.pos.clone().addScaledVector(b.vel, 0.3).setY(0);
        const field = t.players.filter((p) => !p.sentOff && !p.isGK && !p.incapacitated);
        field.sort((a, b2) => a.pos.distanceTo(interest) - b2.pos.distanceTo(interest));
        let n = 1;
        if (t.aiMode === 'press' || (b.owner && Math.abs(b.pos.x - e.ownGoalX(t)) < 15)) n = 2;
        const list = field.slice(0, n);
        // 双足球：第二个足球也分配一名追球队员
        if (e.balls.length > 1) {
          const b2 = e.balls[1];
          const c2 = field.filter((p) => !list.includes(p)).sort((a, c) => a.pos.distanceTo(b2.pos) - c.pos.distanceTo(b2.pos))[0];
          if (c2 && !(b2.owner && b2.owner.side === t.side)) list.push(c2);
        }
        this.chasers[t.side] = list;
      }
    }
  }
}
