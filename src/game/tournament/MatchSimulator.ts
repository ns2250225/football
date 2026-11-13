import { TeamDef, MatchResult, GoalEvent, CardEvent, Stage, RosterPlayer } from '../types';
import { RNG } from '../../utils/random';
import { clamp } from '../../utils/math';
import { getRoster } from '../../data/players';
import { simulatePenalties } from './PenaltyShootout';

export interface SimContext {
  rng: RNG; stage: Stage; knockout: boolean; fatigue: [number, number]; host: string;
}

const RANDOM_EVENTS = [
  { text: '暴雨倾盆，双方进攻效率下降', h: 0.85, a: 0.85 },
  { text: '主力前锋热身受伤，进攻受挫', h: 0.8, a: 1, side: true },
  { text: '主教练临场变阵，攻势大增', h: 1.2, a: 1, side: true },
  { text: '球迷声势浩大，比赛节奏加快', h: 1.12, a: 1.12 },
  { text: '烈日高温，双方体能消耗巨大', h: 0.92, a: 0.92 },
  { text: '门将状态神勇，扑出多次险球', h: 1, a: 0.8, side: true },
  { text: '狂风影响长传，比赛陷入胶着', h: 0.9, a: 0.9 },
];

function attackOf(t: TeamDef): number { const s = t.stats; return s.shooting * 0.3 + s.dribbling * 0.2 + s.passing * 0.2 + s.speed * 0.2 + s.stamina * 0.1; }
function defenseOf(t: TeamDef): number { const s = t.stats; return s.defense * 0.55 + s.stamina * 0.15 + s.speed * 0.15 + s.passing * 0.15; }

function pickScorer(rng: RNG, roster: RosterPlayer[]): RosterPlayer {
  const starters = roster.slice(0, 5);
  const w = starters.map((p) => (p.role === 'FW' ? 5 : p.role === 'MF' ? 2.6 : p.role === 'DF' ? 0.9 : 0.02) * (p.attrs.shotPower / 80));
  return rng.weighted(starters, w)!;
}
function pickAssist(rng: RNG, roster: RosterPlayer[], exclude: RosterPlayer): RosterPlayer | undefined {
  const starters = roster.slice(0, 5).filter((p) => p !== exclude);
  return rng.weighted(starters, starters.map((p) => (p.role === 'MF' ? 3 : p.role === 'FW' ? 2 : p.role === 'DF' ? 1 : 0.2) * (p.attrs.passAccuracy / 80)));
}

/**
 * AI 比赛模拟：综合实力 + 阵容 + 战术 + 疲劳 + 主场氛围 + 随机事件
 */
