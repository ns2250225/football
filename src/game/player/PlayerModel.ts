import * as THREE from 'three';
import { KitDef, FlagDef } from '../types';
import { canvasTexture, drawFlag, shade } from '../world/Textures';

const ROLE_COLORS: Record<string, string> = { GK: '#facc15', DF: '#38bdf8', MF: '#4ade80', FW: '#f87171' };
function roleTex(role: string, team: string) {
  return canvasTexture('role_' + role + team, 32, 16, (ctx) => {
    ctx.fillStyle = 'rgba(0,0,0,0.65)'; ctx.fillRect(0, 0, 32, 16);
    ctx.fillStyle = team; ctx.fillRect(0, 13, 32, 3);
    ctx.fillStyle = ROLE_COLORS[role] ?? '#fff'; ctx.font = 'bold 12px monospace'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(role, 16, 7);
  });
}

// ===== 共享几何体（所有球员共用，降低内存） =====
const G = {
  thigh: new THREE.BoxGeometry(0.25, 0.32, 0.27).translate(0, -0.16, 0),
  shin: new THREE.BoxGeometry(0.23, 0.36, 0.25).translate(0, -0.5, 0),
  shoe: new THREE.BoxGeometry(0.26, 0.12, 0.36).translate(0, -0.72, 0.04),
  torso: new THREE.BoxGeometry(0.52, 0.62, 0.3),
  sleeve: new THREE.BoxGeometry(0.19, 0.24, 0.21).translate(0, -0.1, 0),
  forearm: new THREE.BoxGeometry(0.17, 0.36, 0.19).translate(0, -0.4, 0),
  hand: new THREE.BoxGeometry(0.2, 0.14, 0.22).translate(0, -0.62, 0),
  head: new THREE.BoxGeometry(0.42, 0.42, 0.42),
  hair: new THREE.BoxGeometry(0.45, 0.12, 0.45),
  hairBack: new THREE.BoxGeometry(0.45, 0.28, 0.1),
  band: new THREE.BoxGeometry(0.2, 0.08, 0.22),
  headband: new THREE.BoxGeometry(0.44, 0.06, 0.44),
  ring: new THREE.RingGeometry(0.5, 0.66, 20).rotateX(-Math.PI / 2),
  marker: new THREE.ConeGeometry(0.18, 0.32, 4).rotateX(Math.PI),
  star: new THREE.OctahedronGeometry(0.13),
};

const matCache = new Map<string, THREE.Material>();
export function lambert(color: string, opts: { transparent?: boolean; opacity?: number; emissive?: string } = {}): THREE.MeshLambertMaterial {
  const key = `${color}_${opts.transparent ? 1 : 0}_${opts.opacity ?? 1}_${opts.emissive ?? ''}`;
  let m = matCache.get(key) as THREE.MeshLambertMaterial | undefined;
  if (!m) {
    m = new THREE.MeshLambertMaterial({ color, transparent: opts.transparent, opacity: opts.opacity ?? 1 });
    if (opts.emissive) m.emissive = new THREE.Color(opts.emissive);
    matCache.set(key, m);
  }
  return m;
}
function texMat(tex: THREE.Texture, key: string): THREE.MeshLambertMaterial {
  let m = matCache.get('tex_' + key) as THREE.MeshLambertMaterial | undefined;
  if (!m) { m = new THREE.MeshLambertMaterial({ map: tex }); matCache.set('tex_' + key, m); }
  return m;
}

