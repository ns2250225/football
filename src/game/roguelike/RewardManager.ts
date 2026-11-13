import { RunState, DraftChoice, MatchPlan, RARITY_ORDER } from '../types';
import { RNG } from '../../utils/random';
import { SKILL_MAP } from '../skills/SkillRegistry';
import { applyEvolution, buildMods } from '../skills/SkillEvolution';
import { BOOST_MAP } from '../../data/shop';
import { addEquipment, randomEquipment } from './EquipmentManager';
import type { MatchOutcome } from '../core/GameState';
import { EVENT_MAP } from '../../data/events';

/** 应用三选一奖励 */
export function applyDraftChoice(run: RunState, c: DraftChoice, rng: RNG): string {
  switch (c.kind) {
    case 'newSkill': {
      const d = SKILL_MAP[c.skillId!];
      if (!d || run.skills.some((s) => s.id === d.id)) return '';
      run.skills.push({ id: d.id, level: 1 });
      if (d.category === 'ultimate' && !run.ultimate) run.ultimate = d.id;
      return `获得技能「${d.name}」`;
    }
    case 'upgrade': {
      const os = run.skills.find((s) => s.id === c.skillId);
      const d = SKILL_MAP[c.skillId!];
      if (!os || !d) return '';
      os.level = Math.min(d.maxLevel, os.level + 1);
      return `「${d.name}」升级到 LV${os.level}`;
    }
    case 'evolve': {
      const ok = applyEvolution(run, c.skillId!);
      return ok ? `进化成功：「${SKILL_MAP[c.skillId!].name}」` : '';
    }
    case 'stat': {
      const b = BOOST_MAP[c.statId!];
      if (!b) return '';
      run.statBoosts[b.id] = Math.min(b.max, (run.statBoosts[b.id] ?? 0) + 1);
      return `属性强化「${b.name}」×${run.statBoosts[b.id]}`;
    }
    case 'item': {
      if (c.equipId && addEquipment(run, c.equipId)) return '获得装备';
      run.gold += 50;
      return '获得 50 金币';
    }
    case 'gold': run.gold += c.gold ?? 50; return `获得 ${c.gold} 金币`;
  }
  return '';
}

export interface RewardLine { label: string; gold: number }
export interface MatchRewards { lines: RewardLine[]; gold: number; xp: number; drop?: string; missionXp: number }

/** 比赛结算奖励（金币与经验） */
export function computeRewards(run: RunState, plan: MatchPlan, o: MatchOutcome, rng: RNG): MatchRewards {
  const lines: RewardLine[] = [];
  lines.push({ label: '完成比赛', gold: 30 });
  if (o.won) lines.push({ label: '比赛获胜', gold: 50 });
  if (o.gf > 0) lines.push({ label: `进球 ×${o.gf}`, gold: 10 * o.gf });
  if (o.teamStats.assists > 0) lines.push({ label: `助攻 ×${o.teamStats.assists}`, gold: 8 * o.teamStats.assists });
  if (o.won && o.ga === 0) lines.push({ label: '完美比赛（零封获胜）', gold: 30 });
  if (o.won && plan.elite) lines.push({ label: plan.boss ? '击败 BOSS 球队' : '击败精英球队', gold: 60 });
  let missionXp = 0;
  for (const m of o.missions) if (m.done) { lines.push({ label: `任务：${m.desc}`, gold: m.gold }); missionXp += m.xp; }
  if (o.won && plan.stage === 'sf') lines.push({ label: '赢得半决赛', gold: 150 });
  if (o.won && plan.stage === 'final') lines.push({ label: '赢得世界杯', gold: 500 });
  const mods = buildMods(run);
  let goldMul = 1 + mods.goldMul;
  if (plan.events.includes('golden_time')) goldMul *= EVENT_MAP.golden_time.effect.goldMul ?? 1.5;
  const total = Math.round(lines.reduce((s, l) => s + l.gold, 0) * goldMul);
  if (goldMul > 1.001) lines.push({ label: `金币加成 ×${goldMul.toFixed(2)}`, gold: total - lines.reduce((s, l) => s + l.gold, 0) });
  let drop: string | undefined;
  if (o.won && plan.boss) drop = randomEquipment(run, rng, 'epic') ?? randomEquipment(run, rng);
  else if (o.won && rng.chance(0.15)) drop = randomEquipment(run, rng);
  return { lines, gold: total, xp: o.xpEarned, drop, missionXp };
}

export function rarityRank(r: string): number { return RARITY_ORDER.indexOf(r as never); }
