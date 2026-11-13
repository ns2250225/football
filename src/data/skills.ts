import { SkillDef, Rarity, Op, ShotSpec, Mods, DefenseSpec, AnimName, EvolutionDef, BaseCategory } from '../game/types';

type Extra = Partial<SkillDef>;
const base = (category: BaseCategory, code: string, id: string, name: string, rarity: Rarity, icon: string, color: string, desc: string, tags: string[], extra: Extra): SkillDef => ({
  id, code, name, category, baseCategory: category, rarity, icon, color, desc, maxLevel: 5, tags,
  vfx: extra.vfx ?? 'spark', sfx: extra.sfx ?? 'skill', anim: (extra.anim ?? 'Idle') as AnimName, ...extra,
});

const A = (code: string, id: string, name: string, rarity: Rarity, icon: string, color: string, cd: number, desc: string, ops: Op[], tags: string[], extra: Extra = {}) =>
  base('active', code, id, name, rarity, icon, color, desc, tags, { cooldown: cd, active: ops, anim: 'Sprint', ...extra });
const PV = (code: string, id: string, name: string, rarity: Rarity, icon: string, color: string, desc: string, mods: Partial<Mods>, tags: string[], extra: Extra = {}) =>
  base('passive', code, id, name, rarity, icon, color, desc, tags, { passive: mods, trigger: '持续生效', vfx: 'aura', sfx: 'buff', anim: 'Idle', ...extra });
const SH = (code: string, id: string, name: string, rarity: Rarity, icon: string, color: string, cd: number, desc: string, shot: ShotSpec, tags: string[], extra: Extra = {}) =>
  base('shooting', code, id, name, rarity, icon, color, desc, tags, { cooldown: cd, shot, trigger: '蓄力 40% 以上射门时自动触发', anim: 'LongShoot', sfx: 'shot_skill', ...extra });
const DF = (code: string, id: string, name: string, rarity: Rarity, icon: string, color: string, desc: string, defense: DefenseSpec[], tags: string[], extra: Extra = {}) =>
  base('defense', code, id, name, rarity, icon, color, desc, tags, { defense, cooldown: defense[0]?.cd, anim: 'Tackle', sfx: 'defense', ...extra });
const UL = (code: string, id: string, name: string, rarity: Rarity, icon: string, color: string, desc: string, ops: Op[], tags: string[], extra: Extra = {}) =>
  base('ultimate', code, id, name, rarity, icon, color, desc, tags, { ultimate: ops, maxLevel: 5, trigger: '大招能量 100% 时按 R 释放', anim: 'Celebrate', sfx: 'ultimate', vfx: 'ultimate', ...extra });

