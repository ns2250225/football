import * as THREE from 'three';
import type { EffectsManager } from './EffectsManager';
/** 大招全场级视觉反馈（配合 UI 全屏闪光与镜头震动） */
export function ultimateBurst(fx: EffectsManager, pos: THREE.Vector3, color: string) {
  fx.ring(pos, color, 0.5, 14, 0.9);
  fx.ring(pos, '#ffffff', 0.5, 9, 0.6);
  fx.flash(pos.clone().setY(1.5), color, 4, 0.6);
  fx.particles.burst(pos.clone().setY(1), [color, '#ffffff', '#fde047'], 90, 14, 1.2, 0.3, -6);
  for (let i = 0; i < 12; i++) {
    const a = (i / 12) * Math.PI * 2;
    fx.particles.spawn(pos.x, 0.3, pos.z, Math.cos(a) * 16, 6, Math.sin(a) * 16, color, 0.9, 0.45, -10, 1);
  }
}
