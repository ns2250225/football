import { EventDef, GameMode, MatchParams, WeatherKind } from '../types';
import { EVENTS } from '../../data/events';
import { WEATHER_MAP } from '../../data/stadiums';
import { RNG } from '../../utils/random';

export function defaultParams(): MatchParams {
  return { ballPower: 1, ballSpeed: 1, friction: 1, bounce: 1, playerSpeed: 1, staminaDrain: 1, goalScale: 1, wind: 0, lightning: false, night: false, doubleBall: false, xpMul: 1, ultMul: 1, goldMul: 1, cdr: 0, gravity: 1 };
}

/** 随机抽取赛事事件，自动排除互斥事件 */
export function pickEvents(rng: RNG, mode: GameMode, freq: number, stageIdx: number): string[] {
  let n = 0;
  if (mode === 'standard') n = rng.chance(0.45 + stageIdx * 0.05) ? 1 : 0;
  else if (mode === 'random') n = rng.chance(0.5) ? 2 : 1;
  else if (mode === 'extreme') n = rng.chance(0.6) ? 2 : 1;
  else n = freq <= 0 ? 0 : freq === 1 ? (rng.chance(0.5) ? 1 : 0) : freq === 2 ? rng.int(1, 2) : rng.int(2, 3);
  const out: EventDef[] = [];
  const pool = rng.shuffle([...EVENTS]);
  for (const e of pool) {
    if (out.length >= n) break;
    if (out.some((o) => o.conflicts?.includes(e.id) || e.conflicts?.includes(o.id))) continue;
    out.push(e);
  }
  return out.map((e) => e.id);
}

/**
 * 计算比赛参数：天气 + 事件。
 * 返回 both（影响双方）与 player（仅影响玩家）两部分。
 */
export function computeParams(eventIds: string[], weather: WeatherKind): MatchParams {
  const p = defaultParams();
  const w = WEATHER_MAP[weather];
  p.friction *= w.friction; p.playerSpeed *= w.playerSpeed; p.wind += w.wind;
  if (weather === 'storm') p.lightning = true;
  if (weather === 'night') p.night = true;
  for (const id of eventIds) {
    const e = EVENTS.find((x) => x.id === id);
    if (!e) continue;
    const f = e.effect;
    if (f.ballPower) p.ballPower *= f.ballPower;
    if (f.ballSpeed) p.ballSpeed *= f.ballSpeed;
    if (f.friction) p.friction *= f.friction;
    if (f.bounce) p.bounce *= f.bounce;
    if (f.playerSpeed) p.playerSpeed *= f.playerSpeed;
    if (f.staminaDrain) p.staminaDrain *= f.staminaDrain;
    if (f.goalScale) p.goalScale *= f.goalScale;
    if (f.wind) p.wind += f.wind;
    if (f.lightning) p.lightning = true;
    if (f.night) p.night = true;
    if (f.doubleBall) p.doubleBall = true;
    if (f.xpMul) p.xpMul *= f.xpMul;
    if (f.ultMul) p.ultMul *= f.ultMul;
    if (f.goldMul) p.goldMul *= f.goldMul;
    if (f.cdr) p.cdr += f.cdr;
    if (f.gravity) p.gravity *= f.gravity;
  }
  return p;
}
