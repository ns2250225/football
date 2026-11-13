// ============ 全局核心类型定义 ============

export type Rarity = 'common' | 'rare' | 'epic' | 'legendary';
export const RARITY_ORDER: Rarity[] = ['common', 'rare', 'epic', 'legendary'];
export const RARITY_NAME: Record<Rarity, string> = { common: '普通', rare: '稀有', epic: '史诗', legendary: '传说' };
export const RARITY_COLOR: Record<Rarity, string> = { common: '#9ca3af', rare: '#3b82f6', epic: '#a855f7', legendary: '#f59e0b' };

export interface TeamStats {
  speed: number; shooting: number; dribbling: number; passing: number; defense: number; stamina: number;
}
export type StatKey = keyof TeamStats;
export const STAT_NAMES: Record<StatKey, string> = {
  speed: '速度', shooting: '射门', dribbling: '盘带', passing: '传球', defense: '防守', stamina: '体能',
};

/** 战术倾向（0~1） */
export interface TacticProfile {
  attack: number; press: number; possession: number; counter: number; longShot: number; width: number; aerial: number; physical: number;
}

export type TacticMode = 'attack' | 'defend' | 'possession' | 'counter' | 'press' | 'allBack';
export const TACTIC_NAMES: Record<TacticMode, string> = {
  attack: '进攻', defend: '防守', possession: '控球', counter: '反击', press: '全场逼抢', allBack: '全员回防',
};
export const TACTIC_DESC: Record<TacticMode, string> = {
  attack: '更多球员前插', defend: '优先保护球门', possession: '优先短传', counter: '迅速向前推进', press: '主动压迫持球队员', allBack: '降低进攻倾向',
};

export type FlagType = 'h' | 'v' | 'nordic' | 'circle' | 'diamond' | 'cross' | 'plus' | 'solid' | 'stripes' | 'canton' | 'yinyang';
export interface FlagDef { type: FlagType; colors: string[]; weights?: number[]; emblem?: string; emblemColor?: string }

export interface KitDef { shirt: string; shirt2: string; shorts: string; socks: string }

export interface TeamPassiveDef {
  id: string; name: string; icon: string; desc: string; kind: string; params: Record<string, number>;
}

export interface TeamDef {
  id: string; name: string; code: string; style: string; stats: TeamStats; profile: TacticProfile;
  defaultTactic: TacticMode; passive: TeamPassiveDef; home: KitDef; away: KitDef; flag: FlagDef;
  formation: string; skin: string[]; hair: string[]; region: string; unlockedByDefault: boolean;
}

export type Role = 'GK' | 'DF' | 'MF' | 'FW';
export const ROLE_NAME: Record<Role, string> = { GK: '门将', DF: '后卫', MF: '中场', FW: '前锋' };

export interface PlayerAttrs {
  speed: number; sprint: number; shotPower: number; shotAccuracy: number; control: number;
  passAccuracy: number; tackle: number; body: number; stamina: number; gkSave: number;
}
export const ATTR_NAMES: Record<keyof PlayerAttrs, string> = {
  speed: '移动速度', sprint: '冲刺速度', shotPower: '射门力量', shotAccuracy: '射门精度', control: '控球能力',
  passAccuracy: '传球精度', tackle: '抢断能力', body: '身体对抗', stamina: '体力', gkSave: '门将扑救',
};

export interface RosterPlayer {
  id: string; name: string; number: number; role: Role; height: number; build: number;
  attrs: PlayerAttrs; skinIdx: number; hairIdx: number; accessory: number;
  injured?: number; // 剩余受伤场次
  fatigue?: number; // 0~100
}