// ====================== 主动技能（20） ======================
export const ACTIVE_SKILLS: SkillDef[] = [
  A('A01', 'lightning_dash', '闪电冲刺', 'common', '⚡', '#facc15', 8, '短时间内移动速度 +60%、冲刺速度 +40%，持续 2.5 秒', [{ t: 'buff', target: 'self', mods: { speed: 0.6, sprint: 0.4 }, dur: 2.5 }], ['speed', 'thunder'], { vfx: 'lightning_trail', sfx: 'zap' }),
  A('A02', 'blink_dribble', '瞬间过人', 'rare', '💨', '#93c5fd', 10, '带球向前瞬移 4 米完成突破（不能瞬移进入球门区域）', [{ t: 'dash', mode: 'blink', dist: 4 }], ['dribble', 'speed'], { vfx: 'blink', sfx: 'blink', anim: 'Dribble' }),
  A('A03', 'fire_strike', '火焰冲射', 'rare', '🔥', '#f97316', 12, '立即射出火焰足球（威力 +30%，命中击倒附近球员）；未持球时强化下一次射门', [{ t: 'shootNow', shot: { form: 'fire', prio: 3, power: 0.3, burn: 1, explode: 1.6 } }], ['fire', 'shoot'], { vfx: 'fire_ball', sfx: 'fire', anim: 'Shoot' }),
  A('A04', 'freeze_ball', '冰冻足球', 'epic', '🧊', '#67e8f9', 15, '冻结 4 米内所有敌方球员 1.5 秒', [{ t: 'status', target: 'oppNear', radius: 4, status: 'freeze', dur: 1.5, fx: 'ice' }], ['ice', 'control'], { vfx: 'ice_burst', sfx: 'ice', anim: 'Pass' }),
  A('A05', 'whirlwind_dribble', '旋风盘带', 'rare', '🌀', '#a5f3fc', 14, '原地旋转击退 3 米内敌人，并在 2 秒内控球 +30%', [{ t: 'status', target: 'oppNear', radius: 3, status: 'knock', dur: 0.8, power: 6, fx: 'wind' }, { t: 'buff', target: 'self', mods: { control: 0.3 }, dur: 2 }], ['dribble', 'wind'], { vfx: 'whirl', sfx: 'wind', anim: 'Dribble' }),
  A('A06', 'gravity_pull', '引力吸球', 'common', '🧲', '#c084fc', 12, '将 8 米内的足球吸引到身边（持续 1.2 秒）', [{ t: 'pullBall', radius: 8, dur: 1.2, power: 30 }], ['magnet', 'control'], { vfx: 'pull', sfx: 'magnet', anim: 'Idle' }),
  A('A07', 'phantom_clone', '幻影分身', 'epic', '👥', '#a78bfa', 20, '生成 2 个跟随突破的幻影分身，扰乱对手防守 6 秒', [{ t: 'clone', count: 2, dur: 6, mode: 'attack' }], ['phantom', 'dribble'], { vfx: 'phantom', sfx: 'phantom', anim: 'Run' }),
  A('A08', 'magnet_pass', '磁力传球', 'common', '🎯', '#60a5fa', 10, '8 秒内的下一次传球会自动寻找最佳队友并精准到位', [{ t: 'nextPass', dur: 8 }], ['pass', 'magnet'], { vfx: 'magnet', sfx: 'magnet', anim: 'Pass' }),
  A('A09', 'quake_tackle', '地震铲球', 'epic', '🌋', '#b45309', 18, '猛击地面，4.5 米内的对手被击倒 1.2 秒，并震落足球', [{ t: 'status', target: 'oppNear', radius: 4.5, status: 'knock', dur: 1.2, power: 5, fx: 'quake' }], ['quake', 'defense'], { vfx: 'quake', sfx: 'quake', anim: 'Tackle' }),
  A('A10', 'time_slow', '时空减速', 'legendary', '⏳', '#818cf8', 30, '9 米内的对手行动速度降低 50%，持续 4 秒', [{ t: 'status', target: 'oppNear', radius: 9, status: 'slow', dur: 4, power: 0.5, fx: 'time' }], ['time', 'control'], { vfx: 'time', sfx: 'time', anim: 'Idle' }),
  A('A11', 'double_jump', '二段跳跃', 'common', '🦘', '#86efac', 8, '跳跃后可以再次起跳，用于头球和躲避铲球', [{ t: 'jump', height: 2.2, double: 1 }], ['jump', 'air'], { vfx: 'jump', sfx: 'jump', anim: 'Jump' }),
  A('A12', 'rocket_boost', '火箭推进', 'rare', '🚀', '#fb923c', 12, '向前高速飞行 9 米（不可越过球门线）', [{ t: 'dash', mode: 'fly', dist: 9, speed: 22 }], ['speed', 'fire', 'air'], { vfx: 'rocket', sfx: 'rocket', anim: 'Sprint' }),
  A('A13', 'shield_charge', '护盾冲锋', 'rare', '🛡️', '#38bdf8', 15, '获得 3 秒护盾并向前冲锋 5 米，撞开路径上的对手', [{ t: 'shield', dur: 3, hits: 1 }, { t: 'dash', mode: 'forward', dist: 5, speed: 16, knock: 5 }], ['shield', 'body'], { vfx: 'shield', sfx: 'shield', anim: 'Sprint' }),
  A('A14', 'shadow_swap', '影子换位', 'rare', '🔄', '#6366f1', 18, '与位置最佳的己方队友交换位置（足球不随之移动）', [{ t: 'swap' }], ['shadow', 'tactic'], { vfx: 'swap', sfx: 'blink', anim: 'Idle' }),
  A('A15', 'ball_boomerang', '足球回旋', 'rare', '↩️', '#2dd4bf', 16, '召回足球或改变飞行中足球的方向，使其飞向自己', [{ t: 'recall', power: 1 }], ['magnet', 'control'], { vfx: 'pull', sfx: 'magnet', anim: 'Pass' }),
  A('A16', 'homing_strike', '追踪修正', 'epic', '🛰️', '#22d3ee', 18, '立即射门，足球在飞行中自动修正方向（最大修正角受平衡限制）', [{ t: 'shootNow', shot: { homing: 1.5, accuracy: 0.3 } }], ['homing', 'shoot'], { vfx: 'homing', sfx: 'shot_skill', anim: 'Shoot' }),
  A('A17', 'anti_gravity', '反重力领域', 'epic', '🪐', '#c4b5fd', 22, '6 米内的足球短暂悬浮 3 秒，便于抢点和头球', [{ t: 'float', radius: 6, dur: 3 }], ['gravity', 'air'], { vfx: 'float', sfx: 'magic', anim: 'Idle' }),
  A('A18', 'speed_field', '速度领域', 'rare', '🏃', '#4ade80', 20, '10 米内的己方球员移动速度 +30%，持续 5 秒', [{ t: 'buff', target: 'near', radius: 10, mods: { speed: 0.3 }, dur: 5 }], ['speed', 'team'], { vfx: 'field_green', sfx: 'buff', anim: 'Celebrate' }),
  A('A19', 'energy_wave', '能量波动', 'common', '💥', '#f472b6', 16, '释放冲击波，击退 5 米内的对手', [{ t: 'status', target: 'oppNear', radius: 5, status: 'knock', dur: 0.6, power: 8, fx: 'wave' }], ['wave', 'control'], { vfx: 'wave', sfx: 'wave', anim: 'Hit' }),
  A('A20', 'absolute_field', '绝对领域', 'legendary', '🔰', '#fde047', 30, '6 秒内控球 +60%、传球 +30%，免疫控制效果', [{ t: 'buff', target: 'self', mods: { control: 0.6, stunResist: 1, passAccuracy: 0.3 }, dur: 6 }, { t: 'shield', dur: 6, hits: 2 }], ['control', 'shield'], { vfx: 'field_gold', sfx: 'buff', anim: 'Celebrate' }),
];

