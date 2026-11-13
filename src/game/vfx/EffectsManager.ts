import * as THREE from 'three';
import { ParticleManager } from './ParticleManager';

interface Fx { obj: THREE.Object3D; life: number; max: number; tick: (f: Fx, dt: number, k: number) => void; done?: () => void }

const ringGeo = new THREE.RingGeometry(0.85, 1, 40).rotateX(-Math.PI / 2);
const discGeo = new THREE.CircleGeometry(1, 32).rotateX(-Math.PI / 2);
const flashGeo = new THREE.IcosahedronGeometry(1, 0);
const cubeGeo = new THREE.BoxGeometry(1, 1, 1);

/** 技能特效对象池：冲击环、闪光、闪电、冰冻区域、陨石、龙卷风、壁垒等 */
export class EffectsManager {
  list: Fx[] = [];
  private pool = new Map<string, THREE.Object3D[]>();
  constructor(public scene: THREE.Scene, public particles: ParticleManager) {}

  private take<T extends THREE.Object3D>(key: string, make: () => T): T {
    const arr = this.pool.get(key);
    const o = (arr && arr.pop()) as T | undefined;
    const obj = o ?? make();
    obj.visible = true;
    this.scene.add(obj);
    return obj;
  }
  private give(key: string, o: THREE.Object3D) {
    o.visible = false; o.removeFromParent();
    const arr = this.pool.get(key) ?? []; arr.push(o); this.pool.set(key, arr);
  }
  private add(key: string, obj: THREE.Object3D, life: number, tick: Fx['tick'], done?: () => void) {
    this.list.push({ obj, life, max: life, tick, done: () => { done?.(); this.give(key, obj); } });
  }

