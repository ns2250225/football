import type { GameEngine } from '../core/GameEngine';
import type { Ball } from './Football';
import { FIELD } from '../../utils/physics';

export type BallEvent =
  | { type: 'goal'; scoringSide: 0 | 1 }
  | { type: 'out'; kind: 'side' | 'goalLine'; x: number; z: number; goalX: number }
  | null;

/**
 * 进球判定：足球整体（球心越过门线 + 半径）完全越过球门线，且位于门柱之间、横梁之下。
 * 出界判定：足球整体越过边线或底线。
 */
export function checkBall(e: GameEngine, b: Ball): BallEvent {
  if (b.dead || b.scored) return null;
  const hx = FIELD.L / 2, hz = FIELD.W / 2;
  const ax = Math.abs(b.pos.x);
  if (ax > hx + b.r) {
    const gx = Math.sign(b.pos.x) * hx;
    if (Math.abs(b.pos.z) < e.goalW / 2 - b.r * 0.2 && b.pos.y < e.goalH) {
      // 哪一方进攻这个球门
      const scoringSide = e.teams[0].dir * gx > 0 ? 0 : 1;
      return { type: 'goal', scoringSide };
    }
    return { type: 'out', kind: 'goalLine', x: b.pos.x, z: b.pos.z, goalX: gx };
  }
  if (Math.abs(b.pos.z) > hz + b.r) return { type: 'out', kind: 'side', x: b.pos.x, z: b.pos.z, goalX: 0 };
  return null;
}
