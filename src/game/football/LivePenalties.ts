import * as THREE from 'three';
import type { GameEngine } from '../core/GameEngine';
import type { Player } from '../player/Player';
import type { Input } from '../core/Input';
import { PenaltyState } from '../tournament/PenaltyShootout';
import { FIELD } from '../../utils/physics';
import { clamp } from '../../utils/math';
import { rand } from '../../utils/random';
import { AudioManager } from '../audio/AudioManager';

/** 现场点球大战：玩家罚球时瞄准+蓄力，对手罚球时玩家选择扑救方向 */
export class LivePenalties {
  st = new PenaltyState();
  stage: 'aim' | 'flight' | 'result' | 'done' = 'aim';
  t = 0;
  kicker!: Player; keeper!: Player; side: 0 | 1 = 0;
  aimZ = 0; aimY = 0.4; charge = 0; charging = false;
  diveZ = 0; diveHigh = false; dived = false; aiDelay = 1.5;
  scored = false; resultText = '';
  order: [number, number] = [0, 0];
  readonly gx = FIELD.L / 2;
  constructor(private e: GameEngine) {}

  start() {
    const e = this.e;
    e.setPhase('penalties');
    e.banner('点球大战', '5 轮点球 + 突然死亡', '#fde047', true);
    AudioManager.play('whistle_long');
    this.setupKick();
  }

  private kickersOf(side: 0 | 1): Player[] {
    return this.e.teams[side].players.filter((p) => !p.sentOff && !p.isGK).sort((a, b) => (b.isCore ? 1 : 0) - (a.isCore ? 1 : 0) || b.shotAcc - a.shotAcc);
  }

  setupKick() {
    const e = this.e;
    this.side = this.st.turn;
    const ks = this.kickersOf(this.side);
    this.kicker = ks[this.order[this.side] % ks.length];
    this.order[this.side]++;
    this.keeper = e.teams[1 - this.side].players.find((p) => p.isGK && !p.sentOff) ?? e.teams[1 - this.side].players[0];
    // 站位
    let idx = 0;
    for (const p of e.players) {
      if (p.sentOff) continue;
      p.vel.set(0, 0, 0); p.state = 'normal'; p.stunT = 0; p.freezeT = 0; p.knockT = 0; p.jumpY = 0; p.jumpV = 0; p.dashT = 0;
      p.gkSaveRolled = new WeakSet();
      if (p === this.kicker) { p.pos.set(this.gx - FIELD.penSpot - 1, 0, 0); p.heading = 0; }
      else if (p === this.keeper) { p.pos.set(this.gx - 0.35, 0, 0); p.heading = Math.PI; }
      else { p.pos.set(-1 + (idx % 5) * 0.2, 0, -5 + idx * 1.1); p.heading = 0; idx++; }
    }
    const b = e.balls[0];
    b.reset(this.gx - FIELD.penSpot, 0);
    for (let i = 1; i < e.balls.length; i++) e.balls[i].reset(0, 30);
    this.stage = 'aim'; this.t = 0; this.aimZ = 0; this.aimY = 0.4; this.charge = 0; this.charging = false;
    this.diveZ = 0; this.diveHigh = false; this.dived = false; this.aiDelay = rand.range(1.4, 2.4); this.scored = false; this.resultText = '';
    e.switchTo(this.side === 0 ? this.kicker : this.keeper, false);
  }

  handleInput(dt: number, inp: Input) {
    const mv = inp.move();
    if (this.stage === 'aim' && this.side === 0) {
      this.aimZ = clamp(this.aimZ + mv.x * dt * 1.6, -1, 1);
      this.aimY = clamp(this.aimY - mv.z * dt * 1.3, 0, 1);
      if (inp.isDown('shoot')) { this.charging = true; this.charge = Math.min(1, this.charge + dt / 1.0); }
      if (this.charging && !inp.isDown('shoot')) { this.kick(this.charge); this.charging = false; }
    } else if (this.side === 1 && !this.dived) {
      if (Math.abs(mv.x) > 0.2) this.diveZ = Math.sign(mv.x);
      else if (inp.isDown('shoot')) this.diveZ = 0;
      this.diveHigh = mv.z < -0.3;
    }
    inp.consume('shoot'); inp.consumeRelease('shoot');
  }

