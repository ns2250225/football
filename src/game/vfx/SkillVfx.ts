import * as THREE from 'three';
import type { EffectsManager } from './EffectsManager';
import { fireBurst } from './FireEffect';
import { iceBurst } from './IceEffect';
import { explosion, shockwave } from './ExplosionEffect';
import { ultimateBurst } from './UltimateEffect';

/** 按技能配置中的 vfx 键播放对应特效 */
export function playSkillVfx(fx: EffectsManager, key: string, pos: THREE.Vector3, color: string, radius = 3) {
  const p = pos.clone();
  switch (key) {
    case 'fire_ball': case 'rocket': fireBurst(fx, p.setY(1)); break;
    case 'ice_burst': iceBurst(fx, p, radius); break;
    case 'explosion': case 'meteor': explosion(fx, p, radius); break;
    case 'wave': case 'quake': shockwave(fx, p, radius, key === 'quake' ? '#a16207' : '#f472b6');
      if (key === 'quake') fx.particles.burst(p.setY(0.2), ['#78350f', '#a16207', '#57534e'], 30, 6, 0.7, 0.25, -12); break;
    case 'lightning': case 'lightning_trail': fx.particles.burst(p.setY(1), ['#fde047', '#ffffff'], 18, 6, 0.4, 0.14, 0); break;
    case 'ultimate': ultimateBurst(fx, p, color); break;
    case 'whirl': fx.ring(p, '#a5f3fc', 0.4, radius, 0.5, 0.5); fx.ring(p, '#ffffff', 0.4, radius * 0.7, 0.4, 1.0); break;
    case 'pull': fx.ring(p, color, radius, 0.3, 0.6); break;
    case 'phantom': case 'swap': case 'blink': fx.particles.burst(p.setY(1), ['#a78bfa', '#c4b5fd', '#ffffff'], 22, 4, 0.5, 0.16, 0); break;
    case 'field_green': case 'field_gold': case 'field_red': case 'aura': case 'horn':
      fx.ring(p, key === 'field_gold' ? '#fde047' : key === 'field_red' ? '#ef4444' : color, 0.5, radius, 0.7); break;
    case 'shield': case 'reflect': case 'post': case 'gk_glow': fx.ring(p, '#38bdf8', 0.3, 1.6, 0.45, 1); fx.flash(p.setY(1), '#7dd3fc', 1, 0.3); break;
    case 'time': fx.ring(p, '#818cf8', 0.5, radius, 0.9); fx.ring(p, '#c7d2fe', radius, 0.5, 0.9); break;
    case 'float': case 'jump': case 'cloud': fx.particles.burst(p.setY(0.3), ['#e0f2fe', '#c4b5fd'], 16, 3, 0.6, 0.15, 2); break;
    case 'evolution': fx.ring(p, '#fbbf24', 0.5, 6, 0.8); fx.particles.burst(p.setY(1.2), ['#fbbf24', '#ffffff', '#a855f7'], 50, 8, 1, 0.22, -2); break;
    default: fx.particles.burst(p.setY(1), [color, '#ffffff'], 14, 4, 0.4, 0.14, 0);
  }
}
