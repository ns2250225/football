import { TeamDef } from '../types';
import { RNG } from '../../utils/random';
import { clamp } from '../../utils/math';

/** 点球大战状态：5 轮 + 突然死亡（玩家现场比赛与 AI 模拟共用） */
export class PenaltyState {
  kicks: [boolean[], boolean[]] = [[], []]; turn: 0 | 1 = 0; done = false; winner: 0 | 1 | null = null;
  score(): [number, number] { return [this.kicks[0].filter(Boolean).length, this.kicks[1].filter(Boolean).length]; }
  record(side: 0 | 1, scored: boolean) {
    this.kicks[side].push(scored);
    this.check();
    if (!this.done) this.turn = side === 0 ? 1 : 0;
  }
  private check() {
    const [h, a] = this.score();
    const nh = this.kicks[0].length, na = this.kicks[1].length;
    if (nh <= 5 && na <= 5) {
      if (h > a + (5 - na)) return this.finish(0);
      if (a > h + (5 - nh)) return this.finish(1);
      if (nh === 5 && na === 5 && h !== a) return this.finish(h > a ? 0 : 1);
    } else if (nh === na && h !== a) this.finish(h > a ? 0 : 1);
  }
  private finish(w: 0 | 1) { this.done = true; this.winner = w; }
}

export function simulatePenalties(home: TeamDef, away: TeamDef, rng: RNG): { score: [number, number]; kicks: [boolean[], boolean[]] } {
  const p = (shooter: TeamDef, keeper: TeamDef) => clamp(0.74 + (shooter.stats.shooting - keeper.stats.defense) / 320, 0.55, 0.9);
  const ph = p(home, away), pa = p(away, home);
  const st = new PenaltyState();
  let guard = 0;
  while (!st.done && guard++ < 80) st.record(st.turn, rng.chance(st.turn === 0 ? ph : pa));
  if (!st.done) st.record(0, true);
  return { score: st.score(), kicks: st.kicks };
}