  private kick(charge: number) {
    const e = this.e;
    const gw = e.goalW / 2;
    const z = this.aimZ * (gw - 0.25);
    const y = 0.25 + this.aimY * (e.goalH - 0.4) + (charge > 0.92 ? (charge - 0.92) * 14 : 0);
    e.balls[0].owner = this.kicker;
    e.shots.shoot(this.kicker, Math.max(0.45, charge), { z: null, high: 0 }, [], { penalty: true, target: new THREE.Vector3(this.gx + 0.5, y, z), noSkills: this.side === 1 });
    this.stage = 'flight'; this.t = 0;
  }

  update(dt: number) {
    const e = this.e;
    this.t += dt;
    if (this.stage === 'aim' && this.side === 1 && this.t > this.aiDelay) {
      this.aimZ = rand.range(-1, 1); this.aimY = rand.range(0, 0.9);
      this.kick(rand.range(0.6, 0.9));
    }
    if (this.stage === 'flight') {
      const b = e.balls[0];
      // 门将反应扑救
      if (!this.dived && this.t > (this.side === 1 ? 0.06 : 0.12)) {
        this.dived = true;
        let dz: number, high: boolean;
        if (this.side === 1) { dz = this.diveZ; high = this.diveHigh; }
        else {
          const guess = rand.chance(0.3 + this.keeper.gk * 0.25);
          dz = guess ? Math.sign(b.vel.z) || 0 : rand.pick([-1, 0, 1]);
          high = guess ? b.vel.y > 3 : rand.chance(0.4);
        }
        const k = this.keeper;
        if (dz !== 0) {
          k.setState('dive', 0.8); k.diveDir = -dz; k.playAnim('GoalkeeperDive');
          k.vel.set(0, 0, dz * 8.5 * (0.9 + k.gk * 0.3)); k.jumpV = high ? 5.5 : 2;
        } else { k.playAnim('GoalkeeperCatch'); k.jumpV = high ? 5 : 0; }
      }
      e.gkAI.tryContact(this.keeper, b);
      const crossed = b.pos.x > this.gx + b.r;
      if (crossed) {
        this.scored = Math.abs(b.pos.z) < e.goalW / 2 && b.pos.y < e.goalH;
        this.finishKick();
      } else if (this.t > 2.2 || (b.speed() < 1.2 && this.t > 0.6) || b.vel.x < -1 || b.owner) {
        this.scored = false; this.finishKick();
      }
    } else if (this.stage === 'result' && this.t > 1.5) {
      this.st.record(this.side, this.scored);
      if (this.st.done) { this.stage = 'done'; e.pens = this.st.score(); e.delay(0.6, () => e.endMatch()); }
      else this.setupKick();
    }
  }

  private finishKick() {
    const e = this.e;
    this.stage = 'result'; this.t = 0;
    if (this.scored) {
      this.resultText = '进球！';
      AudioManager.play(this.side === 0 ? 'goal' : 'boo', 0.7);
      this.kicker.playAnim('Celebrate');
      e.stadium.crowd.cheer(1);
    } else {
      this.resultText = '未进！';
      AudioManager.play(this.side === 0 ? 'boo' : 'cheer', 0.7);
      if (this.side === 1 && this.keeper.side === 0) e.addXp(20, '点球扑救');
    }
    e.toast(`${this.e.teams[this.side].def.name} ${this.kicker.name}：${this.resultText}`, this.scored ? '#4ade80' : '#f87171');
  }

  hud() {
    const [h, a] = this.st.score();
    return {
      score: [h, a] as [number, number], kicks: [[...this.st.kicks[0]], [...this.st.kicks[1]]] as [boolean[], boolean[]],
      role: this.stage === 'aim' ? (this.side === 0 ? 'shoot' as const : 'save' as const) : 'wait' as const,
      aimZ: this.aimZ, aimY: this.aimY, charge: this.charge,
      hint: this.stage === 'result' ? this.resultText : this.side === 0 ? 'A/D 左右瞄准 · W/S 调整高度 · 按住空格蓄力，松开射门' : 'A/D 选择扑救方向（不按则守中路）· W 扑高球',
    };
  }
}
