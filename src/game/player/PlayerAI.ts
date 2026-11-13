import * as THREE from 'three';
import type { GameEngine } from '../core/GameEngine';
import type { Player } from './Player';
import type { Ball } from '../football/Football';
import { FIELD } from '../../utils/physics';
import { clamp, pointSegDist } from '../../utils/math';
import { rand } from '../../utils/random';

const tmp = new THREE.Vector3();

/** 球员 AI：移动、传球、射门、抢断与跑位 */
export class PlayerAI {
  constructor(private e: GameEngine) {}

  private moveTo(p: Player, target: THREE.Vector3, urgency: number) {
    tmp.copy(target).sub(p.pos).setY(0);
    const d = tmp.length();
    if (d < 0.25) { p.desired.set(0, 0, 0); p.sprinting = false; return; }
    const sprint = urgency > 0.6 && d > 5 && p.stamina > p.staminaMax * 0.35;
    p.sprinting = sprint;
    const sp = p.spd * (sprint ? p.sprintMul : 1) * Math.min(1, d / 1.6);
    p.desired.copy(tmp.normalize().multiplyScalar(sp));
  }

  private interceptPoint(p: Player, b: Ball): THREE.Vector3 {
    const bs = b.speed();
    let t = 0;
    for (let i = 0; i < 6; i++) {
      const bp = b.pos.clone().addScaledVector(b.vel, t * Math.max(0.3, 1 - t * 0.35)).setY(0);
      t = bp.distanceTo(p.pos) / (p.spd * 1.2 + 0.1);
      if (t > 2) { t = 2; break; }
    }
    void bs;
    const out = b.pos.clone().addScaledVector(b.vel, t * Math.max(0.3, 1 - t * 0.35)).setY(0);
    out.x = clamp(out.x, -FIELD.L / 2, FIELD.L / 2); out.z = clamp(out.z, -FIELD.W / 2, FIELD.W / 2);
    return out;
  }

  update(p: Player, dt: number) {
    const e = this.e;
    if (!p.canAct || p.dashT > 0) { if (!p.dashT) p.desired.set(0, 0, 0); return; }
    if (e.phase === 'setpiece') {
      const sp = e.rules.sp;
      p.desired.set(0, 0, 0);
      if (sp && sp.taker === p) return;
      p.heading = Math.atan2(e.balls[0].pos.z - p.pos.z, e.balls[0].pos.x - p.pos.x);
      return;
    }
    const own = e.balls.find((b) => b.owner === p);
    if (own) { this.carrier(p, own, dt); return; }
    // 接球
    const incoming = e.balls.find((b) => !b.owner && b.passTo === p);
    if (incoming) { this.moveTo(p, this.interceptPoint(p, incoming), 0.9); return; }
    const chasers = e.teamAI.chasers[p.side];
    if (chasers.includes(p)) {
      const idx = chasers.indexOf(p);
      const b = idx >= 1 && e.balls.length > 1 && chasers.length > 2 && idx === chasers.length - 1 ? e.balls[1] : e.balls[0];
      if (b.owner && b.owner.side !== p.side) this.press(p, b.owner, dt, idx);
      else this.moveTo(p, this.interceptPoint(p, b), 0.85);
      return;
    }
    // 无球跑位 / 盯人
    const attacking = e.teamAI.attacking(p.team);
    let target = e.teamAI.formationTarget(p, e.balls[0].pos, attacking);
    if (!attacking && p.role === 'DF') {
      const ownGoal = new THREE.Vector3(e.ownGoalX(p.team), 0, 0);
      const threats = e.opponents(p).filter((o) => !o.sentOff && !o.isGK).sort((a, b) => a.pos.distanceTo(ownGoal) - b.pos.distanceTo(ownGoal));
      if (threats[0]) target = threats[0].pos.clone().lerp(ownGoal, 0.25).setY(0);
    }
    p.target.copy(target);
    this.moveTo(p, target, attacking && p.role === 'FW' ? 0.7 : 0.4);
  }

