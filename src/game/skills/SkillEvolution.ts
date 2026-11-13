import { RunState, EvolutionDef, Mods, makeMods, addMods, EQUIP_SLOTS } from '../types';
import { EVOLUTIONS } from '../../data/skills';
import { SKILL_MAP, ownedPassiveMods } from './SkillRegistry';
import { EQUIP_MAP } from '../../data/equipment';
import { BOOST_MAP } from '../../data/shop';

export function evolutionProgress(run: RunState, evo: EvolutionDef) {
  const main = run.skills.find((s) => s.id === evo.main);
  const partner = run.skills.find((s) => s.id === evo.partner);
  const owned = run.skills.some((s) => s.id === evo.result);
  const mainLv = main && !main.absorbedInto ? main.level : main ? main.level : 0;
  const ready = !owned && !!main && !main.absorbedInto && !!partner && main.level >= evo.req[0] && partner.level >= evo.req[1];
  return { mainLv: main?.level ?? 0, partnerLv: partner?.level ?? 0, owned, ready, mainAbsorbed: !!main?.absorbedInto, _m: mainLv };
}

export function availableEvolutions(run: RunState): EvolutionDef[] {
  return EVOLUTIONS.filter((e) => evolutionProgress(run, e).ready);
}

/** 执行进化：主技能被进化技能替换（保留其基础被动属性），搭档技能保留 */
export function applyEvolution(run: RunState, evoId: string): boolean {
  const evo = EVOLUTIONS.find((e) => e.id === evoId);
  if (!evo || !evolutionProgress(run, evo).ready) return false;
  const main = run.skills.find((s) => s.id === evo.main)!;
  main.absorbedInto = evo.result;
  run.skills.push({ id: evo.result, level: 1 });
  if (!run.evolved.includes(evo.result)) run.evolved.push(evo.result);
  if (run.ultimate === evo.main) run.ultimate = evo.result;
  return true;
}

/** 整个征程构筑提供的永久属性（技能被动 + 装备 + 属性强化 + 商店永久加成） */
export function buildMods(run: RunState): Mods {
  const m = makeMods();
  ownedPassiveMods(run.skills, m);
  for (const slot of EQUIP_SLOTS) {
    const id = run.equipSlots[slot];
    if (id && EQUIP_MAP[id]) addMods(m, EQUIP_MAP[id].mods);
  }
  for (const [id, n] of Object.entries(run.statBoosts)) { const b = BOOST_MAP[id]; if (b) addMods(m, b.mods, n); }
  addMods(m, run.permBonus);
  m.rareLuck += run.custom?.dropLuck ?? 0;
  return m;
}

export function hasFlag(run: RunState, flag: string): boolean {
  return run.skills.some((s) => !s.absorbedInto && SKILL_MAP[s.id]?.flags?.includes(flag));
}
