import { RunState, MissionInstance } from '../types';
import { XP_NEED } from '../../utils/balance';
import { MISSIONS } from '../../data/shop';
import { RNG, rand } from '../../utils/random';

export { RNG, rand };

/** 经验结算：返回本次提升的等级数，并累加待处理的三选一 */
export function gainXp(run: RunState, amount: number): number {
  run.xp += Math.max(0, Math.round(amount));
  let ups = 0;
  while (run.xp >= XP_NEED(run.level)) {
    run.xp -= XP_NEED(run.level);
    run.level++;
    ups++;
  }
  run.pendingDrafts += ups;
  return ups;
}

export function pickMissions(rng: RNG, n = 3): MissionInstance[] {
  const pool = rng.shuffle([...MISSIONS]).slice(0, n);
  return pool.map((m) => {
    const target = rng.int(m.min, m.max);
    return { id: m.id, stat: m.stat, target, desc: m.desc.replace('{n}', String(target)), gold: m.gold, xp: m.xp };
  });
}
