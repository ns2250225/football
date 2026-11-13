import * as THREE from 'three';
import type { GameEngine } from '../core/GameEngine';
import type { Player } from './Player';
import type { Ball } from '../football/Football';
import { FIELD, PHYS } from '../../utils/physics';
import { clamp } from '../../utils/math';
import { rand } from '../../utils/random';

const tmp = new THREE.Vector3();

/** 门将 AI：预判射门轨迹、扑救、出击、接球与球门球分发 */
export class GoalkeeperAI {
  holdT = new Map<number, number>();
  constructor(private e: GameEngine) {}

  /** 预测足球到达门线平面的位置 */
  predict(b: Ball, planeX: number): { t: number; z: number; y: number } | null {
    const p = b.pos.clone(), v = b.vel.clone();
    const g = PHYS.GRAVITY * this.e.params.gravity;
    const dt = 1 / 60;
    for (let t = 0; t < 1.6; t += dt) {
      v.y += g * dt; v.multiplyScalar(1 - PHYS.AIR_DRAG * dt);
      const prev = p.x;
      p.addScaledVector(v, dt);
      if (p.y < b.r) { p.y = b.r; v.y = Math.abs(v.y) * 0.5; }
      if ((prev - planeX) * (p.x - planeX) <= 0) return { t, z: p.z, y: p.y };
    }
    return null;
  }

  update(gk: Player, dt: number) {
    const e = this.e;
    if (gk.sentOff || gk.ctrl) return;
    if (!gk.canAct && gk.state !== 'dive') { gk.desired.set(0, 0, 0); return; }
    const gx = e.ownGoalX(gk.team);
    const d = Math.sign(gx);
    if (e.phase === 'setpiece') {
      const sp = e.rules.sp;
      if (sp && sp.taker === gk) { gk.desired.set(0, 0, 0); return; }
    }
    const own = e.balls.find((b) => b.owner === gk);
    if (own) { if (e.phase === 'play') this.distribute(gk, own, dt); else gk.desired.set(0, 0, 0); return; }
    if (gk.state === 'dive') return;
    // 找到最具威胁的足球
    let ball = e.balls[0];
    if (e.balls.length > 1) ball = e.balls.reduce((a, b) => (Math.abs(b.pos.x - gx) < Math.abs(a.pos.x - gx) ? b : a));
    const planeX = gx - d * 0.9;
    const towards = ball.vel.x * d > 3;
    const threat = towards && !ball.owner ? this.predict(ball, planeX) : null;
    const halfW = e.goalW / 2;
    const react = 0.24 * (1 - clamp(gk.mods.gkReact, 0, 0.9)) + (ball.shot?.gkDelay ?? 0) + (1 - gk.team.aiSkill) * 0.08;
    const invincible = gk.team.gkInvT > 0;
    if (threat && Math.abs(threat.z) < halfW + 0.6 && threat.y < e.goalH + 0.6) {
      gk.gkReactT += dt;
      if (gk.gkReactT < (invincible ? 0 : react)) { gk.desired.multiplyScalar(0.5); return; }
      const target = new THREE.Vector3(planeX, 0, clamp(threat.z, -halfW, halfW));
      tmp.copy(target).sub(gk.pos).setY(0);
      const dist = tmp.length();
      const runReach = gk.spd * 1.1 * threat.t;
      const reachMul = 1 + gk.mods.gkSave * 0.15 + (invincible ? 1 : 0) + e.boss.gkReach(gk);
      if (dist > runReach + 0.4 && dist < (2.6 + threat.y * 0.2) * reachMul + runReach && threat.t < 0.7) {
        // 飞身扑救
        gk.setState('dive', 0.75);
        gk.diveDir = Math.sign((target.z - gk.pos.z) * d) || 1;
        gk.playAnim('GoalkeeperDive');
        gk.vel.copy(tmp.normalize().multiplyScalar(Math.min(10 * reachMul, dist / Math.max(0.15, threat.t))));
        gk.jumpV = clamp(threat.y * 3, 0, 6);
      } else {
        const sp = Math.min(gk.spd * 1.25, dist / Math.max(0.08, threat.t - 0.05));
        gk.desired.copy(tmp.normalize().multiplyScalar(sp));
        if (threat.y > 1.6 && threat.t < 0.35 && gk.jumpY === 0) gk.jumpV = 4;
      }
      this.tryContact(gk, ball);
      return;
    }
    gk.gkReactT = 0;
    // 出击：持球对手进入禁区且距离很近，或无人控制的球落入禁区
    const inBox = e.rules.inBox(ball.pos.x, ball.pos.z, gx);
    if (inBox && !ball.owner && ball.speed() < 9 && ball.pos.y < 1.8) {
      const closestOpp = Math.min(...e.opponents(gk).filter((o) => !o.sentOff).map((o) => o.pos.distanceTo(ball.pos)));
      if (closestOpp > ball.pos.distanceTo(gk.pos) * 0.7) { this.go(gk, ball.pos, gk.spd * 1.25); this.tryCatchLoose(gk, ball); return; }
    }
    if (ball.owner && ball.owner.side !== gk.side && inBox && ball.owner.pos.distanceTo(gk.pos) < 5.5 && gk.team.aiSkill > 0.4) {
      this.go(gk, ball.owner.pos, gk.spd * 1.2);
      if (ball.owner.pos.distanceTo(gk.pos) < 1.4 && gk.tackleCd <= 0 && rand.chance(dt * 4)) e.tackle(gk);
      return;
    }
    // 站位：球与球门中心连线上
    const goalC = new THREE.Vector3(gx, 0, 0);
    const toBall = ball.pos.clone().setY(0).sub(goalC);
    const db = toBall.length();
    const depth = clamp(0.8 + (30 - db) * 0.06, 0.8, 2.6);
    const pos = goalC.clone().add(toBall.normalize().multiplyScalar(depth));
    pos.x = gx - d * Math.max(0.6, Math.abs(pos.x - gx));
    pos.z = clamp(pos.z, -halfW * 0.85, halfW * 0.85);
    this.go(gk, pos, gk.spd);
    this.tryContact(gk, ball);
  }

