import { useGame } from './gameStore';
import { groupStandings } from '../game/tournament/Standings';
import { nextPlayerMatch } from '../game/tournament/WorldCup';
import type { TournamentState } from '../game/types';

/** 世界杯赛事数据选择器 */
export const useTournament = (): TournamentState | null => useGame((s) => s.run?.tournament ?? null);
export function standingsOf(t: TournamentState, group: string) { return groupStandings(t, group); }

/** 已淘汰球队集合 */
export function eliminatedTeams(t: TournamentState): Set<string> {
  const out = new Set<string>();
  const groupsDone = t.groups.every((g) => t.matches.filter((m) => m.group === g.name).every((m) => m.result));
  if (groupsDone) for (const g of t.groups) groupStandings(t, g.name).slice(2).forEach((r) => out.add(r.team));
  for (const m of t.matches) {
    if (m.stage === 'group' || !m.result?.winner || !m.home || !m.away) continue;
    if (m.stage === 'sf') continue;
    const loser = m.result.winner === m.home ? m.away : m.home;
    out.add(loser);
  }
  return out;
}
export { nextPlayerMatch };
