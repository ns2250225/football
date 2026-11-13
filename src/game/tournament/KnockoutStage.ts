import { TournamentState, MatchRecord, GroupDef, Stage } from '../types';

/** 小组单循环：每组 6 场，分 3 个比赛日 */
export function createGroupMatches(groups: GroupDef[]): Omit<MatchRecord, 'stadiumId' | 'weather'>[] {
  const pairings = [[[0, 1], [2, 3]], [[0, 2], [3, 1]], [[3, 0], [1, 2]]];
  const out: Omit<MatchRecord, 'stadiumId' | 'weather'>[] = [];
  let id = 1;
  for (let md = 0; md < 3; md++) {
    for (const g of groups) {
      for (const [a, b] of pairings[md]) {
        out.push({ id: id++, stage: 'group', matchday: md + 1, group: g.name, home: g.teams[a], away: g.teams[b] });
      }
    }
  }
  return out;
}

/** 标准淘汰赛映射 */
export const KNOCKOUT_SLOTS: { id: number; stage: Stage; h: string; a: string }[] = [
  { id: 49, stage: 'r16', h: '1A', a: '2B' }, { id: 50, stage: 'r16', h: '1C', a: '2D' },
  { id: 51, stage: 'r16', h: '1E', a: '2F' }, { id: 52, stage: 'r16', h: '1G', a: '2H' },
  { id: 53, stage: 'r16', h: '1B', a: '2A' }, { id: 54, stage: 'r16', h: '1D', a: '2C' },
  { id: 55, stage: 'r16', h: '1F', a: '2E' }, { id: 56, stage: 'r16', h: '1H', a: '2G' },
  { id: 57, stage: 'qf', h: 'W49', a: 'W50' }, { id: 58, stage: 'qf', h: 'W53', a: 'W54' },
  { id: 59, stage: 'qf', h: 'W51', a: 'W52' }, { id: 60, stage: 'qf', h: 'W55', a: 'W56' },
  { id: 61, stage: 'sf', h: 'W57', a: 'W58' }, { id: 62, stage: 'sf', h: 'W59', a: 'W60' },
  { id: 63, stage: 'third', h: 'L61', a: 'L62' }, { id: 64, stage: 'final', h: 'W61', a: 'W62' },
];

export const ROUNDS: number[][] = [
  Array.from({ length: 16 }, (_, i) => i + 1),
  Array.from({ length: 16 }, (_, i) => i + 17),
  Array.from({ length: 16 }, (_, i) => i + 33),
  [49, 50, 51, 52, 53, 54, 55, 56],
  [57, 58, 59, 60],
  [61, 62],
  [63, 64],
];
export function roundOf(matchId: number): number { return ROUNDS.findIndex((r) => r.includes(matchId)); }

export function winnerOf(m: MatchRecord): string | null { return m.result?.winner ?? null; }
export function loserOf(m: MatchRecord): string | null {
  if (!m.result || !m.result.winner) return null;
  return m.result.winner === m.home ? m.away : m.home;
}

/** 根据已完成结果填充淘汰赛对阵 */
export function resolveSlots(t: TournamentState, standings: (g: string) => { team: string }[], groupDone: (g: string) => boolean) {
  const byId = (id: number) => t.matches.find((m) => m.id === id)!;
  const resolve = (slot: string): string | null => {
    if (/^[12][A-H]$/.test(slot)) {
      const pos = Number(slot[0]) - 1; const g = slot[1];
      if (!groupDone(g)) return null;
      return standings(g)[pos]?.team ?? null;
    }
    const kind = slot[0]; const id = Number(slot.slice(1));
    const m = byId(id);
    return kind === 'W' ? winnerOf(m) : loserOf(m);
  };
  for (const m of t.matches) {
    if (m.stage === 'group' || m.result) continue;
    if (!m.home && m.slotHome) m.home = resolve(m.slotHome);
    if (!m.away && m.slotAway) m.away = resolve(m.slotAway);
  }
}

export function slotLabel(slot?: string): string {
  if (!slot) return '待定';
  if (/^[12][A-H]$/.test(slot)) return `${slot[1]} 组第 ${slot[0]}`;
  return slot[0] === 'W' ? `第 ${slot.slice(1)} 场胜者` : `第 ${slot.slice(1)} 场负者`;
}
