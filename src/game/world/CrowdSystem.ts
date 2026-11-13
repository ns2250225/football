import * as THREE from 'three';
import { RNG, hashStr } from '../../utils/random';

/** 实例化方块观众：单次 draw call，顶点着色器驱动欢呼跳动 */
export class CrowdSystem {
  mesh: THREE.InstancedMesh;
  uniforms = { uTime: { value: 0 }, uExcite: { value: 0.2 } };
  excite = 0.2;
  constructor(seats: { x: number; y: number; z: number; facing: number }[], palette: string[], density: number, homeColors: string[], key: string) {
    const rnd = new RNG(hashStr('crowd' + key));
    const chosen = seats.filter(() => rnd.next() < density);
    const geo = new THREE.BoxGeometry(0.5, 0.85, 0.4);
    geo.translate(0, 0.42, 0);
    const mat = new THREE.MeshLambertMaterial({ color: '#ffffff' });
    mat.onBeforeCompile = (shader) => {
      shader.uniforms.uTime = this.uniforms.uTime;
      shader.uniforms.uExcite = this.uniforms.uExcite;
      shader.vertexShader = shader.vertexShader
        .replace('#include <common>', '#include <common>\nattribute float aPhase;\nuniform float uTime;\nuniform float uExcite;')
        .replace('#include <begin_vertex>', '#include <begin_vertex>\ntransformed.y += abs(sin(uTime * (5.0 + aPhase * 3.0) + aPhase * 6.28)) * 0.35 * uExcite;');
    };
    this.mesh = new THREE.InstancedMesh(geo, mat, Math.max(1, chosen.length));
    const phase = new Float32Array(Math.max(1, chosen.length));
    const m4 = new THREE.Matrix4(); const q = new THREE.Quaternion(); const c = new THREE.Color();
    const all = [...palette, ...homeColors, ...homeColors];
    chosen.forEach((s, i) => {
      q.setFromAxisAngle(new THREE.Vector3(0, 1, 0), s.facing);
      m4.compose(new THREE.Vector3(s.x + rnd.range(-0.1, 0.1), s.y - 0.4, s.z), q, new THREE.Vector3(1, rnd.range(0.85, 1.15), 1));
      this.mesh.setMatrixAt(i, m4);
      this.mesh.setColorAt(i, c.set(rnd.pick(all)));
      phase[i] = rnd.next();
    });
    this.mesh.geometry.setAttribute('aPhase', new THREE.InstancedBufferAttribute(phase, 1));
    this.mesh.count = chosen.length;
    this.mesh.instanceMatrix.needsUpdate = true;
  }
  cheer(level: number) { this.excite = Math.max(this.excite, level); }
  update(dt: number, t: number) {
    this.excite += (0.2 - this.excite) * Math.min(1, dt * 0.4);
    this.uniforms.uTime.value = t;
    this.uniforms.uExcite.value = this.excite;
  }
}