// ====================== 被动技能（24） ======================
export const PASSIVE_SKILLS: SkillDef[] = [
  PV('P01', 'iron_leg', '铁腿', 'common', '🦵', '#ef4444', '射门力量 +20%', { shotPower: 0.2 }, ['shoot', 'power']),
  PV('P02', 'swift_feet', '飞毛腿', 'common', '👟', '#22c55e', '移动速度 +15%', { speed: 0.15 }, ['speed']),
  PV('P03', 'vajra_body', '金刚体', 'common', '🗿', '#a16207', '减少身体碰撞硬直 30%，身体对抗 +10%', { stunResist: 0.3, body: 0.1 }, ['body']),
  PV('P04', 'precision_master', '精准大师', 'common', '🎯', '#0ea5e9', '射门精度 +20%', { shotAccuracy: 0.2 }, ['shoot', 'precision']),
  PV('P05', 'perpetual_motion', '永动机', 'common', '♾️', '#14b8a6', '体力消耗降低 25%', { staminaCost: -0.25 }, ['stamina']),
  PV('P06', 'ball_magnet', '足球磁铁', 'rare', '🧲', '#a855f7', '控球范围 +25%，控球 +5%', { controlRange: 0.25, control: 0.05 }, ['magnet', 'control']),
  PV('P07', 'pass_master', '传球大师', 'common', '📐', '#3b82f6', '传球准确度 +25%', { passAccuracy: 0.25 }, ['pass']),
  PV('P08', 'box_killer', '门前杀手', 'rare', '🗡️', '#dc2626', '禁区内射门威力 +25%', { boxShot: 0.25 }, ['shoot', 'box']),
  PV('P09', 'comeback_king', '逆境之王', 'epic', '👊', '#f97316', '比分落后时全属性 +15%', { comebackAll: 0.15 }, ['comeback']),
  PV('P10', 'lucky_ball', '幸运球', 'rare', '🍀', '#84cc16', '射门暴击概率 +12%（暴击：威力 ×1.5 且破门能力提升）', { critChance: 0.12 }, ['luck', 'shoot']),
  PV('P11', 'golden_lung', '黄金肺', 'common', '🫁', '#eab308', '体力上限 +25%', { staminaMax: 0.25 }, ['stamina']),
  PV('P12', 'steel_nerve', '钢铁神经', 'rare', '🧠', '#64748b', '减少被控制时间 35%', { stunResist: 0.35 }, ['body', 'resist']),
  PV('P13', 'quick_react', '迅捷反应', 'rare', '⚡', '#fbbf24', '切换球员后 2 秒内速度 +30%', { switchBoost: 0.3 }, ['speed', 'switch']),
  PV('P14', 'spring_leg', '弹簧腿', 'common', '🪀', '#10b981', '跳跃高度 +40%，头球 +20%', { jump: 0.4, header: 0.2 }, ['jump', 'air']),
  PV('P15', 'long_cannon', '远程炮台', 'rare', '🎇', '#f43f5e', '禁区外射门威力 +25%', { longShot: 0.25 }, ['shoot', 'long']),
  PV('P16', 'veteran', '经验丰富', 'rare', '📚', '#8b5cf6', '比赛经验获取 +20%', { xpMul: 0.2 }, ['growth']),
  PV('P17', 'gold_digger', '淘金者', 'rare', '💰', '#f59e0b', '金币获取 +20%', { goldMul: 0.2 }, ['growth']),
  PV('P18', 'skill_resonance', '技能共鸣', 'epic', '🔮', '#d946ef', '技能冷却缩短 10%（全局上限 45%）', { cdr: 0.1 }, ['skill']),
  PV('P19', 'unbreakable', '不屈斗士', 'rare', '🥊', '#ea580c', '比分落后时体力恢复 +50%', { comebackRegen: 0.5 }, ['comeback', 'stamina']),
  PV('P20', 'guardian_heart', '守护之心', 'epic', '💗', '#ec4899', '受到抢断或冲撞时获得 1.5 秒护盾（8 秒冷却）', { shieldOnHit: 1.5 }, ['shield']),
  PV('P21', 'combo_master', '连击大师', 'epic', '🔗', '#06b6d4', '连续成功动作（传球/过人/抢断）每层提高射门威力与控球 +4%（最多 5 层）', { comboBonus: 0.04 }, ['combo']),
  PV('P22', 'lucky_clover', '幸运三叶草', 'legendary', '☘️', '#22c55e', '升级奖励中稀有及以上技能出现概率 +20%', { rareLuck: 0.2 }, ['luck', 'growth']),
  PV('P23', 'goal_breaker', '破门专家', 'epic', '🔨', '#b91c1c', '射门时门将扑救难度 +15%', { gkPierce: 0.15 }, ['shoot', 'pierce']),
  PV('P24', 'perfect_link', '完美配合', 'rare', '🤝', '#0284c7', '接到队友传球后 3 秒内传球与射门精度 +15%', { passCombo: 0.15 }, ['pass', 'team']),
];

