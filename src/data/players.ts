import { RosterPlayer, Role, TeamDef, PlayerAttrs } from '../game/types';
import { RNG, hashStr } from '../utils/random';
import { clamp } from '../utils/math';

const NAME_POOLS: Record<string, string[]> = {
  latin: ['席尔瓦', '桑托斯', '费雷拉', '罗德里格斯', '戈麦斯', '马丁内斯', '佩雷斯', '洛佩斯', '加西亚', '费尔南德斯', '阿尔瓦雷斯', '莫拉莱斯', '奥尔蒂斯', '维加', '门多萨', '卡斯特罗', '里韦拉', '托雷斯', '拉莫斯', '索萨', '科斯塔', '平托', '卡瓦略', '梅洛', '纳瓦罗', '阿科斯塔', '博尔赫斯', '利马'],
  west: ['马丁', '贝尔纳', '杜兰', '勒菲弗', '莫罗', '加尼耶', '鲁塞尔', '布朗热', '吉拉尔', '方丹', '德鲁埃', '范登', '佩兰', '马蒂厄', '卡隆', '舍瓦利耶', '鲁', '布歇', '雅各布', '弗兰克', '迪布瓦', '勒梅尔'],
  german: ['穆勒', '施密特', '施耐德', '菲舍尔', '韦伯', '迈耶', '瓦格纳', '贝克尔', '霍夫曼', '范德维尔', '德容', '扬森', '尼尔森', '拉尔森', '安德森', '汉森', '林德', '克劳斯', '沃尔夫', '索伦森', '伯格', '霍尔姆'],
  english: ['史密斯', '琼斯', '泰勒', '布朗', '威尔逊', '埃文斯', '托马斯', '约翰逊', '罗伯茨', '沃克', '怀特', '休斯', '爱德华兹', '格林', '霍尔', '伍德', '哈里斯', '克拉克', '刘易斯', '摩根', '贝克', '库珀'],
  slavic: ['科瓦奇', '诺瓦克', '霍瓦特', '巴比奇', '彼得罗维奇', '约维奇', '尼科利奇', '马尔科维奇', '科瓦尔斯基', '维希涅夫斯基', '沃伊奇克', '卡明斯基', '帕夫洛维奇', '伊万诺维奇', '斯坦科维奇', '克拉西奇', '马伊奇', '博里奇'],
  italian: ['罗西', '鲁索', '费拉里', '埃斯波西托', '比安基', '罗马诺', '科隆博', '里奇', '马里诺', '格雷科', '布鲁诺', '加洛', '孔蒂', '德卢卡', '曼奇尼', '洛姆巴迪', '莫雷蒂', '巴尔别里'],
  japan: ['佐藤', '铃木', '高桥', '田中', '渡边', '伊藤', '山本', '中村', '小林', '加藤', '吉田', '山田', '松本', '井上', '木村', '清水', '斋藤', '森田'],
  korea: ['金', '李', '朴', '崔', '郑', '姜', '赵', '尹', '张', '林', '韩', '吴', '徐', '申', '权', '黄', '安', '宋'],
  africa: ['迪亚洛', '库亚特', '恩冈', '姆博马', '恩库', '阿布巴卡尔', '恩戈洛', '塔巴', '贝耶', '卡马拉', '基塔', '姆邦戈', '迪奥普', '恩迪亚耶', '法耶', '萨尔', '西塞', '巴迪'],
  arab: ['哈桑', '阿明', '卡里姆', '优素福', '易卜拉欣', '赛义德', '穆斯塔法', '阿卜杜拉', '哈立德', '奥马尔', '纳赛尔', '塔里克', '法里德', '拉希德', '萨米尔', '贾马尔'],
  turkish: ['耶尔马兹', '卡亚', '德米尔', '沙欣', '切利克', '伊尔迪兹', '阿斯兰', '多安', '柯奇', '克勒奇', '阿克索伊', '厄兹蒂尔克', '恰克尔', '居内什'],
};

