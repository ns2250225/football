import * as THREE from 'three';
import type { EffectsManager } from './EffectsManager';
export function iceBurst(fx: EffectsManager, pos: THREE.Vector3, radius = 2) {
  fx.particles.burst(pos.clone().setY(0.6), ['#e0f2fe', '#7dd3fc', '#38bdf8', '#ffffff'], 30, 5, 0.8, 0.2, -5);
  fx.ring(pos, '#7dd3fc', 0.3, radius, 0.5);
}
export function iceZone(fx: EffectsManager, pos: THREE.Vector3, radius: number, life: number) {
  fx.zone(pos, radius, '#bae6fd', life, 0.45);
}