function jerseyFront(kit: KitDef, num: number, flag: FlagDef | null, key: string) {
  return canvasTexture('jf_' + key + num, 32, 32, (ctx) => {
    ctx.fillStyle = kit.shirt; ctx.fillRect(0, 0, 32, 32);
    ctx.fillStyle = kit.shirt2; ctx.fillRect(0, 0, 32, 3); ctx.fillRect(13, 0, 6, 5);
    ctx.fillRect(0, 29, 32, 3);
    if (flag) drawFlag(ctx, flag, 5, 7, 8, 6); else { ctx.fillStyle = kit.shirt2; ctx.fillRect(5, 7, 6, 6); }
    ctx.fillStyle = kit.shirt2; ctx.font = 'bold 10px monospace'; ctx.textAlign = 'center'; ctx.fillText(String(num), 22, 15);
  });
}
function jerseyBack(kit: KitDef, num: number, key: string) {
  return canvasTexture('jb_' + key + num, 32, 32, (ctx) => {
    ctx.fillStyle = kit.shirt; ctx.fillRect(0, 0, 32, 32);
    ctx.fillStyle = kit.shirt2; ctx.fillRect(0, 0, 32, 3); ctx.fillRect(0, 29, 32, 3);
    ctx.font = 'bold 20px monospace'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillStyle = shade(kit.shirt2, 0.6); ctx.fillText(String(num), 17, 18);
    ctx.fillStyle = kit.shirt2; ctx.fillText(String(num), 16, 17);
  });
}
function faceTex(skin: string, hair: string, eye: string, key: string) {
  return canvasTexture('face_' + key, 16, 16, (ctx) => {
    ctx.fillStyle = skin; ctx.fillRect(0, 0, 16, 16);
    ctx.fillStyle = hair; ctx.fillRect(0, 0, 16, 3);
    ctx.fillStyle = '#ffffff'; ctx.fillRect(3, 6, 3, 2); ctx.fillRect(10, 6, 3, 2);
    ctx.fillStyle = eye; ctx.fillRect(4, 6, 2, 2); ctx.fillRect(10, 6, 2, 2);
    ctx.fillStyle = shade(skin, 0.75); ctx.fillRect(7, 8, 2, 3);
    ctx.fillStyle = shade(skin, 0.55); ctx.fillRect(5, 12, 6, 1);
  });
}

export interface ModelOpts {
  kit: KitDef; number: number; isGK: boolean; height: number; build: number; skin: string; hair: string; accessory: number;
  flag: FlagDef | null; ringColor: string; teamKey: string; ghost?: boolean; isCore?: boolean; role?: string;
}

/**
 * 方块人物模型：
 * Player ├ Head ├ Body(Jersey/Number/Badge) ├ LeftArm ├ RightArm ├ LeftLeg ├ RightLeg ├ Shoes └ Accessories
 */
export class PlayerModel {
  root = new THREE.Group();
  pose = new THREE.Group();
  body = new THREE.Group();
  head = new THREE.Group();
  lArm = new THREE.Group(); rArm = new THREE.Group();
  lLeg = new THREE.Group(); rLeg = new THREE.Group();
  ring: THREE.Mesh; marker: THREE.Mesh; star: THREE.Mesh | null = null; roleTag: THREE.Sprite | null = null;
  baseScale: number;
  materials: THREE.Material[] = [];