  ring(pos: THREE.Vector3, color: string, r0: number, r1: number, life = 0.5, y = 0.06) {
    const m = this.take('ring', () => new THREE.Mesh(ringGeo, new THREE.MeshBasicMaterial({ transparent: true, depthWrite: false, side: THREE.DoubleSide })));
    (m.material as THREE.MeshBasicMaterial).color.set(color);
    m.position.set(pos.x, y, pos.z);
    this.add('ring', m, life, (f, _dt, k) => { const r = r0 + (r1 - r0) * k; f.obj.scale.set(r, 1, r); ((f.obj as THREE.Mesh).material as THREE.MeshBasicMaterial).opacity = 0.9 * (1 - k); });
  }
  flash(pos: THREE.Vector3, color: string, size: number, life = 0.35) {
    const m = this.take('flash', () => new THREE.Mesh(flashGeo, new THREE.MeshBasicMaterial({ transparent: true, depthWrite: false })));
    (m.material as THREE.MeshBasicMaterial).color.set(color);
    m.position.copy(pos);
    this.add('flash', m, life, (f, _dt, k) => { f.obj.scale.setScalar(size * (0.3 + k)); ((f.obj as THREE.Mesh).material as THREE.MeshBasicMaterial).opacity = 0.85 * (1 - k); });
  }
  bolt(from: THREE.Vector3, to: THREE.Vector3, color = '#fef08a', life = 0.28) {
    const segs = 10;
    const line = this.take('bolt', () => {
      const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.BufferAttribute(new Float32Array((segs + 1) * 3), 3));
      return new THREE.Line(g, new THREE.LineBasicMaterial({ transparent: true }));
    }) as THREE.Line;
    (line.material as THREE.LineBasicMaterial).color.set(color);
    const pos = line.geometry.getAttribute('position') as THREE.BufferAttribute;
    const jitter = () => {
      for (let i = 0; i <= segs; i++) {
        const t = i / segs;
        const j = i === 0 || i === segs ? 0 : 0.45;
        pos.setXYZ(i, from.x + (to.x - from.x) * t + (Math.random() - 0.5) * j, from.y + (to.y - from.y) * t + (Math.random() - 0.5) * j, from.z + (to.z - from.z) * t + (Math.random() - 0.5) * j);
      }
      pos.needsUpdate = true;
    };
    jitter();
    this.add('bolt', line, life, (f, _dt, k) => { jitter(); ((f.obj as THREE.Line).material as THREE.LineBasicMaterial).opacity = 1 - k; });
    this.particles.burst(to, [color, '#ffffff'], 8, 4, 0.3, 0.12, -4);
  }
  skyStrike(pos: THREE.Vector3, color = '#fef08a') {
    this.bolt(new THREE.Vector3(pos.x + (Math.random() - 0.5) * 2, 22, pos.z + (Math.random() - 0.5) * 2), new THREE.Vector3(pos.x, 0.1, pos.z), color, 0.35);
    this.ring(pos, color, 0.3, 2.2, 0.4);
    this.flash(new THREE.Vector3(pos.x, 0.6, pos.z), '#ffffff', 1.1, 0.25);
  }
  zone(pos: THREE.Vector3, radius: number, color: string, life: number, opacity = 0.35) {
    const m = this.take('zone', () => new THREE.Mesh(discGeo, new THREE.MeshBasicMaterial({ transparent: true, depthWrite: false })));
    (m.material as THREE.MeshBasicMaterial).color.set(color);
    m.position.set(pos.x, 0.05, pos.z);
    m.scale.set(radius, 1, radius);
    this.add('zone', m, life, (f, _dt, k) => { ((f.obj as THREE.Mesh).material as THREE.MeshBasicMaterial).opacity = opacity * Math.min(1, (1 - k) * 4); if (Math.random() < 0.3 * this.particles.scale) this.particles.spawn(pos.x + (Math.random() - 0.5) * radius * 1.6, 0.1, pos.z + (Math.random() - 0.5) * radius * 1.6, 0, 0.8, 0, color, 0.6, 0.12); });
  }
  meteor(target: THREE.Vector3, onImpact: () => void, color = '#b91c1c') {
    const m = this.take('meteor', () => new THREE.Mesh(cubeGeo, new THREE.MeshLambertMaterial({ color: '#4a1d0f', emissive: new THREE.Color('#ff4500'), emissiveIntensity: 0.6 })));
    const start = new THREE.Vector3(target.x - 10, 28, target.z - 6);
    m.scale.setScalar(2.2);
    this.add('meteor', m, 0.9, (f, _dt, k) => {
      f.obj.position.lerpVectors(start, target, k * k);
      f.obj.rotation.x += 0.2; f.obj.rotation.y += 0.15;
      this.particles.trail(f.obj.position, Math.random() < 0.5 ? '#ff4500' : '#fbbf24', 0.6, 0.6, 1.2);
      this.particles.trail(f.obj.position, '#3f3f46', 0.7, 0.9, 1.4);
    }, () => {
      onImpact();
      this.flash(target.clone().setY(1), '#ff8a00', 5, 0.5);
      this.ring(target, color, 0.5, 6, 0.6);
      this.particles.burst(target.clone().setY(0.5), ['#ff4500', '#fbbf24', '#3f3f46', '#7f1d1d'], 70, 12, 1.0, 0.35, -12);
    });
  }
  tornado(getPos: () => THREE.Vector3, life: number) {
    const g = this.take('tornado', () => {
      const grp = new THREE.Group();
      const mat = new THREE.MeshLambertMaterial({ color: '#cbd5e1', transparent: true, opacity: 0.6 });
      for (let i = 0; i < 26; i++) { const c = new THREE.Mesh(cubeGeo, mat); c.scale.setScalar(0.35); grp.add(c); }
      return grp;
    });
    this.add('tornado', g, life, (f, _dt, k) => {
      const p = getPos();
      f.obj.position.set(p.x, 0, p.z);
      const t = performance.now() / 1000;
      f.obj.children.forEach((c, i) => {
        const h = (i / 26) * 6; const r = 0.4 + h * 0.45; const a = t * 6 + i * 1.3;
        c.position.set(Math.cos(a) * r, h, Math.sin(a) * r);
      });
      f.obj.scale.setScalar(Math.min(1, (1 - k) * 5));
    });
  }
  orb(from: THREE.Vector3, to: () => THREE.Vector3, color: string, life: number, onHit: () => void) {
    const m = this.take('orb', () => new THREE.Mesh(cubeGeo, new THREE.MeshBasicMaterial({ color })));
    (m.material as THREE.MeshBasicMaterial).color.set(color);
    m.scale.setScalar(0.5);
    const start = from.clone();
    this.add('orb', m, life, (f, _dt, k) => {
      const t = to();
      f.obj.position.lerpVectors(start, t, k);
      f.obj.position.y += Math.sin(k * Math.PI) * 4;
      f.obj.rotation.x += 0.3;
      this.particles.trail(f.obj.position, color, 0.25, 0.4, 0.2);
    }, () => { onHit(); this.flash(to().clone().setY(1), color, 1.6, 0.3); });
  }
  barrier(x: number, w: number, h: number, life: number, color = '#38bdf8'): { remove: () => void } {
    const m = this.take('barrier', () => new THREE.Mesh(cubeGeo, new THREE.MeshBasicMaterial({ transparent: true, opacity: 0.35, depthWrite: false })));
    (m.material as THREE.MeshBasicMaterial).color.set(color);
    m.position.set(x, h / 2, 0); m.scale.set(0.3, h, w);
    const fx: Fx = { obj: m, life, max: life, tick: (f) => { ((f.obj as THREE.Mesh).material as THREE.MeshBasicMaterial).opacity = 0.25 + Math.sin(performance.now() / 150) * 0.08; }, done: () => this.give('barrier', m) };
    this.list.push(fx);
    return { remove: () => { fx.life = 0; } };
  }
  burstAt(pos: THREE.Vector3, colors: string[], count: number, speed = 6, life = 0.6, size = 0.18) { this.particles.burst(pos, colors, count, speed, life, size); }

  update(dt: number) {
    for (let i = this.list.length - 1; i >= 0; i--) {
      const f = this.list[i];
      f.life -= dt;
      const k = Math.min(1, 1 - f.life / f.max);
      if (f.life <= 0) { this.list.splice(i, 1); f.done?.(); continue; }
      f.tick(f, dt, k);
    }
  }
  clear() { for (const f of this.list) f.done?.(); this.list = []; }
}
