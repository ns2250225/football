import { create } from 'zustand';
import {
  RunState, MetaState, MetaStats, Settings, GameMode, CustomOptions, DraftChoice, EquipSlot, TacticMode, MatchPlan, MatchResult, STAGE_NAME,
  EQUIP_SLOTS, RosterPlayer, BaseCategory,
} from '../game/types';
import type { MatchOutcome, MatchSetup } from '../game/core/GameState';
import { TEAMS, getTeam } from '../data/teams';
import { getRoster } from '../data/players';
import { ACHIEVEMENTS } from '../data/achievements';
import { EQUIP_MAP } from '../data/equipment';
import { RNG, newSeed, rand } from '../utils/random';
import { XP_NEED, opponentMultiplier } from '../utils/balance';
import { createTournament, advanceAfterPlayerMatch, simulateRemaining, isEliminated, nextPlayerMatch, teamStageReached, refreshBracket } from '../game/tournament/WorldCup';
import { groupComplete, groupStandings } from '../game/tournament/Standings';
import { createPlan } from '../game/roguelike/MatchPlanner';
import { gainXp as levelGain } from '../game/roguelike/LevelSystem';
import { generateDraft } from '../game/skills/SkillPool';
import { applyDraftChoice, computeRewards, MatchRewards } from '../game/roguelike/RewardManager';
import { generateShop, buyOffer, restock } from '../game/roguelike/ShopManager';
import { equip, unequip, addEquipment } from '../game/roguelike/EquipmentManager';
import { buildMods, hasFlag } from '../game/skills/SkillEvolution';
import { SKILL_MAP } from '../game/skills/SkillRegistry';
import { saveRun, saveMeta, loadRun, loadMeta, loadBackupRun } from './saveStore';
import { AudioManager } from '../game/audio/AudioManager';

export type Screen = 'menu' | 'mode' | 'teamSelect' | 'coreSelect' | 'hub' | 'match' | 'shop' | 'manage' | 'encyclopedia' | 'achievements' | 'settings' | 'tournamentEnd';

export const START_SKILLS: Record<string, string[]> = {
  striker: ['spiral_shot', 'gravity_shot', 'bounce_shot', 'cloud_piercer', 'thunder_shot', 'frost_shot', 'iron_leg', 'precision_master'],
  winger: ['lightning_dash', 'blink_dribble', 'double_jump', 'whirlwind_dribble', 'energy_wave', 'swift_feet'],
  playmaker: ['magnet_pass', 'gravity_pull', 'speed_field', 'pass_master', 'counter_horn', 'iron_wall'],
};

export function defaultSettings(): Settings {
  const mobile = typeof window !== 'undefined' && (('ontouchstart' in window) || navigator.maxTouchPoints > 0);
  return { quality: mobile ? 'low' : 'medium', sfx: 0.8, music: 0.4, hints: true, shake: true, autoSwitch: true, showFps: false, touch: 'auto', brightness: 1.1 };
}
function emptyStats(): MetaStats {
  return {
    runs: 0, champions: 0, matches: 0, wins: 0, draws: 0, losses: 0, goals: 0, assists: 0, tackles: 0, saves: 0, skillUses: 0, ultUses: 0, evolutions: [], bosses: [],
    championTeams: [], hatTricks: 0, cleanSheets: 0, penWins: 0, comebacks: 0, bigWins: 0, maxLevel: 0, legendaryPicks: 0, equipFound: [], skillsSeen: [], stadiums: [],
    weathers: [], eventsSeen: [], buys: 0, maxGold: 0, maxGoalsMatch: 0, bestStage: {}, titlesByDiff: [0, 0, 0, 0, 0], titlesByMode: {}, unbeatenTitles: 0, perfectTitles: 0,
    fullEquip: false, allCats: false, groupOuts: 0,
  };
}
export function defaultMeta(): MetaState {
  return { version: 1, unlocked: TEAMS.filter((t) => t.unlockedByDefault).map((t) => t.id), achievements: {}, stats: emptyStats(), settings: defaultSettings(), teamHistory: {} };
}
const uniq = (arr: string[]) => [...new Set(arr)];

export interface ResultInfo {
  outcome: MatchOutcome; rewards: MatchRewards; plan: MatchPlan; newAch: string[]; unlocked: string[]; advanced: boolean; eliminated: boolean; championWon: boolean; dropName?: string;
}