// ============ 数值修正 ============
export interface Mods {
  speed: number; sprint: number; shotPower: number; shotAccuracy: number; control: number; passAccuracy: number;
  tackle: number; body: number; staminaMax: number; staminaRegen: number; staminaCost: number; gkSave: number; gkReact: number;
  cdr: number; xpMul: number; goldMul: number; rareLuck: number; critChance: number; controlRange: number; stunResist: number;
  jump: number; longShot: number; boxShot: number; gkPierce: number; comboBonus: number; passCombo: number; switchBoost: number;
  shieldOnHit: number; comebackAll: number; comebackRegen: number; ultCharge: number; turnSpeed: number; header: number; tackleRange: number;
}
export const MOD_KEYS: (keyof Mods)[] = [
  'speed', 'sprint', 'shotPower', 'shotAccuracy', 'control', 'passAccuracy', 'tackle', 'body', 'staminaMax', 'staminaRegen', 'staminaCost',
  'gkSave', 'gkReact', 'cdr', 'xpMul', 'goldMul', 'rareLuck', 'critChance', 'controlRange', 'stunResist', 'jump', 'longShot', 'boxShot',
  'gkPierce', 'comboBonus', 'passCombo', 'switchBoost', 'shieldOnHit', 'comebackAll', 'comebackRegen', 'ultCharge', 'turnSpeed', 'header', 'tackleRange',
];
export const MOD_NAMES: Record<keyof Mods, string> = {
  speed: '移动速度', sprint: '冲刺速度', shotPower: '射门威力', shotAccuracy: '射门精度', control: '控球', passAccuracy: '传球精度',
  tackle: '抢断', body: '身体对抗', staminaMax: '体力上限', staminaRegen: '体力恢复', staminaCost: '体力消耗', gkSave: '扑救',
  gkReact: '门将反应', cdr: '冷却缩减', xpMul: '经验获取', goldMul: '金币获取', rareLuck: '稀有概率', critChance: '暴击率',
  controlRange: '控球范围', stunResist: '抗控制', jump: '跳跃', longShot: '远射威力', boxShot: '禁区射门', gkPierce: '破门',
  comboBonus: '连击加成', passCombo: '配合加成', switchBoost: '切换加速', shieldOnHit: '受击护盾', comebackAll: '逆境属性',
  comebackRegen: '逆境回复', ultCharge: '大招充能', turnSpeed: '转向速度', header: '头球', tackleRange: '抢断距离',
};
export function makeMods(init?: Partial<Mods>): Mods {
  const m = {} as Mods;
  for (const k of MOD_KEYS) m[k] = 0;
  if (init) Object.assign(m, init);
  return m;
}
export function addMods(target: Mods, src: Partial<Mods> | undefined, scale = 1): Mods {
  if (!src) return target;
  for (const k in src) {
    const key = k as keyof Mods;
    const v = src[key];
    if (typeof v === 'number') target[key] += v * scale;
  }
  return target;
}

// ============ 技能 ============
export type SkillCategory = 'active' | 'passive' | 'shooting' | 'defense' | 'ultimate' | 'evolution';
export type BaseCategory = Exclude<SkillCategory, 'evolution'>;
export const CATEGORY_NAME: Record<SkillCategory, string> = {
  active: '主动技能', passive: '被动技能', shooting: '射门技能', defense: '防守技能', ultimate: '终极大招', evolution: '进化技能',
};

export type ShotForm = 'fire' | 'thunder' | 'ice' | 'meteor' | 'golden' | 'rainbow' | 'phantom' | 'light' | 'galaxy' | 'tornado' | 'nuke' | 'void';
export interface ShotSpec {
  form?: ShotForm; prio?: number;
  power?: number; accuracy?: number; pierce?: number; curve?: number; homing?: number; refract?: number; dip?: number;
  bounceTurn?: number; split?: number; afterimage?: number; explode?: number; freezeZone?: number; shockwave?: number;
  attract?: number; curse?: number; lob?: number; chain?: number; speed?: number; burn?: number; crit?: number; rainbow?: number;
}