export function simulateMatch(home: TeamDef, away: TeamDef, ctx: SimContext): MatchResult {
  const { rng } = ctx;
  const events: string[] = [];
  const fatH = 1 - clamp(ctx.fatigue[0], 0, 100) / 450;
  const fatA = 1 - clamp(ctx.fatigue[1], 0, 100) / 450;
  const hostH = home.id === ctx.host ? 1.08 : 1;
  const hostA = away.id === ctx.host ? 1.08 : 1;
  if (hostH > 1) events.push(`${home.name}享受东道主氛围加成`);
  if (hostA > 1) events.push(`${away.name}享受东道主氛围加成`);
  // 战术：进攻倾向提高自身与对手的进球期望
  const tacH = 0.85 + home.profile.attack * 0.3, tacA = 0.85 + away.profile.attack * 0.3;
  const openH = 0.92 + away.profile.attack * 0.12, openA = 0.92 + home.profile.attack * 0.12;
  // 球员阵容强度
  const rosterH = getRoster(home).slice(0, 5).reduce((s, p) => s + p.attrs.shotPower + p.attrs.control, 0) / 800;
  const rosterA = getRoster(away).slice(0, 5).reduce((s, p) => s + p.attrs.shotPower + p.attrs.control, 0) / 800;
  let mH = 1, mA = 1;
  const nEvents = rng.chance(0.55) ? 1 : rng.chance(0.25) ? 2 : 0;
  for (let i = 0; i < nEvents; i++) {
    const e = rng.pick(RANDOM_EVENTS);
    if (e.side) {
      const toHome = rng.chance(0.5);
      events.push(`${toHome ? home.name : away.name}：${e.text}`);
      if (toHome) { mH *= e.h; mA *= e.a; } else { mA *= e.h; mH *= e.a; }
    } else { events.push(e.text); mH *= e.h; mA *= e.a; }
  }
  const ratioH = (attackOf(home) * fatH * hostH * (0.9 + rosterH * 0.2)) / (defenseOf(away) * fatA * hostA);
  const ratioA = (attackOf(away) * fatA * hostA * (0.9 + rosterA * 0.2)) / (defenseOf(home) * fatH * hostH);
  const xgH = clamp(1.3 * Math.pow(ratioH, 4) * tacH * openH * mH, 0.25, 4.5);
  const xgA = clamp(1.3 * Math.pow(ratioA, 4) * tacA * openA * mA, 0.25, 4.5);

  const scorers: GoalEvent[] = []; const cards: CardEvent[] = [];
  const rH = getRoster(home), rA = getRoster(away);
  let gH = 0, gA = 0; let redH = 1, redA = 1;
  const yellowSet: Record<string, number> = {};
  const cardRate = (t: TeamDef) => (1.2 + t.profile.physical * 1.4 + t.profile.press * 0.6) / 90;
  const simMinutes = (from: number, to: number, scale: number) => {
    for (let m = from; m <= to; m++) {
      if (rng.chance((xgH / 90) * redH * scale)) { const s = pickScorer(rng, rH); const as = rng.chance(0.72) ? pickAssist(rng, rH, s) : undefined; scorers.push({ team: home.id, name: s.name, minute: m, assist: as?.name }); gH++; }
      if (rng.chance((xgA / 90) * redA * scale)) { const s = pickScorer(rng, rA); const as = rng.chance(0.72) ? pickAssist(rng, rA, s) : undefined; scorers.push({ team: away.id, name: s.name, minute: m, assist: as?.name }); gA++; }
      for (const [t, r] of [[home, rH], [away, rA]] as [TeamDef, RosterPlayer[]][]) {
        if (rng.chance(cardRate(t))) {
          const p = rng.pick(r.slice(0, 5));
          const key = t.id + p.name;
          yellowSet[key] = (yellowSet[key] ?? 0) + 1;
          const direct = rng.chance(0.05);
          if (direct || yellowSet[key] >= 2) {
            cards.push({ team: t.id, name: p.name, minute: m, type: 'red' });
            events.push(`${m}' ${t.name} ${p.name} 被红牌罚下`);
            if (t === home) redH *= 0.72; else redA *= 0.72;
          } else cards.push({ team: t.id, name: p.name, minute: m, type: 'yellow' });
        }
      }
    }
  };
  simMinutes(1, 90, 1);
  let et = false; let pens: [number, number] | undefined;
  if (ctx.knockout && gH === gA) {
    et = true; events.push('常规时间战平，进入加时赛');
    simMinutes(91, 120, 0.85);
    if (gH === gA) {
      pens = simulatePenalties(home, away, rng).score;
      events.push(`点球大战 ${pens[0]} : ${pens[1]}`);
    }
  }
  const shotsH = gH + rng.poisson(xgH * 3.2) + 2, shotsA = gA + rng.poisson(xgA * 3.2) + 2;
  const onH = gH + Math.round((shotsH - gH) * rng.range(0.25, 0.45)), onA = gA + Math.round((shotsA - gA) * rng.range(0.25, 0.45));
  const possBase = 50 + (home.stats.passing + home.stats.dribbling - away.stats.passing - away.stats.dribbling) * 0.45 + (home.profile.possession - away.profile.possession) * 12;
  const possH = Math.round(clamp(possBase + rng.range(-5, 5), 28, 72));
  let winner: string | null = null;
  if (gH > gA) winner = home.id; else if (gA > gH) winner = away.id; else if (pens) winner = pens[0] > pens[1] ? home.id : away.id;
  scorers.sort((a, b) => a.minute - b.minute);
  return { homeGoals: gH, awayGoals: gA, et, pens, winner, scorers, cards, shots: [shotsH, shotsA], onTarget: [onH, onA], possession: [possH, 100 - possH], events };
}