interface GameStore {
  screen: Screen; ready: boolean; meta: MetaState; run: RunState | null;
  pendingMode: { mode: GameMode; difficulty: number; custom: CustomOptions } | null;
  pendingTeam: string | null;
  result: ResultInfo | null;
  achToasts: { id: number; name: string; icon: string; reward: string }[];
  message: string | null;
  go: (s: Screen) => void;
  init: () => Promise<void>;
  setSettings: (p: Partial<Settings>) => void;
  beginRun: (mode: GameMode, difficulty: number, custom: CustomOptions) => void;
  pickTeam: (id: string) => void;
  pickCore: (rosterId: string, archetype: string, startSkill: string) => void;
  continueRun: () => void;
  abandonRun: () => void;
  buildSetup: () => MatchSetup | null;
  startMatch: () => void;
  gainXp: (n: number) => number;
  ensureDraft: () => void;
  pickDraft: (i: number) => DraftChoice | null;
  rerollDraft: () => boolean;
  finishMatch: (o: MatchOutcome) => void;
  afterResult: () => void;
  buy: (i: number) => string;
  restockShop: () => boolean;
  leaveShop: () => void;
  equipItem: (id: string) => void;
  unequipSlot: (s: EquipSlot) => void;
  setUltimate: (id: string) => void;
  setTactic: (m: TacticMode | null) => void;
  swapLineup: (starterIdx: number, subId: string) => void;
  simulateRest: () => void;
  finishRun: () => void;
  replaceAll: (run: RunState | null, meta: MetaState) => Promise<void>;
  restoreBackup: () => Promise<boolean>;
  dismissAch: (id: number) => void;
  persist: () => void;
}

let achId = 1;

