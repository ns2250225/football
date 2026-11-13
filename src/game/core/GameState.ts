import type { TeamDef, RosterPlayer, OwnedSkill, Mods, ShotSpec, Stage, StadiumDef, WeatherKind, MissionInstance, TacticMode, Settings, GoalEvent, CardEvent } from '../types';

export type Phase = 'intro' | 'kickoff' | 'play' | 'dead' | 'setpiece' | 'goal' | 'replay' | 'halftime' | 'fulltime' | 'penalties' | 'ended';

export interface MatchSetup {
  matchId: number;
  playerTeam: TeamDef; oppTeam: TeamDef; playerRoster: RosterPlayer[]; oppRoster: RosterPlayer[]; coreId: string;
  skills: OwnedSkill[]; ultimate: string | null; buildMods: Mods; equipShots: ShotSpec[]; equipSpecials: { kind: string; value: number }[];
  slideImmune: boolean; stage: Stage; stageLabel: string; knockout: boolean; difficulty: number; oppMult: number; extreme: boolean;
  stadium: StadiumDef; weather: WeatherKind; events: string[]; boss?: string; halfLength: number; missions: MissionInstance[];
  ultStart: number; teamFatigue: number; tactic: TacticMode; settings: Settings; level: number; xp: number; xpNeed: number;
}

export interface PlayerMatchStat {
  id: string; name: string; number: number; role: string; side: 0 | 1;
  goals: number; assists: number; shots: number; passes: number; tackles: number; saves: number; dribbles: number; rating: number;
}

export interface TeamMatchStats {
  passes: number; longPasses: number; tackles: number; dribbles: number; saves: number; skillUses: number; ultUses: number; fouls: number;
  longGoals: number; headers: number; assists: number; goals: number; shots: number; onTarget: number; possessionTime: number;
  yellow: number; red: number; corners: number;
}
export const emptyTeamStats = (): TeamMatchStats => ({
  passes: 0, longPasses: 0, tackles: 0, dribbles: 0, saves: 0, skillUses: 0, ultUses: 0, fouls: 0, longGoals: 0, headers: 0,
  assists: 0, goals: 0, shots: 0, onTarget: 0, possessionTime: 0, yellow: 0, red: 0, corners: 0,
});

export interface MatchOutcome {
  gf: number; ga: number; pens?: [number, number]; et: boolean; won: boolean; draw: boolean; forfeited?: boolean;
  scorers: GoalEvent[]; cards: CardEvent[]; shots: [number, number]; onTarget: [number, number]; possession: [number, number];
  teamStats: TeamMatchStats; oppStats: TeamMatchStats; players: PlayerMatchStat[]; missions: MissionInstance[];
  xpEarned: number; comeback: boolean; lateWinner: boolean; hatTrick: boolean; injuries: string[]; staminaUsed: number;
  replayCount: number; bestPlayer: string; skillUses: number; ultUses: number;
}

export interface EngineCallbacks {
  onXp: (amount: number) => void;
  onHalftime: () => void;
  onEnd: (o: MatchOutcome) => void;
  onEvolutionFx?: (name: string) => void;
}
