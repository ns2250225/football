import { RunState, ShopOffer } from '../types';
import { SHOP_ITEMS, SHOP_MAP } from '../../data/shop';
import { RNG } from '../../utils/random';
import { addEquipment, ownsEquip, randomEquipment } from './EquipmentManager';
import { randomSkillChoice } from '../skills/SkillPool';
import { applyDraftChoice } from './RewardManager';
import { EQUIP_MAP } from '../../data/equipment';

export function generateShop(run: RunState, rng: RNG): ShopOffer[] {
  const n = rng.int(5, 7);
  const items = rng.shuffle([...SHOP_ITEMS]).slice(0, n);
  const saleIdx = rng.int(0, items.length - 1);
  return items.map((it, i) => ({ itemId: it.id, price: i === saleIdx && rng.chance(0.6) ? Math.round(it.price * 0.8) : it.price, sold: false }));
}

export function restockCost(run: RunState): number { return 20 + (run.shop?.restocks ?? 0) * 15; }

export function restock(run: RunState, rng: RNG): boolean {
  if (!run.shop) return false;
  const cost = restockCost(run);
  if (run.gold < cost) return false;
  run.gold -= cost;
  run.shop.restocks++;
  run.shop.offers = generateShop(run, rng);
  return true;
}

/** 购买商品并立即生效 */
export function buyOffer(run: RunState, idx: number, rng: RNG): string {
  const offer = run.shop?.offers[idx];
  if (!offer || offer.sold) return '';
  if (run.gold < offer.price) return '金币不足';
  const item = SHOP_MAP[offer.itemId];
  run.gold -= offer.price;
  offer.sold = true;
  run.buys++;
  switch (item.id) {
    case 'energy_drink': run.teamFatigue = Math.max(0, run.teamFatigue - 30); run.roster.forEach((p) => (p.fatigue = Math.max(0, (p.fatigue ?? 0) - 30))); return '球队疲劳 -30';
    case 'power_ball': run.permBonus.shotPower = (run.permBonus.shotPower ?? 0) + 0.05; return '射门威力永久 +5%';
    case 'lucky_charm_item':
      if (!ownsEquip(run, 'lucky_charm')) { addEquipment(run, 'lucky_charm'); return '获得装备「幸运护符」'; }
      run.permBonus.rareLuck = (run.permBonus.rareLuck ?? 0) + 0.05; return '稀有概率永久 +5%';
    case 'golden_boots_item':
      if (!ownsEquip(run, 'golden_boots')) { addEquipment(run, 'golden_boots'); return '获得装备「黄金球鞋」'; }
      run.permBonus.speed = (run.permBonus.speed ?? 0) + 0.03; return '移动速度永久 +3%';
    case 'mystery_box': {
      const c = randomSkillChoice(run, rng);
      if (!c) { run.gold += 60; return '技能池已满，返还 60 金币'; }
      return applyDraftChoice(run, c, rng) || '获得奖励';
    }
    case 'ult_charger': run.ultStart = Math.min(1, run.ultStart + 0.6); return '下一场比赛大招能量 +60%';
    case 'equip_box': {
      const id = randomEquipment(run, rng);
      if (!id) { run.gold += 100; return '装备已全部收集，返还 100 金币'; }
      addEquipment(run, id); return `获得装备「${EQUIP_MAP[id].name}」`;
    }
    case 'reroll_ticket': run.rerollTokens++; return '刷新券 +1';
    case 'first_aid': run.roster.forEach((p) => (p.injured = 0)); return '所有受伤球员已恢复';
    case 'stamina_potion': run.teamFatigue = 0; run.roster.forEach((p) => (p.fatigue = 0)); return '球队体力完全恢复';
  }
  return '';
}