export const useGame = create<GameStore>((set, get) => {
  const persistRun = () => { const r = get().run; saveRun(r).catch(() => {}); };
  const persistMeta = () => { saveMeta(get().meta).catch(() => {}); };
  /** 检查成就，发放奖励 */
  const checkAchievements = (): { names: string[]; unlocked: string[] } => {
    const meta = get().meta;
    const names: string[] = []; const unlocked: string[] = [];
    const toasts = [...get().achToasts];
    for (const a of ACHIEVEMENTS) {
      if (meta.achievements[a.id]) continue;
      if (!a.check(meta)) continue;
      meta.achievements[a.id] = Date.now();
      names.push(a.name);
      let reward = '';
      if (a.reward.team && !meta.unlocked.includes(a.reward.team)) { meta.unlocked.push(a.reward.team); unlocked.push(a.reward.team); reward = `解锁球队：${getTeam(a.reward.team).name}`; }
      if (a.reward.gold) reward = `征程初始金币 +${a.reward.gold}`;
      toasts.push({ id: achId++, name: a.name, icon: a.icon, reward });
    }
    if (names.length) { set({ achToasts: toasts.slice(-4) }); AudioManager.play('levelup', 0.6); }
    return { names, unlocked };
  };
  /** 根据当前征程刷新统计中的收集类数据 */
  const syncCollectStats = (run: RunState) => {
    const st = get().meta.stats;
    st.evolutions = uniq([...st.evolutions, ...run.evolved]);
    st.skillsSeen = uniq([...st.skillsSeen, ...run.skills.map((s) => s.id)]);
    st.equipFound = uniq([...st.equipFound, ...run.inventory, ...(Object.values(run.equipSlots).filter(Boolean) as string[])]);
    st.maxLevel = Math.max(st.maxLevel, run.level);
    st.maxGold = Math.max(st.maxGold, run.gold);
    if (run.skills.some((s) => SKILL_MAP[s.id]?.rarity === 'legendary')) st.legendaryPicks = Math.max(1, st.legendaryPicks);
    if (EQUIP_SLOTS.every((s) => run.equipSlots[s])) st.fullEquip = true;
    const cats = new Set<BaseCategory>(run.skills.filter((s) => !s.absorbedInto).map((s) => SKILL_MAP[s.id]?.category).filter((c) => c && c !== 'evolution') as BaseCategory[]);
    if (cats.size >= 5) st.allCats = true;
  };
  const makePlan = (run: RunState) => { run.plan = createPlan(run, new RNG(newSeed())); };
  const finishRunInternal = (run: RunState) => {
    const meta = get().meta; const st = meta.stats;
    refreshBracket(run.tournament);
    run.ended = true;
    const champ = run.tournament.champion === run.teamId;
    run.championWon = champ;
    const h = meta.teamHistory[run.teamId] ?? { runs: 0, best: 0, titles: 0 };
    h.best = Math.max(h.best, teamStageReached(run.tournament, run.teamId));
    if (champ) {
      st.champions++; st.championTeams = uniq([...st.championTeams, run.teamId]); h.titles++;
      const d = run.mode === 'custom' ? run.custom.difficulty : run.difficulty;
      st.titlesByDiff[d] = (st.titlesByDiff[d] ?? 0) + 1;
      st.titlesByMode[run.mode] = (st.titlesByMode[run.mode] ?? 0) + 1;
      if (run.log.every((l) => l.won || l.draw)) st.unbeatenTitles++;
      if (run.log.every((l) => l.won)) st.perfectTitles++;
    }
    meta.teamHistory[run.teamId] = h;
  };

  return {
    screen: 'menu', ready: false, meta: defaultMeta(), run: null, pendingMode: null, pendingTeam: null, result: null, achToasts: [], message: null,
    go: (s) => { AudioManager.play('click'); set({ screen: s }); },
    init: async () => {
      const meta = (await loadMeta()) ?? defaultMeta();
      meta.settings = { ...defaultSettings(), ...meta.settings };
      meta.stats = { ...emptyStats(), ...meta.stats };
      for (const t of TEAMS) if (t.unlockedByDefault && !meta.unlocked.includes(t.id)) meta.unlocked.push(t.id);
      const run = await loadRun();
      AudioManager.setVolumes(meta.settings.sfx, meta.settings.music);
      set({ meta, run: run && !run.ended ? run : null, ready: true });
    },
    setSettings: (p) => {
      const meta = get().meta;
      meta.settings = { ...meta.settings, ...p };
      AudioManager.setVolumes(meta.settings.sfx, meta.settings.music);
      set({ meta: { ...meta } }); persistMeta();
    },
    beginRun: (mode, difficulty, custom) => { set({ pendingMode: { mode, difficulty, custom }, screen: 'teamSelect' }); },
    pickTeam: (id) => { set({ pendingTeam: id, screen: 'coreSelect' }); },
    pickCore: (rosterId, _archetype, startSkill) => {
      const pm = get().pendingMode; const teamId = get().pendingTeam;
      if (!pm || !teamId) return;
      const seed = newSeed();
      const rng = new RNG(seed);
      const team = getTeam(teamId);
      const roster: RosterPlayer[] = JSON.parse(JSON.stringify(getRoster(team)));
      const tournament = createTournament(rng, pm.mode);
      const meta = get().meta;
      const bonusGold = Math.min(300, ACHIEVEMENTS.filter((a) => meta.achievements[a.id] && a.reward.gold).reduce((s, a) => s + (a.reward.gold ?? 0), 0));
      const run: RunState = {
        version: 1, id: 'run_' + seed, seed, createdAt: Date.now(), mode: pm.mode, difficulty: pm.mode === 'custom' ? pm.custom.difficulty : pm.difficulty, custom: pm.custom,
        teamId, coreId: rosterId, roster, lineup: roster.slice(0, 5).map((p) => p.id), tournament, level: 1, xp: 0, skills: [{ id: startSkill, level: 1 }], evolved: [],
        ultimate: null, statBoosts: {}, equipSlots: { boots: null, guards: null, gloves: null, helmet: null, amulet: null, ball: null }, inventory: [],
        gold: 100 + bonusGold, rerollTokens: 1, ultStart: 0, teamFatigue: 0, shop: null, pendingDrafts: 0, draft: null, draftFreeReroll: true, pity: 0,
        plan: null, log: [], ended: false, eliminated: false, championWon: false, permBonus: {}, bossesBeaten: [], usedSkills: 0, tacticMode: null, buys: 0,
      };
      makePlan(run);
      meta.stats.runs++;
      const h = meta.teamHistory[teamId] ?? { runs: 0, best: 0, titles: 0 }; h.runs++; meta.teamHistory[teamId] = h;
      set({ run, screen: 'hub', pendingMode: null, pendingTeam: null });
      persistRun(); persistMeta();
    },
    continueRun: () => { const r = get().run; if (!r) return; set({ screen: r.ended ? 'tournamentEnd' : 'hub' }); },
    abandonRun: () => { set({ run: null, screen: 'menu' }); saveRun(null).catch(() => {}); },

    buildSetup: () => {
      const run = get().run; const meta = get().meta;
      if (!run) return null;
      if (!run.plan) makePlan(run);
      const plan = run.plan; if (!plan) return null;
      const team = getTeam(run.teamId), opp = getTeam(plan.opponent);
      const m = run.tournament.matches.find((x) => x.id === plan.matchId)!;
      const stageLabel = `世界杯 · ${STAGE_NAME[plan.stage]}${m.group ? ` · ${m.group} 组第 ${m.matchday} 轮` : ''}`;
      const equipShots = run.equipSlots.ball && EQUIP_MAP[run.equipSlots.ball]?.shot ? [EQUIP_MAP[run.equipSlots.ball].shot!] : [];
      const equipSpecials = EQUIP_SLOTS.map((s) => run.equipSlots[s]).filter(Boolean).map((id) => EQUIP_MAP[id!]?.special).filter(Boolean).map((s) => ({ kind: s!.kind, value: s!.value }));
      const diff = run.mode === 'custom' ? run.custom.difficulty : run.difficulty;
      return {
        matchId: plan.matchId, playerTeam: team, oppTeam: opp, playerRoster: run.lineup.map((id) => run.roster.find((r) => r.id === id)!), oppRoster: getRoster(opp).slice(0, 5),
        coreId: run.coreId, skills: run.skills, ultimate: run.ultimate, buildMods: buildMods(run), equipShots, equipSpecials, slideImmune: hasFlag(run, 'slideImmune'),
        stage: plan.stage, stageLabel, knockout: plan.stage !== 'group', difficulty: diff, oppMult: opponentMultiplier(diff, plan.stage, run.mode === 'extreme'),
        extreme: run.mode === 'extreme', stadium: (STADIUM_LOOKUP())[plan.stadiumId], weather: plan.weather, events: plan.events, boss: plan.boss,
        halfLength: Math.round(90 * (run.mode === 'custom' ? run.custom.timeScale : 1)), missions: plan.missions, ultStart: run.ultStart, teamFatigue: run.teamFatigue,
        tactic: run.tacticMode ?? team.defaultTactic, settings: meta.settings, level: run.level, xp: run.xp, xpNeed: XP_NEED(run.level),
      };
    },
    startMatch: () => {
      const run = get().run; if (!run) return;
      if (!run.plan) makePlan(run);
      persistRun();
      set({ screen: 'match', result: null });
    },
    gainXp: (n) => {
      const run = get().run; if (!run) return 0;
      levelGain(run, n);
      set({ run: { ...run } });
      return run.pendingDrafts;
    },
    ensureDraft: () => {
      const run = get().run; if (!run || run.pendingDrafts <= 0 || run.draft) return;
      const d = generateDraft(run, new RNG(newSeed()));
      run.pity = d.some((c) => c.rarity === 'epic' || c.rarity === 'legendary') ? 0 : run.pity + 1;
      run.draft = d; run.draftFreeReroll = true;
      set({ run: { ...run } });
    },
    pickDraft: (i) => {
      const run = get().run; if (!run || !run.draft) return null;
      const c = run.draft[i]; if (!c) return null;
      applyDraftChoice(run, c, rand);
      run.pendingDrafts = Math.max(0, run.pendingDrafts - 1);
      run.draft = null;
      syncCollectStats(run);
      set({ run: { ...run } });
      checkAchievements();
      persistRun(); persistMeta();
      if (run.pendingDrafts > 0) get().ensureDraft();
      AudioManager.play(c.kind === 'evolve' ? 'evolve' : 'levelup');
      return c;
    },
    rerollDraft: () => {
      const run = get().run; if (!run || !run.draft) return false;
      if (run.draftFreeReroll) run.draftFreeReroll = false;
      else if (run.rerollTokens > 0) run.rerollTokens--;
      else return false;
      run.draft = generateDraft(run, new RNG(newSeed()));
      set({ run: { ...run } });
      AudioManager.play('magic');
      return true;
    },

    finishMatch: (o) => {
      const run = get().run; const meta = get().meta;
      if (!run || !run.plan) return;
      const plan = run.plan;
      const t = run.tournament;
      const m = t.matches.find((x) => x.id === plan.matchId)!;
      const home = m.home === run.teamId;
      // 写入比赛结果（玩家比赛）
      const gfH = home ? o.gf : o.ga, gaH = home ? o.ga : o.gf;
      let winner: string | null = null;
      if (o.gf > o.ga || (o.pens && o.pens[0] > o.pens[1])) winner = run.teamId; else if (o.ga > o.gf || (o.pens && o.pens[1] > o.pens[0])) winner = plan.opponent;
      if (!winner && plan.stage !== 'group') winner = plan.opponent;
      const res: MatchResult = {
        homeGoals: gfH, awayGoals: gaH, et: o.et, pens: o.pens ? (home ? o.pens : [o.pens[1], o.pens[0]]) : undefined, winner,
        scorers: o.scorers, cards: o.cards, shots: home ? o.shots : [o.shots[1], o.shots[0]], onTarget: home ? o.onTarget : [o.onTarget[1], o.onTarget[0]],
        possession: home ? o.possession : [o.possession[1], o.possession[0]], events: [...plan.events.map((id) => `特殊事件：${id}`), ...(plan.boss ? [`BOSS：${plan.boss}`] : [])], byPlayer: true,
      };
      m.result = res;
      const wasGroupDone = t.groups.every((g) => groupComplete(t, g.name));
      advanceAfterPlayerMatch(t, m.id, run.teamId, new RNG(newSeed()));
      const nowGroupDone = t.groups.every((g) => groupComplete(t, g.name));
      // 奖励
      const rewards = computeRewards(run, plan, o, new RNG(newSeed()));
      let advanced = false;
      if (!wasGroupDone && nowGroupDone) {
        const myGroup = t.groups.find((g) => g.teams.includes(run.teamId))!;
        const pos = groupStandings(t, myGroup.name).findIndex((r) => r.team === run.teamId);
        if (pos <= 1) { advanced = true; rewards.lines.push({ label: '晋级淘汰赛', gold: 100 }); rewards.gold += 100; meta.stats.groupOuts++; }
      }
      run.gold += rewards.gold;
      let dropName: string | undefined;
      if (rewards.drop && addEquipment(run, rewards.drop)) dropName = EQUIP_MAP[rewards.drop].name;
      if (rewards.missionXp) levelGain(run, rewards.missionXp);
      // 疲劳与伤病
      run.teamFatigue = Math.max(0, Math.min(100, run.teamFatigue + 14 + (o.et ? 8 : 0) - 4));
      for (const p of run.roster) { if ((p.injured ?? 0) > 0) p.injured = (p.injured ?? 1) - 1; }
      for (const id of o.injuries) { const p = run.roster.find((r) => r.id === id); if (p) p.injured = 2; }
      run.ultStart = 0;
      if (o.won && plan.boss && !run.bossesBeaten.includes(plan.boss)) run.bossesBeaten.push(plan.boss);
      run.log.push({ matchId: m.id, stage: plan.stage, opponent: plan.opponent, gf: o.gf, ga: o.ga, pens: o.pens, won: o.won, draw: o.draw, goals: o.gf, assists: o.teamStats.assists, gold: rewards.gold, xp: o.xpEarned, boss: plan.boss });
      // 统计
      const st = meta.stats;
      st.matches++; if (o.won) st.wins++; else if (o.draw) st.draws++; else st.losses++;
      st.goals += o.gf; st.assists += o.teamStats.assists; st.tackles += o.teamStats.tackles; st.saves += o.teamStats.saves;
      st.skillUses += o.skillUses + o.ultUses; st.ultUses += o.ultUses;
      if (o.hatTrick) st.hatTricks++; if (o.won && o.ga === 0) st.cleanSheets++; if (o.pens && o.won) st.penWins++; if (o.comeback) st.comebacks++;
      if (o.won && o.gf - o.ga >= 4) st.bigWins++;
      st.maxGoalsMatch = Math.max(st.maxGoalsMatch, o.gf);
      st.stadiums = uniq([...st.stadiums, plan.stadiumId]); st.weathers = uniq([...st.weathers, plan.weather]); st.eventsSeen = uniq([...st.eventsSeen, ...plan.events]);
      if (o.won && plan.boss) st.bosses = uniq([...st.bosses, plan.boss]);
      st.buys = Math.max(st.buys, st.buys);
      st.bestStage[run.teamId] = Math.max(st.bestStage[run.teamId] ?? 0, teamStageReached(t, run.teamId));
      syncCollectStats(run);
      // 后续
      const eliminated = isEliminated(t, run.teamId);
      run.eliminated = eliminated;
      const championWon = t.champion === run.teamId;
      if (championWon || (plan.stage === 'final') || (plan.stage === 'third')) { finishRunInternal(run); }
      run.plan = null;
      if (!run.ended && !eliminated) makePlan(run);
      run.shop = { offers: generateShop(run, new RNG(newSeed())), restocks: 0, forMatch: m.id };
      const ach = checkAchievements();
      set({ run: { ...run }, meta: { ...meta }, result: { outcome: o, rewards, plan, newAch: ach.names, unlocked: ach.unlocked, advanced, eliminated, championWon, dropName } });
      persistRun(); persistMeta();
    },
    afterResult: () => {
      const run = get().run;
      if (!run) { set({ screen: 'menu' }); return; }
      set({ screen: 'shop' });
    },
    buy: (i) => {
      const run = get().run; if (!run) return '';
      const msg = buyOffer(run, i, new RNG(newSeed()));
      if (msg && msg !== '金币不足') { get().meta.stats.buys++; AudioManager.play('coin'); } else AudioManager.play('error');
      if (run.pendingDrafts > 0) get().ensureDraft();
      syncCollectStats(run);
      set({ run: { ...run } });
      checkAchievements();
      persistRun(); persistMeta();
      return msg;
    },
    restockShop: () => {
      const run = get().run; if (!run) return false;
      const ok = restock(run, new RNG(newSeed()));
      if (ok) { AudioManager.play('coin'); set({ run: { ...run } }); persistRun(); } else AudioManager.play('error');
      return ok;
    },
    leaveShop: () => {
      const run = get().run;
      if (run?.ended) set({ screen: 'tournamentEnd' }); else set({ screen: 'hub' });
      persistRun();
    },
    equipItem: (id) => { const run = get().run; if (!run) return; equip(run, id); syncCollectStats(run); set({ run: { ...run } }); checkAchievements(); persistRun(); persistMeta(); AudioManager.play('select'); },
    unequipSlot: (s) => { const run = get().run; if (!run) return; unequip(run, s); set({ run: { ...run } }); persistRun(); AudioManager.play('select'); },
    setUltimate: (id) => { const run = get().run; if (!run) return; run.ultimate = id; set({ run: { ...run } }); persistRun(); },
    setTactic: (mode) => { const run = get().run; if (!run) return; run.tacticMode = mode; set({ run: { ...run } }); persistRun(); },
    swapLineup: (idx, subId) => {
      const run = get().run; if (!run) return;
      const cur = run.lineup[idx];
      const curP = run.roster.find((r) => r.id === cur), sub = run.roster.find((r) => r.id === subId);
      if (!curP || !sub || curP.role === 'GK' || sub.role === 'GK') return;
      run.lineup[idx] = subId;
      if (run.coreId === cur) run.coreId = subId;
      set({ run: { ...run } }); persistRun(); AudioManager.play('select');
    },
    simulateRest: () => {
      const run = get().run; if (!run) return;
      simulateRemaining(run.tournament, new RNG(newSeed()));
      finishRunInternal(run);
      syncCollectStats(run);
      checkAchievements();
      set({ run: { ...run }, screen: 'tournamentEnd' });
      persistRun(); persistMeta();
    },
    finishRun: () => {
      set({ run: null, screen: 'menu', result: null });
      saveRun(null).catch(() => {}); persistMeta();
    },
    replaceAll: async (run, meta) => {
      set({ run, meta: { ...defaultMeta(), ...meta, settings: { ...defaultSettings(), ...meta.settings }, stats: { ...emptyStats(), ...meta.stats } } });
      await saveRun(run); await saveMeta(get().meta);
    },
    restoreBackup: async () => {
      const r = await loadBackupRun();
      if (!r) return false;
      set({ run: r, screen: r.ended ? 'tournamentEnd' : 'hub' });
      await saveRun(r);
      return true;
    },
    dismissAch: (id) => set({ achToasts: get().achToasts.filter((a) => a.id !== id) }),
    persist: () => { persistRun(); persistMeta(); },
  };
});

import { STADIUM_MAP } from '../data/stadiums';
function STADIUM_LOOKUP() { return STADIUM_MAP; }
export function getNextMatch(run: RunState) { return nextPlayerMatch(run.tournament, run.teamId); }