  constructor(o: ModelOpts) {
    const ghost = !!o.ghost;
    const m = (c: string) => (ghost ? lambert(c, { transparent: true, opacity: 0.45, emissive: '#6d28d9' }) : lambert(c));
    const skinM = m(o.skin), shortsM = m(o.kit.shorts), socksM = m(o.kit.socks), shirtM = m(o.kit.shirt), hairM = m(o.hair);
    const shoeM = m(o.accessory % 2 ? '#111111' : '#f5f5f5');
    // 腿
    for (const [leg, x] of [[this.lLeg, -0.13], [this.rLeg, 0.13]] as [THREE.Group, number][]) {
      leg.position.set(x, 0.78, 0);
      leg.add(new THREE.Mesh(G.thigh, shortsM), new THREE.Mesh(G.shin, socksM), new THREE.Mesh(G.shoe, shoeM));
      this.body.add(leg);
    }
    // 躯干
    const frontTex = jerseyFront(o.kit, o.number, o.flag, o.teamKey);
    const backTex = jerseyBack(o.kit, o.number, o.teamKey);
    const torsoMats = ghost ? [shirtM, shirtM, shirtM, shirtM, shirtM, shirtM]
      : [shirtM, shirtM, shirtM, shirtM, texMat(frontTex, 'jf' + o.teamKey + o.number), texMat(backTex, 'jb' + o.teamKey + o.number)];
    const torso = new THREE.Mesh(G.torso, torsoMats);
    torso.position.y = 0.78 + 0.31;
    this.body.add(torso);
    // 手臂
    const handM = o.isGK ? m(shade(o.kit.shirt2, 1)) : skinM;
    for (const [arm, x] of [[this.lArm, -0.355], [this.rArm, 0.355]] as [THREE.Group, number][]) {
      arm.position.set(x, 1.36, 0);
      arm.add(new THREE.Mesh(G.sleeve, shirtM), new THREE.Mesh(G.forearm, o.isGK ? shirtM : skinM), new THREE.Mesh(G.hand, handM));
      this.body.add(arm);
    }
    // 头
    this.head.position.y = 1.62;
    const face = ghost ? skinM : texMat(faceTex(o.skin, o.hair, '#1e293b', o.skin + o.hair), 'face' + o.skin + o.hair);
    const headMesh = new THREE.Mesh(G.head, [skinM, skinM, hairM, skinM, face, skinM]);
    this.head.add(headMesh);
    const hairTop = new THREE.Mesh(G.hair, hairM); hairTop.position.y = 0.2; this.head.add(hairTop);
    const hairBack = new THREE.Mesh(G.hairBack, hairM); hairBack.position.set(0, 0.06, -0.19); this.head.add(hairBack);
    // 配饰
    if (o.accessory === 3 && !o.isGK) { const hb = new THREE.Mesh(G.headband, m(o.kit.shirt2)); hb.position.y = 0.1; this.head.add(hb); }
    if (o.isCore) { const band = new THREE.Mesh(G.band, m('#facc15')); band.position.y = -0.12; this.lArm.add(band); }
    this.body.add(this.head);
    this.pose.add(this.body);
    this.root.add(this.pose);
    // 位置标识
    this.ring = new THREE.Mesh(G.ring, new THREE.MeshBasicMaterial({ color: o.ringColor, transparent: true, opacity: 0.85, depthWrite: false }));
    this.ring.position.y = 0.03;
    this.root.add(this.ring);
    this.marker = new THREE.Mesh(G.marker, new THREE.MeshBasicMaterial({ color: '#fde047' }));
    this.marker.position.y = 2.35; this.marker.visible = false;
    this.root.add(this.marker);
    if (o.isCore) {
      this.star = new THREE.Mesh(G.star, new THREE.MeshBasicMaterial({ color: '#facc15' }));
      this.star.position.y = 2.6; this.root.add(this.star);
    }
    if (o.role && !ghost) {
      this.roleTag = new THREE.Sprite(new THREE.SpriteMaterial({ map: roleTex(o.role, o.ringColor), depthTest: false, transparent: true }));
      this.roleTag.scale.set(0.7, 0.35, 1); this.roleTag.position.y = 2.05; this.roleTag.renderOrder = 5;
      this.root.add(this.roleTag);
    }
    this.baseScale = o.height;
    this.root.scale.set(o.build * o.height, o.height, o.build * o.height);
  }
  setShadows(on: boolean) {
    this.root.traverse((c) => { if ((c as THREE.Mesh).isMesh && c !== this.ring && c !== this.marker) { c.castShadow = on; } });
  }
  setScale(k: number) {
    const s = this.baseScale * k;
    this.root.scale.set(s, s, s);
  }
  resetLimbs() {
    for (const g of [this.lArm, this.rArm, this.lLeg, this.rLeg, this.head, this.body]) g.rotation.set(0, 0, 0);
    this.pose.rotation.set(0, 0, 0); this.pose.position.set(0, 0, 0); this.body.position.set(0, 0, 0);
  }
}

export function pickGkKit(a: string, b: string): KitDef {
  const cands = ['#22c55e', '#f97316', '#a855f7', '#111827', '#facc15', '#ec4899', '#06b6d4'];
  const dist = (x: string, y: string) => { const c1 = new THREE.Color(x), c2 = new THREE.Color(y); return Math.abs(c1.r - c2.r) + Math.abs(c1.g - c2.g) + Math.abs(c1.b - c2.b); };
  let best = cands[0], bd = -1;
  for (const c of cands) { const d = Math.min(dist(c, a), dist(c, b)); if (d > bd) { bd = d; best = c; } }
  return { shirt: best, shirt2: '#111111', shorts: shade(best, 0.6), socks: best };
}