// ====================== 射门技能（20） ======================
export const SHOOTING_SKILLS: SkillDef[] = [
  SH('S01', 'fire_shot', '火焰射门', 'epic', '🔥', '#f97316', 8, '足球带火焰，威力 +30%，命中产生爆炸击倒附近球员', { form: 'fire', prio: 3, power: 0.3, burn: 1.2 }, ['fire', 'shoot'], {
    vfx: 'fire_ball', sfx: 'fire', lvShot: { 3: { explode: 2 }, 4: { explode: 3 }, 5: { explode: 4, burn: 2.5 } },
    lvText: ['火焰射门，威力增加 30%', '火焰持续时间增加', '命中后产生小型爆炸', '爆炸范围增加 50%', '产生火焰风暴'],
  }),
  SH('S02', 'thunder_shot', '雷电射门', 'rare', '⚡', '#facc15', 9, '足球高速飞行（速度 +25%）并沿途释放闪电，麻痹路径附近的对手', { form: 'thunder', prio: 3, speed: 0.25, chain: 2.2 }, ['thunder', 'shoot', 'speed'], { vfx: 'lightning', sfx: 'zap' }),
  SH('S03', 'frost_shot', '冰霜射门', 'rare', '❄️', '#67e8f9', 9, '命中或落地后产生 3 米冰冻区域，冻结区域内对手', { form: 'ice', prio: 3, power: 0.1, freezeZone: 3 }, ['ice', 'shoot'], { vfx: 'ice_burst', sfx: 'ice' }),
  SH('S04', 'meteor_shot', '陨石射门', 'epic', '☄️', '#b91c1c', 14, '足球化为陨石，威力 +45%，命中产生大范围爆炸', { form: 'meteor', prio: 6, power: 0.45, explode: 3 }, ['fire', 'shoot', 'power'], { vfx: 'meteor', sfx: 'explosion' }),
  SH('S05', 'space_refract', '空间折射', 'epic', '🔷', '#38bdf8', 10, '足球飞行途中折射一次，转向远离门将的角落', { refract: 1, accuracy: 0.1 }, ['space', 'shoot'], { vfx: 'refract', sfx: 'blink' }),
  SH('S06', 'spiral_shot', '螺旋射门', 'common', '🌀', '#a3e635', 7, '足球产生强烈旋转弧线，绕过防守', { curve: 1, accuracy: 0.1 }, ['curve', 'shoot'], { vfx: 'spiral', sfx: 'wind' }),
  SH('S07', 'phantom_shot', '幻影射门', 'rare', '👻', '#c4b5fd', 10, '足球产生多个视觉残影，门将反应时间增加 35%', { form: 'phantom', prio: 2, afterimage: 0.35 }, ['phantom', 'shoot'], { vfx: 'phantom', sfx: 'phantom' }),
  SH('S08', 'pierce_shot', '穿透射门', 'rare', '🗡️', '#e11d48', 10, '降低门将对射门的阻挡效果 30%', { pierce: 0.3 }, ['pierce', 'shoot'], { vfx: 'pierce', sfx: 'shot_skill' }),
  SH('S09', 'homing_shot', '追踪射门', 'epic', '🛰️', '#22d3ee', 12, '足球自动修正飞行方向，追踪球门空当', { homing: 1.2 }, ['homing', 'shoot'], { vfx: 'homing', sfx: 'shot_skill' }),
  SH('S10', 'split_shot', '分裂射门', 'rare', '✴️', '#fb7185', 12, '足球在空中分裂出 3 个诱饵小球，迷惑门将', { split: 3, afterimage: 0.15 }, ['phantom', 'shoot'], { vfx: 'split', sfx: 'magic' }),
  SH('S11', 'light_shot', '光速射门', 'epic', '💫', '#fef08a', 12, '大幅提升足球速度 +60%', { form: 'light', prio: 4, speed: 0.6 }, ['speed', 'shoot', 'light'], { vfx: 'light', sfx: 'zap' }),
  SH('S12', 'gravity_shot', '重力射门', 'common', '⬇️', '#7c3aed', 9, '足球飞行后段突然下坠，越过门将头顶后急坠入网', { dip: 1, accuracy: 0.05 }, ['gravity', 'shoot'], { vfx: 'gravity', sfx: 'magic' }),
  SH('S13', 'bounce_shot', '反弹射门', 'common', '↗️', '#34d399', 9, '低射触地后改变方向，弹向球门空当', { bounceTurn: 1 }, ['trick', 'shoot'], { vfx: 'bounce', sfx: 'kick' }),
  SH('S14', 'shock_shot', '震荡射门', 'rare', '📳', '#f472b6', 11, '足球飞行时产生范围冲击波，击退 3 米内对手', { shockwave: 3 }, ['wave', 'shoot'], { vfx: 'wave', sfx: 'wave' }),
  SH('S15', 'attract_shot', '吸引射门', 'rare', '🕳️', '#8b5cf6', 11, '足球飞行时产生引力，把附近防守球员拉离射门路线，并轻微吸向球门中心', { attract: 4, homing: 0.3 }, ['gravity', 'shoot'], { vfx: 'pull', sfx: 'magnet' }),
  SH('S16', 'curse_shot', '诅咒射门', 'epic', '💀', '#6b21a8', 12, '射门时诅咒门将，5 秒内扑救能力降低 40%', { curse: 0.4 }, ['curse', 'shoot'], { vfx: 'curse', sfx: 'curse' }),
  SH('S17', 'rainbow_shot', '彩虹射门', 'rare', '🌈', '#f0abfc', 10, '随机获得火焰/雷电/冰霜之一的元素属性，威力 +20%', { rainbow: 1, power: 0.2 }, ['rainbow', 'shoot'], { vfx: 'rainbow', sfx: 'magic' }),
  SH('S18', 'burst_shot', '爆裂射门', 'epic', '💣', '#ea580c', 13, '命中后产生 5 米大范围爆炸，击倒范围内所有球员（含门将）', { explode: 5, power: 0.15 }, ['explode', 'shoot', 'fire'], { vfx: 'explosion', sfx: 'explosion' }),
  SH('S19', 'cloud_piercer', '穿云射门', 'common', '☁️', '#e0f2fe', 10, '超高弧线吊射，越过门将头顶', { lob: 1, accuracy: 0.1 }, ['air', 'shoot'], { vfx: 'cloud', sfx: 'wind' }),
  SH('S20', 'golden_shot', '黄金射门', 'legendary', '🏆', '#fbbf24', 18, '高伤害、高精准度的特殊射门：威力 +50%、精度 +50%、破门 +25%', { form: 'golden', prio: 5, power: 0.5, accuracy: 0.5, pierce: 0.25 }, ['golden', 'shoot', 'precision'], { vfx: 'golden', sfx: 'golden' }),
];