  private press(p: Player, carrier: Player, dt: number, idx: number) {
    const e = this.e;
    // 幻影分身迷惑
    if (p.confuseT > 0 && p.confusedBy) { p.confuseT -= dt; this.moveTo(p, p.confusedBy, 0.9); return; }
    const ownGoal = new THREE.Vector3(e.ownGoalX(p.team), 0, 0);
    const goalSide = carrier.pos.clone().add(ownGoal.clone().sub(carrier.pos).setY(0).normalize().multiplyScalar(idx === 0 ? 0.7 : 2.2));
    this.moveTo(p, idx === 0 ? carrier.pos.clone().lerp(goalSide, 0.5) : goalSide, 0.95);
    const d = p.pos.distanceTo(carrier.pos);
    const reach = 1.55 * (1 + p.mods.tackleRange);
    const aggr = (0.45 + p.team.def.profile.press * 0.4) * p.team.aiSkill;
    if (d < reach && p.tackleCd <= 0 && rand.chance(aggr * dt * 7)) e.tackle(p);
    else if (d < 2.6 && d > 1.4 && p.sprinting && p.tackleCd <= 0 && rand.chance(0.08 * dt * 7 * p.team.aiSkill)) e.tackle(p, true);
  }

  private carrier(p: Player, b: Ball, dt: number) {
    const e = this.e;
    p.aiT -= dt;
    const gx = e.oppGoalX(p.team);
    const goal = new THREE.Vector3(gx, 0, 0);
    const toGoal = goal.clone().sub(p.pos).setY(0);
    const dGoal = toGoal.length();
    const opps = e.opponents(p).filter((o) => !o.sentOff);
    let nearest: Player | null = null, nd = 99;
    for (const o of opps) { const d = o.pos.distanceTo(p.pos); if (d < nd && !o.isGK) { nd = d; nearest = o; } }
    // 队友请求传球
    if (p.side === 0 && e.requestPass && e.requestPass !== p && p.aiT <= 0) { p.aiT = 0.3; e.passes.pass(p, null, e.requestPass.pos.distanceTo(p.pos) > 15, { target: e.requestPass }); return; }
    if (p.aiT <= 0) {
      p.aiT = 0.16 + (1.1 - p.team.aiSkill) * 0.25 + rand.range(0, 0.1);
      const prof = p.team.def.profile;
      let blocked = false;
      for (const o of opps) if (!o.isGK && pointSegDist(o.pos.x, o.pos.z, p.pos.x, p.pos.z, gx, 0) < 1.1 && o.pos.distanceTo(goal) < dGoal) blocked = true;
      const range = 12.5 + prof.longShot * 6 + (p.shotPow - 1) * 8 + (p.role === 'FW' ? 1.5 : 0);
      const angleOk = Math.abs(p.pos.z) < 9 || dGoal < 9;
      if (dGoal < 6.5 && angleOk) { this.aiShoot(p, dGoal); return; }
      if (dGoal < range && angleOk && (!blocked || rand.chance(0.2)) && rand.chance(0.42 + p.team.aiSkill * 0.25)) { this.aiShoot(p, dGoal); return; }
      if (nd < 2.3 && rand.chance(0.5 + prof.possession * 0.4)) { if (e.passes.pass(p, toGoal.clone().normalize(), rand.chance(0.25))) return; }
      if (rand.chance(0.1 + prof.possession * 0.22)) {
        const t = e.passes.chooseTarget(p, null, false);
        if (t && Math.abs(gx - t.pos.x) < dGoal - 2) { e.passes.pass(p, null, t.pos.distanceTo(p.pos) > 16, { target: t }); return; }
      }
      // 盘带方向：朝球门推进并绕开防守者
      const dir = toGoal.clone().normalize();
      if (nearest && nd < 4.5) {
        const away = p.pos.clone().sub(nearest.pos).setY(0).normalize();
        const side = new THREE.Vector3(-dir.z, 0, dir.x);
        const s = side.dot(away) >= 0 ? 1 : -1;
        dir.addScaledVector(side, s * (1.3 - nd / 4.5)).normalize();
      }
      if (Math.abs(p.pos.z) > FIELD.W / 2 - 2.5) dir.z -= Math.sign(p.pos.z) * 0.8;
      p.target.copy(p.pos).addScaledVector(dir.normalize(), 4);
    }
    const free = nd > 3.5;
    tmp.copy(p.target).sub(p.pos).setY(0);
    if (tmp.lengthSq() < 0.1) tmp.copy(toGoal);
    tmp.normalize();
    p.sprinting = free && p.stamina > p.staminaMax * 0.4 && rand.chance(0.98);
    p.desired.copy(tmp).multiplyScalar(p.spd * (p.sprinting ? p.sprintMul * 0.92 : 0.95));
  }

  private aiShoot(p: Player, dGoal: number) {
    const e = this.e;
    const charge = clamp(0.35 + dGoal / 24 + rand.range(-0.1, 0.1), 0.35, 0.92);
    e.shots.shoot(p, charge, { z: null, high: rand.range(0, 0.6) });
  }
}
