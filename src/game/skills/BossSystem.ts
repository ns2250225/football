import * as THREE from 'three';
import type { GameEngine } from '../core/GameEngine';
import type { Player } from '../player/Player';
import { Mods, ShotSpec } from '../types';
import { BOSS_MAP } from '../../data/bosses';
import { rand } from '../../utils/random';
import { AudioManager } from '../audio/AudioManager';
import { lightningStrike } from '../vfx/LightningEffect';
import { iceZone } from '../vfx/IceEffect';
import { ultimateBurst } from '../vfx/UltimateEffect';

const ALL = (v: number): Partial<Mods> => ({ speed: v, sprint: v, shotPower: v, shotAccuracy: v, control: v, passAccuracy: v, tackle: v, body: v });

/**
 * BOSS 挑战模板：叠加在对手国家队基础战术之上的实际机制。
 * 同时负责高难度下 AI 的技能组合（AI 冲刺突破、元素射门）。
 */
export class BossSystem {
  id: string | null;
  phase = 1;
  t = 0; t2 = 0; fireCd = 0; ultUsed = false;
  aiSkills: boolean;
  aiShotCd = 6; aiDashCd = 8;
  aiShotSpec: ShotSpec;
  constructor(private e: GameEngine, bossId: string | undefined, aiSkills: boolean) {
    this.id = bossId ?? null;
    this.aiSkills = aiSkills;
    this.aiShotSpec = rand.pick<ShotSpec>([{ form: 'fire', prio: 2, power: 0.25, burn: 0.8 }, { form: 'thunder', prio: 2, speed: 0.2, chain: 1.6 }, { curve: 1, accuracy: 0.15 }, { pierce: 0.2, power: 0.15 }]);
  }
  get name(): string { return this.id ? BOSS_MAP[this.id]?.name ?? '' : ''; }

  init() {
    const e = this.e;
    if (this.id === 'giant_forward') {
      const fw = e.teams[1].players.find((p) => p.role === 'FW');
      if (fw) { fw.scale = 1.5; fw.giantT = 9999; }
    }
  }

  modsFor(p: Player): Partial<Mods> {
    const e = this.e;
    const m: Partial<Mods> = {};
    switch (this.id) {
      case 'iron_keeper': if (p.isGK) { m.gkSave = 0.6; m.gkReact = 0.4; } break;
      case 'flash_striker': if (p.role === 'FW') { m.speed = 0.25; m.sprint = 0.2; } break;
      case 'phantom_king': m.control = 0.2; break;
      case 'giant_forward': if (p.giantT > 1000) { m.body = 0.8; m.header = 0.5; m.shotPower = 0.15; } break;
      case 'world_champion': {
        Object.assign(m, ALL(0.05));
        if (this.phase >= 2) { m.speed = (m.speed ?? 0) + 0.15; m.sprint = (m.sprint ?? 0) + 0.1; }
        if (this.phase >= 3 && p.isGK) { m.gkSave = 0.5; m.gkReact = 0.3; }
        break;
      }
    }
    void e;
    return m;
  }

  gkReach(gk: Player): number {
    if (gk.side !== 1) return 0;
    if (this.id === 'iron_keeper') return 0.3;
    if (this.id === 'world_champion' && this.phase >= 3) return 0.2;
    return 0;
  }

  collectShot(charge: number, p: Player): ShotSpec[] {
    const out: ShotSpec[] = [];
    if (p.side !== 1) return out;
    if (this.id === 'fire_shooter' && this.fireCd <= 0 && charge >= 0.45) { this.fireCd = 9; out.push({ form: 'fire', prio: 4, power: 0.35, explode: 2, burn: 1 }); this.e.toast('🔥 BOSS 火焰射门！', '#f97316'); }
    if (this.aiSkills && this.aiShotCd <= 0 && charge >= 0.4) { this.aiShotCd = 12; out.push(this.aiShotSpec); }
    if (this.id === 'world_champion' && this.phase >= 4 && rand.chance(0.5)) out.push({ form: 'golden', prio: 3, power: 0.3, accuracy: 0.3 });
    return out;
  }

  phaseLabel(): string {
    if (this.id !== 'world_champion') return '';
    return ['', '第一阶段', '第二阶段：提速', '第三阶段：强化门将', '第四阶段：终极技能'][this.phase];
  }