// ====================== 防守技能（16） ======================
export const DEFENSE_SKILLS: SkillDef[] = [
  DF('D01', 'iron_wall', '铁壁防守', 'common', '🧱', '#78716c', '敌方持球者靠近（4 米）时，抢断与身体对抗 +40%，持续 4 秒', [{ trig: 'carrierNear', cd: 12, radius: 4, ops: [{ t: 'buff', target: 'self', mods: { tackle: 0.4, body: 0.4 }, dur: 4 }] }], ['defense', 'body'], { vfx: 'shield', trigger: '敌方持球者靠近时' }),
  DF('D02', 'flash_intercept', '闪电拦截', 'rare', '⚡', '#fde047', '敌方传球经过 8 米内时，闪电般移动到足球路径上', [{ trig: 'oppPassNear', cd: 10, radius: 8, ops: [{ t: 'dash', mode: 'toBallPath', dist: 8, speed: 26 }] }], ['defense', 'thunder', 'speed'], { vfx: 'lightning_trail', trigger: '敌方传球经过附近时' }),
  DF('D03', 'frost_tackle', '冰冻铲球', 'rare', '🥶', '#67e8f9', '抢断成功后冰冻被抢断的敌人 1.5 秒', [{ trig: 'tackleWin', cd: 6, ops: [{ t: 'status', target: 'victim', status: 'freeze', dur: 1.5, fx: 'ice' }] }], ['defense', 'ice'], { vfx: 'ice_burst', trigger: '抢断成功时' }),
  DF('D04', 'quake_guard', '地震防守', 'epic', '🌋', '#a16207', '被 2 名以上对手包围（4 米）时，震地击退周围敌人', [{ trig: 'crowded', cd: 14, radius: 4, ops: [{ t: 'status', target: 'oppNear', radius: 4, status: 'knock', dur: 0.9, power: 6, fx: 'quake' }] }], ['defense', 'quake'], { vfx: 'quake', trigger: '被多名对手包围时' }),
  DF('D05', 'absolute_shield', '绝对护盾', 'epic', '🛡️', '#38bdf8', '冷却完毕自动生成护盾，阻挡一次强力攻击（抢断、冲撞、控制或射门撞击）', [{ trig: 'ready', cd: 20, ops: [{ t: 'shield', dur: 999, hits: 1 }] }], ['defense', 'shield'], { vfx: 'shield', trigger: '冷却完毕自动生效' }),
  DF('D06', 'magnet_intercept', '磁力拦截', 'rare', '🧲', '#c084fc', '敌方传球经过 5 米内时，将足球吸向自己', [{ trig: 'oppPassNear', cd: 12, radius: 5, ops: [{ t: 'pullBall', radius: 6, dur: 0.8, power: 35 }] }], ['defense', 'magnet'], { vfx: 'pull', trigger: '敌方传球经过附近时' }),
  DF('D07', 'reflect_shield', '反弹护盾', 'rare', '🪞', '#7dd3fc', '受到冲撞或控制时，将 1.2 秒眩晕反弹给攻击者', [{ trig: 'hitTaken', cd: 10, ops: [{ t: 'status', target: 'attacker', status: 'stun', dur: 1.2, fx: 'reflect' }] }], ['defense', 'shield'], { vfx: 'reflect', trigger: '受到攻击时' }),
  DF('D08', 'shadow_defense', '影子防守', 'epic', '👤', '#6366f1', '敌方带球进入我方三区时，在门前生成影子后卫协防 6 秒（可阻挡足球）', [{ trig: 'oppInThird', cd: 18, ops: [{ t: 'clone', count: 1, dur: 6, mode: 'defense' }] }], ['defense', 'phantom'], { vfx: 'phantom', trigger: '敌方进入我方三区时' }),
  DF('D09', 'goal_god', '门神降临', 'epic', '🧤', '#22c55e', '门将扑救永久 +15%；敌方射门时门将扑救额外 +50%（3 秒）', [{ trig: 'oppShot', cd: 20, ops: [{ t: 'gk', mods: { gkSave: 0.5, gkReact: 0.3 }, dur: 3 }] }], ['defense', 'gk'], { passive: { gkSave: 0.15 }, vfx: 'gk_glow', trigger: '敌方射门时 + 持续生效' }),
  DF('D10', 'swift_return', '极速回防', 'common', '🔙', '#4ade80', '在本方半场丢球时，全队速度 +30% 快速回防 3 秒', [{ trig: 'ballLost', cd: 12, ops: [{ t: 'buff', target: 'team', mods: { speed: 0.3 }, dur: 3 }] }], ['defense', 'speed', 'team'], { vfx: 'field_green', trigger: '我方半场丢球时' }),
  DF('D11', 'steel_post', '钢铁门柱', 'rare', '🥅', '#94a3b8', '敌方射门时门柱区域强化 2.5 秒，贴柱射门会被弹出', [{ trig: 'oppShot', cd: 15, ops: [{ t: 'postGuard', dur: 2.5 }] }], ['defense', 'gk'], { vfx: 'post', trigger: '敌方射门时' }),
  DF('D12', 'gk_foresight', '守门预判', 'rare', '🔭', '#0ea5e9', '门将提前判断足球飞行方向：扑救 +10%，反应速度 +30%', [{ trig: 'passive', cd: 0, ops: [] }], ['defense', 'gk'], { passive: { gkSave: 0.1, gkReact: 0.3 }, vfx: 'gk_glow', trigger: '持续生效' }),
  DF('D13', 'counter_horn', '反击号角', 'common', '📯', '#f59e0b', '抢断成功后全队速度 +25%，持续 4 秒', [{ trig: 'tackleWin', cd: 10, ops: [{ t: 'buff', target: 'team', mods: { speed: 0.25 }, dur: 4 }] }], ['defense', 'speed', 'team'], { vfx: 'horn', trigger: '抢断成功时' }),
  DF('D14', 'domain_suppress', '领域压制', 'epic', '🌑', '#475569', '持续降低 4 米内敌方速度 25%', [{ trig: 'passive', cd: 0, ops: [{ t: 'aura', radius: 4, slow: 0.25, dur: 0.3 }] }], ['defense', 'control', 'ice'], { vfx: 'aura_dark', trigger: '持续生效' }),
  DF('D15', 'invincible_slide', '无敌滑铲', 'rare', '🛷', '#f87171', '铲球过程中免受硬直，抢断距离 +30%，抢断 +10%，犯规概率降低', [{ trig: 'passive', cd: 0, ops: [] }], ['defense', 'tackle'], { passive: { tackleRange: 0.3, tackle: 0.1 }, flags: ['slideImmune'], trigger: '持续生效' }),
  DF('D16', 'last_line', '最终防线', 'legendary', '🏰', '#dc2626', '敌方持球者进入门前 10 米时，全队抢断、对抗 +30%、速度 +15%，持续 5 秒', [{ trig: 'danger', cd: 15, radius: 10, ops: [{ t: 'buff', target: 'team', mods: { tackle: 0.3, body: 0.3, speed: 0.15 }, dur: 5 }] }], ['defense', 'team'], { vfx: 'field_red', trigger: '门前危险时' }),
];

