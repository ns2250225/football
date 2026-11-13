import * as THREE from 'three';
import { WeatherKind } from '../types';
import { AudioManager } from '../audio/AudioManager';

/** 天气系统：雨、雷暴、雪、沙尘暴、夜晚，以及黑夜事件 */
export class WeatherSystem {
  points: THREE.Points | null = null;
  private vel: Float32Array | null = null;
  kind: WeatherKind;
  flashT = 0;
  nextThunder = 6;
  windAngle = Math.random() * Math.PI * 2;
  constructor(public scene: THREE.Scene, kind: WeatherKind, quality: number, private hemi: THREE.HemisphereLight, private onBolt: (p: THREE.Vector3) => void) {
    this.kind = kind;
    let count = 0, color = '#a5c8ff', size = 0.08;
    if (kind === 'rain' || kind === 'storm') { count = kind === 'storm' ? 2600 : 1800; color = '#a5c8ff'; size = 0.09; }
    if (kind === 'snow') { count = 1500; color = '#ffffff'; size = 0.18; }
    if (kind === 'sandstorm') { count = 2200; color = '#e0b26a'; size = 0.14; }
    count = Math.round(count * quality);
    if (count > 0) {
      const pos = new Float32Array(count * 3); this.vel = new Float32Array(count * 3);
      for (let i = 0; i < count; i++) {
        pos[i * 3] = (Math.random() - 0.5) * 70; pos[i * 3 + 1] = Math.random() * 26; pos[i * 3 + 2] = (Math.random() - 0.5) * 50;
        const v = this.vel;
        if (kind === 'snow') { v[i * 3] = (Math.random() - 0.5) * 0.8; v[i * 3 + 1] = -1.5 - Math.random(); v[i * 3 + 2] = (Math.random() - 0.5) * 0.8; }
        else if (kind === 'sandstorm') { v[i * 3] = 9 + Math.random() * 5; v[i * 3 + 1] = (Math.random() - 0.5) * 1.5; v[i * 3 + 2] = 2 + Math.random() * 2; }
        else { v[i * 3] = 1.2; v[i * 3 + 1] = -20 - Math.random() * 8; v[i * 3 + 2] = 0.6; }
      }
      const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.BufferAttribute(pos, 3));
      this.points = new THREE.Points(g, new THREE.PointsMaterial({ color, size, transparent: true, opacity: kind === 'sandstorm' ? 0.55 : 0.75, depthWrite: false }));
      this.points.frustumCulled = false;
      scene.add(this.points);
    }
  }
  windVector(strength: number, t: number): THREE.Vector3 {
    this.windAngle += Math.sin(t * 0.13) * 0.002;
    return new THREE.Vector3(Math.cos(this.windAngle), 0, Math.sin(this.windAngle)).multiplyScalar(strength * (0.7 + Math.sin(t * 0.4) * 0.3));
  }
  update(dt: number, center: THREE.Vector3, lightning: boolean) {
    if (this.points && this.vel) {
      const pos = this.points.geometry.getAttribute('position') as THREE.BufferAttribute;
      const a = pos.array as Float32Array;
      for (let i = 0; i < pos.count; i++) {
        a[i * 3] += this.vel[i * 3] * dt; a[i * 3 + 1] += this.vel[i * 3 + 1] * dt; a[i * 3 + 2] += this.vel[i * 3 + 2] * dt;
        if (a[i * 3 + 1] < 0 || a[i * 3] > center.x + 35 || a[i * 3] < center.x - 35) {
          a[i * 3] = center.x + (Math.random() - 0.5) * 70; a[i * 3 + 1] = this.kind === 'sandstorm' ? Math.random() * 10 : 24 + Math.random() * 3; a[i * 3 + 2] = (Math.random() - 0.5) * 50;
          if (this.kind === 'sandstorm') a[i * 3] = center.x - 35;
        }
      }
      pos.needsUpdate = true;
    }
    // 雷暴闪电：天空闪光 + 远方雷击（视觉）
    if (this.kind === 'storm' || lightning) {
      this.nextThunder -= dt;
      if (this.nextThunder <= 0 && this.kind === 'storm') {
        this.nextThunder = 5 + Math.random() * 8;
        this.flashT = 0.25;
        AudioManager.play('thunder', 0.6);
        this.onBolt(new THREE.Vector3(center.x + (Math.random() - 0.5) * 120, 0, -60 - Math.random() * 30));
      }
    }
    if (this.flashT > 0) { this.flashT -= dt; this.hemi.intensity += 2.5 * Math.max(0, this.flashT) * 4; }
  }
  dispose() { if (this.points) { this.points.geometry.dispose(); (this.points.material as THREE.Material).dispose(); this.points.removeFromParent(); } }
}
