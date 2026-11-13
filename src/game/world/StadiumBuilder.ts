import * as THREE from 'three';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import { FIELD } from '../../utils/physics';
import { StadiumDef } from '../types';
import { blockTexture, shade, textTexture } from './Textures';
import { RNG, hashStr } from '../../utils/random';

/** 静态方块批处理：合并为一个网格，减少 draw call */
export class BoxBatch {
  private geos: THREE.BufferGeometry[] = [];
  private col = new THREE.Color();
  add(x: number, y: number, z: number, w: number, h: number, d: number, color: string, jitter = 0.06, rnd?: RNG) {
    const g = new THREE.BoxGeometry(w, h, d);
    g.translate(x, y, z);
    const n = g.getAttribute('position').count;
    const cols = new Float32Array(n * 3);
    this.col.set(color);
    const f = 1 + ((rnd ? rnd.next() : Math.random()) - 0.5) * jitter * 2;
    for (let i = 0; i < n; i++) {
      // 顶面略亮，底面略暗，增加方块立体感
      const ny = g.getAttribute('normal').getY(i);
      const k = f * (ny > 0.5 ? 1.08 : ny < -0.5 ? 0.7 : 0.92);
      cols[i * 3] = Math.min(1, this.col.r * k); cols[i * 3 + 1] = Math.min(1, this.col.g * k); cols[i * 3 + 2] = Math.min(1, this.col.b * k);
    }
    g.setAttribute('color', new THREE.BufferAttribute(cols, 3));
    g.deleteAttribute('uv');
    this.geos.push(g);
  }
  build(emissive = false): THREE.Mesh | null {
    if (!this.geos.length) return null;
    const merged = mergeGeometries(this.geos, false);
    this.geos.forEach((g) => g.dispose());
    this.geos = [];
    const mat = emissive ? new THREE.MeshBasicMaterial({ vertexColors: true }) : new THREE.MeshLambertMaterial({ vertexColors: true });
    const m = new THREE.Mesh(merged!, mat);
    m.receiveShadow = !emissive;
    return m;
  }
}

export interface StadiumBuild {
  group: THREE.Group;
  crowdSeats: { x: number; y: number; z: number; facing: number }[];
  towerTops: THREE.Vector3[];
  volcanoTop?: THREE.Vector3;
  animated: { obj: THREE.Object3D; kind: string; base: number }[];
}

const SPONSORS = ['BLOCK CUP', 'ROGUE FC', 'PIXEL GOAL', 'CUBE SPORT', 'MINE BALL', 'CRAFT 26', 'VOXEL TV', 'GG ARENA'];

function tree(b: BoxBatch, x: number, z: number, h: number, leaf: string, trunk: string, rnd: RNG) {
  b.add(x, h / 2, z, 0.8, h, 0.8, trunk, 0.05, rnd);
  for (let i = 0; i < 4; i++) {
    const s = 3 - i * 0.6;
    b.add(x + rnd.range(-0.3, 0.3), h + i * 0.9, z + rnd.range(-0.3, 0.3), s, 1, s, leaf, 0.12, rnd);
  }
}
function lodTree(group: THREE.Group, x: number, z: number, h: number, leaf: string, trunk: string, rnd: RNG) {
  // LOD：近处细节树，远处简化方块
  const hi = new BoxBatch(); tree(hi, 0, 0, h, leaf, trunk, rnd);
  const lo = new BoxBatch(); lo.add(0, h / 2, 0, 0.8, h, 0.8, trunk); lo.add(0, h + 1.2, 0, 2.6, 3, 2.6, leaf);
  const lod = new THREE.LOD();
  const mh = hi.build(); const ml = lo.build();
  if (mh) lod.addLevel(mh, 0);
  if (ml) lod.addLevel(ml, 70);
  lod.position.set(x, 0, z);
  group.add(lod);
}
function stepped(b: BoxBatch, x: number, z: number, base: number, levels: number, stepH: number, colors: string[], rnd: RNG, y0 = 0, invert = false) {
  for (let i = 0; i < levels; i++) {
    const s = base * (1 - i / levels);
    const y = invert ? y0 - i * stepH - stepH / 2 : y0 + i * stepH + stepH / 2;
    b.add(x, y, z, s, stepH, s, colors[Math.min(colors.length - 1, Math.floor((i / levels) * colors.length))], 0.08, rnd);
  }
}

