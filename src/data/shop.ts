import { ShopItemDef, StatBoostDef, MissionDef } from '../game/types';

export const SHOP_ITEMS: ShopItemDef[] = [
  { id: 'energy_drink', name: '能量饮料', price: 30, icon: '🥤', desc: '恢复体力：球队疲劳 -30' },
  { id: 'power_ball', name: '强力足球', price: 50, icon: '⚽', desc: '射门威力永久 +5%（本次征程）' },
  { id: 'lucky_charm_item', name: '幸运护符', price: 60, icon: '🧿', desc: '获得装备「幸运护符」（已拥有则稀有概率永久 +5%）' },
  { id: 'golden_boots_item', name: '黄金球鞋', price: 80, icon: '👟', desc: '获得装备「黄金球鞋」（已拥有则移动速度永久 +3%）' },
  { id: 'mystery_box', name: '神秘技能箱', price: 100, icon: '🎁', desc: '随机获得一个技能（或升级已有技能）' },
  { id: 'ult_charger', name: '大招充能器', price: 120, icon: '🔋', desc: '下一场比赛开场大招能量 +60%' },
  { id: 'equip_box', name: '装备箱', price: 150, icon: '📦', desc: '随机获得一件装备' },
  { id: 'reroll_ticket', name: '技能刷新券', price: 40, icon: '🎫', desc: '获得一张三选一刷新券' },
  { id: 'first_aid', name: '急救包', price: 50, icon: '🩹', desc: '恢复所有受伤球员状态' },
  { id: 'stamina_potion', name: '体能恢复剂', price: 60, icon: '🧪', desc: '完全恢复球队体力（疲劳清零）' },
];
export const SHOP_MAP: Record<string, ShopItemDef> = Object.fromEntries(SHOP_ITEMS.map((s) => [s.id, s]));

export const STAT_BOOSTS: StatBoostDef[] = [
  { id: 'power_shot', name: '强力射门', icon: '💥', desc: '射门威力 +10%', mods: { shotPower: 0.1 }, max: 5 },
  { id: 'precise_control', name: '精准控制', icon: '🎯', desc: '射门精度 +10%', mods: { shotAccuracy: 0.1 }, max: 5 },
  { id: 'extreme_speed', name: '极限速度', icon: '🏃', desc: '移动速度 +10%', mods: { speed: 0.1 }, max: 4 },
  { id: 'strong_body', name: '强健体魄', icon: '💪', desc: '最大体力 +15%', mods: { staminaMax: 0.15 }, max: 4 },
  { id: 'fast_recover', name: '快速恢复', icon: '💚', desc: '体力恢复速度 +20%', mods: { staminaRegen: 0.2 }, max: 4 },
  { id: 'steel_defense', name: '钢铁防御', icon: '🛡️', desc: '防守能力（抢断、对抗）+10%', mods: { tackle: 0.1, body: 0.1 }, max: 5 },
  { id: 'perfect_pass', name: '完美配合', icon: '🤝', desc: '传球精度 +10%', mods: { passAccuracy: 0.1 }, max: 5 },
  { id: 'fortune', name: '幸运眷顾', icon: '🍀', desc: '稀有技能概率增加 +10%', mods: { rareLuck: 0.1 }, max: 3 },
];
export const BOOST_MAP: Record<string, StatBoostDef> = Object.fromEntries(STAT_BOOSTS.map((s) => [s.id, s]));

export const MISSIONS: MissionDef[] = [
  { id: 'm_pass', stat: 'passes', name: '传控大师', min: 8, max: 14, gold: 25, xp: 30, desc: '完成 {n} 次成功传球' },
  { id: 'm_shot', stat: 'shots', name: '火力全开', min: 4, max: 7, gold: 25, xp: 30, desc: '射门至少 {n} 次' },
  { id: 'm_tackle', stat: 'tackles', name: '铁闸', min: 3, max: 5, gold: 25, xp: 30, desc: '完成 {n} 次抢断' },
  { id: 'm_goal', stat: 'goals', name: '进球如麻', min: 2, max: 3, gold: 40, xp: 40, desc: '进球 {n} 个' },
  { id: 'm_clean', stat: 'cleanSheet', name: '零封', min: 1, max: 1, gold: 40, xp: 40, desc: '不丢球' },
  { id: 'm_dribble', stat: 'dribbles', name: '盘带大师', min: 3, max: 5, gold: 25, xp: 30, desc: '完成 {n} 次过人' },
  { id: 'm_skill', stat: 'skillUses', name: '技能狂人', min: 4, max: 7, gold: 25, xp: 30, desc: '使用技能 {n} 次' },
  { id: 'm_long', stat: 'longGoals', name: '远射破门', min: 1, max: 1, gold: 45, xp: 50, desc: '完成 {n} 次禁区外射门得分' },
  { id: 'm_assist', stat: 'assists', name: '助攻王', min: 1, max: 2, gold: 30, xp: 35, desc: '完成 {n} 次助攻' },
  { id: 'm_save', stat: 'saves', name: '门神', min: 2, max: 4, gold: 30, xp: 30, desc: '门将完成 {n} 次扑救' },
  { id: 'm_ult', stat: 'ultUses', name: '终极爆发', min: 1, max: 2, gold: 35, xp: 40, desc: '释放大招 {n} 次' },
  { id: 'm_winby', stat: 'winBy', name: '大胜', min: 2, max: 3, gold: 40, xp: 40, desc: '净胜 {n} 球以上获胜' },
  { id: 'm_poss', stat: 'possession', name: '控球为王', min: 55, max: 60, gold: 25, xp: 30, desc: '控球率达到 {n}%' },
  { id: 'm_nofoul', stat: 'noFoul', name: '公平竞赛', min: 1, max: 1, gold: 20, xp: 25, desc: '全场不犯规' },
  { id: 'm_ontarget', stat: 'onTarget', name: '精准打击', min: 3, max: 5, gold: 25, xp: 30, desc: '射正 {n} 次' },
  { id: 'm_header', stat: 'headers', name: '空中霸主', min: 1, max: 2, gold: 30, xp: 35, desc: '完成 {n} 次头球' },
];