export type StatusKind = 'freeze' | 'slow' | 'stun' | 'knock';
export type Op =
  | { t: 'buff'; target: 'self' | 'team' | 'near'; radius?: number; mods: Partial<Mods>; dur: number }
  | { t: 'status'; target: 'oppNear' | 'oppAll' | 'victim' | 'attacker'; radius?: number; status: StatusKind; dur: number; power?: number; fx?: string }
  | { t: 'dash'; mode: 'forward' | 'blink' | 'toBallPath' | 'toDefense' | 'fly'; dist: number; speed?: number; knock?: number }
  | { t: 'pullBall'; radius: number; dur: number; power: number }
  | { t: 'clone'; count: number; dur: number; mode: 'attack' | 'defense' }
  | { t: 'nextPass'; dur: number }
  | { t: 'jump'; height: number; double?: number }
  | { t: 'swap' }
  | { t: 'recall'; power: number }
  | { t: 'nextShot'; shot: ShotSpec; dur: number }
  | { t: 'shootNow'; shot: ShotSpec }
  | { t: 'float'; radius: number; dur: number }
  | { t: 'shield'; dur: number; hits: number }
  | { t: 'gk'; mods: Partial<Mods>; dur: number; invincible?: number }
  | { t: 'meteor'; radius: number; dur: number }
  | { t: 'thunderAll'; dur: number }
  | { t: 'teleport' }
  | { t: 'giant'; scale: number; dur: number; mods: Partial<Mods> }
  | { t: 'tornado'; radius: number; dur: number }
  | { t: 'storm'; count: number; dur: number }
  | { t: 'barrier'; dur: number; hits: number }
  | { t: 'postGuard'; dur: number }
  | { t: 'aura'; radius: number; slow: number; dur: number }
  | { t: 'oppSlowAll'; slow: number; dur: number }
  | { t: 'cooldownCut'; amount: number };

export type DefTrigger = 'carrierNear' | 'oppPassNear' | 'tackleWin' | 'crowded' | 'hitTaken' | 'oppInThird' | 'oppShot' | 'ballLost' | 'passive' | 'ready' | 'danger';
export const TRIGGER_NAME: Record<DefTrigger, string> = {
  carrierNear: '敌方持球者靠近时', oppPassNear: '敌方传球经过附近时', tackleWin: '抢断成功时', crowded: '被多名对手包围时',
  hitTaken: '受到攻击时', oppInThird: '敌方进入我方三区时', oppShot: '敌方射门时', ballLost: '我方半场丢球时',
  passive: '持续生效', ready: '冷却完毕自动生效', danger: '门前危险时',
};
export interface DefenseSpec { trig: DefTrigger; cd: number; ops: Op[]; radius?: number }

export type AnimName =
  | 'Idle' | 'Walk' | 'Run' | 'Sprint' | 'Dribble' | 'Pass' | 'Shoot' | 'LongShoot' | 'Tackle' | 'Jump' | 'Header'
  | 'Fall' | 'Hit' | 'Celebrate' | 'GoalkeeperDive' | 'GoalkeeperCatch' | 'Victory' | 'Defeat';
export const ANIM_LIST: AnimName[] = [
  'Idle', 'Walk', 'Run', 'Sprint', 'Dribble', 'Pass', 'Shoot', 'LongShoot', 'Tackle', 'Jump', 'Header',
  'Fall', 'Hit', 'Celebrate', 'GoalkeeperDive', 'GoalkeeperCatch', 'Victory', 'Defeat',
];

export interface SkillDef {
  id: string; code: string; name: string; category: SkillCategory; baseCategory: BaseCategory;
  rarity: Rarity; icon: string; color: string; desc: string; maxLevel: number;
  cooldown?: number; trigger?: string; tags: string[];
  passive?: Partial<Mods>;
  active?: Op[];
  shot?: ShotSpec;
  defense?: DefenseSpec[];
  ultimate?: Op[];
  flags?: string[];
  lvShot?: Record<number, ShotSpec>;
  lvText?: string[];
  vfx: string; sfx: string; anim: AnimName;
  evolveFrom?: { main: string; partner: string; req: [number, number] };
}

export interface EvolutionDef { id: string; code: string; name: string; main: string; partner: string; req: [number, number]; result: string }

export interface OwnedSkill { id: string; level: number; absorbedInto?: string }

// ============ 装备 ============
export type EquipSlot = 'boots' | 'guards' | 'gloves' | 'helmet' | 'amulet' | 'ball';
export const EQUIP_SLOTS: EquipSlot[] = ['boots', 'guards', 'gloves', 'helmet', 'amulet', 'ball'];
export const SLOT_NAME: Record<EquipSlot, string> = {
  boots: '球鞋', guards: '护腿', gloves: '手套', helmet: '头盔', amulet: '护身符', ball: '足球',
};
export const SLOT_ICON: Record<EquipSlot, string> = { boots: '👟', guards: '🦵', gloves: '🧤', helmet: '⛑️', amulet: '🧿', ball: '⚽' };
export interface EquipDef {
  id: string; name: string; slot: EquipSlot; rarity: Rarity; icon: string; color: string; desc: string;
  mods: Partial<Mods>; shot?: ShotSpec; special?: { kind: string; value: number; desc: string }; source: string;
}

