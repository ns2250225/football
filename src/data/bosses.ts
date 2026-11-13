import { BossDef } from '../game/types';

export const BOSSES: BossDef[] = [
  { id: 'iron_keeper', name: '铁壁守门员', type: '防守型', icon: '🧱', mech: '超高扑救能力', desc: '门将扑救 +60%、扑救范围 +30%，反应更快。', match: (t) => t.stats.defense / 100 + (t.defaultTactic === 'defend' ? 0.3 : 0) },
  { id: 'flash_striker', name: '闪电前锋', type: '速度型', icon: '⚡', mech: '高速连续突破', desc: '前锋速度 +25%，每 8 秒持球前锋发动一次瞬间突破。', match: (t) => t.stats.speed / 100 + (t.defaultTactic === 'counter' ? 0.2 : 0) },
  { id: 'fire_shooter', name: '火焰射手', type: '进攻型', icon: '🔥', mech: '火焰射门', desc: '每 9 秒的一次蓄力射门化为火焰射门（威力 +35%，命中爆炸）。', match: (t) => t.stats.shooting / 100 + t.profile.longShot * 0.2 },
  { id: 'frost_mid', name: '冰霜中场', type: '控制型', icon: '❄️', mech: '冰冻球场区域', desc: '每 12 秒在玩家持球者附近生成冰冻区域，区域内玩家球员减速 50%。', match: (t) => t.stats.passing / 100 + t.profile.possession * 0.25 },
  { id: 'phantom_king', name: '幻影球王', type: '技巧型', icon: '👻', mech: '分身和幻影', desc: '持球者每 14 秒生成 2 个幻影分身迷惑防守，控球 +20%。', match: (t) => t.stats.dribbling / 100 + 0.1 },
  { id: 'thunder_back', name: '雷霆后卫', type: '防守型', icon: '🌩️', mech: '范围闪电拦截', desc: '玩家持球靠近对方后卫 7 米内时，每 9 秒释放闪电麻痹持球者。', match: (t) => t.stats.defense / 100 + t.profile.press * 0.2 },
  { id: 'giant_forward', name: '巨人中锋', type: '力量型', icon: '🦍', mech: '身体对抗极强', desc: '中锋巨大化（1.5 倍），对抗 +80%、头球 +50%。', match: (t) => t.profile.physical * 0.8 + t.profile.aerial * 0.4 },
  { id: 'world_champion', name: '世界冠军队', type: '全能型', icon: '🏆', mech: '多种技能组合', desc: '四阶段机制：正常比赛 → 落后时提速 → 强化门将 → 释放终极团队技能。',
    phases: ['第一阶段：正常比赛', '第二阶段：比分落后或开场 60 秒后全队提速 15%', '第三阶段：下半场门将扑救大幅强化', '第四阶段：最后 40 秒释放终极团队技能「神之领域」'], match: () => 0 },
];
export const BOSS_MAP: Record<string, BossDef> = Object.fromEntries(BOSSES.map((b) => [b.id, b]));
