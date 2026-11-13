import { useGame } from './gameStore';
import { SKILL_MAP } from '../game/skills/SkillRegistry';
import { EVOLUTIONS } from '../data/skills';
import { evolutionProgress } from '../game/skills/SkillEvolution';
import type { OwnedSkill, RunState, SkillDef } from '../game/types';

/** 技能相关选择器 */
export const useOwnedSkills = (): OwnedSkill[] => useGame((s) => s.run?.skills ?? []);
export function ownedDefs(run: RunState): { os: OwnedSkill; def: SkillDef }[] {
  return run.skills.map((os) => ({ os, def: SKILL_MAP[os.id] })).filter((x) => !!x.def);
}
export function evolutionStatus(run: RunState) {
  return EVOLUTIONS.map((e) => ({ evo: e, ...evolutionProgress(run, e) }));
}
