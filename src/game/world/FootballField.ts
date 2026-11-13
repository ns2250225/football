import * as THREE from 'three';
import { FIELD } from '../../utils/physics';
import { StadiumDef } from '../types';
import { canvasTexture, noiseFill, shade } from './Textures';

const PX = 20; // 每米像素
const MARGIN = 4;

/** 方块草坪：条纹 + 完整标线（禁区、小禁区、点球点、中圈、角球弧） */
export function buildPitch(st: StadiumDef): THREE.Mesh {
  const W = (FIELD.L + MARGIN * 2) * PX, H = (FIELD.W + MARGIN * 2) * PX;
  const tex = canvasTexture('pitch_' + st.id, W, H, (ctx) => {
    const stripes = 14;
    const sw = W / stripes;
    for (let i = 0; i < stripes; i++) {
      ctx.save(); ctx.translate(i * sw, 0);
      noiseFill(ctx, Math.ceil(sw), H, i % 2 ? st.grassA : st.grassB, 0.07, 8, 13 + i);
      ctx.restore();
    }
    const X = (x: number) => (x + FIELD.L / 2 + MARGIN) * PX;
    const Z = (z: number) => (z + FIELD.W / 2 + MARGIN) * PX;
    ctx.strokeStyle = st.lineColor; ctx.fillStyle = st.lineColor; ctx.lineWidth = 0.14 * PX;
    ctx.strokeRect(X(-FIELD.L / 2), Z(-FIELD.W / 2), FIELD.L * PX, FIELD.W * PX);
    ctx.beginPath(); ctx.moveTo(X(0), Z(-FIELD.W / 2)); ctx.lineTo(X(0), Z(FIELD.W / 2)); ctx.stroke();
    ctx.beginPath(); ctx.arc(X(0), Z(0), FIELD.centerR * PX, 0, Math.PI * 2); ctx.stroke();
    ctx.beginPath(); ctx.arc(X(0), Z(0), 0.25 * PX, 0, Math.PI * 2); ctx.fill();
    for (const s of [-1, 1]) {
      const gx = s * FIELD.L / 2;
      const bx = s < 0 ? X(gx) : X(gx - FIELD.boxDepth);
      ctx.strokeRect(bx, Z(-FIELD.boxW / 2), FIELD.boxDepth * PX, FIELD.boxW * PX);
      const sbx = s < 0 ? X(gx) : X(gx - FIELD.smallBoxDepth);
      ctx.strokeRect(sbx, Z(-FIELD.smallBoxW / 2), FIELD.smallBoxDepth * PX, FIELD.smallBoxW * PX);
      ctx.beginPath(); ctx.arc(X(gx - s * FIELD.penSpot), Z(0), 0.22 * PX, 0, Math.PI * 2); ctx.fill();
      ctx.beginPath(); ctx.arc(X(gx - s * FIELD.penSpot), Z(0), 3.2 * PX, s < 0 ? -0.62 : Math.PI - 0.62, s < 0 ? 0.62 : Math.PI + 0.62); ctx.stroke();
      for (const sz of [-1, 1]) { ctx.beginPath(); ctx.arc(X(gx), Z(sz * FIELD.W / 2), 0.8 * PX, 0, Math.PI * 2); ctx.stroke(); }
    }
    // 边缘区域
    ctx.globalAlpha = 0.35; ctx.fillStyle = shade(st.grassB, 0.7);
    ctx.fillRect(0, 0, W, MARGIN * PX * 0.6); ctx.fillRect(0, H - MARGIN * PX * 0.6, W, MARGIN * PX * 0.6);
    ctx.globalAlpha = 1;
  });
  tex.minFilter = THREE.LinearMipmapLinearFilter;
  tex.anisotropy = 4;
  const geo = new THREE.PlaneGeometry(FIELD.L + MARGIN * 2, FIELD.W + MARGIN * 2).rotateX(-Math.PI / 2);
  const mesh = new THREE.Mesh(geo, new THREE.MeshLambertMaterial({ map: tex }));
  mesh.receiveShadow = true;
  return mesh;
}

/** 方块球门：门柱、横梁、球网 */
export function buildGoal(side: -1 | 1, gw: number, gh: number): THREE.Group {
  const g = new THREE.Group();
  const gd = FIELD.goalDepth;
  const postMat = new THREE.MeshLambertMaterial({ color: '#f8fafc' });
  const t = 0.24;
  const postGeo = new THREE.BoxGeometry(t, gh, t);
  for (const z of [-gw / 2, gw / 2]) {
    const p = new THREE.Mesh(postGeo, postMat); p.position.set(0, gh / 2, z); p.castShadow = true; g.add(p);
    const bp = new THREE.Mesh(new THREE.BoxGeometry(0.12, gh, 0.12), postMat); bp.position.set(side * gd, gh / 2, z); g.add(bp);
  }
  const bar = new THREE.Mesh(new THREE.BoxGeometry(t, t, gw + t), postMat); bar.position.set(0, gh, 0); bar.castShadow = true; g.add(bar);
  const backBar = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.12, gw), postMat); backBar.position.set(side * gd, gh, 0); g.add(backBar);
  for (const z of [-gw / 2, gw / 2]) { const tb = new THREE.Mesh(new THREE.BoxGeometry(gd, 0.1, 0.1), postMat); tb.position.set(side * gd / 2, gh, z); g.add(tb); }
  // 球网（网格线）
  const pts: number[] = [];
  const step = 0.4;
  for (let z = -gw / 2; z <= gw / 2 + 0.01; z += step) { pts.push(side * gd, 0, z, side * gd, gh, z); pts.push(0, gh, z, side * gd, gh, z); }
  for (let y = 0; y <= gh + 0.01; y += step) { pts.push(side * gd, y, -gw / 2, side * gd, y, gw / 2); }
  for (const z of [-gw / 2, gw / 2]) {
    for (let x = 0; x <= gd + 0.01; x += step) pts.push(side * x, 0, z, side * x, gh, z);
    for (let y = 0; y <= gh + 0.01; y += step) pts.push(0, y, z, side * gd, y, z);
  }
  for (let x = 0; x <= gd + 0.01; x += step) pts.push(side * x, gh, -gw / 2, side * x, gh, gw / 2);
  const ng = new THREE.BufferGeometry(); ng.setAttribute('position', new THREE.Float32BufferAttribute(pts, 3));
  g.add(new THREE.LineSegments(ng, new THREE.LineBasicMaterial({ color: '#e5e7eb', transparent: true, opacity: 0.55 })));
  g.position.x = side * FIELD.L / 2;
  return g;
}
