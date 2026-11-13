import { AchievementDef, MetaState } from '../game/types';

const s = (m: MetaState) => m.stats;
const A = (id: string, name: string, desc: string, icon: string, reward: { team?: string; gold?: number }, check: (m: MetaState) => boolean, progress?: (m: MetaState) => [number, number]): AchievementDef =>
  ({ id, name, desc, icon, reward, check, progress });
const num = (f: (m: MetaState) => number, target: number) => [(m: MetaState) => f(m) >= target, (m: MetaState) => [Math.min(f(m), target), target] as [number, number]] as const;

const titles = (m: MetaState) => s(m).champions;
const [c50, p50] = num((m) => s(m).goals, 50);
const [c100t, p100t] = num((m) => s(m).tackles, 100);
const [c100s, p100s] = num((m) => s(m).skillUses, 100);
const [c5e, p5e] = num((m) => s(m).evolutions.length, 5);
const [c20u, p20u] = num((m) => s(m).ultUses, 20);
const [c8b, p8b] = num((m) => s(m).bosses.length, 8);
const [c5c, p5c] = num(titles, 5);
const [c5t, p5t] = num((m) => s(m).championTeams.length, 5);
const [c8s, p8s] = num((m) => s(m).stadiums.length, 8);
const [c6w, p6w] = num((m) => s(m).weathers.length, 6);
const [c16e, p16e] = num((m) => s(m).eventsSeen.length, 16);
const [c20b, p20b] = num((m) => s(m).buys, 20);
const [c50m, p50m] = num((m) => s(m).matches, 50);
const [c30a, p30a] = num((m) => s(m).assists, 30);
const [c50sv, p50sv] = num((m) => s(m).saves, 50);
const [c50sk, p50sk] = num((m) => s(m).skillsSeen.length, 50);
const [c20l, p20l] = num((m) => s(m).maxLevel, 20);
const [c1000, p1000] = num((m) => s(m).maxGold, 1000);

