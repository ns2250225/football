import { EventDef } from '../game/types';

export const EVENTS: EventDef[] = [
  { id: 'golden_football', code: '01', name: '黄金足球', icon: '🟡', desc: '足球威力增加 25%（双方）', scope: 'both', effect: { ballPower: 1.25 } },
  { id: 'thunderstorm', code: '02', name: '雷暴天气', icon: '🌩️', desc: '球场随机出现闪电，被击中的球员短暂麻痹（双方）', scope: 'both', effect: { lightning: true } },
  { id: 'icy_pitch', code: '03', name: '冰雪球场', icon: '🧊', desc: '地面摩擦降低：足球滚得更远，球员急停变难（双方）', scope: 'both', effect: { friction: 0.5 } },
  { id: 'double_xp', code: '04', name: '双倍经验', icon: '📈', desc: '玩家经验获取翻倍', scope: 'player', effect: { xpMul: 2 } },
  { id: 'crowd_frenzy', code: '05', name: '观众狂热', icon: '📣', desc: '玩家大招充能 +50%', scope: 'player', effect: { ultMul: 1.5 } },
  { id: 'ball_rage', code: '06', name: '足球狂暴', icon: '💢', desc: '足球速度 +25%（双方）', scope: 'both', effect: { ballSpeed: 1.25 } },
  { id: 'night_mode', code: '07', name: '黑夜模式', icon: '🌑', desc: '球场环境亮度大幅降低（双方）', scope: 'both', effect: { night: true } },
  { id: 'anti_gravity', code: '08', name: '反重力', icon: '🪐', desc: '重力减弱，足球弹跳高度增加（双方）', scope: 'both', effect: { bounce: 1.35, gravity: 0.7 } },
  { id: 'golden_time', code: '09', name: '黄金时间', icon: '💰', desc: '玩家金币获取 +50%', scope: 'player', effect: { goldMul: 1.5 } },
  { id: 'gale', code: '10', name: '狂风天气', icon: '🌬️', desc: '足球轨迹受风力影响，风向随时间变化（双方）', scope: 'both', effect: { wind: 2.2 } },
  { id: 'giant_goal', code: '11', name: '巨型球门', icon: '🥅', desc: '球门尺寸增加 35%（双方）', scope: 'both', effect: { goalScale: 1.35 }, conflicts: ['tiny_goal'] },
  { id: 'tiny_goal', code: '12', name: '超小球门', icon: '🔳', desc: '球门尺寸缩小 25%（双方）', scope: 'both', effect: { goalScale: 0.75 }, conflicts: ['giant_goal'] },
  { id: 'double_ball', code: '13', name: '双足球', icon: '⚽', desc: '场上同时出现两个足球，都可以进球（双方）', scope: 'both', effect: { doubleBall: true } },
  { id: 'speed_match', code: '14', name: '加速比赛', icon: '⏩', desc: '球员和足球速度 +15%（双方）', scope: 'both', effect: { playerSpeed: 1.15, ballSpeed: 1.1 } },
  { id: 'stamina_crisis', code: '15', name: '体力危机', icon: '🥵', desc: '球员体力消耗 +70%（双方）', scope: 'both', effect: { staminaDrain: 1.7 } },
  { id: 'skill_carnival', code: '16', name: '技能狂欢', icon: '🎉', desc: '玩家技能冷却缩短 30%', scope: 'player', effect: { cdr: 0.3 } },
];
export const EVENT_MAP: Record<string, EventDef> = Object.fromEntries(EVENTS.map((e) => [e.id, e]));
