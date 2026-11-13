import { RunState, EquipSlot, Rarity } from '../types';
import { EQUIPMENT, EQUIP_MAP } from '../../data/equipment';
import { RNG } from '../../utils/random';
import { rarityWeights } from '../skills/SkillPool';
import { buildMods } from '../skills/SkillEvolution';

export function ownsEquip(run: RunState, id: string): boolean {
  return run.inventory.includes(id) || Object.values(run.equipSlots).includes(id);
}

/** 获得装备：对应槽位为空则自动穿戴 */
export function addEquipment(run: RunState, id: string): boolean {
  const def = EQUIP_MAP[id];
  if (!def || ownsEquip(run, id)) return false;
  if (!run.equipSlots[def.slot]) run.equipSlots[def.slot] = id;
  else run.inventory.push(id);
  return true;
}

export function equip(run: RunState, id: string) {
  const def = EQUIP_MAP[id];
  if (!def) return;
  const idx = run.inventory.indexOf(id);
  if (idx < 0) return;
  run.inventory.splice(idx, 1);
  const cur = run.equipSlots[def.slot];
  if (cur) run.inventory.push(cur);
  run.equipSlots[def.slot] = id;
}

export function unequip(run: RunState, slot: EquipSlot) {
  const cur = run.equipSlots[slot];
  if (!cur) return;
  run.inventory.push(cur);
  run.equipSlots[slot] = null;
}

export function randomEquipment(run: RunState, rng: RNG, minRarity?: Rarity): string | undefined {
  const luck = buildMods(run).rareLuck;
  const rw = rarityWeights(luck, run.log.length);
  const order: Rarity[] = ['common', 'rare', 'epic', 'legendary'];
  const minIdx = minRarity ? order.indexOf(minRarity) : 0;
  const pool = EQUIPMENT.filter((e) => !ownsEquip(run, e.id) && order.indexOf(e.rarity) >= minIdx);
  const pick = rng.weighted(pool, pool.map((e) => rw[e.rarity]));
  return pick?.id;
}