export const ACHIEVEMENTS: AchievementDef[] = [
  // ===== 解锁球队的 24 项成就 =====
  A('first_match', '初次登场', '完成第一场世界杯比赛', '🎽', { team: 'mexico' }, (m) => s(m).matches >= 1),
  A('first_win', '首场胜利', '赢得一场比赛', '✌️', { team: 'switzerland' }, (m) => s(m).wins >= 1),
  A('first_goal', '破门得分', '打进第一个进球', '⚽', { team: 'denmark' }, (m) => s(m).goals >= 1),
  A('group_out', '小组出线', '从小组赛晋级 16 强', '📊', { team: 'croatia' }, (m) => s(m).groupOuts >= 1),
  A('quarter', '八强之师', '闯入 8 强', '🎖️', { team: 'uruguay' }, (m) => Object.values(s(m).bestStage).some((v) => v >= 2)),
  A('semi', '四强之路', '闯入半决赛', '🥉', { team: 'belgium' }, (m) => Object.values(s(m).bestStage).some((v) => v >= 3)),
  A('final', '决赛舞台', '闯入世界杯决赛', '🥈', { team: 'netherlands' }, (m) => Object.values(s(m).bestStage).some((v) => v >= 4)),
  A('champion', '世界冠军', '赢得世界杯冠军', '🏆', { team: 'italy' }, (m) => titles(m) >= 1),
  A('hat_trick', '帽子戏法', '单场比赛完成帽子戏法', '🎩', { team: 'poland' }, (m) => s(m).hatTricks >= 1),
  A('clean_sheet', '零封对手', '不丢球赢得比赛', '🧤', { team: 'sweden' }, (m) => s(m).cleanSheets >= 1),
  A('goals_50', '进球机器', '累计打进 50 球', '🔥', { team: 'senegal' }, c50, p50),
  A('tackles_100', '铁血后卫', '累计完成 100 次抢断', '🛡️', { team: 'morocco' }, c100t, p100t),
  A('skills_100', '技能达人', '累计使用技能 100 次', '✨', { team: 'korea' }, c100s, p100s),
  A('evolve_1', '首次进化', '完成一次技能进化', '🧬', { team: 'egypt' }, (m) => s(m).evolutions.length >= 1),
  A('evolve_5', '进化大师', '解锁 5 种不同的进化技能', '🐉', { team: 'cameroon' }, c5e, p5e),
  A('ult_20', '终极爆发', '累计释放大招 20 次', '💥', { team: 'australia' }, c20u, p20u),
  A('boss_1', '精英猎手', '击败一支 BOSS 球队', '👹', { team: 'canada' }, (m) => s(m).bosses.length >= 1),
  A('boss_all', 'BOSS 收集者', '击败全部 8 种 BOSS 模板', '🗡️', { team: 'colombia' }, c8b, p8b),
  A('pens_win', '点球大师', '赢得一次点球大战', '🎯', { team: 'ecuador' }, (m) => s(m).penWins >= 1),
  A('comeback', '逆转好戏', '在落后的情况下逆转获胜', '🔄', { team: 'serbia' }, (m) => s(m).comebacks >= 1),
  A('big_win', '大胜', '净胜 4 球以上赢得比赛', '💯', { team: 'austria' }, (m) => s(m).bigWins >= 1),
  A('legendary', '传说降临', '获得一个传说品质技能', '🌟', { team: 'turkey' }, (m) => s(m).legendaryPicks >= 1),
  A('rich', '富可敌国', '单次征程中持有 1000 金币', '💰', { team: 'wales' }, c1000, p1000),
  A('level_20', '等级 20', '单次征程达到 20 级', '📈', { team: 'usa' }, c20l, p20l),
  // ===== 其他成就 =====
  A('champion_hard', '困难冠军', '在困难或更高难度夺冠', '🔱', { gold: 30 }, (m) => s(m).titlesByDiff.slice(2).some((v) => v > 0)),
  A('champion_hell', '地狱冠军', '在地狱或更高难度夺冠', '😈', { gold: 40 }, (m) => s(m).titlesByDiff.slice(3).some((v) => v > 0)),
  A('champion_wc', '真正的世界冠军', '在世界冠军难度夺冠', '👑', { gold: 60 }, (m) => (s(m).titlesByDiff[4] ?? 0) > 0),
  A('dynasty', '王朝', '累计夺得 5 次世界杯', '🏰', { gold: 50 }, c5c, p5c),
  A('multi_nation', '多国征战', '使用 5 支不同球队夺冠', '🌍', { gold: 50 }, c5t, p5t),
  A('unbeaten', '不败夺冠', '一场不输赢得世界杯', '🛡️', { gold: 40 }, (m) => s(m).unbeatenTitles >= 1),
  A('perfect', '完美征程', '全胜赢得世界杯', '💎', { gold: 60 }, (m) => s(m).perfectTitles >= 1),
  A('stadiums_all', '环球旅行', '在全部 8 座球场比赛', '🗺️', { gold: 30 }, c8s, p8s),
  A('weather_all', '风雨无阻', '经历全部 6 种天气', '🌦️', { gold: 30 }, c6w, p6w),
  A('events_all', '事件见证者', '经历全部 16 种特殊事件', '🎪', { gold: 40 }, c16e, p16e),
  A('equip_full', '全副武装', '同时装备满 6 个装备槽', '🎒', { gold: 20 }, (m) => s(m).fullEquip),
  A('equip_legend', '传说装备', '获得一件传说品质装备', '🏅', { gold: 20 }, (m) => s(m).equipFound.some((id) => ['diamond_boots', 'diamond_guards', 'golden_gloves', 'champion_helmet', 'golden_ball', 'meteor_ball'].includes(id))),
  A('all_cats', '全能构筑', '单次征程同时拥有五类基础技能', '🧩', { gold: 30 }, (m) => s(m).allCats),
  A('shopper', '购物狂', '累计在商店购买 20 次', '🛒', { gold: 20 }, c20b, p20b),
  A('veteran', '老将', '累计进行 50 场比赛', '🎖️', { gold: 40 }, c50m, p50m),
  A('goal_feast', '进球盛宴', '单场比赛打进 5 球以上', '🎉', { gold: 30 }, (m) => s(m).maxGoalsMatch >= 5),
  A('assist_king', '助攻王', '累计完成 30 次助攻', '🤝', { gold: 30 }, c30a, p30a),
  A('save_god', '神级门将', '己方门将累计完成 50 次扑救', '🧱', { gold: 30 }, c50sv, p50sv),
  A('random_champ', '随机冠军', '在随机世界杯模式夺冠', '🎲', { gold: 30 }, (m) => (s(m).titlesByMode.random ?? 0) > 0),
  A('extreme_champ', '极限冠军', '在极限世界杯模式夺冠', '⚡', { gold: 50 }, (m) => (s(m).titlesByMode.extreme ?? 0) > 0),
  A('collector', '图鉴收集者', '累计获得 50 种不同的技能', '📖', { gold: 40 }, c50sk, p50sk),
];
export const ACH_MAP: Record<string, AchievementDef> = Object.fromEntries(ACHIEVEMENTS.map((a) => [a.id, a]));
