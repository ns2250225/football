import { EquipDef, EquipSlot, Rarity, Mods, ShotSpec } from '../game/types';

const E = (id: string, name: string, slot: EquipSlot, rarity: Rarity, icon: string, color: string, desc: string, mods: Partial<Mods>, source: string, extra: { shot?: ShotSpec; special?: { kind: string; value: number; desc: string } } = {}): EquipDef =>
  ({ id, name, slot, rarity, icon, color, desc, mods, source, ...extra });

export const EQUIPMENT: EquipDef[] = [
  // 球鞋（6）
  E('golden_boots', '黄金球鞋', 'boots', 'rare', '👟', '#fbbf24', '金光闪闪的球鞋，移动与冲刺 +10%', { speed: 0.1, sprint: 0.1 }, '商店 / 装备箱'),
  E('lightning_boots', '闪电球鞋', 'boots', 'epic', '⚡', '#facc15', '冲刺 +20%，冲刺时撞到的对手会被电击麻痹 0.5 秒', { sprint: 0.2, cdr: 0.05 }, '装备箱 / BOSS 掉落', { special: { kind: 'sprintSpark', value: 0.5, desc: '冲刺电击' } }),
  E('flame_boots', '火焰球鞋', 'boots', 'epic', '🔥', '#f97316', '冲刺 +15%，冲刺时留下火焰轨迹，踩到的对手减速', { sprint: 0.15, shotPower: 0.05 }, '装备箱 / BOSS 掉落', { special: { kind: 'fireTrail', value: 0.35, desc: '火焰轨迹' } }),
  E('frost_boots', '冰霜球鞋', 'boots', 'rare', '❄️', '#67e8f9', '转向 +30%、控球 +10%，过人成功使对手减速', { turnSpeed: 0.3, control: 0.1 }, '装备箱 / 任务奖励', { special: { kind: 'iceDribble', value: 0.4, desc: '寒霜过人' } }),
  E('gale_boots', '疾风球鞋', 'boots', 'common', '🍃', '#86efac', '轻盈的跑鞋，速度 +8%，体力消耗 -10%', { speed: 0.08, staminaCost: -0.1 }, '商店 / 装备箱'),
  E('diamond_boots', '钻石球鞋', 'boots', 'legendary', '💎', '#22d3ee', '顶级球鞋：速度 +15%、冲刺 +15%、控球 +10%', { speed: 0.15, sprint: 0.15, control: 0.1 }, '装备箱 / 冠军之路'),
  // 护腿（5）
  E('diamond_guards', '钻石护腿', 'guards', 'legendary', '💎', '#67e8f9', '坚不可摧：抢断 +25%、对抗 +25%、抗控制 +30%', { tackle: 0.25, body: 0.25, stunResist: 0.3 }, '装备箱 / BOSS 掉落'),
  E('steel_guards', '钢铁护腿', 'guards', 'common', '⛓️', '#94a3b8', '结实的护腿，身体对抗 +15%', { body: 0.15 }, '商店 / 装备箱'),
  E('thunder_guards', '雷霆护腿', 'guards', 'epic', '🌩️', '#fde047', '抢断 +15%，抢断成功时电击对手 0.8 秒', { tackle: 0.15 }, '装备箱 / BOSS 掉落', { special: { kind: 'tackleStun', value: 0.8, desc: '雷霆抢断' } }),
  E('flame_guards', '火焰护腿', 'guards', 'rare', '🔥', '#fb923c', '抢断 +10%，抢断距离 +15%', { tackle: 0.1, tackleRange: 0.15 }, '装备箱 / 任务奖励'),
  E('guardian_guards', '守护护腿', 'guards', 'rare', '🛡️', '#38bdf8', '抗控制 +30%，被冲撞后获得短暂护盾', { stunResist: 0.3, shieldOnHit: 1 }, '装备箱 / 任务奖励'),
  // 手套（5）
  E('power_gloves', '力量手套', 'gloves', 'common', '🥊', '#ef4444', '对抗 +10%，射门力量 +5%', { body: 0.1, shotPower: 0.05 }, '商店 / 装备箱'),
  E('precision_gloves', '精准手套', 'gloves', 'rare', '🎯', '#0ea5e9', '传球精度 +12%，射门精度 +5%', { passAccuracy: 0.12, shotAccuracy: 0.05 }, '装备箱 / 任务奖励'),
  E('keeper_gloves', '守门手套', 'gloves', 'rare', '🧤', '#22c55e', '己方门将扑救 +20%', { gkSave: 0.2 }, '商店 / 装备箱'),
  E('magnet_gloves', '磁力手套', 'gloves', 'epic', '🧲', '#a855f7', '控球范围 +25%，控球 +10%', { controlRange: 0.25, control: 0.1 }, '装备箱 / BOSS 掉落'),
  E('golden_gloves', '黄金手套', 'gloves', 'legendary', '🏅', '#f59e0b', '门将扑救 +30%，反应 +30%', { gkSave: 0.3, gkReact: 0.3 }, '装备箱 / 冠军之路'),
  // 头盔（5）
  E('lucky_helmet', '幸运头盔', 'helmet', 'common', '🍀', '#84cc16', '暴击 +5%，稀有概率 +5%', { critChance: 0.05, rareLuck: 0.05 }, '商店 / 装备箱'),
  E('diamond_helmet', '钻石头盔', 'helmet', 'epic', '💎', '#7dd3fc', '头球 +30%，抗控制 +20%，对抗 +10%', { header: 0.3, stunResist: 0.2, body: 0.1 }, '装备箱 / BOSS 掉落'),
  E('thor_helmet', '雷神头盔', 'helmet', 'epic', '⚡', '#fde047', '技能冷却 -10%，大招充能 +15%', { cdr: 0.1, ultCharge: 0.15 }, '装备箱 / BOSS 掉落'),
  E('flame_helmet', '火焰头盔', 'helmet', 'rare', '🔥', '#f97316', '射门力量 +10%，冷却 -5%', { shotPower: 0.1, cdr: 0.05 }, '装备箱 / 任务奖励'),
  E('champion_helmet', '冠军头盔', 'helmet', 'legendary', '👑', '#fbbf24', '冠军的荣耀：主要属性 +8%，大招充能 +20%', { speed: 0.08, shotPower: 0.08, shotAccuracy: 0.08, control: 0.08, passAccuracy: 0.08, tackle: 0.08, ultCharge: 0.2 }, '装备箱 / 冠军之路'),
  // 护身符（5）
  E('lucky_charm', '幸运护符', 'amulet', 'rare', '🧿', '#22c55e', '稀有技能概率 +20%，暴击 +5%', { rareLuck: 0.2, critChance: 0.05 }, '商店 / 装备箱'),
  E('xp_charm', '经验护符', 'amulet', 'rare', '📗', '#8b5cf6', '经验获取 +25%', { xpMul: 0.25 }, '装备箱 / 任务奖励'),
  E('skill_charm', '技能护符', 'amulet', 'epic', '🔮', '#d946ef', '技能冷却 -15%', { cdr: 0.15 }, '装备箱 / BOSS 掉落'),
  E('gold_charm', '金币护符', 'amulet', 'rare', '🪙', '#f59e0b', '金币获取 +30%', { goldMul: 0.3 }, '装备箱 / 任务奖励'),
  E('counter_charm', '反击护符', 'amulet', 'epic', '📯', '#f43f5e', '抢断 +10%；抢断成功后全队速度 +20%（3 秒）', { tackle: 0.1 }, '装备箱 / BOSS 掉落', { special: { kind: 'counterRush', value: 0.2, desc: '反击冲锋' } }),
  // 足球（6）
  E('golden_ball', '黄金足球', 'ball', 'legendary', '🏆', '#fbbf24', '蓄力射门附带黄金属性：威力 +20%、精度 +20%', { shotPower: 0.05 }, '装备箱 / 冠军之路', { shot: { form: 'golden', prio: 1, power: 0.2, accuracy: 0.2 } }),
  E('thunder_ball', '雷电足球', 'ball', 'epic', '⚡', '#facc15', '蓄力射门附带雷电：速度 +15%，轻微麻痹路径对手', {}, '装备箱 / BOSS 掉落', { shot: { form: 'thunder', prio: 1, speed: 0.15, chain: 1.2 } }),
  E('fire_ball', '火焰足球', 'ball', 'epic', '🔥', '#f97316', '蓄力射门附带火焰：威力 +15%', {}, '装备箱 / BOSS 掉落', { shot: { form: 'fire', prio: 1, power: 0.15, burn: 0.8 } }),
  E('frost_ball', '冰霜足球', 'ball', 'rare', '❄️', '#67e8f9', '蓄力射门附带冰霜：落点产生 1.5 米冰冻区域', {}, '装备箱 / 任务奖励', { shot: { form: 'ice', prio: 1, freezeZone: 1.5 } }),
  E('meteor_ball', '陨石足球', 'ball', 'legendary', '☄️', '#b91c1c', '蓄力射门附带陨石：威力 +30%，小型爆炸', {}, '装备箱 / BOSS 掉落', { shot: { form: 'meteor', prio: 1, power: 0.3, explode: 2 } }),
  E('rainbow_ball', '彩虹足球', 'ball', 'epic', '🌈', '#f0abfc', '蓄力射门随机附带元素属性，威力 +10%', {}, '装备箱 / 任务奖励', { shot: { rainbow: 1, power: 0.1 } }),
];
export const EQUIP_MAP: Record<string, EquipDef> = Object.fromEntries(EQUIPMENT.map((e) => [e.id, e]));