const ROLE_SLOTS: Role[] = ['GK', 'DF', 'MF', 'FW', 'FW', 'DF', 'MF', 'FW'];
const ROLE_NUM: Record<Role, number[]> = { GK: [1, 12, 23], DF: [2, 3, 4, 5, 6, 15], MF: [8, 6, 14, 16, 18, 20], FW: [9, 10, 7, 11, 17, 19] };

/** 根据国家队属性生成球员属性 */
function attrsFor(team: TeamDef, role: Role, rng: RNG): PlayerAttrs {
  const s = team.stats;
  const v = () => rng.range(-5, 5);
  const base: PlayerAttrs = {
    speed: s.speed + v(), sprint: s.speed * 0.6 + s.stamina * 0.4 + v(), shotPower: s.shooting + v(), shotAccuracy: s.shooting * 0.7 + s.dribbling * 0.3 + v(),
    control: s.dribbling + v(), passAccuracy: s.passing + v(), tackle: s.defense + v(), body: s.defense * 0.4 + s.stamina * 0.3 + team.profile.physical * 30 + v(),
    stamina: s.stamina + v(), gkSave: s.defense * 0.6 + 25 + v(),
  };
  const adj: Record<Role, Partial<PlayerAttrs>> = {
    GK: { speed: -14, sprint: -14, shotPower: -25, shotAccuracy: -35, control: -25, passAccuracy: -10, tackle: -10, body: 5, gkSave: 38 },
    DF: { speed: -3, shotPower: -10, shotAccuracy: -14, control: -8, tackle: 9, body: 8, gkSave: -20 },
    MF: { passAccuracy: 6, control: 3, tackle: -2, stamina: 4, gkSave: -25 },
    FW: { speed: 3, sprint: 3, shotPower: 6, shotAccuracy: 6, control: 2, tackle: -16, body: -2, gkSave: -30 },
  };
  const a = adj[role];
  const out = { ...base };
  (Object.keys(a) as (keyof PlayerAttrs)[]).forEach((k) => { out[k] += a[k] ?? 0; });
  (Object.keys(out) as (keyof PlayerAttrs)[]).forEach((k) => { out[k] = Math.round(clamp(out[k], 20, 99)); });
  return out;
}

export function generateRoster(team: TeamDef): RosterPlayer[] {
  const rng = new RNG(hashStr('roster_' + team.id));
  const pool = rng.shuffle([...(NAME_POOLS[team.region] ?? NAME_POOLS.english)]);
  const usedNums = new Set<number>();
  return ROLE_SLOTS.map((role, i) => {
    let number = ROLE_NUM[role].find((n) => !usedNums.has(n)) ?? 30 + i;
    usedNums.add(number);
    const height = role === 'GK' ? rng.range(1.0, 1.1) : rng.range(0.92, 1.08) + team.profile.aerial * 0.03;
    return {
      id: `${team.id}_${i}`, name: pool[i % pool.length], number, role, height, build: rng.range(0.9, 1.12) + team.profile.physical * 0.05,
      attrs: attrsFor(team, role, rng), skinIdx: rng.int(0, team.skin.length - 1), hairIdx: rng.int(0, team.hair.length - 1), accessory: rng.int(0, 4),
    };
  });
}
const cache: Record<string, RosterPlayer[]> = {};
export function getRoster(team: TeamDef): RosterPlayer[] {
  if (!cache[team.id]) cache[team.id] = generateRoster(team);
  return cache[team.id];
}
export function playerOverall(p: RosterPlayer): number {
  const a = p.attrs;
  if (p.role === 'GK') return Math.round(a.gkSave * 0.7 + a.body * 0.1 + a.passAccuracy * 0.1 + a.speed * 0.1);
  return Math.round((a.speed + a.shotPower + a.shotAccuracy + a.control + a.passAccuracy + a.tackle + a.body + a.stamina) / 8);
}
