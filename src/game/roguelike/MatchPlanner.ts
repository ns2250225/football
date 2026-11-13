import { RunState, MatchPlan, TeamDef } from '../types';
import { RNG } from '../../utils/random';
import { nextPlayerMatch } from '../tournament/WorldCup';
import { getTeam, TEAMS, teamRating } from '../../data/teams';
import { BOSSES } from '../../data/bosses';
import { pickEvents } from './EventManager';
import { pickMissions } from './LevelSystem';

function topTeams(n: number): Set<string> {
  return new Set([...TEAMS].sort((a, b) => teamRating(b) - teamRating(a)).slice(0, n).map((t) => t.id));
}

/** BOSS 模板匹配：按国家队属性与战术选择最契合的挑战模板 */
export function chooseBoss(opp: TeamDef, rng: RNG, exclude: string[]): string {
  const cands = BOSSES.filter((b) => b.id !== 'world_champion');
  const scored = cands.map((b) => ({ b, s: b.match(opp) + rng.range(0, 0.35) - (exclude.includes(b.id) ? 0.3 : 0) }));
  scored.sort((x, y) => y.s - x.s);
  return scored[0].b.id;
}

export function createPlan(run: RunState, rng: RNG): MatchPlan | null {
  const m = nextPlayerMatch(run.tournament, run.teamId);
  if (!m || !m.home || !m.away) return null;
  const oppId = m.home === run.teamId ? m.away : m.home;
  const opp = getTeam(oppId);
  let boss: string | undefined;
  const top = topTeams(8);
  const prevBosses = run.log.map((l) => l.boss).filter(Boolean) as string[];
  if (m.stage === 'final') boss = 'world_champion';
  else if (m.stage !== 'group') boss = rng.chance(m.stage === 'r16' ? 0.6 : 1) ? chooseBoss(opp, rng, prevBosses) : undefined;
  else if (run.mode === 'extreme' || (top.has(oppId) && rng.chance(0.75))) boss = chooseBoss(opp, rng, prevBosses);
  const stageIdx = run.log.length;
  const events = pickEvents(rng, run.mode, run.custom.eventFreq, stageIdx);
  return {
    matchId: m.id, opponent: oppId, stage: m.stage, stadiumId: m.stadiumId, weather: m.weather, events, boss,
    missions: pickMissions(rng, 3), elite: !!boss || top.has(oppId),
  };
}
