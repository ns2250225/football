import type { GameEngine, TeamRuntime } from '../core/GameEngine';
import type { Player } from './Player';
import { Mods, TeamPassiveDef } from '../types';

const ALL = (v: number): Partial<Mods> => ({ speed: v, sprint: v, shotPower: v, shotAccuracy: v, control: v, passAccuracy: v, tackle: v, body: v });

/**
 * 国家队专属被动运行时：32 种被动各自拥有独立参数与实际效果。
 * 通过事件（过人、抢断、传球、扑救、切换、对抗）累积层数，或按条件（持球、反击、下半场、落后等）提供属性修正。
 */
export class TeamPassiveRuntime {
  kind: string; p: Record<string, number>; def: TeamPassiveDef;
  stacks = 0; stackT = 0; timer = 0; lastWinT = -99; buffT = 0;
  playerTimers = new Map<number, number>();
  activeText = '';
  constructor(def: TeamPassiveDef, private team: TeamRuntime) { this.def = def; this.kind = def.kind; this.p = def.params; }

  update(dt: number) {
    if (this.stackT > 0) { this.stackT -= dt; if (this.stackT <= 0) { if (this.kind === 'samba') this.stacks = Math.max(0, this.stacks - 1), this.stackT = this.stacks ? 2 : 0; else this.stacks = 0; } }
    if (this.buffT > 0) this.buffT -= dt;
    for (const [k, v] of this.playerTimers) { if (v - dt <= 0) this.playerTimers.delete(k); else this.playerTimers.set(k, v - dt); }
  }

  on(evt: string, data: { p?: Player; victim?: Player; winner?: Player }, e: GameEngine) {
    const mine = (pl?: Player) => !!pl && pl.side === this.team.side;
    switch (this.kind) {
      case 'samba': if (evt === 'dribblePast' && mine(data.p)) { this.stacks = Math.min(this.p.maxStacks, this.stacks + 1); this.stackT = this.p.decay; } if (evt === 'ballLost' && mine(data.p)) this.stacks = 0; break;
      case 'steel': if (evt === 'tackleWin' && mine(data.p)) { this.stacks = Math.min(this.p.maxStacks, this.stacks + 1); this.stackT = this.p.window; } break;
      case 'tiki': if (evt === 'passComplete' && mine(data.p)) { this.stacks = Math.min(this.p.maxStacks, this.stacks + 1); this.stackT = 12; } if ((evt === 'intercept' || evt === 'ballLost') && mine(data.p)) this.stacks = 0; break;
      case 'ninja': if (evt === 'passComplete' && mine(data.p) && this.team.side === 0) e.skills.cutCooldowns(this.p.cut); break;
      case 'total': if (evt === 'switch' && mine(data.p)) this.playerTimers.set(data.p!.id, this.p.dur); if (evt === 'possession' && mine(data.p) && this.team.side === 1) this.playerTimers.set(data.p!.id, this.p.dur); break;
      case 'iron_line': if (evt === 'save' && mine(data.p)) this.buffT = this.p.dur; break;
      case 'iron_blood': case 'lion': if ((evt === 'tackleWin' || evt === 'duelWin') && mine(data.p)) this.playerTimers.set(data.p!.id, this.p.dur); break;
      case 'desert_eagle': if (evt === 'tackleWin' && mine(data.p)) this.buffT = this.p.dur; break;
      case 'pharaoh': if (evt === 'dribblePast' && mine(data.p)) this.playerTimers.set(data.p!.id, this.p.dur); break;
      case 'coffee': if (evt === 'passComplete' && data.victim && mine(data.victim)) this.playerTimers.set(data.victim.id, this.p.dur); break;
      case 'gallic': if ((evt === 'tackleWin' || evt === 'intercept') && mine(data.p)) this.lastWinT = e.simT; break;
    }
  }

