import * as THREE from 'three';
import type { GameEngine } from '../core/GameEngine';
import type { MatchSetup } from '../core/GameState';
import type { Player } from '../player/Player';
import { SkillDef, DefenseSpec, ShotSpec, OwnedSkill } from '../types';
import { SKILL_MAP, scaleOps, skillShot, skillCooldown } from './SkillRegistry';
import { SkillExecutor } from './SkillExecutor';
import { CDR_CAP } from '../../utils/balance';
import { clamp, pointSegDist } from '../../utils/math';
import { AudioManager } from '../audio/AudioManager';
import { playSkillVfx } from '../vfx/SkillVfx';
import { EQUIP_MAP } from '../../data/equipment';

export interface SkillSlot { def: SkillDef; lv: number }
interface DefSlot { slot: SkillSlot; spec: DefenseSpec; key: string }

/** 技能管理器：技能槽、冷却、释放条件、触发型防守技能、射门技能叠加 */
export class SkillManager {
  actives: SkillSlot[] = []; shots: SkillSlot[] = []; defenses: DefSlot[] = [];
  cds = new Map<string, number>(); maxCd = new Map<string, number>();
  selected = 0;
  nextShot: { spec: ShotSpec; t: number; name: string } | null = null;
  nextPassT = 0;
  uses = 0;
  exec: SkillExecutor;
  equipShots: ShotSpec[] = [];
  flashKey = '';
  constructor(private e: GameEngine, setup: MatchSetup) {
    this.exec = new SkillExecutor(e);
    this.rebuild(setup.skills);
    this.equipShots = setup.equipShots;
    const bus = e.bus;
    bus.on('tackleWin', (d: { p: Player; victim: Player }) => { if (d.p.side === 0) this.trigger('tackleWin', d.p, { victim: d.victim }); });
    bus.on('hit', (d: { victim: Player; attacker: Player }) => { if (d.victim.side === 0 && d.victim === e.controlled) this.trigger('hitTaken', d.victim, { attacker: d.attacker }); });
    bus.on('pass', (d: { p: Player; ball: { pos: THREE.Vector3; vel: THREE.Vector3 } }) => {
      if (d.p.side !== 1) return;
      const c = e.controlled; if (!c) return;
      const end = d.ball.pos.clone().addScaledVector(d.ball.vel, 0.9);
      for (const ds of this.defenses) if (ds.spec.trig === 'oppPassNear') {
        const dist = pointSegDist(c.pos.x, c.pos.z, d.ball.pos.x, d.ball.pos.z, end.x, end.z);
        if (dist < (ds.spec.radius ?? 6)) this.fire(ds, c, {});
      }
    });
    bus.on('shot', (d: { p: Player }) => { if (d.p.side === 1) this.trigger('oppShot', e.controlled, {}); });
    bus.on('ballLost', (d: { p: Player; pos: THREE.Vector3 }) => {
      if (d.p.side !== 0) return;
      if (d.pos.x * e.teams[0].dir < 0) this.trigger('ballLost', e.controlled, {});
    });
  }

  rebuild(skills: OwnedSkill[]) {
    this.actives = []; this.shots = []; this.defenses = [];
    for (const os of skills) {
      if (os.absorbedInto) continue;
      const def = SKILL_MAP[os.id]; if (!def) continue;
      const slot = { def, lv: os.level };
      if (def.baseCategory === 'active') this.actives.push(slot);
      if (def.shot && (def.baseCategory === 'shooting')) this.shots.push(slot);
      if (def.defense) def.defense.forEach((spec, i) => this.defenses.push({ slot, spec, key: `${def.id}#${i}` }));
    }
    this.actives = this.actives.slice(0, 4);
    if (this.selected >= this.actives.length) this.selected = 0;
  }

  cdr(): number { const c = this.e.controlled; return clamp((c ? c.mods.cdr : 0) + this.e.params.cdr, 0, CDR_CAP); }

  update(dt: number) {
    const e = this.e;
    for (const [k, v] of this.cds) if (v > 0) this.cds.set(k, Math.max(0, v - dt));
    if (this.nextShot) { this.nextShot.t -= dt; if (this.nextShot.t <= 0) this.nextShot = null; }
    if (this.nextPassT > 0) this.nextPassT -= dt;
    if (e.phase !== 'play') return;
    const c = e.controlled; if (!c || c.sentOff) return;
    const opps = e.teams[1].players.filter((p) => !p.sentOff);
    const carrier = opps.find((o) => e.balls.some((b) => b.owner === o));
    const ownGoal = new THREE.Vector3(e.ownGoalX(e.teams[0]), 0, 0);
    for (const ds of this.defenses) {
      const r = ds.spec.radius ?? 4;
      switch (ds.spec.trig) {
        case 'passive': this.exec.run(scaleOps(ds.spec.ops, ds.slot.lv), { self: c, lv: ds.slot.lv, def: ds.slot.def }); break;
        case 'ready': this.fire(ds, c, {}); break;
        case 'carrierNear': if (carrier && carrier.pos.distanceTo(c.pos) < r) this.fire(ds, c, {}); break;
        case 'crowded': if (opps.filter((o) => !o.isGK && o.pos.distanceTo(c.pos) < r).length >= 2) this.fire(ds, c, {}); break;
        case 'oppInThird': if (carrier && carrier.pos.x * e.teams[0].dir < -FIELD_THIRD) this.fire(ds, c, {}); break;
        case 'danger': if (carrier && carrier.pos.distanceTo(ownGoal) < r) this.fire(ds, c, {}); break;
      }
    }
  }

