import { DIFFICULTY_MULT, STAGE_MULT, Stage } from '../game/types';
import { clamp } from './math';
/** 对手综合倍率：难度 × 阶段（以普通难度为基准叠加） */
export function opponentMultiplier(difficulty: number, stage: Stage, extreme: boolean): number {
  const m = DIFFICULTY_MULT[difficulty] * STAGE_MULT[stage] * (extreme ? 1.12 : 1);
  return clamp(m, 0.6, 2.4);
}
/** 将倍率映射到不同类型属性，避免速度等数值失衡 */
export function scaleFor(mult: number, kind: 'speed' | 'skill' | 'gk' | 'ai'): number {
  switch (kind) {
    case 'speed': return 1 + (mult - 1) * 0.22;
    case 'skill': return 1 + (mult - 1) * 0.5;
    case 'gk': return 1 + (mult - 1) * 0.45;
    case 'ai': return clamp(0.55 + (mult - 0.7) * 0.42, 0.45, 1.2);
  }
}
/** 冷却缩减上限 45% */
export const CDR_CAP = 0.45;
export const XP_NEED = (lv: number) => 80 + lv * 30;
