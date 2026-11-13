import { TournamentState, MatchRecord, GameMode, WeatherKind, Stage } from '../types';
import { RNG } from '../../utils/random';
import { generateGroups } from './GroupGenerator';
import { createGroupMatches, KNOCKOUT_SLOTS, ROUNDS, resolveSlots, roundOf, loserOf } from './KnockoutStage';
import { groupStandings, groupComplete } from './Standings';
import { simulateMatch } from './MatchSimulator';
import { STADIUMS, STADIUM_MAP } from '../../data/stadiums';
import { TEAMS, getTeam } from '../../data/teams';

function pickStadium(rng: RNG, mode: GameMode, stage: Stage, idx: number): string {
  if (mode === 'random') return rng.pick(STADIUMS).id;
  if (stage === 'final') return 'champion';
  if (stage === 'sf') return 'central';
  if (stage === 'third') return 'sky';
  const pool = STADIUMS.filter((s) => s.id !== 'champion');
  return pool[(idx + rng.int(0, 6)) % pool.length].id;
}
function pickWeather(rng: RNG, stadiumId: string, mode: GameMode): WeatherKind {
  const st = STADIUM_MAP[stadiumId];
  if (mode === 'random') return rng.pick(['sunny', 'rain', 'storm', 'snow', 'sandstorm', 'night'] as WeatherKind[]);
  return rng.pick(st.weatherPool);
}

export function createTournament(rng: RNG, mode: GameMode): TournamentState {
  const groups = generateGroups(rng, mode !== 'random');
  const lots: Record<string, number> = {};
  for (const t of TEAMS) lots[t.id] = rng.next();
  const matches: MatchRecord[] = [];
  createGroupMatches(groups).forEach((m, i) => {
    const stadiumId = pickStadium(rng, mode, 'group', i);
    matches.push({ ...m, stadiumId, weather: pickWeather(rng, stadiumId, mode) });
  });
  KNOCKOUT_SLOTS.forEach((k, i) => {
    const stadiumId = pickStadium(rng, mode, k.stage, i);
    matches.push({ id: k.id, stage: k.stage, home: null, away: null, slotHome: k.h, slotAway: k.a, stadiumId, weather: pickWeather(rng, stadiumId, mode) });
  });
  const fatigue: Record<string, number> = {};
  for (const t of TEAMS) fatigue[t.id] = 0;
  return { groups, matches, host: rng.pick(TEAMS).id, lots, fatigue };
}

export function refreshBracket(t: TournamentState) {
  resolveSlots(t, (g) => groupStandings(t, g), (g) => groupComplete(t, g));
  // 最终名次
  const final = t.matches.find((m) => m.id === 64)!;
  const third = t.matches.find((m) => m.id === 63)!;
  if (final.result?.winner) { t.champion = final.result.winner; t.runnerUp = loserOf(final) ?? undefined; }
  if (third.result?.winner) { t.third = third.result.winner; t.fourth = loserOf(third) ?? undefined; }
}

export function nextPlayerMatch(t: TournamentState, teamId: string): MatchRecord | undefined {
  return t.matches.filter((m) => !m.result && (m.home === teamId || m.away === teamId)).sort((a, b) => a.id - b.id)[0];
}

export function isEliminated(t: TournamentState, teamId: string): boolean {
  if (nextPlayerMatch(t, teamId)) return false;
  // 小组赛尚未全部结束时可能还没生成淘汰赛对阵
  const groupDone = t.groups.every((g) => groupComplete(t, g.name));
  if (!groupDone) return false;
  const pending = t.matches.filter((m) => !m.result && m.stage !== 'group');
  // 若仍有未决定对阵的淘汰赛且玩家仍在晋级路线中
  for (const m of pending) {
    if (m.home && m.away) continue;
    const src = [m.slotHome, m.slotAway];
    for (const s of src) {
      if (!s || s.length < 2) continue;
      const sm = t.matches.find((x) => x.id === Number(s.slice(1)));
      if (sm && !sm.result && (sm.home === teamId || sm.away === teamId)) return false;
    }
  }
  return true;
}

function simOne(t: TournamentState, m: MatchRecord, rng: RNG) {
  if (!m.home || !m.away || m.result) return;
  const knockout = m.stage !== 'group';
  m.result = simulateMatch(getTeam(m.home), getTeam(m.away), { rng, stage: m.stage, knockout, fatigue: [t.fatigue[m.home] ?? 0, t.fatigue[m.away] ?? 0], host: t.host });
  const extra = m.result.et ? 10 : 0;
  t.fatigue[m.home] = Math.min(100, (t.fatigue[m.home] ?? 0) + 14 + extra);
  t.fatigue[m.away] = Math.min(100, (t.fatigue[m.away] ?? 0) + 14 + extra);
}

/** 模拟某轮中除玩家比赛外的全部比赛 */
export function simulateRound(t: TournamentState, roundIdx: number, playerTeam: string | null, rng: RNG) {
  const ids = ROUNDS[roundIdx] ?? [];
  refreshBracket(t);
  for (const id of ids) {
    const m = t.matches.find((x) => x.id === id)!;
    if (m.result) continue;
    if (playerTeam && (m.home === playerTeam || m.away === playerTeam)) continue;
    simOne(t, m, rng);
  }
  for (const k of Object.keys(t.fatigue)) t.fatigue[k] = Math.max(0, t.fatigue[k] - 6);
  refreshBracket(t);
}

/** 玩家比赛结束后推进本轮其余比赛 */
export function advanceAfterPlayerMatch(t: TournamentState, matchId: number, playerTeam: string, rng: RNG) {
  const r = roundOf(matchId);
  simulateRound(t, r, playerTeam, rng);
  // 若玩家下一场比赛不在下一轮（例如被淘汰），不需要额外处理
}

/** 玩家淘汰后模拟剩余全部赛事 */
export function simulateRemaining(t: TournamentState, rng: RNG) {
  for (let r = 0; r < ROUNDS.length; r++) {
    const ids = ROUNDS[r];
    const pending = ids.some((id) => !t.matches.find((m) => m.id === id)!.result);
    if (pending) simulateRound(t, r, null, rng);
  }
  refreshBracket(t);
}

export function currentRound(t: TournamentState): number {
  for (let r = 0; r < ROUNDS.length; r++) if (ROUNDS[r].some((id) => !t.matches.find((m) => m.id === id)!.result)) return r;
  return ROUNDS.length;
}

export function teamStageReached(t: TournamentState, teamId: string): number {
  // 0 小组赛 1 十六强 2 八强 3 四强 4 决赛 5 冠军
  if (t.champion === teamId) return 5;
  let best = 0;
  for (const m of t.matches) {
    if (m.home !== teamId && m.away !== teamId) continue;
    const v = m.stage === 'r16' ? 1 : m.stage === 'qf' ? 2 : m.stage === 'sf' || m.stage === 'third' ? 3 : m.stage === 'final' ? 4 : 0;
    best = Math.max(best, v);
  }
  return best;
}
export const STAGE_REACHED_NAME = ['小组赛', '16 强', '8 强', '4 强', '亚军', '冠军'];
