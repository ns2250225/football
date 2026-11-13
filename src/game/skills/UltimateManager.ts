import type { GameEngine } from '../core/GameEngine';
import type { MatchSetup } from '../core/GameState';
import { SkillDef } from '../types';
import { SKILL_MAP, scaleOps } from './SkillRegistry';
import { AudioManager } from '../audio/AudioManager';
import { ultimateBurst } from '../vfx/UltimateEffect';
import { clamp } from '../../utils/math';

export type UltSource = 'goal' | 'assist' | 'tackle' | 'save' | 'dribble' | 'onTarget';
const CHARGE: Record<UltSource, number> = { goal: 0.4, assist: 0.2, tackle: 0.1, save: 0.15, dribble: 0.05, onTarget: 0.05 };

/** 大招管理：充能（上限 100%，不溢出）与释放 */
export class UltimateManager {
  charge = 0;
  def: SkillDef | null = null;
  lv = 1;
  uses = 0;
  constructor(private e: GameEngine, setup: MatchSetup) {
    this.set(setup.ultimate, setup.skills.find((s) => s.id === setup.ultimate)?.level ?? 1);
    this.charge = clamp(setup.ultStart, 0, 1);
  }
  set(id: string | null, lv: number) {
    this.def = id ? SKILL_MAP[id] ?? null : null;
    if (this.def && !this.def.ultimate) this.def = null;
    this.lv = lv;
  }
  add(src: UltSource) {
    const c = this.e.controlled;
    const mul = (1 + (c ? c.mods.ultCharge : 0)) * this.e.params.ultMul;
    const before = this.charge;
    this.charge = clamp(this.charge + CHARGE[src] * mul, 0, 1);
    if (before < 1 && this.charge >= 1 && this.def) { this.e.toast(`大招「${this.def.name}」已就绪！按 R 释放`, '#fde047'); AudioManager.play('golden', 0.6); }
  }
  ready(): boolean { return !!this.def && this.charge >= 1; }
  cast() {
    const e = this.e;
    const c = e.controlled;
    if (!this.def || !c) return;
    if (this.charge < 1 || e.phase !== 'play' || c.sentOff) { AudioManager.play('error'); return; }
    this.charge = 0;
    this.uses++;
    e.teams[0].stats.ultUses++;
    // 全屏级视觉反馈
    e.slowmo(0.6);
    e.shake(1.0);
    e.flashScreen(this.def.color);
    e.banner(`${this.def.icon} ${this.def.name}`, '终极大招', this.def.color, true);
    ultimateBurst(e.fx, c.pos, this.def.color);
    AudioManager.play('ultimate');
    e.skills.exec.run(scaleOps(this.def.ultimate, this.lv), { self: c, lv: this.lv, def: this.def });
    e.bus.emit('ultCast', { def: this.def });
  }
}
