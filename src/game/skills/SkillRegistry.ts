import { SkillDef, ShotSpec, Op, Mods, OwnedSkill, RunState, SkillCategory, BaseCategory } from '../types';
import { ALL_SKILLS, BASE_SKILLS, EVOLUTION_SKILLS } from '../../data/skills';
import { CDR_CAP } from '../../utils/balance';
import { clamp } from '../../utils/math';

export const SKILL_MAP: Record<string, SkillDef> = Object.fromEntries(ALL_SKILLS.map((s) => [s.id, s]));
export function getSkill(id: string): SkillDef | undefined { return SKILL_MAP[id]; }
export { ALL_SKILLS, BASE_SKILLS, EVOLUTION_SKILLS };

/** 技能槽上限 */
export const SLOT_CAP: Record<BaseCategory, number> = { active: 4, passive: 8, shooting: 4, defense: 4, ultimate: 2 };

export const levelMul = (lv: number) => 1 + 0.2 * (lv - 1);
const radiusMul = (lv: number) => 1 + 0.1 * (lv - 1);

export function skillCooldown(def: SkillDef, lv: number, cdr: number): number {
  const base = def.cooldown ?? 10;
  return Math.max(1.5, base * (1 - 0.06 * (lv - 1)) * (1 - clamp(cdr, 0, CDR_CAP)));
}

export function scaledMods(mods: Partial<Mods> | undefined, lv: number): Partial<Mods> {
  if (!mods) return {};
  const out: Partial<Mods> = {};
  const k = levelMul(lv);
  for (const key in mods) { const v = mods[key as keyof Mods]; if (typeof v === 'number') out[key as keyof Mods] = v * k; }
  return out;
}

const SHOT_SCALE: (keyof ShotSpec)[] = ['power', 'accuracy', 'pierce', 'curve', 'homing', 'curse', 'speed', 'burn', 'afterimage', 'dip', 'attract'];
const SHOT_RADIUS: (keyof ShotSpec)[] = ['explode', 'freezeZone', 'shockwave', 'chain'];

export function scaleShot(spec: ShotSpec, lv: number): ShotSpec {
  const out: ShotSpec = { ...spec };
  const k = levelMul(lv), r = radiusMul(lv);
  for (const key of SHOT_SCALE) { const v = out[key]; if (typeof v === 'number') (out as Record<string, number>)[key] = v * k; }
  for (const key of SHOT_RADIUS) { const v = out[key]; if (typeof v === 'number') (out as Record<string, number>)[key] = v * r; }
  return out;
}

export function skillShot(def: SkillDef, lv: number): ShotSpec | undefined {
  if (!def.shot) return undefined;
  let s = scaleShot(def.shot, lv);
  if (def.lvShot) for (const l of Object.keys(def.lvShot).map(Number).sort((a, b) => a - b)) if (lv >= l) s = { ...s, ...def.lvShot[l] };
  return s;
}

export function scaleOps(ops: Op[] | undefined, lv: number): Op[] {
  if (!ops) return [];
  const k = levelMul(lv), r = radiusMul(lv);
  return ops.map((op) => {
    const o = { ...op } as Record<string, unknown>;
    if (typeof o.dur === 'number' && (o.dur as number) < 100) o.dur = (o.dur as number) * (1 + 0.12 * (lv - 1));
    if (typeof o.radius === 'number') o.radius = (o.radius as number) * r;
    if (typeof o.power === 'number') o.power = op.t === 'status' && op.status === 'slow' ? Math.min(0.85, (o.power as number) * (1 + 0.08 * (lv - 1))) : (o.power as number) * k;
    if (typeof o.slow === 'number') o.slow = Math.min(0.85, (o.slow as number) * (1 + 0.08 * (lv - 1)));
    if (typeof o.dist === 'number') o.dist = (o.dist as number) * (1 + 0.08 * (lv - 1));
    if (o.mods) o.mods = scaledMods(o.mods as Partial<Mods>, lv);
    if (o.shot) o.shot = scaleShot(o.shot as ShotSpec, lv);
    return o as unknown as Op;
  });
}

/** 合并多个射门规格：形态按优先级唯一，数值叠加，半径取最大 */
export function mergeShots(list: (ShotSpec | undefined)[]): ShotSpec {
  const out: ShotSpec = {};
  let bestPrio = -1;
  for (const s of list) {
    if (!s) continue;
    if (s.form && (s.prio ?? 0) > bestPrio) { out.form = s.form; bestPrio = s.prio ?? 0; out.prio = bestPrio; }
    for (const key of ['power', 'accuracy', 'pierce', 'curve', 'homing', 'curse', 'speed', 'burn', 'afterimage', 'dip', 'attract', 'refract', 'bounceTurn', 'lob', 'crit', 'rainbow'] as (keyof ShotSpec)[]) {
      const v = s[key]; if (typeof v === 'number') (out as Record<string, number>)[key] = ((out as Record<string, number>)[key] ?? 0) + v;
    }
    for (const key of ['explode', 'freezeZone', 'shockwave', 'chain', 'split'] as (keyof ShotSpec)[]) {
      const v = s[key]; if (typeof v === 'number') (out as Record<string, number>)[key] = Math.max((out as Record<string, number>)[key] ?? 0, v);
    }
  }
  // 平衡上限
  if (out.homing) out.homing = Math.min(out.homing, 2.8);
  if (out.curve) out.curve = Math.min(out.curve, 2.5);
  if (out.power) out.power = Math.min(out.power, 2.2);
  if (out.pierce) out.pierce = Math.min(out.pierce, 0.7);
  if (out.afterimage) out.afterimage = Math.min(out.afterimage, 0.9);
  if (out.speed) out.speed = Math.min(out.speed, 1.2);
  if (out.refract) out.refract = Math.min(out.refract, 2);
  return out;
}

export function levelText(def: SkillDef, lv: number): string {
  if (def.lvText && def.lvText[lv - 1]) return `LV${lv}：${def.lvText[lv - 1]}`;
  if (lv <= 1) return `LV1：${def.desc}`;
  const parts = [`效果强度 +${Math.round((levelMul(lv) - 1) * 100)}%`];
  if (def.cooldown) parts.push(`冷却 -${Math.round(6 * (lv - 1))}%`);
  if (def.active || def.ultimate || def.defense) parts.push(`持续/范围提升`);
  return `LV${lv}：${parts.join('，')}`;
}

export function ownedSkill(run: RunState, id: string): OwnedSkill | undefined { return run.skills.find((s) => s.id === id); }
export function activeOwned(run: RunState): OwnedSkill[] { return run.skills.filter((s) => !s.absorbedInto); }
export function categoryCount(run: RunState, cat: BaseCategory): number {
  return activeOwned(run).filter((s) => { const d = SKILL_MAP[s.id]; return d && d.baseCategory === cat; }).length;
}
export function categoryOf(id: string): SkillCategory | undefined { return SKILL_MAP[id]?.category; }

/** 计算一组已拥有技能提供的被动属性（被吸收的主技能保留基础被动属性） */
export function ownedPassiveMods(skills: OwnedSkill[], into: Mods): Mods {
  for (const os of skills) {
    const d = SKILL_MAP[os.id];
    if (!d?.passive) continue;
    const m = scaledMods(d.passive, os.level);
    for (const k in m) into[k as keyof Mods] += m[k as keyof Mods] ?? 0;
  }
  return into;
}
