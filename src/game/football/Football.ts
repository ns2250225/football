import * as THREE from 'three';
import { ShotSpec, ShotForm } from '../types';
import type { Player } from '../player/Player';
import { ballTexture } from '../world/Textures';
import { FIELD } from '../../utils/physics';

export interface ShotRuntime {
  by: Player; side: 0 | 1; spec: ShotSpec; t: number; target: THREE.Vector3; startPos: THREE.Vector3; hit: Set<number>;
  refracted: number; dipped: boolean; bounced: boolean; exploded: boolean; long: boolean; crit: boolean; gkDelay: number;
  form?: ShotForm; power: number; onTargetCounted: boolean; decoys: THREE.Vector3[]; header: boolean;
}

const FORM_COLOR: Record<ShotForm, string> = {
  fire: '#ff6a00', thunder: '#fde047', ice: '#7dd3fc', meteor: '#7f1d1d', golden: '#fbbf24', rainbow: '#f0abfc', phantom: '#a78bfa',
  light: '#fffbe0', galaxy: '#8b5cf6', tornado: '#cbd5e1', nuke: '#84cc16', void: '#111827',
};
export function formColor(f?: ShotForm): string { return f ? FORM_COLOR[f] : '#ffffff'; }

const ballGeo = new THREE.BoxGeometry(FIELD.ballR * 2, FIELD.ballR * 2, FIELD.ballR * 2);
const glowGeo = new THREE.BoxGeometry(FIELD.ballR * 2.7, FIELD.ballR * 2.7, FIELD.ballR * 2.7);
const shadowGeo = new THREE.CircleGeometry(FIELD.ballR * 1.1, 10).rotateX(-Math.PI / 2);

export class Ball {
  pos = new THREE.Vector3(0, FIELD.ballR, 0);
  vel = new THREE.Vector3();
  spin = new THREE.Vector3();
  r = FIELD.ballR;
  owner: Player | null = null;
  lastTouch: Player | null = null;
  lastTouchTime = 0;
  assistCand: Player | null = null;
  assistTime = -99;
  passFrom: Player | null = null;
  passTo: Player | null = null;
  passLong = false;
  passTime = 0;
  magnet: Player | null = null;
  shot: ShotRuntime | null = null;
  floatT = 0;
  pullT = 0; pullTo: Player | null = null; pullPow = 0;
  isMain: boolean;
  dead = false;
  mesh = new THREE.Group();
  inner: THREE.Mesh;
  glow: THREE.Mesh;
  shadow: THREE.Mesh;
  rot = new THREE.Euler();
  trailT = 0;
  scored = false;

  constructor(isMain: boolean) {
    this.isMain = isMain;
    const mat = new THREE.MeshLambertMaterial({ map: ballTexture() });
    this.inner = new THREE.Mesh(ballGeo, mat);
    this.inner.castShadow = true;
    this.glow = new THREE.Mesh(glowGeo, new THREE.MeshBasicMaterial({ color: '#ffffff', transparent: true, opacity: 0, depthWrite: false }));
    this.mesh.add(this.inner, this.glow);
    this.shadow = new THREE.Mesh(shadowGeo, new THREE.MeshBasicMaterial({ color: '#000', transparent: true, opacity: 0.35, depthWrite: false }));
    if (!isMain) (this.inner.material as THREE.MeshLambertMaterial).color.set('#ffd6a0');
  }

  speed(): number { return Math.hypot(this.vel.x, this.vel.z); }
  touch(p: Player, time: number) {
    if (this.lastTouch && this.lastTouch !== p) {
      if (this.lastTouch.side === p.side) { this.assistCand = this.lastTouch; this.assistTime = time; }
      else { this.assistCand = null; }
    }
    this.lastTouch = p; this.lastTouchTime = time;
  }
  reset(x: number, z: number) {
    this.pos.set(x, this.r, z); this.vel.set(0, 0, 0); this.spin.set(0, 0, 0);
    this.owner = null; this.shot = null; this.passFrom = null; this.passTo = null; this.magnet = null; this.floatT = 0; this.pullT = 0; this.scored = false; this.dead = false;
  }

  syncMesh(dt: number) {
    this.mesh.position.copy(this.pos);
    const sp = this.vel.length();
    // 滚动旋转
    this.inner.rotation.x += this.vel.z * dt / this.r * 0.5 + this.spin.x * dt;
    this.inner.rotation.z -= this.vel.x * dt / this.r * 0.5;
    this.inner.rotation.y += this.spin.y * dt;
    this.shadow.position.set(this.pos.x, 0.02, this.pos.z);
    const sh = Math.max(0.2, 1 - this.pos.y / 8);
    this.shadow.scale.setScalar(sh);
    const gm = this.glow.material as THREE.MeshBasicMaterial;
    if (this.shot?.form) {
      gm.color.set(formColor(this.shot.form));
      gm.opacity = 0.45 + Math.sin(performance.now() / 60) * 0.1;
      const sc = this.shot.form === 'meteor' ? 1.9 : this.shot.form === 'nuke' ? 1.6 : 1.15;
      this.glow.scale.setScalar(sc);
      this.inner.scale.setScalar(this.shot.form === 'meteor' ? 1.5 : 1);
    } else {
      gm.opacity = Math.max(0, gm.opacity - dt * 2);
      this.inner.scale.setScalar(1);
    }
    void sp;
  }
}
