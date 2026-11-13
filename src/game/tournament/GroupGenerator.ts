import { GroupDef, TeamDef } from '../types';
import { TEAMS, teamRating } from '../../data/teams';
import { RNG } from '../../utils/random';

export const GROUP_NAMES = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'];

/**
 * 生成 8 个小组：标准模式按实力分为 4 档种子，每组每档一队，避免强队扎堆；
 * 随机模式完全随机抽签。
 */
export function generateGroups(rng: RNG, seeded: boolean): GroupDef[] {
  const groups: GroupDef[] = GROUP_NAMES.map((name) => ({ name, teams: [] }));
  if (!seeded) {
    const all = rng.shuffle(TEAMS.map((t) => t.id));
    all.forEach((id, i) => groups[i % 8].teams.push(id));
    return groups;
  }
  const sorted = [...TEAMS].sort((a, b) => teamRating(b) - teamRating(a) + rng.range(-0.5, 0.5));
  for (let pot = 0; pot < 4; pot++) {
    const potTeams = rng.shuffle(sorted.slice(pot * 8, pot * 8 + 8).map((t: TeamDef) => t.id));
    potTeams.forEach((id, i) => groups[i].teams.push(id));
  }
  // 组内顺序随机
  groups.forEach((g) => rng.shuffle(g.teams));
  return groups;
}
