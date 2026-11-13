import { RunState, DraftChoice, Rarity, RARITY_ORDER, SkillDef } from '../types';
import { BASE_SKILLS, SKILL_MAP, SLOT_CAP, categoryCount } from './SkillRegistry';
import { availableEvolutions, buildMods } from './SkillEvolution';
import { STAT_BOOSTS } from '../../data/shop';
import { EQUIPMENT } from '../../data/equipment';
import { EVOLUTIONS } from '../../data/skills';
import { RNG } from '../../utils/random';
import { clamp } from '../../utils/math';

const BASE_RARITY: Record<Rarity, number> = { common: 50, rare: 30, epic: 15, legendary: 5 };

/** 根据幸运值、赛事阶段调整品质概率 */
export function rarityWeights(luck: number, stageIdx: number): Record<Rarity, number> {
  const L = clamp(luck + stageIdx * 0.06, 0, 1.6);
  return {
    common: BASE_RARITY.common * Math.max(0.25, 1 - L * 0.55),
    rare: BASE_RARITY.rare * (1 + L * 0.4),
    epic: BASE_RARITY.epic * (1 + L * 0.9),
    legendary: BASE_RARITY.legendary * (1 + L * 1.4),
  };
}

function stageIndex(run: RunState): number {
  return run.log.length;
}

function ownedTags(run: RunState): Set<string> {
  const set = new Set<string>();
  for (const s of run.skills) SKILL_MAP[s.id]?.tags.forEach((t) => set.add(t));
  return set;
}

function synergy(def: SkillDef, run: RunState, tags: Set<string>): number {
  let w = 1;
  if (def.tags.some((t) => tags.has(t) && t !== 'shoot' && t !== 'defense')) w += 0.6;
  // 进化配方相关：另一半已拥有时显著提高
  for (const e of EVOLUTIONS) {
    if (run.skills.some((s) => s.id === e.result)) continue;
    if (e.main === def.id && run.skills.some((s) => s.id === e.partner)) w += 1.2;
    if (e.partner === def.id && run.skills.some((s) => s.id === e.main && !s.absorbedInto)) w += 1.2;
  }
  if (def.category === 'ultimate' && !run.skills.some((s) => SKILL_MAP[s.id]?.category === 'ultimate')) w += 1.5;
  return w;
}

interface Cand { choice: DraftChoice; w: number }

function skillCandidates(run: RunState): Cand[] {
  const tags = ownedTags(run);
  const out: Cand[] = [];
  for (const def of BASE_SKILLS) {
    const owned = run.skills.find((s) => s.id === def.id);
    if (owned) continue;
    if (categoryCount(run, def.baseCategory) >= SLOT_CAP[def.baseCategory]) continue;
    out.push({ choice: { kind: 'newSkill', key: 'new:' + def.id, rarity: def.rarity, skillId: def.id }, w: synergy(def, run, tags) });
  }
  for (const os of run.skills) {
    if (os.absorbedInto) continue;
    const def = SKILL_MAP[os.id];
    if (!def || os.level >= def.maxLevel) continue; // 满级技能不再出现
    out.push({ choice: { kind: 'upgrade', key: 'up:' + def.id, rarity: def.rarity, skillId: def.id }, w: 1.4 + synergy(def, run, tags) * 0.4 });
  }
  return out;
}

function otherCandidates(run: RunState, rng: RNG): Cand[] {
  const out: Cand[] = [];
  for (const b of STAT_BOOSTS) {
    if ((run.statBoosts[b.id] ?? 0) >= b.max) continue;
    out.push({ choice: { kind: 'stat', key: 'stat:' + b.id, rarity: b.id === 'fortune' ? 'rare' : 'common', statId: b.id }, w: 1 });
  }
  return out;
}

export function generateDraft(run: RunState, rng: RNG, onlySkills = false): DraftChoice[] {
  const mods = buildMods(run);
  const rw = rarityWeights(mods.rareLuck, stageIndex(run));
  const picked: DraftChoice[] = [];
  const keys = new Set<string>();
  const push = (c: DraftChoice | undefined) => { if (c && !keys.has(c.key)) { keys.add(c.key); picked.push(c); return true; } return false; };

  // 满足进化条件时优先提供进化奖励
  if (!onlySkills) {
    const evos = availableEvolutions(run);
    if (evos.length && rng.chance(0.85)) {
      const e = rng.pick(evos);
      push({ kind: 'evolve', key: 'evo:' + e.id, rarity: 'legendary', skillId: e.result });
    }
  }
  const skills = skillCandidates(run);
  // 尚无大招时，从 3 级起较高概率提供一个大招
  if (!onlySkills && run.level >= 3 && !run.skills.some((s) => SKILL_MAP[s.id]?.category === 'ultimate') && rng.chance(0.5)) {
    const ults = BASE_SKILLS.filter((d) => d.category === 'ultimate');
    const u = rng.weighted(ults, ults.map((x) => rw[x.rarity]));
    if (u) push({ kind: 'newSkill', key: 'new:' + u.id, rarity: u.rarity, skillId: u.id });
  }
  const others = otherCandidates(run, rng);
  const forceHigh = run.pity >= 6; // 保底机制
  let guard = 0;
  while (picked.length < 3 && guard++ < 60) {
    const typeRoll = onlySkills ? 'skill' : rng.weighted(['skill', 'stat', 'item', 'gold'], [72, 15, 7, 6])!;
    if (typeRoll === 'skill') {
      let rarity = rng.weighted(RARITY_ORDER, RARITY_ORDER.map((r) => rw[r]))!;
      if (forceHigh && !picked.some((p) => p.rarity === 'epic' || p.rarity === 'legendary')) rarity = rng.chance(0.25) ? 'legendary' : 'epic';
      let pool = skills.filter((c) => c.choice.rarity === rarity && !keys.has(c.choice.key));
      if (!pool.length) pool = skills.filter((c) => !keys.has(c.choice.key));
      const c = rng.weighted(pool, pool.map((p) => p.w));
      if (c) push(c.choice);
    } else if (typeRoll === 'stat') {
      const pool = others.filter((c) => !keys.has(c.choice.key));
      const c = rng.weighted(pool, pool.map((p) => p.w));
      if (c) push(c.choice);
    } else if (typeRoll === 'item') {
      const notOwned = EQUIPMENT.filter((e) => !run.inventory.includes(e.id) && !Object.values(run.equipSlots).includes(e.id));
      const e = rng.weighted(notOwned, notOwned.map((x) => BASE_RARITY[x.rarity] * (x.rarity === 'common' ? 0.6 : 1) * (rw[x.rarity] / BASE_RARITY[x.rarity])));
      if (e) push({ kind: 'item', key: 'item:' + e.id, rarity: e.rarity, equipId: e.id });
    } else {
      const g = rng.int(4, 9) * 10;
      push({ kind: 'gold', key: 'gold', rarity: 'common', gold: g });
    }
  }
  // 兜底：至少三项
  while (picked.length < 3) {
    const g = rng.int(4, 8) * 10;
    if (!push({ kind: 'gold', key: 'gold' + picked.length, rarity: 'common', gold: g })) break;
  }
  return picked.slice(0, 3);
}

/** 随机获取一个技能（神秘技能箱） */
export function randomSkillChoice(run: RunState, rng: RNG): DraftChoice | undefined {
  const d = generateDraft(run, rng, true);
  return d.find((c) => c.kind === 'newSkill' || c.kind === 'upgrade') ?? d[0];
}