// ====================== 终极大招（12） ======================
export const ULTIMATE_SKILLS: SkillDef[] = [
  UL('U01', 'world_wave', '世界波', 'epic', '🌊', '#0ea5e9', '超强远距离射门：威力 +100%，精度 +60%，速度 +40%', [{ t: 'shootNow', shot: { form: 'light', prio: 9, power: 1.0, accuracy: 0.6, speed: 0.4, homing: 0.4 } }], ['shoot', 'long']),
  UL('U02', 'meteor_fall', '天降陨石', 'epic', '☄️', '#b91c1c', '召唤陨石轰击敌方防守密集区域，击倒 5 米内所有对手 2 秒', [{ t: 'meteor', radius: 5, dur: 2 }], ['fire', 'explode']),
  UL('U03', 'thor_descent', '雷神降临', 'legendary', '🌩️', '#facc15', '全场雷电攻击，麻痹所有对手 1.8 秒', [{ t: 'thunderAll', dur: 1.8 }], ['thunder']),
  UL('U04', 'time_domain', '时间领域', 'legendary', '⌛', '#818cf8', '大范围时间减缓：所有对手速度降低 60%，持续 6 秒', [{ t: 'oppSlowAll', slow: 0.6, dur: 6 }], ['time', 'control']),
  UL('U05', 'tornado_ball', '龙卷风足球', 'epic', '🌪️', '#94a3b8', '足球形成巨型龙卷风：吸附足球、卷飞 4 米内对手 4 秒，下一脚射门带强烈弧线', [{ t: 'tornado', radius: 4, dur: 4 }, { t: 'nextShot', shot: { form: 'tornado', prio: 8, curve: 1.5, power: 0.3, shockwave: 2.5 }, dur: 10 }], ['wind', 'curve']),
  UL('U06', 'nuke_ball', '足球核爆', 'legendary', '☢️', '#84cc16', '下一次射门命中时产生巨大爆炸，击倒 7 米内所有球员（含门将）', [{ t: 'nextShot', shot: { form: 'nuke', prio: 10, explode: 7, power: 0.3 }, dur: 15 }], ['explode']),
  UL('U07', 'absolute_defense', '绝对防御', 'epic', '🛡️', '#22c55e', '己方门将进入无敌防御状态 10 秒（可扑范围内必定扑出）', [{ t: 'gk', mods: { gkSave: 1, gkReact: 1 }, dur: 10, invincible: 1 }], ['gk', 'defense']),
  UL('U08', 'golden_goal', '黄金进球', 'epic', '🥇', '#fbbf24', '下一次射门大幅强化：威力 +80%、精度 +80%、破门 +50%', [{ t: 'nextShot', shot: { form: 'golden', prio: 9, power: 0.8, accuracy: 0.8, pierce: 0.5 }, dur: 20 }], ['golden', 'shoot']),
  UL('U09', 'giant_descent', '巨人降临', 'epic', '🦍', '#a16207', '核心球员巨大化 10 秒：对抗 +100%、抢断 +50%、射门 +30%', [{ t: 'giant', scale: 1.8, dur: 10, mods: { body: 1, tackle: 0.5, shotPower: 0.3, speed: 0.1, stunResist: 1 } }], ['body', 'power']),
  UL('U10', 'dimension_gate', '次元传送', 'rare', '🌀', '#7c3aed', '带球瞬间转移到敌方禁区弧顶附近的合法空位', [{ t: 'teleport' }], ['space', 'tactic']),
  UL('U11', 'ball_storm', '足球风暴', 'legendary', '🌪️', '#f43f5e', '召唤 6 颗能量足球连续轰击对手防线，击中者眩晕 1.5 秒', [{ t: 'storm', count: 6, dur: 4 }], ['storm', 'explode']),
  UL('U12', 'god_domain', '神之领域', 'legendary', '✨', '#fde047', '全队全属性 +30%，所有对手减速 30%，持续 8 秒', [{ t: 'buff', target: 'team', mods: { speed: 0.3, sprint: 0.3, shotPower: 0.3, shotAccuracy: 0.3, control: 0.3, passAccuracy: 0.3, tackle: 0.3, body: 0.3 }, dur: 8 }, { t: 'oppSlowAll', slow: 0.3, dur: 8 }], ['team', 'time']),
];

