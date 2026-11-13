import * as THREE from 'three';
import type { GameEngine } from '../core/GameEngine';
import type { Ball } from './Football';
import type { Player } from '../player/Player';
import { PHYS, FIELD } from '../../utils/physics';
import { AudioManager } from '../audio/AudioManager';

const tmp = new THREE.Vector3();
const tmp2 = new THREE.Vector3();

/** 球柱碰撞（竖直门柱） */
function collideVerticalPost(b: Ball, px: number, pz: number, h: number, r: number): boolean {
  if (b.pos.y > h + b.r) return false;
  const dx = b.pos.x - px, dz = b.pos.z - pz;
  const d = Math.hypot(dx, dz);
  const min = b.r + r;
  if (d >= min || d === 0) return false;
  const nx = dx / d, nz = dz / d;
  b.pos.x = px + nx * min; b.pos.z = pz + nz * min;
  const vn = b.vel.x * nx + b.vel.z * nz;
  if (vn < 0) { b.vel.x -= 1.7 * vn * nx; b.vel.z -= 1.7 * vn * nz; }
  return true;
}
/** 横梁碰撞（沿 z 方向的水平圆柱） */
function collideCrossbar(b: Ball, px: number, py: number, halfW: number, r: number): boolean {
  if (Math.abs(b.pos.z) > halfW) return false;
  const dx = b.pos.x - px, dy = b.pos.y - py;
  const d = Math.hypot(dx, dy);
  const min = b.r + r;
  if (d >= min || d === 0) return false;
  const nx = dx / d, ny = dy / d;
  b.pos.x = px + nx * min; b.pos.y = py + ny * min;
  const vn = b.vel.x * nx + b.vel.y * ny;
  if (vn < 0) { b.vel.x -= 1.7 * vn * nx; b.vel.y -= 1.7 * vn * ny; }
  return true;
}

