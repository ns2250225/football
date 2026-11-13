import * as THREE from 'three';
import type { EffectsManager } from './EffectsManager';
export function explosion(fx: EffectsManager, pos: THREE.Vector3, radius: number, color = '#ff7a00') {
  const p = pos.clone(); p.y = Math.max(0.6, p.y);
  fx.flash(p, color, radius * 0.7, 0.45);
  fx.flash(p, '#ffffff', radius * 0.35, 0.2);
  fx.ring(pos, color, 0.4, radius, 0.55);
  fx.particles.burst(p, [color, '#fbbf24', '#3f3f46', '#ffffff'], 18 + radius * 10, 4 + radius * 2, 0.9, 0.28, -9);
}
export function shockwave(fx: EffectsManager, pos: THREE.Vector3, radius: number, color = '#f472b6') {
  fx.ring(pos, color, 0.3, radius, 0.45);
  fx.ring(pos, '#ffffff', 0.2, radius * 0.7, 0.35);
}