// ====================== 进化技能（20） ======================
const EV = (code: string, id: string, name: string, main: string, partner: string, req: [number, number], baseCat: BaseCategory, icon: string, color: string, desc: string, extra: Extra): SkillDef => ({
  id, code, name, category: 'evolution', baseCategory: baseCat, rarity: 'legendary', icon, color, desc, maxLevel: 3, tags: ['evolution'],
  vfx: extra.vfx ?? 'evolution', sfx: extra.sfx ?? 'evolve', anim: (extra.anim ?? 'Celebrate') as AnimName, evolveFrom: { main, partner, req }, ...extra,
});

export const EVOLUTION_SKILLS: SkillDef[] = [
  EV('E01', 'flame_emperor', '炎帝世界波', 'fire_shot', 'iron_leg', [3, 2], 'shooting', '🐲', '#ff4500', '烈焰化身的世界波：威力 +60%，命中产生 4 米爆炸与火焰风暴', { cooldown: 8, shot: { form: 'fire', prio: 7, power: 0.6, explode: 4, burn: 2.5, speed: 0.15 }, trigger: '蓄力射门自动触发', vfx: 'fire_ball', sfx: 'fire' }),
  EV('E02', 'thunder_gale', '雷霆疾风', 'thunder_shot', 'swift_feet', [3, 2], 'shooting', '🌩️', '#fde047', '雷电与疾风合一：速度 +50%，沿途连锁闪电；持续移动速度 +10%', { cooldown: 8, shot: { form: 'thunder', prio: 7, speed: 0.5, chain: 3.5, power: 0.2 }, passive: { speed: 0.1 }, vfx: 'lightning', sfx: 'zap' }),
  EV('E03', 'absolute_zero', '绝对零度', 'frost_shot', 'precision_master', [3, 2], 'shooting', '🧊', '#a5f3fc', '冻结一切：精度 +30%，命中产生 6 米冰冻区域并冻结门将', { cooldown: 9, shot: { form: 'ice', prio: 7, accuracy: 0.3, freezeZone: 6, power: 0.2 }, vfx: 'ice_burst', sfx: 'ice' }),
  EV('E04', 'world_ender', '灭世陨星', 'meteor_shot', 'iron_leg', [3, 2], 'shooting', '🌠', '#7f1d1d', '毁天灭地的陨星：威力 +80%，6 米巨型爆炸', { cooldown: 12, shot: { form: 'meteor', prio: 8, power: 0.8, explode: 6 }, vfx: 'meteor', sfx: 'explosion' }),
  EV('E05', 'shadow_wind_step', '影风舞步', 'whirlwind_dribble', 'phantom_clone', [3, 2], 'active', '🌬️', '#c4b5fd', '旋风与幻影共舞：生成 3 个分身，击退 4 米内对手，速度 +30%', { cooldown: 14, active: [{ t: 'clone', count: 3, dur: 6, mode: 'attack' }, { t: 'status', target: 'oppNear', radius: 4, status: 'knock', dur: 0.9, power: 7, fx: 'wind' }, { t: 'buff', target: 'self', mods: { speed: 0.3, control: 0.3 }, dur: 3 }], vfx: 'whirl', sfx: 'wind' }),
  EV('E06', 'auto_possession', '全自动传控', 'magnet_pass', 'pass_master', [3, 2], 'active', '🤖', '#60a5fa', '15 秒内所有传球自动精准到位，传球精度永久 +20%', { cooldown: 8, active: [{ t: 'nextPass', dur: 15 }], passive: { passAccuracy: 0.2 }, vfx: 'magnet', sfx: 'magnet' }),
  EV('E07', 'lightspeed_break', '光速破门', 'lightning_dash', 'light_shot', [3, 2], 'active', '💥', '#fef9c3', '闪电冲刺后立即光速射门：速度 +80%，射速 +80%', { cooldown: 10, active: [{ t: 'buff', target: 'self', mods: { speed: 0.8, sprint: 0.5 }, dur: 2 }, { t: 'shootNow', shot: { form: 'light', prio: 8, speed: 0.8, accuracy: 0.3 } }], vfx: 'light', sfx: 'zap' }),
  EV('E08', 'galaxy_spin', '银河旋球', 'anti_gravity', 'spiral_shot', [3, 2], 'active', '🌌', '#a78bfa', '足球悬浮于银河之中，下一脚射门带银河弧线与追踪', { cooldown: 18, active: [{ t: 'float', radius: 8, dur: 3 }, { t: 'nextShot', shot: { form: 'galaxy', prio: 8, curve: 2, homing: 0.8, power: 0.3 }, dur: 10 }], vfx: 'float', sfx: 'magic' }),
  EV('E09', 'fate_guidance', '命运制导', 'homing_shot', 'lucky_ball', [3, 2], 'shooting', '🎲', '#22d3ee', '命中注定的射门：强力追踪、必定暴击、精度 +50%', { cooldown: 10, shot: { homing: 2.2, accuracy: 0.5, pierce: 0.2, crit: 1 }, vfx: 'homing', sfx: 'shot_skill' }),
  EV('E10', 'sky_burst', '震天爆裂', 'burst_shot', 'quake_tackle', [3, 2], 'shooting', '💢', '#ea580c', '震天动地：7 米爆炸与路径冲击波', { cooldown: 11, shot: { explode: 7, shockwave: 4, power: 0.4 }, vfx: 'explosion', sfx: 'explosion' }),
  EV('E11', 'eternal_wall', '永恒壁垒', 'absolute_shield', 'iron_wall', [3, 2], 'defense', '🏯', '#0ea5e9', '自身获得护盾，并在球门前生成能阻挡一次射门的壁垒', { cooldown: 25, defense: [{ trig: 'ready', cd: 25, ops: [{ t: 'shield', dur: 999, hits: 2 }, { t: 'barrier', dur: 999, hits: 1 }] }], vfx: 'shield', sfx: 'shield', trigger: '冷却完毕自动生效' }),
  EV('E12', 'undefeated_keeper', '不败门神', 'goal_god', 'gk_foresight', [3, 2], 'defense', '🦸', '#16a34a', '门将扑救 +35%、反应 +50%；敌方射门时 1.5 秒无敌', { cooldown: 25, passive: { gkSave: 0.35, gkReact: 0.5 }, defense: [{ trig: 'oppShot', cd: 25, ops: [{ t: 'gk', mods: { gkSave: 1 }, dur: 1.5, invincible: 1 }] }], vfx: 'gk_glow', sfx: 'shield', trigger: '敌方射门时 + 持续生效' }),
  EV('E13', 'frozen_domain', '极寒领域', 'frost_tackle', 'domain_suppress', [3, 2], 'defense', '🌨️', '#bae6fd', '6 米寒冰领域减速 45%；抢断成功冻结周围 3 米敌人', { cooldown: 6, defense: [{ trig: 'passive', cd: 0, ops: [{ t: 'aura', radius: 6, slow: 0.45, dur: 0.3 }] }, { trig: 'tackleWin', cd: 6, ops: [{ t: 'status', target: 'oppNear', radius: 3, status: 'freeze', dur: 2, fx: 'ice' }] }], vfx: 'ice_burst', sfx: 'ice', trigger: '持续生效 + 抢断成功时' }),
  EV('E14', 'thousand_shadows', '千影足球', 'phantom_shot', 'split_shot', [3, 2], 'shooting', '🎭', '#e879f9', '千道残影：分裂 6 个诱饵，门将反应时间 +70%', { cooldown: 9, shot: { form: 'phantom', prio: 7, split: 6, afterimage: 0.7, power: 0.2 }, vfx: 'phantom', sfx: 'phantom' }),
  EV('E15', 'gale_domain', '疾风领域', 'speed_field', 'swift_feet', [3, 2], 'active', '🍃', '#4ade80', '全队速度 +45% 持续 7 秒，所有对手减速 20%', { cooldown: 18, active: [{ t: 'buff', target: 'team', mods: { speed: 0.45, sprint: 0.2 }, dur: 7 }, { t: 'oppSlowAll', slow: 0.2, dur: 7 }], vfx: 'field_green', sfx: 'wind' }),
  EV('E16', 'time_judgement', '时间裁决', 'time_slow', 'golden_shot', [3, 2], 'active', '⚖️', '#fcd34d', '冻结时间般减速所有对手 70%（4 秒），下一次射门化为黄金射门', { cooldown: 28, active: [{ t: 'oppSlowAll', slow: 0.7, dur: 4 }, { t: 'nextShot', shot: { form: 'golden', prio: 8, power: 0.6, accuracy: 0.6, pierce: 0.3 }, dur: 10 }], vfx: 'time', sfx: 'time' }),
  EV('E17', 'sky_walk', '天空漫步', 'rocket_boost', 'double_jump', [3, 2], 'active', '🪽', '#7dd3fc', '腾空飞行 14 米，可在空中二段跳跃争顶', { cooldown: 10, active: [{ t: 'dash', mode: 'fly', dist: 14, speed: 24 }, { t: 'jump', height: 2.6, double: 1 }], vfx: 'rocket', sfx: 'rocket' }),
  EV('E18', 'thunder_counter', '雷霆反击', 'counter_horn', 'quick_react', [3, 2], 'defense', '🐺', '#facc15', '抢断成功后全队速度 +50%（5 秒），并麻痹周围 4 米的对手', { cooldown: 9, defense: [{ trig: 'tackleWin', cd: 9, ops: [{ t: 'buff', target: 'team', mods: { speed: 0.5 }, dur: 5 }, { t: 'status', target: 'oppNear', radius: 4, status: 'stun', dur: 1.2, fx: 'thunder' }] }], vfx: 'lightning', sfx: 'zap', trigger: '抢断成功时' }),
  EV('E19', 'sonic_impact', '超音速冲击', 'shock_shot', 'light_shot', [3, 2], 'shooting', '🔊', '#fbcfe8', '突破音障：速度 +70%，5 米路径冲击波', { cooldown: 10, shot: { form: 'light', prio: 7, speed: 0.7, shockwave: 5, power: 0.2 }, vfx: 'wave', sfx: 'wave' }),
  EV('E20', 'universal_gravity', '万有引力', 'gravity_pull', 'ball_magnet', [3, 2], 'active', '🍎', '#c084fc', '14 米超强引力吸球并减速周围对手；控球范围永久 +40%', { cooldown: 10, active: [{ t: 'pullBall', radius: 14, dur: 1.2, power: 50 }, { t: 'status', target: 'oppNear', radius: 6, status: 'slow', dur: 2, power: 0.4, fx: 'time' }], passive: { controlRange: 0.4 }, vfx: 'pull', sfx: 'magnet' }),
];

export const EVOLUTIONS: EvolutionDef[] = EVOLUTION_SKILLS.map((s) => ({
  id: s.id, code: s.code, name: s.name, main: s.evolveFrom!.main, partner: s.evolveFrom!.partner, req: s.evolveFrom!.req, result: s.id,
}));

export const BASE_SKILLS: SkillDef[] = [...ACTIVE_SKILLS, ...PASSIVE_SKILLS, ...SHOOTING_SKILLS, ...DEFENSE_SKILLS, ...ULTIMATE_SKILLS];
export const ALL_SKILLS: SkillDef[] = [...BASE_SKILLS, ...EVOLUTION_SKILLS];