/** 足球物理：重力、空气阻力、马格努斯旋转弧线、地面摩擦、弹跳、门柱、球网、看台挡板 */
export function stepBall(e: GameEngine, b: Ball, dt: number) {
  const p = e.params;
  const inAir = b.pos.y > b.r + 0.03;
  let g = PHYS.GRAVITY * p.gravity;
  if (b.floatT > 0) {
    b.floatT -= dt;
    g *= 0.04;
    if (b.pos.y < 1.3) b.vel.y += 6 * dt;
    b.vel.y *= 1 - 2 * dt;
  }
  b.vel.y += g * dt;
  if (inAir) {
    const drag = Math.max(0, 1 - PHYS.AIR_DRAG * dt);
    b.vel.multiplyScalar(drag);
    // 马格努斯效应：旋转产生弧线
    tmp.copy(b.spin).cross(b.vel).multiplyScalar(PHYS.MAGNUS * dt);
    b.vel.add(tmp);
    if (p.wind > 0) b.vel.addScaledVector(e.windVec, dt * 0.45);
  }
  b.spin.multiplyScalar(Math.max(0, 1 - PHYS.SPIN_DECAY * dt * (inAir ? 0.6 : 2)));
  // 引力吸球
  if (b.pullT > 0 && b.pullTo && !b.owner) {
    b.pullT -= dt;
    tmp.copy(b.pullTo.pos).sub(b.pos).setY(0);
    const d = tmp.length();
    if (d > 0.6) { tmp.normalize(); b.vel.x += tmp.x * b.pullPow * dt; b.vel.z += tmp.z * b.pullPow * dt; const sp = b.speed(); if (sp > 16) { b.vel.x *= 16 / sp; b.vel.z *= 16 / sp; } }
    if (b.pos.y > 0.6) b.vel.y -= 4 * dt;
  }
  // 磁力传球：自动修正到目标队友
  if (b.magnet && !b.owner) {
    tmp.copy(b.magnet.pos).sub(b.pos).setY(0);
    const d = tmp.length();
    if (d > 0.4) {
      const sp = Math.max(10, b.speed());
      tmp.normalize().multiplyScalar(sp);
      b.vel.x += (tmp.x - b.vel.x) * Math.min(1, 6 * dt);
      b.vel.z += (tmp.z - b.vel.z) * Math.min(1, 6 * dt);
    }
  }
  b.pos.addScaledVector(b.vel, dt);
  // 地面
  if (b.pos.y < b.r) {
    b.pos.y = b.r;
    if (b.vel.y < -1.6) {
      b.vel.y = -b.vel.y * PHYS.BOUNCE * p.bounce;
      b.vel.x *= 0.9; b.vel.z *= 0.9;
      if (b.shot && !b.shot.bounced) e.shots.onBounce(b);
    } else b.vel.y = 0;
    const f = PHYS.ROLL_FRICTION * p.friction;
    const sp = b.speed();
    if (sp > 0) {
      const ns = Math.max(0, sp - (f * 0.9 + sp * f * 0.35) * dt);
      b.vel.x *= ns / sp; b.vel.z *= ns / sp;
    }
  }
  // 门柱 / 横梁 / 球网
  const gw = e.goalW / 2, gh = e.goalH;
  for (const side of [-1, 1]) {
    const gx = side * FIELD.L / 2;
    const guard = e.postGuard[side < 0 ? 0 : 1] > 0 ? 3.5 : 1;
    let hit = false;
    hit = collideVerticalPost(b, gx, -gw, gh, PHYS.POST_RADIUS * guard) || hit;
    hit = collideVerticalPost(b, gx, gw, gh, PHYS.POST_RADIUS * guard) || hit;
    hit = collideCrossbar(b, gx, gh, gw, PHYS.POST_RADIUS * (guard > 1 ? 1.8 : 1)) || hit;
    if (hit && b.speed() > 4) {
      AudioManager.play('post');
      e.fx.ring(b.pos, '#ffffff', 0.2, 1, 0.3, b.pos.y);
      if (b.shot) e.shots.onImpact(b, 'post');
      if (guard > 1) { b.vel.x = -side * Math.abs(b.vel.x) * 0.6; }
    }
    // 球网：进入球门后被网兜住
    const inside = side > 0 ? b.pos.x > gx : b.pos.x < gx;
    if (inside && Math.abs(b.pos.z) < gw + 0.05 && b.pos.y < gh + 0.05) {
      const back = gx + side * FIELD.goalDepth;
      if ((side > 0 && b.pos.x > back - b.r) || (side < 0 && b.pos.x < back + b.r)) { b.pos.x = back - side * b.r; b.vel.x *= -0.15; b.vel.z *= 0.5; b.vel.y *= 0.5; }
      if (Math.abs(b.pos.z) > gw - b.r) { b.pos.z = Math.sign(b.pos.z) * (gw - b.r); b.vel.z *= -0.2; }
      if (b.pos.y > gh - b.r) { b.pos.y = gh - b.r; b.vel.y *= -0.2; }
    } else if (inside && Math.abs(b.pos.z) < gw + b.r && b.pos.y < gh) {
      // 外侧网
      const outSide = Math.abs(b.pos.z) > gw;
      if (outSide && Math.abs(b.pos.x - gx) < FIELD.goalDepth) { b.pos.z = Math.sign(b.pos.z) * (gw + b.r); b.vel.z *= -0.25; }
    }
  }
  // 场地挡板（防止足球飞出体育场）
  const bx = FIELD.L / 2 + 3.4, bz = FIELD.W / 2 + 1.7;
  if (Math.abs(b.pos.x) > bx) { b.pos.x = Math.sign(b.pos.x) * bx; b.vel.x *= -0.4; }
  if (Math.abs(b.pos.z) > bz && b.pos.y < 1) { b.pos.z = Math.sign(b.pos.z) * bz; b.vel.z *= -0.4; }
  if (b.pos.y > 30) { b.pos.y = 30; b.vel.y = -Math.abs(b.vel.y); }
  // 速度上限
  const v = b.vel.length();
  if (v > 55) b.vel.multiplyScalar(55 / v);
}

