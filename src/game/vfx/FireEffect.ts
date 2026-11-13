import * as THREE from 'three';
import type { EffectsManager } from './EffectsManager';
export function fireBurst(fx: EffectsManager, pos: THREE.Vector3, scale = 1) {
  fx.particles.burst(pos, ['#ff4500', '#ff8a00', '#fbbf24', '#7f1d1d'], 26 * scale, 6 * scale, 0.6, 0.22, 3);
  fx.flash(pos, '#ff7a00', 1.2 * scale, 0.3);
}
export function fireTrail(fx: EffectsManager, pos: THREE.Vector3) {
  fx.particles.trail(pos, Math.random() < 0.5 ? '#ff4500' : '#fbbf24', 0.22, 0.4, 0.25);
}