// ============ 球场 / 天气 / 事件 / BOSS ============
export type WeatherKind = 'sunny' | 'rain' | 'storm' | 'snow' | 'sandstorm' | 'night';
export interface WeatherDef { id: WeatherKind; name: string; icon: string; desc: string; friction: number; playerSpeed: number; wind: number; light: number }

export interface StadiumDef {
  id: string; name: string; theme: string; desc: string; icon: string;
  skyTop: string; skyBottom: string; fog: string; fogDensity: number;
  grassA: string; grassB: string; lineColor: string; ground: string;
  standColor: string; standAccent: string; crowd: string[];
  ambient: number; sun: number; sunColor: string; hemiSky: string; hemiGround: string;
  props: string; ambience: { freq: number; q: number; vol: number; tone: number };
  weatherPool: WeatherKind[];
}

export interface MatchParams {
  ballPower: number; ballSpeed: number; friction: number; bounce: number; playerSpeed: number; staminaDrain: number;
  goalScale: number; wind: number; lightning: boolean; night: boolean; doubleBall: boolean; xpMul: number; ultMul: number;
  goldMul: number; cdr: number; gravity: number;
}
export interface EventDef {
  id: string; code: string; name: string; icon: string; desc: string; scope: 'both' | 'player'; effect: Partial<MatchParams>; conflicts?: string[];
}

export interface BossDef { id: string; name: string; type: string; icon: string; desc: string; mech: string; phases?: string[]; match: (t: TeamDef) => number }

// ============ 任务 / 成就 / 商店 ============
export type MissionStat =
  | 'passes' | 'shots' | 'tackles' | 'goals' | 'cleanSheet' | 'dribbles' | 'skillUses' | 'longGoals' | 'assists'
  | 'saves' | 'ultUses' | 'winBy' | 'possession' | 'noFoul' | 'onTarget' | 'headers';
export interface MissionDef { id: string; stat: MissionStat; name: string; min: number; max: number; gold: number; xp: number; desc: string }
export interface MissionInstance { id: string; stat: MissionStat; target: number; desc: string; gold: number; xp: number; progress?: number; done?: boolean }

export interface ShopItemDef { id: string; name: string; price: number; icon: string; desc: string }
export interface ShopOffer { itemId: string; price: number; sold: boolean; equipId?: string }

export interface StatBoostDef { id: string; name: string; icon: string; desc: string; mods: Partial<Mods>; max: number }

// ============ 赛事 ============
export type Stage = 'group' | 'r16' | 'qf' | 'sf' | 'third' | 'final';
export const STAGE_NAME: Record<Stage, string> = { group: '小组赛', r16: '16 强', qf: '8 强', sf: '半决赛', third: '三四名决赛', final: '决赛' };
export const STAGE_RANK: Record<Stage, number> = { group: 0, r16: 1, qf: 2, sf: 3, third: 3, final: 4 };

export interface GoalEvent { team: string; name: string; minute: number; assist?: string; pen?: boolean; own?: boolean }
export interface CardEvent { team: string; name: string; minute: number; type: 'yellow' | 'red' }
export interface MatchResult {
  homeGoals: number; awayGoals: number; et?: boolean; pens?: [number, number]; winner: string | null;
  scorers: GoalEvent[]; cards: CardEvent[]; shots: [number, number]; onTarget: [number, number]; possession: [number, number];
  events: string[]; byPlayer?: boolean;
}
export interface MatchRecord {
  id: number; stage: Stage; matchday?: number; group?: string; home: string | null; away: string | null;
  slotHome?: string; slotAway?: string; result?: MatchResult; stadiumId: string; weather: WeatherKind;
}
export interface GroupDef { name: string; teams: string[] }
export interface TournamentState {
  groups: GroupDef[]; matches: MatchRecord[]; host: string; lots: Record<string, number>;
  fatigue: Record<string, number>; champion?: string; runnerUp?: string; third?: string; fourth?: string;
}

