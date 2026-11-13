// 随机数工具聚合：征程级随机 + 比赛级随机
import { RNG, hashStr, rand, newSeed } from '../../utils/random';
import { RunState } from '../types';

export { RNG, hashStr, rand, newSeed };

/** 为征程中的某个环节生成可复现的随机数流 */
export function runRng(run: RunState, salt: string): RNG {
  return new RNG(hashStr(`${run.seed}_${salt}_${run.log.length}_${run.level}_${run.gold}`));
}