/** 足球与球员身体碰撞：足球不能穿过球员 */
export function ballVsPlayers(e: GameEngine, b: Ball) {
  for (const p of e.players) {
    if (p.sentOff || p === b.owner) continue;
    if (b.owner && b.owner.side === p.side) continue;
    if (p.flying) continue;
    const r = p.radius + b.r;
    const dx = b.pos.x - p.pos.x, dz = b.pos.z - p.pos.z;
    const d2 = dx * dx + dz * dz;
    if (d2 > r * r) continue;
    const top = p.pos.y + p.jumpY + p.height;
    if (b.pos.y - b.r > top || b.pos.y + b.r < p.jumpY) continue;
    if (e.phase !== 'play' && e.phase !== 'setpiece' && e.phase !== 'penalties') continue;
    if (p.touchCd > 0 && b.lastTouch === p) continue;
    // 门将与射门接触：交由门将扑救判定（扑救失败则视为足球擦过门将指尖）
    if (p.isGK && b.shot && b.shot.side !== p.side) {
      if (!p.gkSaveRolled.has(b.shot)) e.gkContact(p, b, false);
      continue;
    }
    const d = Math.sqrt(d2) || 0.001;
    const nx = dx / d, nz = dz / d;
    const rvx = b.vel.x - p.vel.x, rvz = b.vel.z - p.vel.z;
    const vn = rvx * nx + rvz * nz;
    // 护盾阻挡强力射门
    if (p.shieldT > 0 && p.shieldHits > 0 && b.shot && b.shot.side !== p.side && b.speed() > 16) {
      p.shieldHits--; if (p.shieldHits <= 0) p.shieldT = 0;
      b.vel.multiplyScalar(0.1);
      e.fx.ring(p.pos, '#38bdf8', 0.3, 1.8, 0.4, 1);
      AudioManager.play('shield');
    }
    b.pos.x = p.pos.x + nx * r; b.pos.z = p.pos.z + nz * r;
    if (vn < 0) {
      const rest = 0.35;
      b.vel.x -= (1 + rest) * vn * nx; b.vel.z -= (1 + rest) * vn * nz;
      b.vel.y *= 0.6;
      if (Math.abs(vn) > 6) {
        AudioManager.play('kick', 0.5);
        if (b.shot && b.shot.side !== p.side) { e.shots.onImpact(b, 'player', p); e.onBlock(p, b); }
      }
    }
    if (!b.owner) b.touch(p, e.simT);
    if (b.shot && b.shot.by !== p) b.shot = b.shot.side === p.side ? b.shot : null;
    b.passTo = null; b.magnet = null;
  }
  // 影子防守分身与壁垒
  for (const c of e.clones) {
    if (c.mode !== 'defense') continue;
    const r = 0.5 + b.r;
    tmp.set(b.pos.x - c.pos.x, 0, b.pos.z - c.pos.z);
    const d = tmp.length();
    if (d < r && b.pos.y < 2) {
      tmp.normalize();
      b.pos.x = c.pos.x + tmp.x * r; b.pos.z = c.pos.z + tmp.z * r;
      const vn = b.vel.x * tmp.x + b.vel.z * tmp.z;
      if (vn < 0) { b.vel.x -= 1.3 * vn * tmp.x; b.vel.z -= 1.3 * vn * tmp.z; }
      if (b.shot && b.shot.side !== c.side) b.shot = null;
    }
  }
  for (const bar of e.barriers) {
    if (bar.hits <= 0) continue;
    const gx = e.ownGoalX(e.teams[bar.side]);
    const bxp = gx - Math.sign(gx) * 0.6;
    if (Math.abs(b.pos.z) < e.goalW / 2 + 0.3 && b.pos.y < e.goalH + 0.3) {
      const crossed = Math.sign(gx) > 0 ? b.pos.x > bxp : b.pos.x < bxp;
      if (crossed && b.vel.x * Math.sign(gx) > 0) {
        b.pos.x = bxp; b.vel.x = -b.vel.x * 0.4; b.shot = null;
        bar.hits--; if (bar.hits <= 0) bar.handle.remove();
        e.fx.flash(b.pos, '#38bdf8', 2, 0.4); AudioManager.play('shield');
        e.toast('永恒壁垒挡下射门！', '#38bdf8');
      }
    }
  }
}

/** 球员之间的身体碰撞与对抗 */
export function playersCollide(e: GameEngine) {
  const ps = e.players;
  for (let i = 0; i < ps.length; i++) {
    const a = ps[i]; if (a.sentOff || a.flying) continue;
    for (let j = i + 1; j < ps.length; j++) {
      const b = ps[j]; if (b.sentOff || b.flying) continue;
      const r = a.radius + b.radius;
      const dx = b.pos.x - a.pos.x, dz = b.pos.z - a.pos.z;
      const d2 = dx * dx + dz * dz;
      if (d2 >= r * r || d2 === 0) continue;
      const d = Math.sqrt(d2); const nx = dx / d, nz = dz / d;
      const overlap = r - d;
      // 身体对抗：更强壮（或巨大化）的一方推开对手
      const wa = a.bod * a.scale * a.scale + (a.sprinting ? 0.3 : 0), wb = b.bod * b.scale * b.scale + (b.sprinting ? 0.3 : 0);
      const ka = wb / (wa + wb), kb = wa / (wa + wb);
      a.pos.x -= nx * overlap * ka; a.pos.z -= nz * overlap * ka;
      b.pos.x += nx * overlap * kb; b.pos.z += nz * overlap * kb;
      if (a.side !== b.side) e.onBodyContact(a, b, wa, wb);
    }
    // 分身阻挡
    for (const c of e.clones) {
      if (c.side === a.side) continue;
      tmp2.set(a.pos.x - c.pos.x, 0, a.pos.z - c.pos.z);
      const d = tmp2.length();
      if (d < 0.9 && d > 0) { tmp2.normalize(); a.pos.addScaledVector(tmp2, 0.9 - d); a.vel.multiplyScalar(0.85); }
    }
  }
}
