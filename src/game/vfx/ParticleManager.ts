import * as THREE from 'three';

/** GPU 实例化方块粒子（对象池），数量随画质动态调整 */
export class ParticleManager {
  mesh: THREE.InstancedMesh;
  cap: number;
  n = 0;
  private p: Float32Array; private v: Float32Array; private life: Float32Array; private max: Float32Array; private size: Float32Array; private grav: Float32Array; private drag: Float32Array;
  private m4 = new THREE.Matrix4(); private q = new THREE.Quaternion(); private sc = new THREE.Vector3(); private ps = new THREE.Vector3(); private col = new THREE.Color();
  scale = 1;
  constructor(scene: THREE.Scene, cap: number, quality: number) {
    this.cap = cap; this.scale = quality;
    const geo = new THREE.BoxGeometry(1, 1, 1);
    const mat = new THREE.MeshBasicMaterial({ color: '#ffffff' });
    this.mesh = new THREE.InstancedMesh(geo, mat, cap);
    this.mesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
    this.mesh.frustumCulled = false;
    this.mesh.count = 0;
    for (let i = 0; i < cap; i++) this.mesh.setColorAt(i, this.col.set('#ffffff'));
    this.p = new Float32Array(cap * 3); this.v = new Float32Array(cap * 3);
    this.life = new Float32Array(cap); this.max = new Float32Array(cap); this.size = new Float32Array(cap); this.grav = new Float32Array(cap); this.drag = new Float32Array(cap);
    scene.add(this.mesh);
  }
  spawn(x: number, y: number, z: number, vx: number, vy: number, vz: number, color: string, life: number, size: number, grav = 0, drag = 0) {
    if (this.n >= this.cap) return;
    const i = this.n++;
    this.p[i * 3] = x; this.p[i * 3 + 1] = y; this.p[i * 3 + 2] = z;
    this.v[i * 3] = vx; this.v[i * 3 + 1] = vy; this.v[i * 3 + 2] = vz;
    this.life[i] = life; this.max[i] = life; this.size[i] = size; this.grav[i] = grav; this.drag[i] = drag;
    this.mesh.setColorAt(i, this.col.set(color));
  }
  burst(pos: THREE.Vector3, colors: string | string[], count: number, speed: number, life: number, size: number, grav = -6, upBias = 0.5) {
    const c = Math.max(1, Math.round(count * this.scale));
    for (let k = 0; k < c; k++) {
      const a = Math.random() * Math.PI * 2, e = (Math.random() - 0.3) * Math.PI * 0.5;
      const sp = speed * (0.4 + Math.random() * 0.6);
      const col = Array.isArray(colors) ? colors[(Math.random() * colors.length) | 0] : colors;
      this.spawn(pos.x, pos.y, pos.z, Math.cos(a) * Math.cos(e) * sp, Math.abs(Math.sin(e)) * sp + upBias * speed * Math.random(), Math.sin(a) * Math.cos(e) * sp, col, life * (0.6 + Math.random() * 0.6), size * (0.6 + Math.random() * 0.7), grav, 1.5);
    }
  }
  trail(pos: THREE.Vector3, color: string, size: number, life = 0.35, jitter = 0.08) {
    if (Math.random() > this.scale) return;
    this.spawn(pos.x + (Math.random() - 0.5) * jitter, pos.y + (Math.random() - 0.5) * jitter, pos.z + (Math.random() - 0.5) * jitter, 0, 0.3, 0, color, life, size, 0, 0);
  }
  update(dt: number) {
    let i = 0;
    while (i < this.n) {
      this.life[i] -= dt;
      if (this.life[i] <= 0) { this.swap(i, --this.n); continue; }
      const d = Math.max(0, 1 - this.drag[i] * dt);
      this.v[i * 3] *= d; this.v[i * 3 + 2] *= d;
      this.v[i * 3 + 1] = this.v[i * 3 + 1] * d + this.grav[i] * dt;
      this.p[i * 3] += this.v[i * 3] * dt; this.p[i * 3 + 1] += this.v[i * 3 + 1] * dt; this.p[i * 3 + 2] += this.v[i * 3 + 2] * dt;
      if (this.p[i * 3 + 1] < 0.03) { this.p[i * 3 + 1] = 0.03; this.v[i * 3 + 1] *= -0.3; }
      const s = this.size[i] * Math.min(1, (this.life[i] / this.max[i]) * 1.6);
      this.ps.set(this.p[i * 3], this.p[i * 3 + 1], this.p[i * 3 + 2]); this.sc.set(s, s, s);
      this.m4.compose(this.ps, this.q, this.sc);
      this.mesh.setMatrixAt(i, this.m4);
      i++;
    }
    this.mesh.count = this.n;
    this.mesh.instanceMatrix.needsUpdate = true;
    if (this.mesh.instanceColor) this.mesh.instanceColor.needsUpdate = true;
  }
  private swap(a: number, b: number) {
    if (a === b) return;
    for (let k = 0; k < 3; k++) { this.p[a * 3 + k] = this.p[b * 3 + k]; this.v[a * 3 + k] = this.v[b * 3 + k]; }
    this.life[a] = this.life[b]; this.max[a] = this.max[b]; this.size[a] = this.size[b]; this.grav[a] = this.grav[b]; this.drag[a] = this.drag[b];
    this.mesh.getColorAt(b, this.col); this.mesh.setColorAt(a, this.col);
  }
  clear() { this.n = 0; this.mesh.count = 0; }
  dispose() { this.mesh.geometry.dispose(); (this.mesh.material as THREE.Material).dispose(); this.mesh.removeFromParent(); }
}
