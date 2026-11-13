import { TournamentState, MatchRecord } from '../types';

export interface StandingRow { team: string; p: number; w: number; d: number; l: number; gf: number; ga: number; gd: number; pts: number }

function rowsFrom(matches: MatchRecord[], teams: string[]): Record<string, StandingRow> {
  const rows: Record<string, StandingRow> = {};
  for (const t of teams) rows[t] = { team: t, p: 0, w: 0, d: 0, l: 0, gf: 0, ga: 0, gd: 0, pts: 0 };
  for (const m of matches) {
    if (!m.result || !m.home || !m.away) continue;
    if (!rows[m.home] || !rows[m.away]) continue;
    const h = rows[m.home], a = rows[m.away];
    const hg = m.result.homeGoals, ag = m.result.awayGoals;
    h.p++; a.p++; h.gf += hg; h.ga += ag; a.gf += ag; a.ga += hg;
    if (hg > ag) { h.w++; a.l++; h.pts += 3; } else if (hg < ag) { a.w++; h.l++; a.pts += 3; } else { h.d++; a.d++; h.pts++; a.pts++; }
  }
  for (const r of Object.values(rows)) r.gd = r.gf - r.ga;
  return rows;
}

/** 小组排名：积分 → 净胜球 → 总进球 → 相互比赛成绩 → 抽签 */
export function groupStandings(t: TournamentState, group: string): StandingRow[] {
  const g = t.groups.find((x) => x.name === group);
  if (!g) return [];
  const gm = t.matches.filter((m) => m.stage === 'group' && m.group === group);
  const rows = rowsFrom(gm, g.teams);
  const list = Object.values(rows);
  const base = (a: StandingRow, b: StandingRow) => b.pts - a.pts || b.gd - a.gd || b.gf - a.gf;
  list.sort(base);
  // 对完全相同的并列球队使用相互比赛成绩
  const out: StandingRow[] = [];
  let i = 0;
  while (i < list.length) {
    let j = i + 1;
    while (j < list.length && base(list[i], list[j]) === 0) j++;
    const tied = list.slice(i, j);
    if (tied.length > 1) {
      const ids = tied.map((r) => r.team);
      const h2h = rowsFrom(gm.filter((m) => m.home && m.away && ids.includes(m.home) && ids.includes(m.away)), ids);
      tied.sort((a, b) => {
        const x = h2h[a.team], y = h2h[b.team];
        return y.pts - x.pts || y.gd - x.gd || y.gf - x.gf || (t.lots[b.team] ?? 0) - (t.lots[a.team] ?? 0);
      });
    }
    out.push(...tied);
    i = j;
  }
  return out;
}

export function groupComplete(t: TournamentState, group: string): boolean {
  return t.matches.filter((m) => m.stage === 'group' && m.group === group).every((m) => !!m.result);
}