/** 根据主题建造完整方块体育场 */
export function buildStadium(st: StadiumDef, quality: 'low' | 'medium' | 'high'): StadiumBuild {
  const rnd = new RNG(hashStr(st.id));
  const group = new THREE.Group();
  const seats: StadiumBuild['crowdSeats'] = [];
  const towers: THREE.Vector3[] = [];
  const animated: StadiumBuild['animated'] = [];
  const L = FIELD.L, W = FIELD.W;
  const sky = st.props === 'sky';

  // 地面
  if (!sky) {
    const ground = new THREE.Mesh(new THREE.PlaneGeometry(400, 400).rotateX(-Math.PI / 2), new THREE.MeshLambertMaterial({ map: blockTexture(st.ground, st.id + 'g') }));
    (ground.material as THREE.MeshLambertMaterial).map!.wrapS = (ground.material as THREE.MeshLambertMaterial).map!.wrapT = THREE.RepeatWrapping;
    (ground.material as THREE.MeshLambertMaterial).map!.repeat.set(100, 100);
    ground.position.y = -0.02; ground.receiveShadow = true;
    group.add(ground);
  } else {
    // 浮岛：球场位于悬浮岛屿之上
    const isl = new BoxBatch();
    isl.add(0, -1.5, 0, L + 30, 3, W + 30, '#5b8c3a', 0.02, rnd);
    stepped(isl, 0, 0, L + 26, 7, 2.2, ['#7a5a3a', '#6b4f2a', '#5c4328', '#4a3520'], rnd, -3, true);
    const m = isl.build(); if (m) group.add(m);
  }

  // 看台
  const stands = new BoxBatch();
  const tiers = quality === 'low' ? 5 : 8;
  const standCol = st.standColor, accent = st.standAccent;
  for (let t = 0; t < tiers; t++) {
    const y = t * 0.9 + 0.45;
    const off = 4 + t * 1.1;
    const col = t % 3 === 2 ? accent : shade(standCol, 1 - t * 0.03);
    stands.add(0, y, -(W / 2 + off), L + 12 + t * 2.2, 0.9 + t * 0.9 * 0 + 0.9, 1.1, col, 0.04, rnd);
    stands.add(0, y, W / 2 + off, L + 12 + t * 2.2, 1.8, 1.1, col, 0.04, rnd);
    if (t < tiers - 1) {
      stands.add(-(L / 2 + off + 1), y, 0, 1.1, 1.8, W + 6 + t * 2.2, col, 0.04, rnd);
      stands.add(L / 2 + off + 1, y, 0, 1.1, 1.8, W + 6 + t * 2.2, col, 0.04, rnd);
    }
    const step = 0.85;
    for (let x = -(L / 2 + 5); x <= L / 2 + 5; x += step) {
      seats.push({ x, y: y + 1.2, z: -(W / 2 + off), facing: 0 });
      seats.push({ x, y: y + 1.2, z: W / 2 + off, facing: Math.PI });
    }
    if (t < tiers - 1) for (let z = -(W / 2 + 1); z <= W / 2 + 1; z += step) {
      seats.push({ x: -(L / 2 + off + 1), y: y + 1.2, z, facing: Math.PI / 2 });
      seats.push({ x: L / 2 + off + 1, y: y + 1.2, z, facing: -Math.PI / 2 });
    }
  }
  // 顶棚
  const roofY = tiers * 0.9 + 4;
  stands.add(0, roofY, -(W / 2 + 4 + tiers * 0.6), L + 20, 0.4, tiers * 1.4, shade(accent, 0.8), 0.02, rnd);
  stands.add(0, roofY, W / 2 + 4 + tiers * 0.6 + 2, L + 20, 0.4, tiers * 0.8, shade(accent, 0.8), 0.02, rnd);
  // 灯光塔
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) {
    const x = sx * (L / 2 + 8), z = sz * (W / 2 + 9);
    stands.add(x, 11, z, 0.9, 22, 0.9, '#6b7280', 0.03, rnd);
    towers.push(new THREE.Vector3(x, 22.5, z));
  }
  const sm = stands.build(); if (sm) group.add(sm);
  const lightsB = new BoxBatch();
  for (const t of towers) lightsB.add(t.x, t.y, t.z, 3, 1.6, 0.6, '#fff8dc', 0, rnd);
  const lm = lightsB.build(true); if (lm) group.add(lm);

  // 场边广告牌
  const boardMatCache: THREE.Material[] = SPONSORS.map((s, i) => new THREE.MeshBasicMaterial({ map: textTexture('sp' + i + st.id, s, i % 2 ? st.standAccent : '#111827', '#ffffff', 256, 48, 'bold 30px monospace') }));
  const boardGeo = new THREE.BoxGeometry(5.6, 0.9, 0.2);
  let bi = 0;
  for (let x = -L / 2 + 2.8; x < L / 2; x += 5.8) {
    for (const sz of [-1, 1]) {
      const m = new THREE.Mesh(boardGeo, boardMatCache[bi++ % boardMatCache.length]);
      m.position.set(x, 0.45, sz * (W / 2 + 1.9));
      if (sz > 0) m.rotation.y = Math.PI;
      group.add(m);
    }
  }
  for (const sx of [-1, 1]) for (const z of [-9, -4, 4, 9]) {
    const m = new THREE.Mesh(boardGeo, boardMatCache[bi++ % boardMatCache.length]);
    m.position.set(sx * (L / 2 + 3.2), 0.45, z); m.rotation.y = sx > 0 ? -Math.PI / 2 : Math.PI / 2;
    group.add(m);
  }

  // 主题环境
  const props = new BoxBatch();
  const glow = new BoxBatch();
  let volcanoTop: THREE.Vector3 | undefined;
  const ring = (cb: (x: number, z: number, i: number) => void, count: number, rMin: number, rMax: number) => {
    for (let i = 0; i < count; i++) {
      const a = rnd.range(0, Math.PI * 2), r = rnd.range(rMin, rMax);
      cb(Math.cos(a) * r * 1.3, Math.sin(a) * r, i);
    }
  };
  const density = quality === 'low' ? 0.5 : quality === 'medium' ? 0.8 : 1;
  switch (st.props) {
    case 'city':
      ring((x, z) => { const h = rnd.range(8, 30); props.add(x, h / 2, z, rnd.range(4, 8), h, rnd.range(4, 8), rnd.pick(['#9ca3af', '#6b7280', '#cbd5e1', '#475569']), 0.05, rnd);
        for (let y = 2; y < h; y += 2.5) glow.add(x, y, z, rnd.range(4.1, 8.1) * 0.5, 0.5, 0.1, '#fef3c7', 0, rnd); }, Math.round(36 * density), 48, 80);
      break;
    case 'jungle':
      ring((x, z) => lodTree(group, x, z, rnd.range(4, 9), rnd.pick(['#166534', '#15803d', '#14532d', '#3f6212']), '#5b3a1e', rnd), Math.round(70 * density), 38, 75);
      ring((x, z) => props.add(x, 0.5, z, rnd.range(1, 3), 1, rnd.range(1, 3), '#365314', 0.1, rnd), Math.round(40 * density), 30, 70);
      break;
    case 'desert':
      ring((x, z) => {
        const lod = new THREE.LOD(); const hi = new BoxBatch(); const h = rnd.range(2.5, 5);
        hi.add(0, h / 2, 0, 0.8, h, 0.8, '#3f7d20', 0.05, rnd); hi.add(0.8, h * 0.55, 0, 0.8, 0.6, 0.6, '#3f7d20'); hi.add(1.1, h * 0.7, 0, 0.5, 1.4, 0.5, '#4d8f2a');
        hi.add(-0.7, h * 0.45, 0, 0.7, 0.5, 0.5, '#3f7d20'); hi.add(-0.95, h * 0.6, 0, 0.45, 1.2, 0.45, '#4d8f2a');
        const lo = new BoxBatch(); lo.add(0, h / 2, 0, 1, h, 1, '#3f7d20');
        const a = hi.build(), b = lo.build(); if (a) lod.addLevel(a, 0); if (b) lod.addLevel(b, 70);
        lod.position.set(x, 0, z); group.add(lod);
      }, Math.round(40 * density), 36, 70);
      ring((x, z) => props.add(x, 0.6, z, rnd.range(5, 12), 1.2 + rnd.range(0, 1.5), rnd.range(4, 9), '#e2c27a', 0.06, rnd), Math.round(30 * density), 40, 90);
      stepped(props, -70, -60, 26, 12, 1.6, ['#d6b46a', '#c9a55a', '#bb9650'], rnd);
      stepped(props, 80, -75, 18, 9, 1.6, ['#d6b46a', '#c9a55a'], rnd);
      break;
    case 'snow':
      for (let i = 0; i < 6; i++) stepped(props, -90 + i * 36 + rnd.range(-8, 8), -85 + rnd.range(-10, 5), rnd.range(30, 50), 14, 2.4, ['#64748b', '#94a3b8', '#e2e8f0', '#ffffff'], rnd);
      ring((x, z) => {
        const lod = new THREE.LOD(); const hi = new BoxBatch(); const h = rnd.range(3, 6);
        hi.add(0, 0.8, 0, 0.6, 1.6, 0.6, '#4a3520');
        for (let k = 0; k < 4; k++) { const s = 2.6 - k * 0.6; hi.add(0, 1.6 + k * (h / 4), 0, s, h / 4, s, '#14532d'); hi.add(0, 1.6 + k * (h / 4) + h / 8, 0, s * 0.9, 0.18, s * 0.9, '#ffffff'); }
        const lo = new BoxBatch(); lo.add(0, h / 2 + 1, 0, 2, h, 2, '#14532d');
        const a = hi.build(), b = lo.build(); if (a) lod.addLevel(a, 0); if (b) lod.addLevel(b, 70);
        lod.position.set(x, 0, z); group.add(lod);
      }, Math.round(50 * density), 36, 70);
      break;
    case 'volcano': {
      stepped(props, 0, -95, 70, 16, 3.2, ['#1c1917', '#292524', '#44403c', '#57534e'], rnd);
      volcanoTop = new THREE.Vector3(0, 51, -95);
      glow.add(0, 51.5, -95, 6, 1, 6, '#ff4500', 0, rnd);
      for (const sz of [-1, 1]) glow.add(0, 0.05, sz * (W / 2 + 2.8), L + 10, 0.1, 0.9, '#ff5a00', 0, rnd);
      ring((x, z) => { glow.add(x, 0.08, z, rnd.range(2, 6), 0.12, rnd.range(1, 2), '#ff6a00', 0, rnd); props.add(x + 2, 0.6, z + 1, 2, 1.2, 2, '#1c1917', 0.1, rnd); }, Math.round(30 * density), 36, 70);
      break;
    }
    case 'neon':
      ring((x, z) => {
        const h = rnd.range(12, 40); props.add(x, h / 2, z, rnd.range(4, 7), h, rnd.range(4, 7), rnd.pick(['#1e1b4b', '#0f172a', '#312e81']), 0.05, rnd);
        const c = rnd.pick(['#22d3ee', '#e879f9', '#a3e635', '#f472b6']);
        glow.add(x, h * 0.5, z + 3.6, 0.3, h * 0.9, 0.1, c, 0, rnd); glow.add(x, h + 0.2, z, 5, 0.4, 5, c, 0, rnd);
      }, Math.round(40 * density), 45, 85);
      for (const sz of [-1, 1]) glow.add(0, 0.05, sz * (W / 2 + 0.9), L + 4, 0.06, 0.15, '#22d3ee', 0, rnd);
      break;
    case 'sky':
      for (let i = 0; i < Math.round(14 * density); i++) {
        const a = rnd.range(0, Math.PI * 2), r = rnd.range(55, 90);
        const x = Math.cos(a) * r, z = Math.sin(a) * r, y = rnd.range(-10, 18), s = rnd.range(6, 14);
        props.add(x, y, z, s, 1.5, s, '#4cbf5a', 0.05, rnd);
        stepped(props, x, z, s * 0.95, 5, 1.6, ['#7a5a3a', '#5c4328'], rnd, y - 0.75, true);
      }
      break;
    case 'champion':
      for (let i = -3; i <= 3; i++) for (const sz of [-1, 1]) { props.add(i * 9, 9, sz * (W / 2 + 18), 1.6, 18, 1.6, '#d4af37', 0.03, rnd); glow.add(i * 9, 18.4, sz * (W / 2 + 18), 2.2, 0.8, 2.2, '#fde68a', 0, rnd); }
      // 巨型奖杯
      {
        const tx = -(L / 2 + 16);
        props.add(tx, 1.5, 0, 6, 3, 6, '#7c2d12', 0.02, rnd);
        props.add(tx, 4, 0, 2, 2, 2, '#d4af37', 0.02, rnd);
        props.add(tx, 7, 0, 3, 4, 3, '#eab308', 0.02, rnd);
        props.add(tx, 10.5, 0, 5, 3, 5, '#facc15', 0.02, rnd);
        props.add(tx, 10.5, 3, 1, 2.4, 1, '#eab308'); props.add(tx, 10.5, -3, 1, 2.4, 1, '#eab308');
        glow.add(tx, 12.2, 0, 4.4, 0.4, 4.4, '#fef08a', 0, rnd);
      }
      ring((x, z) => props.add(x, 0.5, z, 2, 1, 2, rnd.pick(['#d4af37', '#7c2d12', '#b91c1c']), 0.1, rnd), Math.round(30 * density), 40, 70);
      break;
  }
  const pm = props.build(); if (pm) { pm.castShadow = false; group.add(pm); }
  const gm = glow.build(true); if (gm) group.add(gm);

  // 方块云
  const clouds = new THREE.Group();
  const cloudMat = new THREE.MeshLambertMaterial({ color: '#ffffff', transparent: true, opacity: 0.92 });
  const cloudGeo = new THREE.BoxGeometry(1, 1, 1);
  for (let i = 0; i < Math.round(18 * density); i++) {
    const c = new THREE.Mesh(cloudGeo, cloudMat);
    c.scale.set(rnd.range(8, 18), rnd.range(1.5, 3), rnd.range(5, 10));
    c.position.set(rnd.range(-140, 140), sky ? rnd.range(-30, -14) : rnd.range(38, 55), rnd.range(-120, 60));
    clouds.add(c);
    animated.push({ obj: c, kind: 'cloud', base: c.position.x });
  }
  group.add(clouds);
  return { group, crowdSeats: seats, towerTops: towers, volcanoTop, animated };
}

/** 渐变天空球 */
export function buildSky(st: StadiumDef): THREE.Mesh {
  const geo = new THREE.SphereGeometry(320, 24, 16);
  const top = new THREE.Color(st.skyTop), bot = new THREE.Color(st.skyBottom);
  const cols = new Float32Array(geo.getAttribute('position').count * 3);
  const pos = geo.getAttribute('position');
  const c = new THREE.Color();
  for (let i = 0; i < pos.count; i++) {
    const y = pos.getY(i) / 320;
    c.copy(bot).lerp(top, Math.max(0, Math.min(1, y * 1.4 + 0.15)));
    cols[i * 3] = c.r; cols[i * 3 + 1] = c.g; cols[i * 3 + 2] = c.b;
  }
  geo.setAttribute('color', new THREE.BufferAttribute(cols, 3));
  const m = new THREE.Mesh(geo, new THREE.MeshBasicMaterial({ vertexColors: true, side: THREE.BackSide, fog: false, depthWrite: false }));
  return m;
}