  private trigger(trig: string, self: Player | null, extra: { victim?: Player; attacker?: Player }) {
    if (!self || this.e.phase !== 'play') return;
    for (const ds of this.defenses) if (ds.spec.trig === trig) this.fire(ds, self, extra);
  }

  private fire(ds: DefSlot, self: Player, extra: { victim?: Player; attacker?: Player }) {
    if ((this.cds.get(ds.key) ?? 0) > 0) return;
    if (ds.spec.trig === 'ready' && ds.spec.ops.some((o) => o.t === 'shield') && self.shieldT > 0 && !ds.spec.ops.some((o) => o.t === 'barrier')) return;
    const cd = Math.max(1, ds.spec.cd * (1 - 0.06 * (ds.slot.lv - 1)) * (1 - this.cdr()));
    this.cds.set(ds.key, cd); this.maxCd.set(ds.key, cd);
    this.exec.run(scaleOps(ds.spec.ops, ds.slot.lv), { self, lv: ds.slot.lv, def: ds.slot.def, ...extra });
    AudioManager.play(ds.slot.def.sfx, 0.7);
    this.e.toast(`${ds.slot.def.icon} ${ds.slot.def.name}`, ds.slot.def.color);
    this.uses++;
    this.e.teams[0].stats.skillUses++;
    this.e.bus.emit('skillCast', { def: ds.slot.def });
  }

  cast(i: number) {
    const e = this.e;
    const slot = this.actives[i];
    const c = e.controlled;
    if (!slot || !c) return;
    if (e.phase !== 'play') { AudioManager.play('error'); return; }
    if (!c.canAct) { AudioManager.play('error'); return; }
    if ((this.cds.get(slot.def.id) ?? 0) > 0) { AudioManager.play('error'); return; }
    this.selected = i;
    const cd = skillCooldown(slot.def, slot.lv, this.cdr());
    this.cds.set(slot.def.id, cd); this.maxCd.set(slot.def.id, cd);
    this.exec.run(scaleOps(slot.def.active, slot.lv), { self: c, lv: slot.lv, def: slot.def });
    AudioManager.play(slot.def.sfx);
    playSkillVfx(e.fx, slot.def.vfx, c.pos, slot.def.color);
    this.uses++;
    e.teams[0].stats.skillUses++;
    this.flashKey = slot.def.id;
    e.bus.emit('skillCast', { def: slot.def });
  }
  castSelected() { this.cast(this.selected); }
  cycle() { if (this.actives.length) this.selected = (this.selected + 1) % this.actives.length; }

  /** 射门时收集可触发的射门技能、下一次射门强化与装备足球属性（按形态优先级合并） */
  collectShot(charge: number, p: Player): ShotSpec[] {
    const out: ShotSpec[] = [];
    if (!p.ctrl) return out;
    if (charge >= 0.4) {
      for (const s of this.shots) {
        if ((this.cds.get(s.def.id) ?? 0) > 0) continue;
        const sp = skillShot(s.def, s.lv);
        if (!sp) continue;
        out.push(sp);
        const cd = skillCooldown(s.def, s.lv, this.cdr());
        this.cds.set(s.def.id, cd); this.maxCd.set(s.def.id, cd);
        this.uses++; this.e.teams[0].stats.skillUses++;
        this.e.toast(`${s.def.icon} ${s.def.name}`, s.def.color);
        this.e.bus.emit('skillCast', { def: s.def });
      }
    }
    if (this.nextShot) { out.push(this.nextShot.spec); this.nextShot = null; }
    if (charge >= 0.5) out.push(...this.equipShots);
    return out;
  }
  consumeMagnet(): boolean { return this.nextPassT > 0; }
  cutCooldowns(s: number) { for (const [k, v] of this.cds) this.cds.set(k, Math.max(0, v - s)); }

  hud() {
    const list = this.actives.map((s, i) => ({
      id: s.def.id, icon: s.def.icon, name: s.def.name, color: s.def.color, lv: s.lv, key: String(i + 1),
      cd: this.cds.get(s.def.id) ?? 0, max: this.maxCd.get(s.def.id) ?? 1, selected: i === this.selected, kind: 'active' as const,
    }));
    const shots = this.shots.map((s) => ({ id: s.def.id, icon: s.def.icon, name: s.def.name, color: s.def.color, lv: s.lv, key: '', cd: this.cds.get(s.def.id) ?? 0, max: this.maxCd.get(s.def.id) ?? 1, selected: false, kind: 'shot' as const }));
    const defs = this.defenses.filter((d) => d.spec.trig !== 'passive').map((d) => ({ id: d.key, icon: d.slot.def.icon, name: d.slot.def.name, color: d.slot.def.color, lv: d.slot.lv, key: '', cd: this.cds.get(d.key) ?? 0, max: this.maxCd.get(d.key) ?? 1, selected: false, kind: 'def' as const }));
    return { list, shots, defs, nextShot: this.nextShot?.name ?? null, magnet: this.nextPassT > 0 };
  }
}
const FIELD_THIRD = 7;
void EQUIP_MAP; void playSkillVfx;
