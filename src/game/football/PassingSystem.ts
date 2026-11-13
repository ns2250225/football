import * as THREE from 'three';
import type { GameEngine } from '../core/GameEngine';
import type { Player } from '../player/Player';
import type { Ball } from './Football';
import { clamp, pointSegDist } from '../../utils/math';
import { rand } from '../../utils/random';
import { PHYS } from '../../utils/physics';
import { AudioManager } from '../audio/AudioManager';

export interface PassOpts { magnet?: boolean; throwIn?: boolean; target?: Player; power?: number }

/** 传球系统：短传（地面）与长传（高球），自动选择最佳接球队友并计算提前量 */
export class PassSystem {
  constructor(private e: GameEngine) {}

  chooseTarget(p: Player, dir: THREE.Vector3 | null, long: boolean): Player | null {
    const e = this.e;
    const mates = e.teammates(p).filter((m) => !m.sentOff && !m.incapacitated);
    const gx = e.oppGoalX(p.team);
    let best: Player | null = null, bestScore = -1e9;
    for (const m of mates) {
      const to = m.pos.clone().sub(p.pos).setY(0);
      const d = to.length();
      if (d < 2.5) continue;
      if (m.isGK && (Math.abs(p.pos.x - e.ownGoalX(p.team)) > 18 || !dir)) continue;
      to.normalize();
      let score = 0;
      if (dir && dir.lengthSq() > 0.01) { const c = to.dot(dir); if (c < 0.25) continue; score += c * 5; }
      // 前进程度与空当
      score += (Math.abs(gx - p.pos.x) - Math.abs(gx - m.pos.x)) * 0.12;
      let open = 99;
      for (const o of e.opponents(p)) { if (o.sentOff) continue; open = Math.min(open, pointSegDist(o.pos.x, o.pos.z, p.pos.x, p.pos.z, m.pos.x, m.pos.z)); }
      score += clamp(open, 0, 4) * 0.8;
      if (long) score += d > 12 ? 2 : -2; else score += d < 15 ? 1.5 : -1.5 - (d - 15) * 0.2;
      if (e.requestPass === m) score += 4;
      if (score > bestScore) { bestScore = score; best = m; }
    }
    return best;
  }

  pass(p: Player, dir: THREE.Vector3 | null, long: boolean, opts: PassOpts = {}): Ball | null {
    const e = this.e;
    const ball = e.balls.find((b) => b.owner === p) ?? (opts.throwIn ? e.balls.find((b) => b.pos.distanceTo(p.pos) < 2.2) : undefined);
    if (!ball) return null;
    const magnet = opts.magnet || (p.side === 0 && p.ctrl && e.skills.consumeMagnet());
    const target = opts.target ?? this.chooseTarget(p, dir, long);
    let aim: THREE.Vector3;
    let dist: number;
    if (target) {
      const lead = long ? 0.75 : 0.35;
      aim = target.pos.clone().addScaledVector(target.vel, lead).setY(0);
      dist = aim.clone().sub(p.pos).setY(0).length();
    } else {
      const d = dir && dir.lengthSq() > 0.01 ? dir.clone().normalize() : p.dir();
      dist = long ? 18 : 9;
      aim = p.pos.clone().addScaledVector(d, dist).setY(0);
    }
    const flat = aim.clone().sub(ball.pos).setY(0);
    dist = Math.max(1.5, flat.length());
    flat.normalize();
    // 传球误差
    const nordicBonus = p.team.passive.passBonus(p, e);
    const acc = clamp(p.passAcc + nordicBonus, 0.2, 1);
    const err = magnet ? 0 : rand.gauss() * (1 - acc) * (long ? 0.16 : 0.1);
    const ang = Math.atan2(flat.z, flat.x) + err;
    const power = opts.power ?? 1;
    if (long) {
      const T = clamp(0.75 + dist * 0.032, 0.8, 1.7);
      const hs = (dist / T) * 1.08 * power;
      const g = -PHYS.GRAVITY * e.params.gravity;
      ball.vel.set(Math.cos(ang) * hs, (g * T) / 2, Math.sin(ang) * hs);
      if (opts.throwIn) ball.pos.y = 1.8;
    } else {
      const sp = clamp(7 + dist * 1.25, 9, 25) * power * (0.95 + p.passAcc * 0.1);
      ball.vel.set(Math.cos(ang) * sp, opts.throwIn ? 3.5 : 0.6, Math.sin(ang) * sp);
      if (opts.throwIn) ball.pos.y = 1.6;
    }
    ball.vel.multiplyScalar(e.params.ballSpeed > 1 ? 1 + (e.params.ballSpeed - 1) * 0.5 : 1);
    ball.spin.set(0, rand.range(-1, 1), 0);
    ball.owner = null; ball.shot = null;
    ball.touch(p, e.simT);
    ball.passFrom = p; ball.passTo = target; ball.passLong = long; ball.passTime = e.simT;
    ball.magnet = magnet && target ? target : null;
    p.touchCd = 0.3; p.kickLock = 0.2;
    p.playAnim('Pass');
    if (magnet && target) { e.particles.burst(ball.pos, ['#60a5fa', '#ffffff'], 10, 3, 0.3, 0.12, 0); }
    AudioManager.play('pass');
    e.requestPass = null;
    e.bus.emit('pass', { p, ball, target, long });
    return ball;
  }
}
