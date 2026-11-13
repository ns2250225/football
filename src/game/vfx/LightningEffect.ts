import * as THREE from 'three';
import type { EffectsManager } from './EffectsManager';
export function lightningChain(fx: EffectsManager, from: THREE.Vector3, to: THREE.Vector3) {
  fx.bolt(from.clone().setY(from.y + 0.5), to.clone().setY(1.0), '#fef08a', 0.3);
}
export function lightningStrike(fx: EffectsManager, pos: THREE.Vector3) { fx.skyStrike(pos); }
export function sparkTrail(fx: EffectsManager, pos: THREE.Vector3) {
  fx.particles.trail(pos, Math.random() < 0.5 ? '#fde047' : '#ffffff', 0.16, 0.25, 0.4);
}
