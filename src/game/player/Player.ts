import * as THREE from 'three';
import { RosterPlayer, Role, Mods, makeMods, AnimName, PlayerAttrs } from '../types';
import { PlayerModel } from './PlayerModel';
import type { TeamRuntime } from '../core/GameEngine';
import { clamp } from '../../utils/math';

export type PState = 'normal' | 'kick' | 'tackle' | 'slide' | 'fallen' | 'dive' | 'catch' | 'stumble' | 'celebrate' | 'jump' | 'dash';

export interface Buff { mods: Partial<Mods>; t: number; src: string }

let NEXT_ID = 1;

export class Player {
  id = NEXT_ID++;
  side: 0 | 1;
  team: TeamRuntime;
  rp: RosterPlayer;
  role: Role;
  slot: number;
  isGK: boolean;
  isCore: boolean;
  attrs: PlayerAttrs;
  pos = new THREE.Vector3();
  vel = new THREE.Vector3();
  desired = new THREE.Vector3();
  heading = 0;
  model: PlayerModel;
  // 状态
  state: PState = 'normal';
  stateT = 0;
  anim: AnimName = 'Idle';
  animT = 0;
  diveDir = 1;
  ctrl = false;
  sprinting = false;
  stamina = 100;
  staminaMax = 100;
  touchCd = 0;
  tackleCd = 0;
  kickLock = 0;
  jumpY = 0; jumpV = 0; jumpsLeft = 0;
  scale = 1; giantT = 0;
  freezeT = 0; stunT = 0; slowT = 0; slowAmt = 0; knockT = 0;
  shieldT = 0; shieldHits = 0; shieldOnHitCd = 0;
  buffs: Buff[] = [];
  cards = 0; sentOff = false; injured = false;
  switchT = 0; recvT = 0; combo = 0; comboT = 0;
  dashT = 0; dashVel = new THREE.Vector3(); dashKnock = 0; dashHit = new Set<number>(); flying = false;
  // 缓存属性
  mods: Mods = makeMods();
  modT = 0;
  spd = 6; sprintMul = 1.35; shotPow = 1; shotAcc = 0.7; ctl = 0.7; passAcc = 0.7; tkl = 0.7; bod = 0.7; gk = 0.5; ctlRange = 0.85;
  // AI
  target = new THREE.Vector3();
  aiT = 0;
  aiShootT = 0;
  confusedBy: THREE.Vector3 | null = null; confuseT = 0;
  gkReactT = 0; gkSaveRolled = new WeakSet<object>();
  dribbleSeen = new Map<number, number>();
  // 统计
  ms = { goals: 0, assists: 0, shots: 0, passes: 0, tackles: 0, saves: 0, dribbles: 0, fouls: 0 };
  staminaUsed = 0;

  constructor(team: TeamRuntime, rp: RosterPlayer, slot: number, model: PlayerModel, attrs: PlayerAttrs, isCore: boolean) {
    this.team = team; this.side = team.side; this.rp = rp; this.role = rp.role; this.slot = slot; this.isGK = rp.role === 'GK';
    this.model = model; this.attrs = attrs; this.isCore = isCore;
    this.injured = (rp.injured ?? 0) > 0;
  }

  get name() { return this.rp.name; }
  get incapacitated(): boolean { return this.sentOff || this.freezeT > 0 || this.stunT > 0 || this.knockT > 0 || this.state === 'fallen' || this.state === 'stumble'; }
  get canAct(): boolean { return !this.incapacitated && this.state !== 'dive' && this.state !== 'slide' && this.state !== 'tackle'; }
  get radius(): number { return 0.42 * this.scale * this.model.baseScale; }
  get height(): number { return 1.8 * this.scale * this.model.baseScale; }
  dir(): THREE.Vector3 { return new THREE.Vector3(Math.cos(this.heading), 0, Math.sin(this.heading)); }

  setState(s: PState, t: number) { this.state = s; this.stateT = t; }
  playAnim(a: AnimName, restart = true) { if (this.anim !== a || restart) { this.anim = a; this.animT = 0; } }

  addBuff(mods: Partial<Mods>, t: number, src: string) {
    const ex = this.buffs.find((b) => b.src === src);
    if (ex) { ex.t = Math.max(ex.t, t); ex.mods = mods; } else this.buffs.push({ mods, t, src });
  }

  applyStatus(kind: 'freeze' | 'slow' | 'stun' | 'knock', dur: number, power = 0, from?: THREE.Vector3): boolean {
    if (this.sentOff) return false;
    if (this.shieldT > 0 && this.shieldHits > 0) { this.shieldHits--; if (this.shieldHits <= 0) this.shieldT = 0; return false; }
    const resist = clamp(this.mods.stunResist, 0, 0.85);
    const d = dur * (1 - resist);
    if (d <= 0.05) return false;
    switch (kind) {
      case 'freeze': this.freezeT = Math.max(this.freezeT, d); this.vel.set(0, 0, 0); break;
      case 'stun': this.stunT = Math.max(this.stunT, d); this.vel.multiplyScalar(0.2); break;
      case 'slow': this.slowT = Math.max(this.slowT, dur); this.slowAmt = Math.max(this.slowAmt, clamp(power * (1 - resist * 0.5), 0, 0.85)); break;
      case 'knock': {
        this.knockT = Math.max(this.knockT, d);
        this.setState('fallen', d); this.playAnim('Fall');
        if (from) {
          const push = this.pos.clone().sub(from).setY(0);
          if (push.lengthSq() < 0.01) push.set(Math.random() - 0.5, 0, Math.random() - 0.5);
          push.normalize().multiplyScalar(power || 5);
          this.vel.copy(push);
        }
        break;
      }
    }
    return true;
  }

  /** 体力系数：体力低于 30% 时速度下降 */
  staminaFactor(): number { const r = this.stamina / this.staminaMax; return r > 0.3 ? 1 : 0.72 + r; }
}
