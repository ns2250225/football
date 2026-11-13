import * as THREE from 'three';
import type { GameEngine } from '../core/GameEngine';
import type { Player } from './Player';
import type { Input } from '../core/Input';

/** 玩家操控：WASD/摇杆移动、Shift 冲刺、空格蓄力射门、J 短传、K 长传、L 抢断、Q 切换、E 技能、R 大招 */
export class PlayerController {
  charge = 0;
  charging = false;
  constructor(private e: GameEngine, private input: Input) {}

  moveDir(): THREE.Vector3 {
    const m = this.input.move();
    return new THREE.Vector3(m.x, 0, m.z);
  }

  update(dt: number) {
    const e = this.e, inp = this.input;
    const p = e.controlled;
    if (!p) return;
    // 全局按键
    if (inp.consume('pause')) e.requestPause();
    if (inp.consume('tactic')) e.requestTactic();
    if (e.phase === 'penalties') { e.penalties.handleInput(dt, inp); return; }
    if (inp.consume('ult')) e.ult.cast();
    if (inp.consume('skill')) e.skills.castSelected();
    if (inp.consume('cycle')) e.skills.cycle();
    (['skill1', 'skill2', 'skill3', 'skill4'] as const).forEach((k, i) => { if (inp.consume(k)) e.skills.cast(i); });
    if (inp.consume('switch')) e.switchNearest();

    const mv = this.moveDir();
    const has = e.balls.some((b) => b.owner === p);
    // 定位球
    if (e.phase === 'setpiece' && e.rules.sp && e.rules.sp.taker === p) {
      p.desired.set(0, 0, 0);
      if (mv.lengthSq() > 0.01) p.heading = Math.atan2(mv.z, mv.x);
      if (inp.consume('pass')) e.rules.take('pass', mv.lengthSq() > 0.01 ? mv : null);
      else if (inp.consume('long')) e.rules.take('long', mv.lengthSq() > 0.01 ? mv : null);
      else if (e.rules.canShoot()) {
        if (inp.isDown('shoot')) { this.charging = true; this.charge = Math.min(1, this.charge + dt / 0.9); }
        if (inp.consumeRelease('shoot') && this.charging) { e.rules.take('shoot', null, Math.max(0.35, this.charge), mv.z !== 0 ? mv.z : null); this.charging = false; this.charge = 0; }
      }
      inp.consume('shoot');
      return;
    }
    if (e.phase !== 'play' && e.phase !== 'setpiece') { p.desired.set(0, 0, 0); this.charging = false; this.charge = 0; return; }
    if (!p.canAct || p.dashT > 0) { if (!p.dashT) p.desired.set(0, 0, 0); this.charging = false; return; }
    // 移动
    const sprint = inp.isDown('sprint') && p.stamina > 4;
    p.sprinting = sprint && mv.lengthSq() > 0.01;
    p.desired.copy(mv).multiplyScalar(p.spd * (p.sprinting ? p.sprintMul : 1));
    // 射门（按住蓄力，松开射出）
    if (inp.isDown('shoot')) {
      if (!this.charging) { this.charging = true; this.charge = 0; }
      this.charge = Math.min(1, this.charge + dt / 0.9);
      p.desired.multiplyScalar(0.75);
    }
    if (this.charging && !inp.isDown('shoot')) {
      const c = Math.max(0.3, this.charge);
      this.charging = false; this.charge = 0;
      const nearAir = e.balls.find((b) => !b.owner && b.pos.y > 1.0 && b.pos.distanceTo(p.pos.clone().setY(b.pos.y)) < 1.6 && b.pos.y < p.height + p.jumpY + 0.8);
      if (has) e.shots.shoot(p, c, { z: Math.abs(mv.z) > 0.2 ? mv.z : null, high: mv.z < -0.5 ? 0.6 : 0.3 });
      else if (nearAir) { e.shots.shoot(p, c, { z: mv.z || null, high: 0.3 }, [], { header: nearAir.pos.y > 1.3 }); if (nearAir.pos.y > 1.3) e.bus.emit('header', { p }); }
      else { const loose = e.balls.find((b) => !b.owner && b.pos.distanceTo(p.pos.clone().setY(b.pos.y)) < 1.3); if (loose) e.shots.shoot(p, c, { z: mv.z || null, high: 0.3 }); }
    }
    inp.consumeRelease('shoot');
    // 传球
    if (inp.consume('pass')) { if (has) e.passes.pass(p, mv.lengthSq() > 0.01 ? mv : null, false); else e.callForPass(p); }
    if (inp.consume('long')) { if (has) e.passes.pass(p, mv.lengthSq() > 0.01 ? mv : null, true); else e.callForPass(p); }
    // 抢断 / 铲球
    if (inp.consume('tackle')) e.tackle(p, p.sprinting);
    inp.consume('shoot');
  }
}