  update(dt: number) {
    const e = this.e;
    if (e.phase !== 'play') return;
    this.t += dt; this.t2 += dt;
    if (this.fireCd > 0) this.fireCd -= dt;
    this.aiShotCd -= dt; this.aiDashCd -= dt;
    const opp = e.teams[1]; const me = e.teams[0];
    const carrierOpp = opp.players.find((p) => e.balls.some((b) => b.owner === p));
    const carrierMe = me.players.find((p) => e.balls.some((b) => b.owner === p));
    // 高难度 AI 技能组合：持球冲刺突破
    if (this.aiSkills && this.aiDashCd <= 0 && carrierOpp && !carrierOpp.isGK) {
      this.aiDashCd = 11; carrierOpp.addBuff({ speed: 0.5, sprint: 0.3 }, 2, 'ai_dash');
      e.particles.burst(carrierOpp.pos.clone().setY(0.6), ['#f87171', '#ffffff'], 12, 4, 0.4, 0.14, 0);
    }
    switch (this.id) {
      case 'flash_striker':
        if (this.t > 8 && carrierOpp && carrierOpp.role === 'FW') {
          this.t = 0;
          const dir = new THREE.Vector3(e.oppGoalX(opp) - carrierOpp.pos.x, 0, -carrierOpp.pos.z).normalize();
          const to = carrierOpp.pos.clone().addScaledVector(dir, 3.5);
          to.x = Math.max(-19, Math.min(19, to.x));
          e.fx.burstAt(carrierOpp.pos.clone().setY(1), ['#fde047', '#ffffff'], 16);
          carrierOpp.pos.copy(to);
          const b = e.balls.find((x) => x.owner === carrierOpp); if (b) b.pos.set(to.x + dir.x * 0.6, b.r, to.z + dir.z * 0.6);
          e.fx.burstAt(to.clone().setY(1), ['#fde047', '#ffffff'], 16);
          AudioManager.play('blink'); e.toast('⚡ 闪电前锋瞬间突破！', '#fde047');
        }
        break;
      case 'frost_mid':
        if (this.t > 12) {
          this.t = 0;
          const c = (carrierMe ?? e.controlled)?.pos.clone() ?? new THREE.Vector3();
          c.y = 0;
          iceZone(e.fx, c, 3.5, 5); AudioManager.play('ice');
          e.zones.push({ pos: c, r: 3.5, t: 5, slow: 0.5, side: 0, color: '#bae6fd' });
          e.toast('❄️ 冰霜中场冻结了球场区域！', '#67e8f9');
        }
        break;
      case 'phantom_king':
        if (this.t > 14 && carrierOpp) { this.t = 0; for (let i = 0; i < 2; i++) e.spawnClone(carrierOpp, 'attack', 5, i, 2); e.toast('👻 幻影球王召唤分身！', '#a78bfa'); }
        break;
      case 'thunder_back':
        if (this.t > 9 && carrierMe) {
          const df = opp.players.find((p) => p.role === 'DF' && !p.sentOff && p.pos.distanceTo(carrierMe.pos) < 7);
          if (df) {
            this.t = 0;
            lightningStrike(e.fx, carrierMe.pos); e.fx.bolt(df.pos.clone().setY(1.5), carrierMe.pos.clone().setY(1), '#fde047');
            AudioManager.play('thunder', 0.7);
            if (carrierMe.applyStatus('stun', 1.0)) { e.bus.emit('hit', { victim: carrierMe, attacker: df }); for (const b of e.balls) if (b.owner === carrierMe) b.owner = null; }
            e.toast('🌩️ 雷霆后卫闪电拦截！', '#facc15');
          }
        }
        break;
      case 'world_champion': {
        const trailing = e.score[1] < e.score[0];
        const prev = this.phase;
        if (this.phase < 2 && (trailing || this.t2 > 60)) this.phase = 2;
        if (this.phase < 3 && e.period >= 2) this.phase = 3;
        if (this.phase < 4 && e.period >= 2 && (e.periodRemaining() < 40 || (trailing && e.periodRemaining() < 70))) this.phase = 4;
        if (this.phase !== prev) { e.banner(`🏆 世界冠军队 · ${this.phaseLabel()}`, 'BOSS 阶段转换', '#fbbf24'); AudioManager.play('golden'); }
        if (this.phase >= 4 && !this.ultUsed) {
          this.ultUsed = true;
          // 终极团队技能：神之领域（对手版）
          for (const p of opp.players) if (!p.sentOff) p.addBuff(ALL(0.25), 8, 'boss_god');
          for (const p of me.players) if (!p.sentOff) p.applyStatus('slow', 6, 0.3);
          const gk = opp.players.find((p) => p.isGK);
          ultimateBurst(e.fx, gk?.pos ?? new THREE.Vector3(), '#fbbf24');
          e.flashScreen('#fbbf24'); e.shake(0.8);
          e.banner('✨ 神之领域', '世界冠军队释放终极团队技能！', '#fde047', true);
          AudioManager.play('ultimate');
        }
        break;
      }
    }
  }
}