  /** 返回该球员此刻由国家队被动提供的属性修正 */
  mods(pl: Player, e: GameEngine): Partial<Mods> {
    const p = this.p;
    const hasBall = e.balls.some((b) => b.owner === pl);
    const u = pl.pos.x * this.team.dir;
    switch (this.kind) {
      case 'samba': return { speed: p.perStack * this.stacks };
      case 'king': return pl.isCore || pl.slot === 4 ? (hasBall ? { shotAccuracy: p.acc, shotPower: p.pow } : {}) : {};
      case 'gallic': return e.simT - this.lastWinT < p.window ? { speed: p.speed } : {};
      case 'steel': return { tackle: p.perStack * this.stacks, body: p.perStack * this.stacks * 0.5 };
      case 'tiki': return { control: p.perStack * this.stacks };
      case 'lions': return { longShot: p.longShot };
      case 'golden_right': return {}; // 在射门时按蓄力判定（见 shotBonus）
      case 'total': return this.playerTimers.has(pl.id) ? ALL(p.all) : {};
      case 'iron_line': return this.buffT > 0 ? { tackle: p.def, body: p.def } : {};
      case 'unyielding': return pl.role === 'MF' ? { staminaRegen: p.regen } : {};
      case 'iron_blood': return this.playerTimers.has(pl.id) ? { body: p.body, shotPower: p.pow } : {};
      case 'golden_gen': return { shotPower: p.all, shotAccuracy: p.all, control: p.all, passAccuracy: p.all };
      case 'ninja': return hasBall ? {} : { speed: p.offBall };
      case 'perpetual': return e.period >= 2 ? { speed: p.speed } : {};
      case 'american': return { body: p.body };
      case 'green_whirl': return hasBall ? { turnSpeed: p.turn, control: p.ctl } : {};
      case 'precise': return u < 0 ? { tackle: p.def, body: p.def * 0.5 } : {};
      case 'nordic_will': return {};
      case 'nordic_giant': return { header: p.header };
      case 'box_hunter': return { boxShot: p.boxShot };
      case 'beast': return pl.sprinting ? { body: p.body } : {};
      case 'desert_eagle': return this.buffT > 0 ? { speed: p.speed } : {};
      case 'pharaoh': return this.playerTimers.has(pl.id) ? { shotAccuracy: p.acc } : {};
      case 'lion': return this.playerTimers.has(pl.id) ? { speed: p.speed, sprint: p.speed } : {};
      case 'kangaroo': return { tackleRange: p.range };
      case 'polar': return e.periodTime() < p.window ? { speed: p.speed } : {};
      case 'coffee': return this.playerTimers.has(pl.id) ? { control: p.ctl } : {};
      case 'highland': return { staminaCost: -p.cost };
      case 'giant_power': return { header: p.header, shotPower: p.pow };
      case 'red_press': return !e.teamAI.attacking(this.team) && u > 0 ? { speed: p.speed } : {};
      case 'frenzy': return { ultCharge: p.ult, ...(e.score[this.team.side] < e.score[1 - this.team.side] ? ALL(p.all) : {}) };
      case 'red_dragon': return hasBall && Math.abs(pl.pos.z) > p.wing ? { sprint: p.sprint } : {};
    }
    return {};
  }

  /** 传球附加精度（丹麦：附近有队友时） */
  passBonus(pl: Player, e: GameEngine): number {
    if (this.kind !== 'nordic_will') return 0;
    const near = e.teammates(pl).some((m) => !m.sentOff && m.pos.distanceTo(pl.pos) < this.p.range);
    return near ? this.p.acc * 0.5 : 0;
  }
  /** 射门附加精度（葡萄牙：蓄力射门） */
  shotAccBonus(charge: number): number { return this.kind === 'golden_right' && charge >= this.p.minCharge ? this.p.acc : 0; }

  statusText(e: GameEngine): string {
    switch (this.kind) {
      case 'samba': case 'steel': case 'tiki': return this.stacks ? `${this.def.name} ×${this.stacks}` : '';
      case 'gallic': return e.simT - this.lastWinT < this.p.window ? `${this.def.name} 反击中` : '';
      case 'iron_line': case 'desert_eagle': return this.buffT > 0 ? `${this.def.name} 生效` : '';
      case 'perpetual': return e.period >= 2 ? `${this.def.name} 生效` : '';
      case 'polar': return e.periodTime() < this.p.window ? `${this.def.name} 生效` : '';
      case 'frenzy': return e.score[this.team.side] < e.score[1 - this.team.side] ? `${this.def.name} 爆发` : '';
    }
    return this.playerTimers.size ? `${this.def.name} 生效` : '';
  }
}
