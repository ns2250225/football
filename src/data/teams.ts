import { TeamDef, TacticProfile, TacticMode, FlagDef, KitDef, TeamStats, TeamPassiveDef } from '../game/types';

const P = (attack: number, press: number, possession: number, counter: number, longShot: number, width: number, aerial: number, physical: number): TacticProfile =>
  ({ attack, press, possession, counter, longShot, width, aerial, physical });
const S = (speed: number, shooting: number, dribbling: number, passing: number, defense: number, stamina: number): TeamStats =>
  ({ speed, shooting, dribbling, passing, defense, stamina });
const K = (shirt: string, shirt2: string, shorts: string, socks: string): KitDef => ({ shirt, shirt2, shorts, socks });
const PS = (id: string, name: string, icon: string, desc: string, kind: string, params: Record<string, number>): TeamPassiveDef => ({ id, name, icon, desc, kind, params });

const SKIN_LIGHT = ['#f1c9a5', '#e8b98f', '#d9a27a'];
const SKIN_MIX = ['#f1c9a5', '#c68a5e', '#8d5a3b', '#d9a27a'];
const SKIN_DARK = ['#8d5a3b', '#6b4329', '#a86f48'];
const SKIN_ASIA = ['#f3d2b0', '#e8c29b', '#dcb38a'];
const SKIN_MENA = ['#d9a27a', '#c68a5e', '#b47a50'];
const HAIR_DARK = ['#1d1410', '#2e1d12', '#0f0f0f'];
const HAIR_MIX = ['#1d1410', '#5a3a1e', '#c9a050', '#2e1d12', '#8a5a2b'];
const HAIR_LIGHT = ['#d8b45a', '#a97a3c', '#5a3a1e', '#e6cf8a'];

interface Raw {
  id: string; name: string; code: string; style: string; stats: TeamStats; profile: TacticProfile; tactic: TacticMode;
  passive: TeamPassiveDef; home: KitDef; away: KitDef; flag: FlagDef; formation?: string; skin: string[]; hair: string[]; region: string; open?: boolean;
}