  private go(gk: Player, target: THREE.Vector3, sp: number) {
    tmp.copy(target).sub(gk.pos).setY(0);
    const d = tmp.length();
    if (d < 0.15) { gk.desired.set(0, 0, 0); return; }
    gk.desired.copy(tmp.normalize().multiplyScalar(sp * Math.min(1, d / 1.2)));
    gk.heading = Math.atan2(-Math.sign(this.e.ownGoalX(gk.team)) * 0 + (this.e.balls[0].pos.z - gk.pos.z), this.e.balls[0].pos.x - gk.pos.x);
  }

  /** 手部接触检测：扑救判定 */
  tryContact(gk: Player, b: Ball) {
    if (!b.shot || b.shot.side === gk.side || gk.gkSaveRolled.has(b.shot)) return;
    const hands = gk.pos.clone(); hands.y = gk.jumpY + (gk.state === 'dive' ? 0.7 : 1.2);
    const reach = (gk.state === 'dive' ? 1.25 : 0.95) * gk.scale * (1 + this.e.boss.gkReach(gk));
    const dx = b.pos.x - hands.x, dz = b.pos.z - hands.z;
    const horiz = Math.hypot(dx, dz);
    if (horiz < reach && b.pos.y < hands.y + 1.3 && b.pos.y > hands.y - 1.4) this.e.gkContact(gk, b, true);
  }

  private tryCatchLoose(gk: Player, b: Ball) {
    if (b.owner || gk.touchCd > 0) return;
    if (b.pos.distanceTo(gk.pos.clone().setY(b.pos.y)) < 1.1 && b.pos.y < 2.2) {
      b.owner = gk; b.vel.set(0, 0, 0); b.shot = null; b.touch(gk, this.e.simT); b.passTo = null;
      gk.playAnim('GoalkeeperCatch');
      this.holdT.set(gk.id, 0);
      this.e.bus.emit('possession', { p: gk, ball: b });
    }
  }

  private distribute(gk: Player, b: Ball, dt: number) {
    const e = this.e;
    gk.desired.set(0, 0, 0);
    b.pos.set(gk.pos.x + Math.cos(gk.heading) * 0.5, 1.1, gk.pos.z + Math.sin(gk.heading) * 0.5);
    b.vel.set(0, 0, 0);
    const t = (this.holdT.get(gk.id) ?? 0) + dt;
    this.holdT.set(gk.id, t);
    if (gk.side === 0 && e.requestPass && t > 0.4) { e.passes.pass(gk, null, e.requestPass.pos.distanceTo(gk.pos) > 14, { target: e.requestPass }); this.holdT.set(gk.id, 0); return; }
    if (t > 1.1) {
      const long = rand.chance(0.45);
      e.passes.pass(gk, new THREE.Vector3(-Math.sign(e.ownGoalX(gk.team)), 0, rand.range(-0.6, 0.6)), long);
      this.holdT.set(gk.id, 0);
    }
    void FIELD;
  }
}