export type GameMode = 'standard' | 'random' | 'extreme' | 'custom';
export const MODE_NAME: Record<GameMode, string> = { standard: '标准世界杯', random: '随机世界杯', extreme: '极限世界杯', custom: '自定义世界杯' };
export const DIFFICULTY_NAME = ['新手', '普通', '困难', '地狱', '世界冠军'];
export const DIFFICULTY_MULT = [0.7, 1.0, 1.2, 1.5, 1.8];
export const DIFFICULTY_AI = ['基础', '标准', '积极逼抢', '高级战术', '完整战术 + 技能组合'];
export const STAGE_MULT: Record<Stage, number> = { group: 1.0, r16: 1.1, qf: 1.2, sf: 1.3, third: 1.3, final: 1.5 };

export interface CustomOptions { difficulty: number; timeScale: number; eventFreq: number; dropLuck: number }

export type DraftKind = 'newSkill' | 'upgrade' | 'evolve' | 'stat' | 'item' | 'gold';
export interface DraftChoice { kind: DraftKind; key: string; rarity: Rarity; skillId?: string; statId?: string; equipId?: string; gold?: number }

export interface MatchPlan {
  matchId: number; opponent: string; stage: Stage; stadiumId: string; weather: WeatherKind; events: string[];
  boss?: string; missions: MissionInstance[]; elite: boolean;
}

export interface RunMatchLog {
  matchId: number; stage: Stage; opponent: string; gf: number; ga: number; pens?: [number, number]; won: boolean; draw: boolean;
  goals: number; assists: number; gold: number; xp: number; boss?: string;
}

export interface RunState {
  version: number; id: string; seed: number; createdAt: number; mode: GameMode; difficulty: number; custom: CustomOptions;
  teamId: string; coreId: string; roster: RosterPlayer[]; lineup: string[];
  tournament: TournamentState; level: number; xp: number; skills: OwnedSkill[]; evolved: string[]; ultimate: string | null;
  statBoosts: Record<string, number>; equipSlots: Record<EquipSlot, string | null>; inventory: string[];
  gold: number; rerollTokens: number; ultStart: number; teamFatigue: number;
  shop: { offers: ShopOffer[]; restocks: number; forMatch: number } | null;
  pendingDrafts: number; draft: DraftChoice[] | null; draftFreeReroll: boolean; pity: number;
  plan: MatchPlan | null; log: RunMatchLog[]; ended: boolean; eliminated: boolean; championWon: boolean;
  permBonus: Partial<Mods>; bossesBeaten: string[]; usedSkills: number; tacticMode: TacticMode | null; buys: number;
  categoriesOwned?: string[];
}

export interface MetaStats {
  runs: number; champions: number; matches: number; wins: number; draws: number; losses: number; goals: number; assists: number;
  tackles: number; saves: number; skillUses: number; ultUses: number; evolutions: string[]; bosses: string[]; championTeams: string[];
  hatTricks: number; cleanSheets: number; penWins: number; comebacks: number; bigWins: number; maxLevel: number; legendaryPicks: number;
  equipFound: string[]; skillsSeen: string[]; stadiums: string[]; weathers: string[]; eventsSeen: string[]; buys: number;
  maxGold: number; maxGoalsMatch: number; bestStage: Record<string, number>; titlesByDiff: number[]; titlesByMode: Record<string, number>;
  unbeatenTitles: number; perfectTitles: number; fullEquip: boolean; allCats: boolean; groupOuts: number;
}
export interface Settings {
  quality: 'low' | 'medium' | 'high'; sfx: number; music: number; hints: boolean; shake: boolean; autoSwitch: boolean; showFps: boolean; touch: 'auto' | 'on' | 'off'; brightness: number;
}
export interface MetaState { version: number; unlocked: string[]; achievements: Record<string, number>; stats: MetaStats; settings: Settings; teamHistory: Record<string, { runs: number; best: number; titles: number }> }

export interface AchievementDef {
  id: string; name: string; desc: string; icon: string; reward: { team?: string; gold?: number };
  check: (m: MetaState) => boolean; progress?: (m: MetaState) => [number, number];
}