const RAW: Raw[] = [
  { id: 'brazil', name: '巴西', code: 'BRA', style: '技术盘带', stats: S(88, 82, 96, 85, 70, 85), profile: P(0.8, 0.5, 0.6, 0.4, 0.4, 0.7, 0.3, 0.4), tactic: 'attack',
    passive: PS('samba_dance', '桑巴舞步', '💃', '连续过人后移动速度逐步增加（每次 +4%，最多 5 层，8 秒无过人则衰减）', 'samba', { perStack: 0.04, maxStacks: 5, decay: 8 }),
    home: K('#f7d417', '#0b8a3a', '#1f4fbf', '#ffffff'), away: K('#1f4fbf', '#f7d417', '#ffffff', '#1f4fbf'), flag: { type: 'diamond', colors: ['#009c3b', '#ffdf00', '#002776'] }, skin: SKIN_MIX, hair: HAIR_DARK, region: 'latin', open: true },
  { id: 'argentina', name: '阿根廷', code: 'ARG', style: '核心突破', stats: S(85, 90, 96, 92, 72, 83), profile: P(0.7, 0.5, 0.65, 0.5, 0.5, 0.5, 0.3, 0.5), tactic: 'possession',
    passive: PS('king_domain', '球王领域', '👑', '核心球员持球时射门精准度 +25%，射门力量 +10%', 'king', { acc: 0.25, pow: 0.1 }),
    home: K('#7cc4f0', '#ffffff', '#1b1b3a', '#ffffff'), away: K('#1b2a5a', '#7cc4f0', '#1b2a5a', '#1b2a5a'), flag: { type: 'h', colors: ['#74acdf', '#ffffff', '#74acdf'], emblem: '☀', emblemColor: '#f6b40e' }, skin: SKIN_LIGHT, hair: HAIR_MIX, region: 'latin', open: true },
  { id: 'france', name: '法国', code: 'FRA', style: '均衡反击', stats: S(94, 92, 86, 85, 86, 92), profile: P(0.6, 0.5, 0.5, 0.85, 0.4, 0.6, 0.4, 0.6), tactic: 'counter',
    passive: PS('gallic_rooster', '高卢雄鸡', '🐓', '夺回球权后 6 秒内视为反击，全队速度 +12%', 'gallic', { speed: 0.12, window: 6 }),
    home: K('#1e3a8a', '#ffffff', '#ffffff', '#c8102e'), away: K('#ffffff', '#1e3a8a', '#1e3a8a', '#ffffff'), flag: { type: 'v', colors: ['#0055a4', '#ffffff', '#ef4135'] }, skin: SKIN_MIX, hair: HAIR_DARK, region: 'west', open: true },
  { id: 'germany', name: '德国', code: 'GER', style: '强力压迫', stats: S(82, 90, 78, 86, 93, 94), profile: P(0.6, 0.85, 0.55, 0.4, 0.5, 0.5, 0.5, 0.7), tactic: 'press',
    passive: PS('steel_will', '钢铁意志', '🛡️', '15 秒内连续抢断叠加层数，每层全队防守 +6%（最多 4 层）', 'steel', { perStack: 0.06, maxStacks: 4, window: 15 }),
    home: K('#ffffff', '#111111', '#111111', '#ffffff'), away: K('#111111', '#e11d2a', '#111111', '#111111'), flag: { type: 'h', colors: ['#000000', '#dd0000', '#ffce00'] }, skin: SKIN_LIGHT, hair: HAIR_LIGHT, region: 'german', open: true },
  { id: 'spain', name: '西班牙', code: 'ESP', style: '控球传递', stats: S(78, 80, 92, 98, 82, 85), profile: P(0.55, 0.6, 0.95, 0.2, 0.3, 0.5, 0.2, 0.3), tactic: 'possession',
    passive: PS('tiki_taka', 'Tiki-Taka', '🔁', '连续传球每次增加控球稳定性 +5%（最多 6 层，丢球重置）', 'tiki', { perStack: 0.05, maxStacks: 6 }),
    home: K('#c8102e', '#ffc400', '#1e2a6e', '#1e2a6e'), away: K('#ffe9a8', '#c8102e', '#ffe9a8', '#ffe9a8'), flag: { type: 'h', colors: ['#aa151b', '#f1bf00', '#aa151b'], weights: [1, 2, 1] }, skin: SKIN_LIGHT, hair: HAIR_DARK, region: 'latin', open: true },
  { id: 'england', name: '英格兰', code: 'ENG', style: '远射冲击', stats: S(84, 90, 80, 84, 84, 86), profile: P(0.65, 0.55, 0.5, 0.5, 0.9, 0.6, 0.6, 0.6), tactic: 'attack',
    passive: PS('three_lions', '三狮之力', '🦁', '禁区外射门威力 +25%', 'lions', { longShot: 0.25 }),
    home: K('#ffffff', '#0b1f5c', '#0b1f5c', '#ffffff'), away: K('#c8102e', '#ffffff', '#c8102e', '#c8102e'), flag: { type: 'cross', colors: ['#ffffff', '#ce1124'] }, skin: SKIN_MIX, hair: HAIR_MIX, region: 'english', open: true },
  { id: 'portugal', name: '葡萄牙', code: 'POR', style: '精准射门', stats: S(86, 95, 88, 84, 78, 84), profile: P(0.7, 0.5, 0.55, 0.5, 0.6, 0.6, 0.5, 0.5), tactic: 'attack',
    passive: PS('golden_right', '黄金右脚', '🦶', '蓄力超过 70% 的射门精准度 +25%', 'golden_right', { acc: 0.25, minCharge: 0.7 }),
    home: K('#b5121b', '#0b6e2e', '#0b6e2e', '#b5121b'), away: K('#f2f2f2', '#b5121b', '#f2f2f2', '#f2f2f2'), flag: { type: 'v', colors: ['#006600', '#ff0000'], weights: [2, 3], emblem: '⛨', emblemColor: '#ffcc00' }, skin: SKIN_MIX, hair: HAIR_DARK, region: 'latin', open: true },
  { id: 'netherlands', name: '荷兰', code: 'NED', style: '全攻全守', stats: S(86, 86, 86, 88, 85, 86), profile: P(0.7, 0.7, 0.65, 0.5, 0.5, 0.75, 0.5, 0.5), tactic: 'attack',
    passive: PS('total_football', '全能足球', '🔶', '切换球员后该球员 3 秒内全属性 +10%', 'total', { all: 0.1, dur: 3 }),
    home: K('#ff7a00', '#111111', '#ffffff', '#ff7a00'), away: K('#1b2a5a', '#ff7a00', '#1b2a5a', '#1b2a5a'), flag: { type: 'h', colors: ['#ae1c28', '#ffffff', '#21468b'] }, skin: SKIN_MIX, hair: HAIR_LIGHT, region: 'german' },
  { id: 'italy', name: '意大利', code: 'ITA', style: '防守反击', stats: S(80, 82, 82, 86, 95, 86), profile: P(0.4, 0.45, 0.55, 0.75, 0.4, 0.4, 0.4, 0.6), tactic: 'counter',
    passive: PS('iron_line', '钢铁防线', '🧱', '门将扑救成功后全队防守 +15%，持续 8 秒', 'iron_line', { def: 0.15, dur: 8 }),
    home: K('#1f5fbf', '#ffffff', '#ffffff', '#1f5fbf'), away: K('#ffffff', '#1f5fbf', '#1f5fbf', '#ffffff'), flag: { type: 'v', colors: ['#009246', '#ffffff', '#ce2b37'] }, skin: SKIN_LIGHT, hair: HAIR_DARK, region: 'italian' },
  { id: 'croatia', name: '克罗地亚', code: 'CRO', style: '中场控制', stats: S(80, 82, 88, 93, 82, 90), profile: P(0.55, 0.55, 0.8, 0.4, 0.5, 0.5, 0.4, 0.5), tactic: 'possession',
    passive: PS('unyielding', '不屈斗志', '🔥', '中场球员体力恢复速度 +60%', 'unyielding', { regen: 0.6 }),
    home: K('#ffffff', '#d52b1e', '#ffffff', '#1b2a5a'), away: K('#1b2a5a', '#d52b1e', '#1b2a5a', '#1b2a5a'), flag: { type: 'h', colors: ['#ff0000', '#ffffff', '#171796'], emblem: '▦', emblemColor: '#d52b1e' }, skin: SKIN_LIGHT, hair: HAIR_MIX, region: 'slavic' },
  { id: 'uruguay', name: '乌拉圭', code: 'URU', style: '强硬对抗', stats: S(82, 86, 82, 80, 88, 88), profile: P(0.55, 0.65, 0.45, 0.6, 0.5, 0.4, 0.5, 0.9), tactic: 'press',
    passive: PS('iron_blood', '铁血精神', '🩸', '对抗成功后 4 秒内身体对抗 +20%、射门力量 +10%', 'iron_blood', { body: 0.2, pow: 0.1, dur: 4 }),
    home: K('#6cace4', '#111111', '#111111', '#6cace4'), away: K('#ffffff', '#6cace4', '#ffffff', '#ffffff'), flag: { type: 'stripes', colors: ['#ffffff', '#0038a8'], emblem: '☀', emblemColor: '#fcd116' }, skin: SKIN_LIGHT, hair: HAIR_DARK, region: 'latin' },
  { id: 'belgium', name: '比利时', code: 'BEL', style: '全面进攻', stats: S(86, 88, 88, 87, 82, 85), profile: P(0.8, 0.5, 0.6, 0.5, 0.6, 0.6, 0.4, 0.5), tactic: 'attack',
    passive: PS('golden_gen', '黄金一代', '🌟', '全队射门、精度、控球、传球均衡提升 +6%', 'golden_gen', { all: 0.06 }),
    home: K('#c8102e', '#000000', '#c8102e', '#c8102e'), away: K('#f0e68c', '#c8102e', '#f0e68c', '#f0e68c'), flag: { type: 'v', colors: ['#000000', '#fdda24', '#ef3340'] }, skin: SKIN_MIX, hair: HAIR_MIX, region: 'west' },
  { id: 'japan', name: '日本', code: 'JPN', style: '快速配合', stats: S(93, 75, 90, 88, 78, 96), profile: P(0.6, 0.65, 0.75, 0.5, 0.3, 0.6, 0.2, 0.3), tactic: 'possession',
    passive: PS('ninja_run', '忍者跑位', '🥷', '连续传球时每次传球使技能冷却缩短 0.6 秒，无球跑动速度 +6%', 'ninja', { cut: 0.6, offBall: 0.06 }),
    home: K('#1b3e8f', '#ffffff', '#ffffff', '#1b3e8f'), away: K('#ffffff', '#1b3e8f', '#ffffff', '#ffffff'), flag: { type: 'circle', colors: ['#ffffff', '#bc002d'] }, skin: SKIN_ASIA, hair: HAIR_DARK, region: 'japan', open: true },
  { id: 'korea', name: '韩国', code: 'KOR', style: '高速奔袭', stats: S(92, 80, 82, 82, 80, 95), profile: P(0.6, 0.75, 0.5, 0.7, 0.4, 0.6, 0.3, 0.5), tactic: 'counter',
    passive: PS('perpetual', '永动机', '⚙️', '比赛后半段（下半场及加时）全队移动速度 +10%', 'perpetual', { speed: 0.1 }),
    home: K('#d8232a', '#111111', '#111111', '#d8232a'), away: K('#ffffff', '#d8232a', '#ffffff', '#ffffff'), flag: { type: 'yinyang', colors: ['#ffffff', '#cd2e3a', '#0047a0'] }, skin: SKIN_ASIA, hair: HAIR_DARK, region: 'korea' },
  { id: 'usa', name: '美国', code: 'USA', style: '身体对抗', stats: S(86, 80, 76, 80, 84, 90), profile: P(0.55, 0.6, 0.45, 0.6, 0.5, 0.5, 0.6, 0.85), tactic: 'press',
    passive: PS('american_power', '美式力量', '💪', '全队身体对抗能力 +20%', 'american', { body: 0.2 }),
    home: K('#ffffff', '#0a3161', '#0a3161', '#ffffff'), away: K('#0a3161', '#b31942', '#0a3161', '#0a3161'), flag: { type: 'canton', colors: ['#b22234', '#ffffff', '#3c3b6e'] }, skin: SKIN_MIX, hair: HAIR_MIX, region: 'english' },
  { id: 'mexico', name: '墨西哥', code: 'MEX', style: '灵活突破', stats: S(87, 80, 88, 83, 76, 85), profile: P(0.65, 0.5, 0.6, 0.55, 0.4, 0.6, 0.3, 0.4), tactic: 'attack',
    passive: PS('green_whirl', '绿茵旋风', '🌪️', '盘带时转向速度 +40%，控球 +5%', 'green_whirl', { turn: 0.4, ctl: 0.05 }),
    home: K('#006341', '#ffffff', '#ffffff', '#c8102e'), away: K('#111111', '#c8102e', '#111111', '#111111'), flag: { type: 'v', colors: ['#006847', '#ffffff', '#ce1126'], emblem: '🦅' }, skin: SKIN_MENA, hair: HAIR_DARK, region: 'latin' },
  { id: 'switzerland', name: '瑞士', code: 'SUI', style: '稳定防守', stats: S(78, 78, 78, 82, 90, 86), profile: P(0.4, 0.45, 0.55, 0.5, 0.4, 0.4, 0.4, 0.5), tactic: 'defend',
    passive: PS('precise_line', '精密防线', '⌚', '防守阵型更紧凑，本方半场全队防守 +10%', 'precise', { def: 0.1, compact: 0.3 }),
    home: K('#d52b1e', '#ffffff', '#ffffff', '#d52b1e'), away: K('#ffffff', '#d52b1e', '#ffffff', '#ffffff'), flag: { type: 'plus', colors: ['#d52b1e', '#ffffff'] }, skin: SKIN_LIGHT, hair: HAIR_MIX, region: 'west' },
  { id: 'denmark', name: '丹麦', code: 'DEN', style: '团队协作', stats: S(80, 80, 80, 86, 86, 86), profile: P(0.5, 0.55, 0.65, 0.5, 0.4, 0.5, 0.5, 0.5), tactic: 'possession',
    passive: PS('nordic_will', '北欧意志', '🛶', '6 米内有队友时传球准确度 +20%', 'nordic_will', { acc: 0.2, range: 6 }),
    home: K('#c8102e', '#ffffff', '#ffffff', '#c8102e'), away: K('#ffffff', '#c8102e', '#ffffff', '#ffffff'), flag: { type: 'nordic', colors: ['#c8102e', '#ffffff'] }, skin: SKIN_LIGHT, hair: HAIR_LIGHT, region: 'german' },
  { id: 'sweden', name: '瑞典', code: 'SWE', style: '高空进攻', stats: S(78, 84, 76, 80, 86, 86), profile: P(0.55, 0.5, 0.45, 0.5, 0.5, 0.75, 0.9, 0.7), tactic: 'attack',
    passive: PS('nordic_giant', '北欧巨人', '🗿', '头球与高空球能力 +40%', 'nordic_giant', { header: 0.4 }),
    home: K('#fecc02', '#006aa7', '#006aa7', '#fecc02'), away: K('#006aa7', '#fecc02', '#006aa7', '#006aa7'), flag: { type: 'nordic', colors: ['#006aa7', '#fecc02'] }, skin: SKIN_LIGHT, hair: HAIR_LIGHT, region: 'german' },
  { id: 'poland', name: '波兰', code: 'POL', style: '强力射门', stats: S(80, 92, 76, 78, 80, 84), profile: P(0.6, 0.5, 0.45, 0.55, 0.6, 0.5, 0.6, 0.6), tactic: 'attack',
    passive: PS('box_hunter', '禁区猎手', '🎯', '禁区内射门威力 +30%', 'box_hunter', { boxShot: 0.3 }),
    home: K('#ffffff', '#dc143c', '#dc143c', '#ffffff'), away: K('#dc143c', '#ffffff', '#dc143c', '#dc143c'), flag: { type: 'h', colors: ['#ffffff', '#dc143c'] }, skin: SKIN_LIGHT, hair: HAIR_LIGHT, region: 'slavic' },
  { id: 'senegal', name: '塞内加尔', code: 'SEN', style: '身体冲击', stats: S(90, 84, 82, 76, 84, 90), profile: P(0.6, 0.6, 0.4, 0.65, 0.4, 0.6, 0.6, 0.9), tactic: 'counter',
    passive: PS('beast_charge', '猛兽冲锋', '🐆', '冲刺时身体碰撞能力 +30%', 'beast', { body: 0.3 }),
    home: K('#ffffff', '#00853f', '#ffffff', '#00853f'), away: K('#00853f', '#fdef42', '#00853f', '#00853f'), flag: { type: 'v', colors: ['#00853f', '#fdef42', '#e31b23'], emblem: '★', emblemColor: '#00853f' }, skin: SKIN_DARK, hair: HAIR_DARK, region: 'africa' },
  { id: 'morocco', name: '摩洛哥', code: 'MAR', style: '快速防反', stats: S(90, 80, 84, 82, 88, 88), profile: P(0.45, 0.55, 0.5, 0.85, 0.4, 0.5, 0.4, 0.6), tactic: 'counter',
    passive: PS('desert_eagle', '沙漠雄鹰', '🦅', '抢断成功后 4 秒内全队反击速度 +15%', 'desert_eagle', { speed: 0.15, dur: 4 }),
    home: K('#c1272d', '#006233', '#006233', '#c1272d'), away: K('#ffffff', '#c1272d', '#ffffff', '#ffffff'), flag: { type: 'solid', colors: ['#c1272d'], emblem: '✪', emblemColor: '#006233' }, skin: SKIN_MENA, hair: HAIR_DARK, region: 'arab' },
  { id: 'egypt', name: '埃及', code: 'EGY', style: '技术突破', stats: S(91, 84, 88, 78, 76, 82), profile: P(0.65, 0.45, 0.5, 0.65, 0.45, 0.65, 0.3, 0.4), tactic: 'counter',
    passive: PS('pharaoh_speed', '法老之速', '🏺', '盘带过人成功后 5 秒内射门精准度 +20%', 'pharaoh', { acc: 0.2, dur: 5 }),
    home: K('#c8102e', '#ffffff', '#ffffff', '#c8102e'), away: K('#ffffff', '#111111', '#ffffff', '#ffffff'), flag: { type: 'h', colors: ['#ce1126', '#ffffff', '#000000'], emblem: '𓅃', emblemColor: '#c09300' }, skin: SKIN_MENA, hair: HAIR_DARK, region: 'arab' },
  { id: 'cameroon', name: '喀麦隆', code: 'CMR', style: '力量进攻', stats: S(86, 86, 78, 74, 82, 90), profile: P(0.7, 0.55, 0.4, 0.55, 0.5, 0.5, 0.65, 0.9), tactic: 'attack',
    passive: PS('african_lion', '非洲雄狮', '🦁', '对抗成功后获得 2 秒冲刺效果（速度 +25%）', 'lion', { speed: 0.25, dur: 2 }),
    home: K('#007a5e', '#ce1126', '#ce1126', '#fcd116'), away: K('#fcd116', '#007a5e', '#fcd116', '#fcd116'), flag: { type: 'v', colors: ['#007a5e', '#ce1126', '#fcd116'], emblem: '★', emblemColor: '#fcd116' }, skin: SKIN_DARK, hair: HAIR_DARK, region: 'africa' },
  { id: 'australia', name: '澳大利亚', code: 'AUS', style: '强硬拼抢', stats: S(82, 78, 74, 78, 86, 90), profile: P(0.5, 0.7, 0.4, 0.5, 0.5, 0.5, 0.6, 0.8), tactic: 'press',
    passive: PS('kangaroo', '袋鼠冲锋', '🦘', '抢断和铲球距离 +35%', 'kangaroo', { range: 0.35 }),
    home: K('#ffcd00', '#00843d', '#00843d', '#ffcd00'), away: K('#012169', '#ffcd00', '#012169', '#012169'), flag: { type: 'solid', colors: ['#012169'], emblem: '✦', emblemColor: '#ffffff' }, skin: SKIN_LIGHT, hair: HAIR_LIGHT, region: 'english' },
  { id: 'canada', name: '加拿大', code: 'CAN', style: '快速反击', stats: S(92, 78, 78, 78, 78, 86), profile: P(0.55, 0.5, 0.4, 0.8, 0.4, 0.6, 0.4, 0.6), tactic: 'counter',
    passive: PS('polar_speed', '极地速度', '❄️', '每个半场开场 30 秒内全队移动速度 +15%', 'polar', { speed: 0.15, window: 30 }),
    home: K('#d80621', '#ffffff', '#d80621', '#d80621'), away: K('#ffffff', '#d80621', '#ffffff', '#ffffff'), flag: { type: 'v', colors: ['#d80621', '#ffffff', '#d80621'], weights: [1, 2, 1], emblem: '🍁' }, skin: SKIN_MIX, hair: HAIR_MIX, region: 'english' },
  { id: 'colombia', name: '哥伦比亚', code: 'COL', style: '技术进攻', stats: S(86, 84, 90, 86, 76, 84), profile: P(0.7, 0.5, 0.6, 0.5, 0.45, 0.6, 0.4, 0.4), tactic: 'attack',
    passive: PS('coffee_whirl', '咖啡旋风', '☕', '传球成功后接球队员 3 秒内控球能力 +20%', 'coffee', { ctl: 0.2, dur: 3 }),
    home: K('#fcd116', '#003893', '#003893', '#ce1126'), away: K('#ce1126', '#fcd116', '#ce1126', '#ce1126'), flag: { type: 'h', colors: ['#fcd116', '#003893', '#ce1126'], weights: [2, 1, 1] }, skin: SKIN_MIX, hair: HAIR_DARK, region: 'latin' },
  { id: 'ecuador', name: '厄瓜多尔', code: 'ECU', style: '高速奔跑', stats: S(92, 78, 80, 76, 80, 92), profile: P(0.55, 0.6, 0.4, 0.7, 0.4, 0.65, 0.4, 0.6), tactic: 'counter',
    passive: PS('highland', '高原之力', '⛰️', '全队体力消耗降低 30%', 'highland', { cost: 0.3 }),
    home: K('#ffdd00', '#034ea2', '#034ea2', '#ed1c24'), away: K('#034ea2', '#ffdd00', '#034ea2', '#034ea2'), flag: { type: 'h', colors: ['#ffdd00', '#034ea2', '#ed1c24'], weights: [2, 1, 1], emblem: '⛰', emblemColor: '#7a5c2e' }, skin: SKIN_MENA, hair: HAIR_DARK, region: 'latin' },
  { id: 'serbia', name: '塞尔维亚', code: 'SRB', style: '高空轰炸', stats: S(80, 86, 78, 82, 84, 86), profile: P(0.6, 0.5, 0.45, 0.5, 0.6, 0.6, 0.9, 0.75), tactic: 'attack',
    passive: PS('giant_power', '巨人之力', '🏔️', '头球 +25%，长传力量与射门力量 +12%', 'giant_power', { header: 0.25, pow: 0.12 }),
    home: K('#c6363c', '#0c4076', '#0c4076', '#ffffff'), away: K('#ffffff', '#c6363c', '#ffffff', '#ffffff'), flag: { type: 'h', colors: ['#c6363c', '#0c4076', '#ffffff'], emblem: '♛', emblemColor: '#c6a64b' }, skin: SKIN_LIGHT, hair: HAIR_DARK, region: 'slavic' },
  { id: 'austria', name: '奥地利', code: 'AUT', style: '高位逼抢', stats: S(86, 80, 78, 80, 84, 90), profile: P(0.55, 0.9, 0.5, 0.5, 0.45, 0.5, 0.4, 0.6), tactic: 'press',
    passive: PS('red_press', '红白压迫', '🟥', '在对方半场逼抢时移动速度 +12%', 'red_press', { speed: 0.12 }),
    home: K('#ed2939', '#ffffff', '#ffffff', '#ed2939'), away: K('#111111', '#ed2939', '#111111', '#111111'), flag: { type: 'h', colors: ['#ed2939', '#ffffff', '#ed2939'] }, skin: SKIN_LIGHT, hair: HAIR_LIGHT, region: 'german' },
  { id: 'turkey', name: '土耳其', code: 'TUR', style: '激情进攻', stats: S(84, 84, 84, 80, 78, 84), profile: P(0.75, 0.6, 0.5, 0.5, 0.55, 0.55, 0.4, 0.6), tactic: 'attack',
    passive: PS('frenzy_home', '狂热主场', '📣', '观众加成：大招充能 +20%；比分落后时全属性 +12%', 'frenzy', { ult: 0.2, all: 0.12 }),
    home: K('#e30a17', '#ffffff', '#ffffff', '#e30a17'), away: K('#ffffff', '#e30a17', '#ffffff', '#ffffff'), flag: { type: 'solid', colors: ['#e30a17'], emblem: '☾★', emblemColor: '#ffffff' }, skin: SKIN_MENA, hair: HAIR_DARK, region: 'turkish' },
  { id: 'wales', name: '威尔士', code: 'WAL', style: '边路突击', stats: S(88, 80, 80, 78, 78, 84), profile: P(0.6, 0.5, 0.45, 0.6, 0.45, 0.9, 0.5, 0.5), tactic: 'counter',
    passive: PS('red_dragon', '红龙之心', '🐉', '在边路（距中线 6 米外）突破时冲刺速度 +25%', 'red_dragon', { sprint: 0.25, wing: 6 }),
    home: K('#c8102e', '#00b140', '#c8102e', '#c8102e'), away: K('#ffffff', '#00b140', '#ffffff', '#ffffff'), flag: { type: 'h', colors: ['#ffffff', '#00b140'], emblem: '🐉' }, skin: SKIN_LIGHT, hair: HAIR_MIX, region: 'english' },
];

export const TEAMS: TeamDef[] = RAW.map((r) => ({
  id: r.id, name: r.name, code: r.code, style: r.style, stats: r.stats, profile: r.profile, defaultTactic: r.tactic,
  passive: r.passive, home: r.home, away: r.away, flag: r.flag, formation: r.formation ?? '1-1-1-2', skin: r.skin, hair: r.hair,
  region: r.region, unlockedByDefault: !!r.open,
}));
export const TEAM_MAP: Record<string, TeamDef> = Object.fromEntries(TEAMS.map((t) => [t.id, t]));
export function teamRating(t: TeamDef): number {
  const s = t.stats;
  return Math.round(s.speed * 0.17 + s.shooting * 0.2 + s.dribbling * 0.16 + s.passing * 0.16 + s.defense * 0.18 + s.stamina * 0.13);
}
export function getTeam(id: string): TeamDef { return TEAM_MAP[id] ?? TEAMS[0]; }
