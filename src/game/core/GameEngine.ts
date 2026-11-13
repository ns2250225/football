import * as THREE from 'three';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { ShaderPass } from 'three/examples/jsm/postprocessing/ShaderPass.js';
import { FXAAShader } from 'three/examples/jsm/shaders/FXAAShader.js';
import { TeamDef, KitDef, TacticMode, MatchParams, Mods, makeMods, addMods, ANIM_LIST, AnimName, GoalEvent, CardEvent, MissionInstance, PlayerAttrs, TACTIC_NAMES, STAGE_NAME } from '../types';
import { MatchSetup, EngineCallbacks, MatchOutcome, Phase, TeamMatchStats, emptyTeamStats, PlayerMatchStat } from './GameState';
import { EventBus } from './EventBus';
import { GameLoop } from './GameLoop';
import { Input } from './Input';
import { Player, Buff } from '../player/Player';
import { PlayerModel, pickGkKit } from '../player/PlayerModel';
import { applyPose } from '../player/AnimationManager';
import { TeamAI } from '../player/TeamAI';
import { PlayerAI } from '../player/PlayerAI';
import { GoalkeeperAI } from '../player/GoalkeeperAI';
import { PlayerController } from '../player/PlayerController';
import { TeamPassiveRuntime } from '../player/TeamPassives';
import { Ball } from '../football/Football';
import { stepBall, ballVsPlayers, playersCollide } from '../football/Physics';
import { ShotSystem } from '../football/ShootingSystem';
import { PassSystem } from '../football/PassingSystem';
import { checkBall } from '../football/GoalDetector';
import { MatchRules, SP_NAME } from '../football/MatchRules';
import { LivePenalties } from '../football/LivePenalties';
import { SkillManager } from '../skills/SkillManager';
import { UltimateManager } from '../skills/UltimateManager';
import { BossSystem } from '../skills/BossSystem';
import { Stadium } from '../world/Stadium';
import { ParticleManager } from '../vfx/ParticleManager';
import { EffectsManager } from '../vfx/EffectsManager';
import { lightningStrike } from '../vfx/LightningEffect';
import { AudioManager } from '../audio/AudioManager';
import { computeParams } from '../roguelike/EventManager';
import { EVENT_MAP } from '../../data/events';
import { BOSS_MAP } from '../../data/bosses';
import { WEATHER_MAP } from '../../data/stadiums';
import { FIELD, PHYS } from '../../utils/physics';
import { clamp, colorDist, lerp } from '../../utils/math';
import { rand } from '../../utils/random';
import { scaleFor } from '../../utils/balance';
import { useHud, HudToast } from '../../store/hudStore';

export interface TeamRuntime {
  side: 0 | 1; def: TeamDef; dir: 1 | -1; players: Player[]; kit: KitDef; gkKit: KitDef; aiMode: TacticMode; buffs: Buff[];
  passive: TeamPassiveRuntime; stats: TeamMatchStats; mult: number; aiSkill: number; gkInvT: number; color: string;
}
export interface Clone { pos: THREE.Vector3; vel: THREE.Vector3; side: 0 | 1; mode: 'attack' | 'defense'; t: number; max: number; model: PlayerModel; owner: Player; idx: number; count: number }
export interface Zone { pos: THREE.Vector3; r: number; t: number; slow: number; side: 0 | 1; color: string }
export interface Barrier { side: 0 | 1; hits: number; handle: { remove: () => void } }
interface Replay { frames: Float32Array[]; label: string; side: 0 | 1 }

const ALL_KEYS: (keyof Mods)[] = ['speed', 'sprint', 'shotPower', 'shotAccuracy', 'control', 'passAccuracy', 'tackle', 'body'];
const XP_TABLE = { pass: 5, long: 8, tackle: 10, dribble: 10, onTarget: 15, assist: 30, goal: 50, save: 20, pass5: 15, dribble3: 20, hatTrick: 50, lateWinner: 40 };

export class GameEngine {
  setup: MatchSetup; cb: EngineCallbacks;
  renderer: THREE.WebGLRenderer; scene = new THREE.Scene(); camera: THREE.PerspectiveCamera; composer: EffectComposer | null = null;
  loop: GameLoop; input = new Input(); bus = new EventBus();
  particles: ParticleManager; fx: EffectsManager; stadium: Stadium;
  teams: [TeamRuntime, TeamRuntime]; players: Player[] = []; balls: Ball[] = [];
  clones: Clone[] = []; zones: Zone[] = []; barriers: Barrier[] = []; postGuard: [number, number] = [0, 0];
  params: MatchParams; goalW: number; goalH: number; windVec = new THREE.Vector3();
  phase: Phase = 'intro'; phaseT = 3; period = 1; clock = 0; simT = 0; halfLen: number; etLen: number;
  score: [number, number] = [0, 0]; pens: [number, number] | undefined;
  scorers: GoalEvent[] = []; cards: CardEvent[] = []; injuries = new Set<string>();
  controlled!: Player; requestPass: Player | null = null; tacticOverride: TacticMode | null = null;
  rules: MatchRules; shots: ShotSystem; passes: PassSystem; teamAI: TeamAI; playerAI: PlayerAI; gkAI: GoalkeeperAI; controller: PlayerController;
  skills: SkillManager; ult: UltimateManager; boss: BossSystem; penalties: LivePenalties;
  pauseReasons = new Set<string>(); timeScale = 1; slowT = 0; shakeAmt = 0; kickoffFirst: 0 | 1;
  private timers: { t: number; fn: () => void }[] = [];
  private toastList: (HudToast & { until: number })[] = []; private toastId = 1;
  private bannerData: { id: number; text: string; sub: string; color: string; big: boolean; until: number } | null = null;
  private flashData: { id: number; color: string } | null = null;
  private hudT = 0; private camFocus = new THREE.Vector3(); private camPos = new THREE.Vector3(0, 30, 30);
  private recordT = 0; private frames: Float32Array[] = []; replays: Replay[] = [];
  private replayState: { r: Replay; t: number; onDone?: () => void; prev: Phase } | null = null;
  private lightningT = 6; private fireTrailT = 0; private sparkCd = 0;
  private consec: [number, number] = [0, 0]; private consecDribble: [number, number] = [0, 0];
  private lastOwner = new Map<Ball, Player>();
  xpEarned = 0; lvl: number; xp: number; xpNeed: number; wasTrailing = false; lateWinner = false; hatTrick = false;
  onPauseRequest: (() => void) | null = null; onTacticRequest: (() => void) | null = null; onHidden: (() => void) | null = null;
  disposed = false;
  private visHandler = () => { if (document.hidden) { this.pause('hidden'); AudioManager.suspend(); this.onHidden?.(); } else { AudioManager.resume(); this.resume('hidden'); } };
  private resizeHandler = () => this.resize();
  private ro: ResizeObserver | null = null;

  constructor(private container: HTMLElement, setup: MatchSetup, cb: EngineCallbacks) {
    this.setup = setup; this.cb = cb;
    this.lvl = setup.level; this.xp = setup.xp; this.xpNeed = setup.xpNeed;
    const q = setup.settings.quality;
    this.renderer = new THREE.WebGLRenderer({ antialias: q === 'high', powerPreference: 'high-performance' });
    const prScale = q === 'low' ? 0.7 : q === 'medium' ? 0.85 : 1;
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2) * prScale);
    this.renderer.shadowMap.enabled = q !== 'low';
    this.renderer.shadowMap.type = q === 'high' ? THREE.PCFSoftShadowMap : THREE.PCFShadowMap;
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    container.appendChild(this.renderer.domElement);
    this.renderer.domElement.style.display = 'block';
    this.camera = new THREE.PerspectiveCamera(48, 1, 0.5, 900);
    if (q === 'medium') {
      this.composer = new EffectComposer(this.renderer);
      this.composer.addPass(new RenderPass(this.scene, this.camera));
      const fxaa = new ShaderPass(FXAAShader);
      this.composer.addPass(fxaa);
      (this as unknown as { fxaa: ShaderPass }).fxaa = fxaa;
    }
    // 比赛参数（天气 + 事件）
    this.params = computeParams(setup.events, setup.weather);
    this.goalW = FIELD.goalW * this.params.goalScale;
    this.goalH = FIELD.goalH * (1 + (this.params.goalScale - 1) * 0.5);
    this.halfLen = setup.halfLength; this.etLen = setup.halfLength * (60 / 90);
    const qk = q === 'low' ? 0.35 : q === 'medium' ? 0.7 : 1;
    this.particles = new ParticleManager(this.scene, q === 'low' ? 500 : q === 'medium' ? 1300 : 2600, qk);
    this.fx = new EffectsManager(this.scene, this.particles);
    // 球队
    const pt = setup.playerTeam, ot = setup.oppTeam;
    const clash = colorDist(pt.home.shirt, ot.home.shirt) < 130 || colorDist(pt.home.shorts, ot.home.shirt) < 60;
    const oppKit = clash ? ot.away : ot.home;
    const gk0 = pickGkKit(pt.home.shirt, oppKit.shirt);
    const gk1 = pickGkKit(oppKit.shirt, gk0.shirt);
    const aiSkill = scaleFor(setup.oppMult, 'ai');
    this.teams = [
      this.makeTeam(0, pt, pt.home, gk0, 1, 0.85, '#22d3ee'),
      this.makeTeam(1, ot, oppKit, gk1, setup.oppMult, aiSkill, '#f87171'),
    ];
    this.stadium = new Stadium(this.scene, setup.stadium, setup.weather, this.params.night, q, this.goalW, this.goalH, [pt.home.shirt, oppKit.shirt], (p) => lightningStrike(this.fx, p), setup.settings.brightness ?? 1);
    this.tacticOverride = setup.tactic ?? null;
    this.createPlayers(this.teams[0], setup.playerRoster, setup.coreId);
    this.createPlayers(this.teams[1], setup.oppRoster, '');
    this.balls.push(new Ball(true));
    if (this.params.doubleBall) this.balls.push(new Ball(false));
    for (const b of this.balls) { this.scene.add(b.mesh, b.shadow); }
    // 系统
    this.rules = new MatchRules(this); this.shots = new ShotSystem(this); this.passes = new PassSystem(this);
    this.teamAI = new TeamAI(this); this.playerAI = new PlayerAI(this); this.gkAI = new GoalkeeperAI(this);
    this.controller = new PlayerController(this, this.input);
    this.skills = new SkillManager(this, setup); this.ult = new UltimateManager(this, setup);
    this.boss = new BossSystem(this, setup.boss, setup.difficulty >= 3 || setup.extreme);
    this.penalties = new LivePenalties(this);
    this.boss.init();
    this.controlled = this.teams[0].players.find((p) => p.isCore) ?? this.teams[0].players[3];
    this.controlled.ctrl = true;
    this.kickoffFirst = rand.chance(0.5) ? 0 : 1;
    this.wireEvents();
    for (const p of this.players) this.refreshMods(p);
    for (const p of this.players) p.stamina = p.staminaMax;
    this.rules.arrange('kickoff', this.kickoffFirst, new THREE.Vector3(), this.teams[this.kickoffFirst].players[3]);
    this.balls[0].reset(0, 0);
    for (let i = 1; i < this.balls.length; i++) this.balls[i].reset(0, 6);
    this.input.attach();
    document.addEventListener('visibilitychange', this.visHandler);
    window.addEventListener('resize', this.resizeHandler);
    if (typeof ResizeObserver !== 'undefined') { this.ro = new ResizeObserver(() => this.resize()); this.ro.observe(container); }
    this.resize();
    AudioManager.startAmbience(setup.stadium.ambience);
    AudioManager.startMusic('match');
    this.loop = new GameLoop(PHYS.STEP, (dt) => this.update(dt), (dt) => this.render(dt));
    useHud.setState({
      homeCode: pt.code, awayCode: ot.code, homeColor: pt.home.shirt, awayColor: oppKit.shirt, stageLabel: setup.stageLabel,
      events: setup.events.map((id) => EVENT_MAP[id]).filter(Boolean).map((e) => ({ icon: e.icon, name: e.name, desc: e.desc })),
      boss: setup.boss ? { name: BOSS_MAP[setup.boss].name, icon: BOSS_MAP[setup.boss].icon, phase: '' } : null,
      weather: `${WEATHER_MAP[setup.weather].icon} ${WEATHER_MAP[setup.weather].name}`, stadium: setup.stadium.name, replay: false,
      score: [0, 0], toasts: [], banner: null, penalty: null, flash: null,
    });
    this.banner(`${pt.name} VS ${ot.name}`, `${setup.stageLabel} · ${setup.stadium.name}`, '#ffffff', true);
    if (setup.boss) this.delay(1.2, () => this.toast(`BOSS：${BOSS_MAP[setup.boss!].name} —— ${BOSS_MAP[setup.boss!].mech}`, '#f59e0b'));
    for (const id of setup.events) { const ev = EVENT_MAP[id]; if (ev) this.delay(1.6, () => this.toast(`特殊事件：${ev.icon} ${ev.name}`, '#a78bfa')); }
  }

  start() { this.loop.start(); }

  private makeTeam(side: 0 | 1, def: TeamDef, kit: KitDef, gkKit: KitDef, mult: number, aiSkill: number, color: string): TeamRuntime {
    const t: TeamRuntime = { side, def, dir: side === 0 ? 1 : -1, players: [], kit, gkKit, aiMode: def.defaultTactic, buffs: [], passive: null as unknown as TeamPassiveRuntime, stats: emptyTeamStats(), mult, aiSkill, gkInvT: 0, color };
    t.passive = new TeamPassiveRuntime(def.passive, t);
    return t;
  }

  private createPlayers(team: TeamRuntime, roster: MatchSetup['playerRoster'], coreId: string) {
    const q = this.setup.settings.quality;
    roster.slice(0, 5).forEach((rp, slot) => {
      const isCore = rp.id === coreId;
      const a: PlayerAttrs = { ...rp.attrs };
      if (team.side === 1) {
        const m = team.mult;
        a.speed *= scaleFor(m, 'speed'); a.sprint *= scaleFor(m, 'speed');
        for (const k of ['shotPower', 'shotAccuracy', 'control', 'passAccuracy', 'tackle', 'body', 'stamina'] as (keyof PlayerAttrs)[]) a[k] *= scaleFor(m, 'skill');
        a.gkSave *= scaleFor(m, 'gk');
      } else if (isCore) {
        for (const k of Object.keys(a) as (keyof PlayerAttrs)[]) a[k] = Math.min(99, a[k] + 8);
      }
      const isGK = rp.role === 'GK';
      const model = new PlayerModel({
        kit: isGK ? team.gkKit : team.kit, number: rp.number, isGK, height: rp.height, build: rp.build, skin: team.def.skin[rp.skinIdx % team.def.skin.length],
        hair: team.def.hair[rp.hairIdx % team.def.hair.length], accessory: rp.accessory, flag: team.def.flag, ringColor: team.color, teamKey: team.def.id + (isGK ? 'gk' : team.kit === team.def.away ? 'a' : 'h'), isCore, role: rp.role,
      });
      model.setShadows(q !== 'low');
      this.scene.add(model.root);
      const p = new Player(team, rp, slot, model, a, isCore);
      team.players.push(p);
      this.players.push(p);
    });
  }

  // ===================== 工具方法 =====================
  oppGoalX(t: TeamRuntime): number { return t.dir * FIELD.L / 2; }
  ownGoalX(t: TeamRuntime): number { return -t.dir * FIELD.L / 2; }
  teammates(p: Player, includeSelf = false): Player[] { return p.team.players.filter((m) => includeSelf || m !== p); }
  opponents(p: Player): Player[] { return this.teams[1 - p.side].players; }
  setPhase(ph: Phase) { this.phase = ph; }
  delay(t: number, fn: () => void) { this.timers.push({ t, fn }); }
  shake(a: number) { if (this.setup.settings.shake) this.shakeAmt = Math.max(this.shakeAmt, a); }
  slowmo(t: number) { this.slowT = Math.max(this.slowT, t); }
  flashScreen(color: string) { this.flashData = { id: this.toastId++, color }; }
  toast(text: string, color = '#ffffff') {
    if (!this.setup.settings.hints && !/进球|红牌|黄牌|大招|进化|BOSS/.test(text)) return;
    this.toastList.push({ id: this.toastId++, text, color, until: performance.now() + 2600 });
    if (this.toastList.length > 5) this.toastList.shift();
  }
  banner(text: string, sub: string, color: string, big = false) { this.bannerData = { id: this.toastId++, text, sub, color, big, until: performance.now() + (big ? 2400 : 1800) }; }
  pause(reason: string) { this.pauseReasons.add(reason); }
  resume(reason: string) { this.pauseReasons.delete(reason); }
  get paused(): boolean { return this.pauseReasons.size > 0; }
  requestPause() { this.onPauseRequest?.(); }
  requestTactic() { this.onTacticRequest?.(); }
  remainingFrac(): number { const len = this.period === 3 ? this.etLen : this.halfLen; return this.period === 1 ? 1 - this.clock / (len * 2) : this.period === 2 ? (len - this.clock) / (len * 2) : (len - this.clock) / len; }
  periodTime(): number { return this.clock; }
  periodRemaining(): number { return (this.period === 3 ? this.etLen : this.halfLen) - this.clock; }
  displayTime(): number { return this.period === 1 ? this.clock : this.period === 2 ? this.halfLen + this.clock : this.halfLen * 2 + this.clock; }
  minute(): number { const d = this.displayTime(); return this.period <= 2 ? Math.max(1, Math.ceil((d / (this.halfLen * 2)) * 90)) : 90 + Math.max(1, Math.ceil((this.clock / this.etLen) * 30)); }
  setLevelInfo(lvl: number, xp: number, need: number) { this.lvl = lvl; this.xp = xp; this.xpNeed = need; }

  addXp(amount: number, _why?: string) {
    const mul = (1 + this.setup.buildMods.xpMul) * this.params.xpMul;
    const v = Math.round(amount * mul);
    this.xpEarned += v;
    this.cb.onXp(v);
  }

  switchTo(p: Player, emit = true) {
    if (!p || p.sentOff || p === this.controlled) return;
    if (this.controlled) this.controlled.ctrl = false;
    this.controlled = p; p.ctrl = true;
    p.switchT = 2; this.controller.charge = 0; this.controller.charging = false;
    if (emit) this.bus.emit('switch', { p });
  }
  switchNearest() {
    const b = this.balls[0];
    const cands = this.teams[0].players.filter((p) => !p.sentOff && !p.isGK && p !== this.controlled);
    cands.sort((a, c) => a.pos.distanceTo(b.pos) - c.pos.distanceTo(b.pos));
    if (cands[0]) { this.switchTo(cands[0]); AudioManager.play('select'); }
  }
  callForPass(p: Player) { this.requestPass = p; this.toast('要球！', '#93c5fd'); this.delay(2, () => { if (this.requestPass === p) this.requestPass = null; }); }

  sendOff(p: Player) {
    p.sentOff = true; p.model.root.visible = false; p.pos.set(0, -50, FIELD.W);
    for (const b of this.balls) if (b.owner === p) b.owner = null;
    if (p === this.controlled) this.switchNearest();
  }
  recordCard(p: Player, type: 'yellow' | 'red') {
    this.cards.push({ team: p.team.def.id, name: p.name, minute: this.minute(), type });
    if (type === 'yellow') p.team.stats.yellow++; else p.team.stats.red++;
    this.bus.emit('card', { p, type });
  }

  spawnClone(owner: Player, mode: 'attack' | 'defense', dur: number, idx: number, count: number) {
    const t = owner.team;
    const model = new PlayerModel({ kit: t.kit, number: owner.rp.number, isGK: false, height: owner.rp.height, build: owner.rp.build, skin: '#c4b5fd', hair: '#6d28d9', accessory: 0, flag: null, ringColor: '#a78bfa', teamKey: 'ghost', ghost: true });
    this.scene.add(model.root);
    const pos = owner.pos.clone();
    if (mode === 'defense') pos.set(this.ownGoalX(t) + t.dir * 3, 0, (idx - (count - 1) / 2) * 2);
    else pos.add(new THREE.Vector3(0, 0, (idx % 2 ? 1 : -1) * 1.6));
    this.clones.push({ pos, vel: new THREE.Vector3(), side: owner.side, mode, t: dur, max: dur, model, owner, idx, count });
  }

  // ===================== 事件接线：经验、大招充能、统计、被动 =====================
  private wireEvents() {
    const bus = this.bus;
    const passive = (evt: string) => bus.on(evt as never, (d: { p?: Player; victim?: Player }) => { for (const t of this.teams) t.passive.on(evt, d, this); });
    ['dribblePast', 'tackleWin', 'passComplete', 'intercept', 'ballLost', 'switch', 'possession', 'save', 'duelWin'].forEach(passive);
    bus.on('passComplete', (d: { p: Player; victim: Player; long: boolean }) => {
      const s = d.p.side;
      d.p.team.stats.passes++; if (d.long) d.p.team.stats.longPasses++; d.p.ms.passes++;
      this.consec[s]++; d.p.combo = Math.min(5, d.p.combo + 1); d.p.comboT = 6; d.victim.recvT = 3;
      if (s === 0) { this.addXp(d.long ? XP_TABLE.long : XP_TABLE.pass); if (this.consec[0] % 5 === 0) { this.addXp(XP_TABLE.pass5); this.toast('连续传球 ×5！', '#60a5fa'); } }
    });
    bus.on('intercept', (d: { p: Player }) => { this.consec[1 - d.p.side] = 0; d.p.team.stats.tackles++; d.p.ms.tackles++; if (d.p.side === 0) { this.addXp(XP_TABLE.tackle * 0.6); this.ult.add('tackle'); } });
    bus.on('tackleWin', (d: { p: Player; victim: Player }) => {
      d.p.team.stats.tackles++; d.p.ms.tackles++; d.p.combo = Math.min(5, d.p.combo + 1); d.p.comboT = 6;
      if (d.p.side === 0) {
        this.addXp(XP_TABLE.tackle); this.ult.add('tackle');
        for (const sp of this.setup.equipSpecials) {
          if (sp.kind === 'tackleStun') { d.victim.applyStatus('stun', sp.value); lightningStrike(this.fx, d.victim.pos); }
          if (sp.kind === 'counterRush') for (const m of this.teams[0].players) m.addBuff({ speed: sp.value }, 3, 'counter_charm');
        }
      }
    });
    bus.on('dribblePast', (d: { p: Player; victim: Player }) => {
      const s = d.p.side;
      d.p.team.stats.dribbles++; d.p.ms.dribbles++; this.consecDribble[s]++; d.p.combo = Math.min(5, d.p.combo + 1); d.p.comboT = 6;
      if (s === 0) {
        this.addXp(XP_TABLE.dribble);
        if (this.consecDribble[0] % 3 === 0) { this.addXp(XP_TABLE.dribble3); this.toast('连续过人 ×3！', '#a3e635'); }
        if (this.consecDribble[0] >= 2) this.ult.add('dribble');
        for (const sp of this.setup.equipSpecials) if (sp.kind === 'iceDribble' && d.p.ctrl) { d.victim.applyStatus('slow', 1.5, sp.value); this.particles.burst(d.victim.pos.clone().setY(0.5), ['#bae6fd', '#fff'], 10, 3, 0.4, 0.12, 0); }
      }
    });
    bus.on('ballLost', (d: { p: Player }) => { this.consec[d.p.side] = 0; this.consecDribble[d.p.side] = 0; d.p.combo = 0; });
    bus.on('shotOnTarget', (d: { p: Player }) => { if (d.p.side === 0) { this.addXp(XP_TABLE.onTarget); this.ult.add('onTarget'); } });
    bus.on('save', (d: { p: Player }) => { d.p.team.stats.saves++; d.p.ms.saves++; if (d.p.side === 0) { this.addXp(XP_TABLE.save); this.ult.add('save'); } });
    bus.on('header', (d: { p: Player }) => { d.p.team.stats.headers++; });
    bus.on('hit', (d: { victim: Player }) => {
      const v = d.victim;
      if (v.side === 0 && v.mods.shieldOnHit > 0 && v.shieldOnHitCd <= 0) { v.shieldT = Math.max(v.shieldT, v.mods.shieldOnHit); v.shieldHits = Math.max(v.shieldHits, 1); v.shieldOnHitCd = 8; }
    });
  }

  // ===================== 属性计算 =====================
  refreshMods(p: Player) {
    const m = makeMods();
    const t = p.team;
    if (p.side === 0) {
      const share = p.ctrl ? 1 : 0.45;
      addMods(m, this.setup.buildMods, share);
      if (p.isGK) { m.gkSave += this.setup.buildMods.gkSave * (1 - share); m.gkReact += this.setup.buildMods.gkReact * (1 - share); }
      const fat = this.setup.teamFatigue / 100;
      m.speed -= fat * 0.1; m.staminaMax -= fat * 0.25;
    }
    for (const b of p.buffs) addMods(m, b.mods);
    for (const b of t.buffs) addMods(m, b.mods);
    addMods(m, t.passive.mods(p, this));
    if (p.side === 1) addMods(m, this.boss.modsFor(p));
    const trailing = this.score[p.side] < this.score[1 - p.side];
    if (trailing && m.comebackAll > 0) for (const k of ALL_KEYS) m[k] += m.comebackAll;
    if (p.switchT > 0) m.speed += m.switchBoost;
    if (p.recvT > 0 && m.passCombo > 0) { m.passAccuracy += m.passCombo; m.shotAccuracy += m.passCombo; m.control += m.passCombo * 0.5; }
    if (p.combo > 0 && m.comboBonus > 0) { m.shotPower += m.comboBonus * p.combo; m.control += m.comboBonus * p.combo; }
    if (p.injured) { m.speed -= 0.15; m.sprint -= 0.1; }
    p.mods = m;
    const a = p.attrs;
    p.spd = (4.5 + (a.speed / 100) * 3.1) * clamp(1 + m.speed, 0.4, 2.6) * this.params.playerSpeed * p.staminaFactor();
    p.sprintMul = 1.28 + (a.sprint / 100) * 0.16 + clamp(m.sprint, -0.3, 1.5) * 0.5;
    p.shotPow = (0.72 + (a.shotPower / 100) * 0.45) * clamp(1 + m.shotPower, 0.5, 3);
    p.shotAcc = clamp(a.shotAccuracy / 100 + m.shotAccuracy * 0.5, 0.15, 0.99);
    p.ctl = clamp(a.control / 100 + m.control * 0.5, 0.1, 1.4);
    p.passAcc = clamp(a.passAccuracy / 100 + m.passAccuracy * 0.5, 0.2, 1);
    p.tkl = (a.tackle / 100) * clamp(1 + m.tackle, 0.3, 3);
    p.bod = (a.body / 100) * clamp(1 + m.body, 0.3, 3);
    p.gk = clamp((a.gkSave / 100) * (1 + m.gkSave), 0, 1.6);
    p.ctlRange = 0.8 * (1 + clamp(m.controlRange, 0, 1.2));
    const maxS = 100 * (0.75 + (a.stamina / 100) * 0.5) * clamp(1 + m.staminaMax, 0.5, 2.5);
    if (Math.abs(maxS - p.staminaMax) > 0.5) { const r = p.stamina / p.staminaMax; p.staminaMax = maxS; p.stamina = r * maxS; }
  }

  // ===================== 主循环 =====================
  private update(dt0: number) {
    if (this.disposed) return;
    if (this.replayState) return;
    // 暂停时依然处理暂停/战术键
    if (this.paused) return;
    if (this.slowT > 0) { this.slowT -= dt0; this.timeScale = 0.35; } else this.timeScale = 1;
    const dt = dt0 * this.timeScale;
    this.simT += dt;
    for (let i = this.timers.length - 1; i >= 0; i--) { const tm = this.timers[i]; tm.t -= dt; if (tm.t <= 0) { this.timers.splice(i, 1); tm.fn(); } }
    this.controller.update(dt);
    switch (this.phase) {
      case 'intro':
        this.phaseT -= dt;
        if (this.phaseT <= 0) { AudioManager.play('whistle'); this.rules.startKickoff(this.kickoffFirst); }
        this.updatePlayers(dt, false);
        return;
      case 'goal':
        this.phaseT -= dt;
        this.updatePlayers(dt, false);
        for (const b of this.balls) stepBall(this, b, dt);
        if (this.phaseT <= 0) this.afterGoal();
        return;
      case 'halftime': case 'fulltime': case 'ended': return;
      case 'penalties':
        this.penalties.update(dt);
        this.updatePlayers(dt, false);
        for (const b of this.balls) { stepBall(this, b, dt); ballVsPlayers(this, b); }
        this.shots.update(dt);
        return;
    }
    // play / dead / setpiece / kickoff
    if (this.phase === 'play') {
      this.clock += dt;
      const len = this.period === 3 ? this.etLen : this.halfLen;
      if (this.clock >= len) { this.endPeriod(); return; }
    }
    this.rules.update(dt);
    this.teamAI.update(dt);
    this.updatePlayers(dt, true);
    playersCollide(this);
    this.updateClones(dt);
    this.updateZones(dt);
    this.skills.update(dt);
    this.boss.update(dt);
    for (const t of this.teams) {
      t.passive.update(dt);
      if (t.gkInvT > 0) t.gkInvT -= dt;
      for (let i = t.buffs.length - 1; i >= 0; i--) { t.buffs[i].t -= dt; if (t.buffs[i].t <= 0) t.buffs.splice(i, 1); }
    }
    for (let i = 0; i < 2; i++) if (this.postGuard[i] > 0) this.postGuard[i] -= dt;
    this.updateEvents(dt);
    if (this.phase === 'play') {
      for (const b of this.balls) this.updatePossession(b, dt);
      for (const b of this.balls) { stepBall(this, b, dt); ballVsPlayers(this, b); }
      this.shots.update(dt);
      this.aiHeaders();
      this.dribbleCheck();
      for (const b of this.balls) {
        const ev = checkBall(this, b);
        if (!ev) continue;
        if (ev.type === 'goal') { this.onGoal(b, ev.scoringSide); break; }
        else { this.rules.out(b, ev.kind, ev.x, ev.z, ev.goalX); if (b.isMain) break; }
      }
      // 控球率
      const ob = this.balls[0].owner ?? this.balls[0].lastTouch;
      if (ob) ob.team.stats.possessionTime += dt;
      if (this.score[0] < this.score[1]) this.wasTrailing = true;
    } else {
      for (const b of this.balls) if (!b.owner || this.phase === 'dead') stepBall(this, b, dt);
    }
    this.record(dt);
  }

  private updatePlayers(dt: number, ai: boolean) {
    for (const p of this.players) {
      if (p.sentOff) continue;
      // 计时器
      p.touchCd -= dt; p.tackleCd -= dt; p.kickLock -= dt; p.shieldOnHitCd -= dt;
      if (p.freezeT > 0) p.freezeT -= dt;
      if (p.stunT > 0) p.stunT -= dt;
      if (p.knockT > 0) p.knockT -= dt;
      if (p.slowT > 0) { p.slowT -= dt; if (p.slowT <= 0) p.slowAmt = 0; }
      if (p.shieldT > 0) { p.shieldT -= dt; if (p.shieldT <= 0) p.shieldHits = 0; }
      if (p.giantT > 0 && p.giantT < 1000) { p.giantT -= dt; if (p.giantT <= 0) p.scale = 1; }
      if (p.switchT > 0) p.switchT -= dt;
      if (p.recvT > 0) p.recvT -= dt;
      if (p.comboT > 0) { p.comboT -= dt; if (p.comboT <= 0) p.combo = 0; }
      for (let i = p.buffs.length - 1; i >= 0; i--) { p.buffs[i].t -= dt; if (p.buffs[i].t <= 0) p.buffs.splice(i, 1); }
      if (p.stateT > 0) { p.stateT -= dt; if (p.stateT <= 0 && p.state !== 'normal') { p.state = 'normal'; } }
      p.modT -= dt;
      if (p.modT <= 0) { p.modT = 0.1; this.refreshMods(p); }
      // 决策
      if (ai) {
        if (p.ctrl) { /* 由 PlayerController 设定 desired */ }
        else if (p.isGK) this.gkAI.update(p, dt);
        else this.playerAI.update(p, dt);
      }
      // 体力
      const moving = p.vel.lengthSq() > 1;
      if (p.sprinting && moving) {
        const cost = 10 * clamp(1 + p.mods.staminaCost, 0.25, 2) * this.params.staminaDrain * dt;
        p.stamina -= cost; p.staminaUsed += cost;
        if (p.stamina <= 0) { p.stamina = 0; p.sprinting = false; }
      } else {
        const trailing = this.score[p.side] < this.score[1 - p.side];
        p.stamina += (5 + p.attrs.stamina * 0.05) * clamp(1 + p.mods.staminaRegen + (trailing ? p.mods.comebackRegen : 0), 0.3, 3) * dt;
      }
      p.stamina = clamp(p.stamina, 0, p.staminaMax);
      // 移动
      if (p.freezeT > 0) p.vel.set(0, 0, 0);
      else if (p.stunT > 0) p.vel.multiplyScalar(Math.max(0, 1 - 10 * dt));
      else if (p.knockT > 0 || p.state === 'fallen') p.vel.multiplyScalar(Math.max(0, 1 - 4 * dt));
      else if (p.dashT > 0) {
        p.dashT -= dt; p.vel.copy(p.dashVel);
        if (p.dashKnock > 0) for (const o of this.opponents(p)) if (!o.sentOff && !p.dashHit.has(o.id) && o.pos.distanceTo(p.pos) < 1.4) { p.dashHit.add(o.id); o.applyStatus('knock', 0.8, p.dashKnock, p.pos); this.bus.emit('hit', { victim: o, attacker: p }); for (const b of this.balls) if (b.owner === o) b.owner = null; }
        if (p.flying) this.particles.trail(p.pos.clone().setY(0.6 + p.jumpY), '#fb923c', 0.3, 0.4, 0.3);
        if (p.dashT <= 0) { p.flying = false; p.vel.multiplyScalar(0.4); }
      } else if (p.state === 'dive') p.vel.multiplyScalar(Math.max(0, 1 - 2.5 * dt));
      else if (p.state === 'slide') { p.vel.multiplyScalar(Math.max(0, 1 - 2.2 * dt)); this.slideCheck(p); }
      else if (p.state === 'stumble') p.vel.multiplyScalar(Math.max(0, 1 - 6 * dt));
      else {
        let slow = p.slowT > 0 ? 1 - p.slowAmt : 1;
        for (const z of this.zones) if (z.side === p.side && p.pos.distanceTo(z.pos) < z.r) slow *= 1 - z.slow;
        const accel = (this.params.friction < 0.7 ? 11 : 30) * (p.kickLock > 0 ? 0.4 : 1);
        const tx = p.desired.x * slow, tz = p.desired.z * slow;
        const dx = tx - p.vel.x, dz = tz - p.vel.z;
        const dl = Math.hypot(dx, dz), step = accel * dt;
        if (dl <= step) { p.vel.x = tx; p.vel.z = tz; } else { p.vel.x += (dx / dl) * step; p.vel.z += (dz / dl) * step; }
      }
      p.pos.x += p.vel.x * dt; p.pos.z += p.vel.z * dt;
      const lim = p.flying ? FIELD.L / 2 - 0.6 : FIELD.L / 2 + 1.6;
      p.pos.x = clamp(p.pos.x, -lim, lim); p.pos.z = clamp(p.pos.z, -FIELD.W / 2 - 1.3, FIELD.W / 2 + 1.3);
      // 跳跃 / 二段跳
      if (p.jumpV !== 0 || p.jumpY > 0) {
        p.jumpY += p.jumpV * dt; p.jumpV -= 19 * dt;
        if (p.jumpsLeft > 0 && p.jumpV < 0 && p.jumpY > 0.8) { const bb = this.balls[0]; if (bb.pos.y > p.jumpY + 1.4 && bb.pos.distanceTo(p.pos.clone().setY(bb.pos.y)) < 3) { p.jumpV = 7 * (1 + p.mods.jump * 0.5); p.jumpsLeft--; this.particles.burst(p.pos.clone().setY(p.jumpY), ['#86efac', '#fff'], 8, 3, 0.3, 0.12, 0); } }
        if (p.jumpY <= 0) { p.jumpY = 0; p.jumpV = 0; p.jumpsLeft = 0; }
      }
      // 朝向
      const sp = Math.hypot(p.vel.x, p.vel.z);
      if (sp > 0.5 && p.state === 'normal' && p.freezeT <= 0 && p.stunT <= 0) {
        const want = Math.atan2(p.vel.z, p.vel.x);
        let d = want - p.heading; while (d > Math.PI) d -= Math.PI * 2; while (d < -Math.PI) d += Math.PI * 2;
        const hasBall = this.balls.some((b) => b.owner === p);
        const rate = (hasBall ? 7 * (1 + p.mods.turnSpeed) : 13) * dt;
        p.heading += clamp(d, -rate, rate);
      }
      p.animT += dt;
    }
    // 火焰球鞋轨迹
    const c = this.controlled;
    if (c && c.sprinting && this.setup.equipSpecials.some((s) => s.kind === 'fireTrail')) {
      this.fireTrailT -= dt;
      if (this.fireTrailT <= 0) { this.fireTrailT = 0.18; const v = this.setup.equipSpecials.find((s) => s.kind === 'fireTrail')!.value; this.zones.push({ pos: c.pos.clone().setY(0), r: 0.9, t: 1.4, slow: v, side: 1, color: '#f97316' }); this.particles.burst(c.pos.clone().setY(0.2), ['#ff4500', '#fbbf24'], 4, 1.5, 0.5, 0.15, 2); }
    }
    if (this.sparkCd > 0) this.sparkCd -= dt;
  }

  private slideCheck(p: Player) {
    const reach = 1.05 * (1 + p.mods.tackleRange) * p.scale;
    for (const b of this.balls) {
      if (b.pos.distanceTo(p.pos.clone().setY(b.pos.y)) < reach && b.pos.y < 0.8) {
        const victim = b.owner && b.owner.side !== p.side ? b.owner : null;
        if (b.owner === p) continue;
        b.owner = null; b.shot = null;
        b.vel.copy(p.dir().multiplyScalar(7)).add(new THREE.Vector3(rand.range(-2, 2), 1.5, rand.range(-2, 2)));
        b.touch(p, this.simT);
        p.state = 'stumble'; p.stateT = 0.25;
        if (victim) { victim.applyStatus('stun', 0.4); victim.playAnim('Hit'); this.bus.emit('tackleWin', { p, victim }); this.bus.emit('ballLost', { p: victim, pos: victim.pos.clone() }); AudioManager.play('tackle'); }
        return;
      }
    }
    for (const o of this.opponents(p)) {
      if (o.sentOff || o.incapacitated) continue;
      if (o.pos.distanceTo(p.pos) < p.radius + o.radius + 0.1) {
        const behind = o.dir().dot(p.dir()) > 0.5;
        const immune = p.side === 0 && this.setup.slideImmune;
        p.state = 'stumble'; p.stateT = 0.4;
        if (!immune || rand.chance(0.3)) this.rules.foul(p, o, behind ? 0.8 : 0.5);
        else o.applyStatus('knock', 0.6, 3, p.pos);
        return;
      }
    }
  }

  /** 抢断 / 铲球 */
  tackle(p: Player, slide = false) {
    if (p.tackleCd > 0 || !p.canAct || this.phase !== 'play') return;
    p.tackleCd = 0.85;
    const immune = p.side === 0 && this.setup.slideImmune;
    if (slide && Math.hypot(p.vel.x, p.vel.z) > 3) {
      p.setState('slide', 0.55); p.playAnim('Tackle');
      p.vel.copy(p.dir().multiplyScalar(11 * (1 + p.mods.tackleRange * 0.4)));
      if (immune) p.shieldT = Math.max(p.shieldT, 0.6);
      AudioManager.play('tackle', 0.7);
      return;
    }
    p.playAnim('Pass');
    const reach = 1.55 * (1 + p.mods.tackleRange) * p.scale;
    const carrier = this.opponents(p).find((o) => !o.sentOff && this.balls.some((b) => b.owner === o) && o.pos.distanceTo(p.pos) < reach);
    if (!carrier) {
      const loose = this.balls.find((b) => !b.owner && b.pos.distanceTo(p.pos.clone().setY(b.pos.y)) < reach && b.pos.y < 0.9);
      if (loose) { loose.vel.add(p.dir().multiplyScalar(5)); loose.touch(p, this.simT); }
      return;
    }
    const ball = this.balls.find((b) => b.owner === carrier)!;
    if (carrier.isGK && this.gkAI.holdT.has(carrier.id) && this.rules.inBox(carrier.pos.x, carrier.pos.z, this.ownGoalX(carrier.team))) { p.setState('stumble', 0.3); return; }
    const toP = p.pos.clone().sub(carrier.pos).setY(0).normalize();
    const fromBehind = carrier.dir().dot(toP) < -0.4;
    if (carrier.shieldT > 0 && carrier.shieldHits > 0) {
      carrier.shieldHits--; if (carrier.shieldHits <= 0) carrier.shieldT = 0;
      this.fx.ring(carrier.pos, '#38bdf8', 0.3, 1.6, 0.4, 1); AudioManager.play('shield');
      p.setState('stumble', 0.5);
      return;
    }
    const chance = clamp(0.42 + (p.tkl - carrier.ctl) * 0.7 + (p.bod - carrier.bod) * 0.25 + (p.scale - carrier.scale) * 0.4 - (fromBehind ? 0.15 : 0), 0.08, 0.92);
    if (rand.chance(chance)) {
      ball.owner = null;
      ball.vel.copy(toP.multiplyScalar(3.5)).add(new THREE.Vector3(rand.range(-1, 1), 0.5, rand.range(-1, 1)));
      ball.touch(p, this.simT);
      p.touchCd = 0;
      carrier.applyStatus('stun', 0.35); carrier.playAnim('Hit');
      AudioManager.play('tackle');
      this.particles.burst(carrier.pos.clone().setY(0.4), ['#ffffff', '#a3a3a3'], 8, 3, 0.3, 0.12, -4);
      this.bus.emit('tackleWin', { p, victim: carrier });
      this.bus.emit('duelWin', { p });
      this.bus.emit('hit', { victim: carrier, attacker: p });
      this.bus.emit('ballLost', { p: carrier, pos: carrier.pos.clone() });
    } else {
      p.setState('stumble', 0.45);
      this.bus.emit('duelWin', { p: carrier });
      if (rand.chance((immune ? 0.04 : 0.1) + (fromBehind ? 0.25 : 0))) this.rules.foul(p, carrier, fromBehind ? 0.7 : 0.3);
    }
  }

  onBodyContact(a: Player, b: Player, wa: number, wb: number) {
    // 闪电球鞋：冲刺撞击麻痹
    if (this.sparkCd <= 0) {
      const sp = this.setup.equipSpecials.find((s) => s.kind === 'sprintSpark');
      if (sp) for (const [x, y] of [[a, b], [b, a]] as [Player, Player][]) if (x.ctrl && x.sprinting && y.side === 1) { y.applyStatus('stun', sp.value); this.sparkCd = 3; lightningStrike(this.fx, y.pos); AudioManager.play('zap'); }
    }
    // 身体对抗：明显更强壮的一方可能把持球者撞开
    for (const [x, y, wx, wy] of [[a, b, wa, wb], [b, a, wb, wa]] as [Player, Player, number, number][]) {
      const ball = this.balls.find((bb) => bb.owner === y);
      if (ball && wx > wy * 1.5 && rand.chance(0.02)) {
        ball.owner = null; ball.vel.add(x.dir().multiplyScalar(3));
        this.bus.emit('duelWin', { p: x }); this.bus.emit('ballLost', { p: y, pos: y.pos.clone() });
      }
    }
  }

  onBlock(p: Player, _b: Ball) { if (p.side === 0) this.toast(`${p.name} 封堵射门！`, '#93c5fd'); }

  /** 门将扑救判定（物理接触时） */
  gkContact(gk: Player, b: Ball, _fromAI: boolean) {
    const s = b.shot;
    if (!s || gk.gkSaveRolled.has(s)) return;
    gk.gkSaveRolled.add(s);
    const sp = b.vel.length();
    const inv = gk.team.gkInvT > 0;
    let chance = gk.gk * 0.95 - clamp((sp - 14) / 30, 0, 0.6) - (s.spec.pierce ?? 0) - s.by.mods.gkPierce * 0.8 + (gk.state === 'dive' ? 0.05 : 0.12);
    if (gk.incapacitated) chance = 0.15;
    chance = clamp(chance, 0.05, 0.93);
    if (inv) chance = 1;
    if (rand.chance(chance)) {
      this.shots.onImpact(b, 'save', gk);
      if (sp < 19 && rand.chance(0.55) && !gk.incapacitated) {
        b.owner = gk; b.vel.set(0, 0, 0); b.shot = null; b.passTo = null; b.touch(gk, this.simT);
        gk.playAnim('GoalkeeperCatch'); gk.state = 'normal';
        this.gkAI.holdT.set(gk.id, 0);
      } else {
        const d = Math.sign(this.ownGoalX(gk.team));
        b.vel.set(-d * Math.abs(b.vel.x) * 0.35 - d * 2, 2.5 + rand.next() * 3, b.vel.z * 0.3 + rand.range(-6, 6));
        b.shot = null; b.touch(gk, this.simT);
      }
      AudioManager.play('save');
      this.fx.flash(b.pos, '#ffffff', 0.8, 0.2);
      this.bus.emit('save', { p: gk });
      if (gk.side === 1 && this.phase === 'play') this.toast('被门将扑出！', '#f87171');
      if (gk.side === 0 && this.phase === 'play') this.toast(inv ? '绝对防御！' : '精彩扑救！', '#4ade80');
      if (inv) this.fx.ring(gk.pos, '#22c55e', 0.4, 3, 0.5, 1);
    } else {
      b.vel.multiplyScalar(0.9); b.vel.z += rand.range(-1, 1);
    }
  }

  // ===================== 控球（带球）=====================
  private updatePossession(b: Ball, dt: number) {
    const o = b.owner;
    if (o) {
      if (o.incapacitated || o.sentOff || o.state === 'slide') { this.release(b, o); return; }
      if (o.isGK && this.gkAI.holdT.has(o.id) && this.rules.inBox(o.pos.x, o.pos.z, this.ownGoalX(o.team))) return; // 门将手持
      const dir = o.dir();
      const spd = Math.hypot(o.vel.x, o.vel.z);
      const frac = spd / Math.max(1, o.spd * o.sprintMul);
      const lead = (0.5 + frac * 0.5) * o.scale;
      const tx = o.pos.x + dir.x * lead, tz = o.pos.z + dir.z * lead;
      const k = 6 + o.ctl * 9;
      const dvx = (tx - b.pos.x) * k + o.vel.x, dvz = (tz - b.pos.z) * k + o.vel.z;
      const f = Math.min(1, dt * (14 + o.ctl * 10));
      b.vel.x += (dvx - b.vel.x) * f; b.vel.z += (dvz - b.vel.z) * f;
      if (b.pos.y < b.r + 0.1 && o.jumpY === 0) { b.vel.y = Math.min(b.vel.y, 0); }
      if (Math.hypot(b.pos.x - o.pos.x, b.pos.z - o.pos.z) > 2.1) this.release(b, o);
      return;
    }
    // 无人控球：尝试停球（相对速度过快时停球失败，足球由物理反弹）
    let best: Player | null = null, bd = 99;
    for (const p of this.players) {
      if (p.sentOff || p.touchCd > 0 || !p.canAct || p.flying || p.dashT > 0) continue;
      if (p.isGK && b.shot && b.shot.side !== p.side) continue;
      const d = Math.hypot(b.pos.x - p.pos.x, b.pos.z - p.pos.z);
      const reach = p.ctlRange * p.scale + b.r;
      const feet = b.pos.y < 0.95 + p.jumpY;
      if (d < reach && feet && d < bd) { bd = d; best = p; }
    }
    if (!best) return;
    const rel = Math.hypot(b.vel.x - best.vel.x, b.vel.z - best.vel.z);
    let thresh = 10 + best.ctl * 12 + (b.passTo === best ? 6 : 0) + (best.isGK ? 5 : 0);
    if (b.shot && b.shot.side !== best.side) thresh -= 7;
    if (rel < thresh || rand.chance(best.ctl * 0.12)) this.gainPossession(best, b);
    else { best.touchCd = 0.25; }
  }

  private release(b: Ball, o: Player) {
    b.owner = null;
    b.vel.x += rand.range(-1.5, 1.5); b.vel.z += rand.range(-1.5, 1.5);
    o.touchCd = 0.4;
  }

  gainPossession(p: Player, b: Ball) {
    const from = b.passFrom;
    const prev = this.lastOwner.get(b);
    b.owner = p; b.touch(p, this.simT);
    if (b.shot && b.shot.side !== p.side) { if (p.isGK) this.bus.emit('save', { p }); }
    b.shot = null; b.passTo = null; b.magnet = null; b.pullT = 0; b.floatT = 0;
    if (from && from !== p) {
      if (from.side === p.side) this.bus.emit('passComplete', { p: from, victim: p, long: b.passLong });
      else { this.bus.emit('intercept', { p }); this.bus.emit('ballLost', { p: from, pos: from.pos.clone() }); }
    } else if (prev && prev.side !== p.side) this.bus.emit('ballLost', { p: prev, pos: prev.pos.clone() });
    b.passFrom = null;
    this.lastOwner.set(b, p);
    p.dribbleSeen.clear();
    this.bus.emit('possession', { p, ball: b });
    if (p.side === 0 && this.setup.settings.autoSwitch && !p.isGK && p !== this.controlled && b.isMain) this.switchTo(p);
    if (p.side === 1 && b.isMain && this.controlled && this.setup.settings.autoSwitch) {
      // 丢球后自动切换到离球最近的队员
      const near = this.teams[0].players.filter((x) => !x.sentOff && !x.isGK).sort((x, y) => x.pos.distanceTo(b.pos) - y.pos.distanceTo(b.pos))[0];
      if (near && near !== this.controlled && near.pos.distanceTo(b.pos) + 3 < this.controlled.pos.distanceTo(b.pos)) this.switchTo(near, false);
    }
  }

  /** AI 头球：进攻方门前争顶、防守方解围 */
  private aiHeaders() {
    for (const b of this.balls) {
      if (b.owner || b.pos.y < 1.25 || b.pos.y > 2.9) continue;
      for (const p of this.players) {
        if (p.ctrl || p.isGK || p.sentOff || !p.canAct || p.touchCd > 0) continue;
        const d = Math.hypot(b.pos.x - p.pos.x, b.pos.z - p.pos.z);
        if (d > 0.9 * p.scale || b.pos.y > p.height + p.jumpY + 0.6) continue;
        const gx = this.oppGoalX(p.team);
        const headerSkill = 0.4 + p.mods.header + (p.team.def.profile.aerial - 0.5) * 0.4;
        if (!rand.chance(clamp(headerSkill, 0.15, 0.95))) { p.touchCd = 0.3; continue; }
        if (Math.abs(gx - p.pos.x) < 12) { this.shots.shoot(p, 0.6, { z: null, high: 0.2 }, [], { header: true }); this.bus.emit('header', { p }); }
        else { b.vel.set(-Math.sign(this.ownGoalX(p.team)) * 9, 5, rand.range(-4, 4)); b.touch(p, this.simT); p.touchCd = 0.4; p.playAnim('Header'); this.bus.emit('header', { p }); }
        break;
      }
    }
  }

  /** 过人判定：对手从持球者前方被甩到身后 */
  private dribbleCheck() {
    for (const b of this.balls) {
      const c = b.owner; if (!c || c.isGK) continue;
      for (const o of this.opponents(c)) {
        if (o.sentOff || o.isGK) continue;
        const rx = o.pos.x - c.pos.x, rz = o.pos.z - c.pos.z;
        const along = rx * c.team.dir, lat = Math.abs(rz), d = Math.hypot(rx, rz);
        const st = c.dribbleSeen.get(o.id);
        if (st === undefined && along > 0 && along < 2.4 && lat < 1.7) c.dribbleSeen.set(o.id, 1);
        else if (st === 1 && along < -0.7 && d < 3.5) { c.dribbleSeen.set(o.id, 2); this.bus.emit('dribblePast', { p: c, victim: o }); }
        else if (st === 1 && d > 4.5) c.dribbleSeen.delete(o.id);
      }
    }
  }

  private updateClones(dt: number) {
    for (let i = this.clones.length - 1; i >= 0; i--) {
      const c = this.clones[i];
      c.t -= dt;
      if (c.t <= 0 || c.owner.sentOff) { c.model.root.removeFromParent(); this.particles.burst(c.pos.clone().setY(1), ['#a78bfa', '#fff'], 10, 3, 0.4, 0.14, 0); this.clones.splice(i, 1); continue; }
      const t = c.owner.team;
      let target: THREE.Vector3;
      if (c.mode === 'attack') {
        const side = (c.idx % 2 ? 1 : -1) * (1.6 + Math.floor(c.idx / 2) * 1.4);
        const fwd = c.owner.dir();
        const lat = new THREE.Vector3(-fwd.z, 0, fwd.x);
        target = c.owner.pos.clone().addScaledVector(lat, side).addScaledVector(fwd, 0.8 + Math.sin(this.simT * 3 + c.idx) * 0.8);
        // 迷惑附近防守者
        for (const o of this.teams[1 - c.side].players) {
          if (o.sentOff || o.isGK || o.confuseT > 0) continue;
          if (o.pos.distanceTo(c.pos) < 5 && rand.chance(0.6 * dt)) { o.confusedBy = c.pos; o.confuseT = 1.4; }
        }
      } else {
        const gx = this.ownGoalX(t);
        const bz = this.balls[0].pos.z;
        target = new THREE.Vector3(gx + t.dir * (2.5 + c.idx), 0, clamp(bz * 0.5, -this.goalW / 2, this.goalW / 2) + (c.idx - (c.count - 1) / 2) * 1.2);
        for (const o of this.teams[1 - c.side].players) if (!o.sentOff && o.pos.distanceTo(c.pos) < 2) { o.slowT = Math.max(o.slowT, 0.3); o.slowAmt = Math.max(o.slowAmt, 0.3); }
      }
      const to = target.sub(c.pos).setY(0);
      const d = to.length();
      const sp = Math.min(d * 6, 12);
      if (d > 0.05) c.vel.copy(to.normalize().multiplyScalar(sp)); else c.vel.set(0, 0, 0);
      c.pos.addScaledVector(c.vel, dt);
    }
  }

  private updateZones(dt: number) {
    for (let i = this.zones.length - 1; i >= 0; i--) { this.zones[i].t -= dt; if (this.zones[i].t <= 0) this.zones.splice(i, 1); }
  }

  /** 特殊事件运行：雷暴闪电、狂风 */
  private updateEvents(dt: number) {
    if (this.params.wind > 0) this.windVec.copy(this.stadium.weather.windVector(this.params.wind, this.simT));
    if (this.params.lightning && this.phase === 'play') {
      this.lightningT -= dt;
      if (this.lightningT <= 0) {
        this.lightningT = rand.range(5, 9);
        const alive = this.players.filter((p) => !p.sentOff && !p.isGK);
        const tgt = rand.pick(alive);
        const pos = tgt.pos.clone().add(new THREE.Vector3(rand.range(-1.5, 1.5), 0, rand.range(-1.5, 1.5)));
        this.fx.ring(pos, '#fde047', 1.8, 0.3, 0.6);
        this.delay(0.6, () => {
          lightningStrike(this.fx, pos); AudioManager.play('thunder', 0.8); this.shake(0.4);
          for (const p of this.players) if (!p.sentOff && p.pos.distanceTo(pos) < 1.7) { p.applyStatus('stun', 1); for (const b of this.balls) if (b.owner === p) b.owner = null; }
        });
      }
    }
  }

  // ===================== 进球 / 时段 =====================
  private onGoal(b: Ball, side: 0 | 1) {
    b.scored = true;
    this.score[side]++;
    const scorer = b.lastTouch;
    const team = this.teams[side];
    const own = !!scorer && scorer.side !== side;
    let assist: Player | null = null;
    if (scorer && !own && b.assistCand && b.assistCand !== scorer && b.assistCand.side === side && this.simT - b.assistTime < 12) assist = b.assistCand;
    this.scorers.push({ team: team.def.id, name: scorer ? scorer.name : '未知', minute: this.minute(), assist: assist?.name, own });
    team.stats.goals++;
    if (scorer && !own) scorer.ms.goals++;
    if (assist) { assist.ms.assists++; team.stats.assists++; }
    if (b.shot?.long && !own) team.stats.longGoals++;
    this.shots.onImpact(b, 'net');
    if (side === 0) {
      this.addXp(XP_TABLE.goal); this.ult.add('goal');
      if (assist) { this.addXp(XP_TABLE.assist); this.ult.add('assist'); }
      if (scorer && scorer.ms.goals === 3 && !own) { this.hatTrick = true; this.addXp(XP_TABLE.hatTrick); this.banner('🎩 帽子戏法！', scorer.name, '#fde047'); }
      if (this.period >= 2 && this.periodRemaining() < 10 && this.score[0] > this.score[1]) { this.lateWinner = true; this.addXp(XP_TABLE.lateWinner); this.toast('绝杀进球！', '#fde047'); }
    }
    this.setPhase('goal'); this.phaseT = 3.2;
    for (const p of this.players) { p.desired.set(0, 0, 0); p.playAnim(p.side === side ? 'Celebrate' : 'Defeat'); }
    this.banner(own ? '乌龙球！' : 'GOAL!', `${team.def.name} ${scorer ? scorer.name : ''}${assist ? '（助攻：' + assist.name + '）' : ''}`, team.def.home.shirt, true);
    AudioManager.play('goal'); AudioManager.play(side === 0 ? 'cheer' : 'boo');
    this.stadium.crowd.cheer(1.5);
    this.shake(0.7); this.slowmo(0.8);
    this.particles.burst(b.pos.clone().setY(1), [team.def.home.shirt, team.def.home.shirt2, '#ffffff', '#fde047'], 80, 10, 1.4, 0.25, -6);
    this.saveReplay(`${this.minute()}' ${team.def.name} ${scorer?.name ?? ''}`, side);
    this.kickoffFirstAfterGoal = (1 - side) as 0 | 1;
    this.bus.emit('goal', { side, scorer, assist });
  }
  private kickoffFirstAfterGoal: 0 | 1 = 0;

  private afterGoal() {
    const r = this.replays[this.replays.length - 1];
    if (r) this.playReplay(this.replays.length - 1, () => this.kickoffAfterGoal());
    else this.kickoffAfterGoal();
  }
  private kickoffAfterGoal() {
    this.clones.forEach((c) => c.model.root.removeFromParent()); this.clones = [];
    this.rules.startKickoff(this.kickoffFirstAfterGoal);
  }

  private endPeriod() {
    AudioManager.play('whistle_long');
    for (const p of this.players) p.desired.set(0, 0, 0);
    if (this.period === 1) {
      this.setPhase('halftime');
      this.banner('中场休息', `${this.score[0]} : ${this.score[1]}`, '#ffffff', true);
      this.pushHud(true);
      this.cb.onHalftime();
    } else if (this.period === 2) {
      if (this.setup.knockout && this.score[0] === this.score[1]) this.startPeriod(3);
      else this.endMatch();
    } else {
      if (this.score[0] === this.score[1]) this.penalties.start();
      else this.endMatch();
    }
  }
  private startPeriod(n: number) {
    this.period = n; this.clock = 0;
    for (const t of this.teams) t.dir = (t.dir * -1) as 1 | -1;
    for (const p of this.players) { p.stamina = Math.min(p.staminaMax, p.stamina + p.staminaMax * 0.35); p.buffs = []; }
    this.clones.forEach((c) => c.model.root.removeFromParent()); this.clones = []; this.zones = [];
    for (const b of this.barriers) b.handle.remove(); this.barriers = [];
    if (n === 3) this.banner('加时赛', '60 秒决胜', '#fbbf24', true);
    else this.banner('下半场', '', '#ffffff', true);
    this.rules.startKickoff(n === 2 ? (1 - this.kickoffFirst) as 0 | 1 : this.kickoffFirst);
  }
  resumeFromHalftime() { if (this.phase === 'halftime') this.startPeriod(2); }

  endMatch(forfeit = false) {
    if (this.phase === 'ended') return;
    this.setPhase('ended');
    if (forfeit) { this.score = [0, Math.max(3, this.score[1])]; }
    AudioManager.play('whistle_long');
    const won = this.score[0] > this.score[1] || (!!this.pens && this.pens[0] > this.pens[1]);
    for (const p of this.players) { p.desired.set(0, 0, 0); p.vel.set(0, 0, 0); p.playAnim((p.side === 0) === won ? 'Victory' : 'Defeat'); }
    AudioManager.stopMusic();
    if (won) AudioManager.play('cheer');
    this.pushHud(true);
    this.cb.onEnd(this.buildOutcome(forfeit));
  }
  forfeit() { this.endMatch(true); }

  missionProgress(m: MissionInstance): number {
    const s = this.teams[0].stats;
    const total = this.teams[0].stats.possessionTime + this.teams[1].stats.possessionTime;
    switch (m.stat) {
      case 'passes': return s.passes; case 'shots': return s.shots; case 'tackles': return s.tackles; case 'goals': return this.score[0];
      case 'cleanSheet': return this.score[1] === 0 ? 1 : 0; case 'dribbles': return s.dribbles; case 'skillUses': return this.skills.uses + this.ult.uses;
      case 'longGoals': return s.longGoals; case 'assists': return s.assists; case 'saves': return s.saves; case 'ultUses': return this.ult.uses;
      case 'winBy': return Math.max(0, this.score[0] - this.score[1]); case 'possession': return total > 0 ? Math.round((s.possessionTime / total) * 100) : 50;
      case 'noFoul': return s.fouls === 0 ? 1 : 0; case 'onTarget': return s.onTarget; case 'headers': return s.headers;
    }
    return 0;
  }

  private buildOutcome(forfeit: boolean): MatchOutcome {
    const [gf, ga] = this.score;
    const won = gf > ga || (!!this.pens && this.pens[0] > this.pens[1]);
    const draw = !won && gf === ga && !this.pens;
    const s0 = this.teams[0].stats, s1 = this.teams[1].stats;
    const total = s0.possessionTime + s1.possessionTime || 1;
    const poss = Math.round((s0.possessionTime / total) * 100);
    const missions = this.setup.missions.map((m) => {
      const prog = this.missionProgress(m);
      const done = !forfeit && (m.stat === 'winBy' ? won && prog >= m.target : m.stat === 'cleanSheet' || m.stat === 'noFoul' ? prog >= 1 : prog >= m.target);
      return { ...m, progress: prog, done };
    });
    const players: PlayerMatchStat[] = this.players.map((p) => ({
      id: p.rp.id, name: p.name, number: p.rp.number, role: p.role, side: p.side,
      goals: p.ms.goals, assists: p.ms.assists, shots: p.ms.shots, passes: p.ms.passes, tackles: p.ms.tackles, saves: p.ms.saves, dribbles: p.ms.dribbles,
      rating: clamp(6 + p.ms.goals * 1.1 + p.ms.assists * 0.7 + p.ms.tackles * 0.2 + p.ms.saves * 0.35 + p.ms.dribbles * 0.15 + p.ms.passes * 0.05 - p.ms.fouls * 0.2 + ((p.side === 0) === won ? 0.4 : 0), 3, 10),
    }));
    const mine = players.filter((p) => p.side === 0).sort((a, b) => b.rating - a.rating);
    return {
      gf, ga, pens: this.pens, et: this.period >= 3, won, draw, forfeited: forfeit, scorers: this.scorers, cards: this.cards,
      shots: [s0.shots, s1.shots], onTarget: [s0.onTarget, s1.onTarget], possession: [poss, 100 - poss], teamStats: s0, oppStats: s1, players, missions,
      xpEarned: this.xpEarned, comeback: this.wasTrailing && won, lateWinner: this.lateWinner, hatTrick: this.hatTrick, injuries: [...this.injuries],
      staminaUsed: this.teams[0].players.reduce((a, p) => a + p.staminaUsed, 0), replayCount: this.replays.length, bestPlayer: mine[0]?.name ?? '',
      skillUses: this.skills.uses, ultUses: this.ult.uses,
    };
  }

  /** 局中更新构筑（三选一后 / 中场换装备） */
  applyBuild(partial: Partial<MatchSetup>) {
    Object.assign(this.setup, partial);
    if (partial.skills) this.skills.rebuild(partial.skills);
    if (partial.equipShots) this.skills.equipShots = partial.equipShots;
    if (partial.ultimate !== undefined || partial.skills) this.ult.set(this.setup.ultimate, this.setup.skills.find((s) => s.id === this.setup.ultimate)?.level ?? 1);
    if (partial.tactic !== undefined) this.tacticOverride = partial.tactic;
    for (const p of this.players) this.refreshMods(p);
  }

  // ===================== 回放 =====================
  private record(dt: number) {
    this.recordT += dt;
    if (this.recordT < 1 / 30) return;
    this.recordT = 0;
    const n = this.players.length;
    const f = new Float32Array(this.balls.length * 3 + n * 7);
    let k = 0;
    for (const b of this.balls) { f[k++] = b.pos.x; f[k++] = b.pos.y; f[k++] = b.pos.z; }
    for (const p of this.players) { f[k++] = p.pos.x; f[k++] = p.jumpY; f[k++] = p.pos.z; f[k++] = p.heading; f[k++] = ANIM_LIST.indexOf(this.animFor(p)); f[k++] = p.animT; f[k++] = p.scale; }
    this.frames.push(f);
    if (this.frames.length > 180) this.frames.shift();
  }
  private saveReplay(label: string, side: 0 | 1) { this.replays.push({ frames: this.frames.slice(-150), label, side }); }
  playReplay(i: number, onDone?: () => void) {
    const r = this.replays[i]; if (!r || !r.frames.length) { onDone?.(); return; }
    this.replayState = { r, t: 0, onDone, prev: this.phase };
    useHud.setState({ replay: true });
  }
  stopReplay() {
    const rs = this.replayState; if (!rs) return;
    this.replayState = null;
    useHud.setState({ replay: false });
    for (const p of this.players) p.model.root.visible = !p.sentOff;
    rs.onDone?.();
  }

  // ===================== 渲染 =====================
  private animFor(p: Player): AnimName {
    const special: AnimName[] = ['Pass', 'Shoot', 'LongShoot', 'Header', 'Hit', 'GoalkeeperCatch'];
    if (p.freezeT > 0 || p.stunT > 0) return 'Hit';
    if (p.state === 'fallen' || p.knockT > 0) return 'Fall';
    if (p.state === 'slide') return 'Tackle';
    if (p.state === 'dive') return 'GoalkeeperDive';
    if (['Celebrate', 'Defeat', 'Victory'].includes(p.anim) && (this.phase === 'goal' || this.phase === 'ended')) return p.anim;
    if (special.includes(p.anim) && p.animT < 0.45) return p.anim;
    if (p.jumpY > 0.15) return p.anim === 'Header' ? 'Header' : 'Jump';
    const sp = Math.hypot(p.vel.x, p.vel.z);
    if (this.balls.some((b) => b.owner === p) && sp > 0.5) return 'Dribble';
    if (sp < 0.35) return 'Idle';
    if (p.sprinting && sp > p.spd * 1.05) return 'Sprint';
    return sp < 3 ? 'Walk' : 'Run';
  }

  private render(dt: number) {
    if (this.disposed) return;
    const t = performance.now() / 1000;
    if (this.replayState) this.renderReplay(dt);
    else {
      for (const p of this.players) {
        if (p.sentOff) continue;
        const m = p.model;
        m.root.position.set(p.pos.x, p.jumpY, p.pos.z);
        m.root.rotation.y = Math.PI / 2 - p.heading;
        m.setScale(p.scale);
        const a = this.animFor(p);
        if (a !== p.anim) { p.anim = a; p.animT = 0; }
        const k = clamp(Math.hypot(p.vel.x, p.vel.z) / 8, 0, 1);
        if (p.freezeT <= 0) applyPose(m, a, p.animT, k, p.diveDir);
        m.marker.visible = p.ctrl && this.phase !== 'ended';
        if (m.roleTag) m.roleTag.visible = !p.ctrl && this.phase !== 'penalties';
        if (m.marker.visible) m.marker.position.y = 2.35 + Math.sin(t * 5) * 0.08;
        if (m.star) m.star.rotation.y += dt * 2;
        // 状态特效
        if (p.freezeT > 0 && Math.random() < 0.3) this.particles.trail(p.pos.clone().setY(0.4 + Math.random() * 1.4), '#bae6fd', 0.18, 0.3, 0.5);
        if (p.stunT > 0 && Math.random() < 0.25) this.particles.trail(p.pos.clone().setY(2), '#fde047', 0.12, 0.25, 0.4);
        if (p.slowT > 0 && p.slowAmt > 0 && Math.random() < 0.12) this.particles.trail(p.pos.clone().setY(0.2), '#818cf8', 0.15, 0.4, 0.5);
        if (p.shieldT > 0 && p.shieldHits > 0 && Math.random() < 0.3) this.particles.trail(p.pos.clone().setY(1 + Math.random() * 0.8).add(new THREE.Vector3(Math.cos(t * 6) * 0.7, 0, Math.sin(t * 6) * 0.7)), '#38bdf8', 0.14, 0.3, 0.1);
        if (p.buffs.length && Math.random() < 0.08) this.particles.trail(p.pos.clone().setY(0.1), '#fde047', 0.1, 0.4, 0.6);
        const ringM = m.ring.material as THREE.MeshBasicMaterial;
        ringM.opacity = p.ctrl ? 1 : 0.55;
      }
      for (const c of this.clones) {
        c.model.root.position.set(c.pos.x, 0, c.pos.z);
        const sp = c.vel.length();
        if (sp > 0.3) c.model.root.rotation.y = Math.PI / 2 - Math.atan2(c.vel.z, c.vel.x);
        applyPose(c.model, sp > 0.5 ? 'Run' : 'Idle', t, clamp(sp / 8, 0, 1));
      }
      for (const b of this.balls) {
        b.syncMesh(dt);
        if (!b.shot && !b.owner && b.vel.lengthSq() > 196 && Math.random() < 0.6) this.particles.trail(b.pos, '#f1f5f9', 0.12, 0.25, 0.05);
      }
    }
    this.particles.update(this.paused && !this.replayState ? 0 : dt);
    if (!this.paused || this.replayState) this.fx.update(dt);
    this.stadium.update(dt, t, this.camFocus, this.params.lightning, this.particles);
    this.updateCamera(dt);
    if (this.composer) this.composer.render(); else this.renderer.render(this.scene, this.camera);
    this.hudT -= dt;
    if (this.hudT <= 0) { this.hudT = 0.1; this.pushHud(); }
    AudioManager.setExcite(this.stadium.crowd.excite);
    this.input.clearFrame();
  }

  private renderReplay(dt: number) {
    const rs = this.replayState!;
    rs.t += dt * 0.65;
    const idx = Math.floor(rs.t * 30);
    if (idx >= rs.r.frames.length || this.input.peek('skip') || this.input.peek('shoot') || this.input.peek('pass') || this.input.peek('pause')) { this.input.clearFrame(); this.stopReplay(); return; }
    const f = rs.r.frames[idx];
    let k = 0;
    for (const b of this.balls) { b.mesh.position.set(f[k], f[k + 1], f[k + 2]); b.shadow.position.set(f[k], 0.02, f[k + 2]); k += 3; }
    for (const p of this.players) {
      const m = p.model;
      m.root.position.set(f[k], f[k + 1], f[k + 2]);
      m.root.rotation.y = Math.PI / 2 - f[k + 3];
      const a = ANIM_LIST[Math.max(0, f[k + 4])] ?? 'Idle';
      applyPose(m, a, f[k + 5], 0.8, p.diveDir);
      m.setScale(f[k + 6] || 1);
      m.root.visible = f[k + 1] > -10 && !p.sentOff;
      m.marker.visible = false;
      k += 7;
    }
  }

  private updateCamera(dt: number) {
    const cam = this.camera;
    const aspect = cam.aspect;
    const far = aspect < 1.25 ? 1.35 : aspect < 1.6 ? 1.12 : 1;
    let pos: THREE.Vector3, look: THREE.Vector3;
    if (this.replayState) {
      const bp = this.balls[0].mesh.position;
      const s = this.replayState.r.side;
      const dir = this.teams[s].dir;
      look = bp.clone().setY(0.8);
      pos = new THREE.Vector3(bp.x - dir * 7, 3.2, bp.z + 7.5);
      this.camPos.lerp(pos, Math.min(1, dt * 3)); this.camFocus.lerp(look, Math.min(1, dt * 5));
    } else if (this.phase === 'penalties') {
      look = new THREE.Vector3(FIELD.L / 2, 1.1, 0);
      pos = new THREE.Vector3(FIELD.L / 2 - 15, 4.8, 0);
      this.camPos.lerp(pos, Math.min(1, dt * 3)); this.camFocus.lerp(look, Math.min(1, dt * 3));
    } else if (this.phase === 'intro') {
      const a = (3 - this.phaseT) * 0.35 - 0.6;
      pos = new THREE.Vector3(Math.sin(a) * 34, 16, Math.cos(a) * 30);
      look = new THREE.Vector3(0, 0, 0);
      this.camPos.copy(pos); this.camFocus.copy(look);
    } else if (this.phase === 'goal') {
      const sc = this.balls.find((b) => b.scored) ?? this.balls[0];
      const scorer = sc.lastTouch ?? this.controlled;
      look = scorer.pos.clone().setY(1);
      pos = scorer.pos.clone().add(new THREE.Vector3(0, 6, 9));
      this.camPos.lerp(pos, Math.min(1, dt * 2)); this.camFocus.lerp(look, Math.min(1, dt * 3));
    } else {
      const b = this.balls[0].pos;
      const c = this.controlled?.pos ?? b;
      const fx = clamp(lerp(b.x, c.x, 0.3), -FIELD.L / 2 + 7, FIELD.L / 2 - 7);
      const fz = clamp(lerp(b.z, c.z, 0.3), -5, 5);
      look = new THREE.Vector3(fx, 0, fz - 1);
      pos = new THREE.Vector3(fx, 16.5 * far, fz + 15.5 * far);
      this.camPos.lerp(pos, Math.min(1, dt * 3.2)); this.camFocus.lerp(look, Math.min(1, dt * 3.5));
    }
    cam.position.copy(this.camPos);
    if (this.shakeAmt > 0.001) {
      cam.position.x += (Math.random() - 0.5) * this.shakeAmt * 0.8;
      cam.position.y += (Math.random() - 0.5) * this.shakeAmt * 0.6;
      this.shakeAmt *= Math.max(0, 1 - dt * 5);
    }
    cam.lookAt(this.camFocus);
  }

  resize() {
    const w = this.container.clientWidth || window.innerWidth, h = this.container.clientHeight || window.innerHeight;
    this.renderer.setSize(w, h);
    this.camera.aspect = w / h; this.camera.updateProjectionMatrix();
    if (this.composer) {
      this.composer.setSize(w, h);
      const fxaa = (this as unknown as { fxaa?: ShaderPass }).fxaa;
      if (fxaa) { const pr = this.renderer.getPixelRatio(); fxaa.material.uniforms['resolution'].value.set(1 / (w * pr), 1 / (h * pr)); }
    }
  }

  pushHud(force = false) {
    const c = this.controlled;
    const now = performance.now();
    this.toastList = this.toastList.filter((x) => x.until > now);
    if (this.bannerData && this.bannerData.until < now) this.bannerData = null;
    const sk = this.skills.hud();
    const sp = this.rules.sp;
    let hint: string | null = null;
    if (this.phase === 'setpiece' && sp && sp.side === 0 && sp.taker.ctrl) {
      hint = `${SP_NAME[sp.type]}：J 短传 · K 长传${this.rules.canShoot() ? ' · 按住空格射门' : ''}`;
    } else if (this.phase === 'setpiece' && sp && sp.side === 1) hint = `对方${SP_NAME[sp.type]}`;
    const periodLabel = this.phase === 'penalties' ? '点球大战' : this.period === 1 ? '上半场' : this.period === 2 ? '下半场' : '加时赛';
    useHud.setState({
      score: [...this.score] as [number, number], time: this.displayTime(), periodLabel, phase: this.phase,
      stamina: c ? c.stamina : 0, staminaMax: c ? c.staminaMax : 100, ult: this.ult.charge,
      ultName: this.ult.def?.name ?? '', ultIcon: this.ult.def?.icon ?? '', ultColor: this.ult.def?.color ?? '#fde047',
      level: this.lvl, xp: this.xp, xpNeed: this.xpNeed, skills: sk.list, shotSkills: sk.shots, defSkills: sk.defs, nextShot: sk.nextShot, magnet: sk.magnet,
      controlled: c ? { name: c.name, number: c.rp.number, role: c.role, injured: c.injured, core: c.isCore } : null,
      missions: this.setup.missions.map((m) => { const pr = this.missionProgress(m); return { desc: m.desc, progress: pr, target: m.target, done: m.stat === 'winBy' ? this.score[0] - this.score[1] >= m.target : pr >= m.target }; }),
      toasts: this.toastList.map(({ id, text, color }) => ({ id, text, color })),
      banner: this.bannerData ? { id: this.bannerData.id, text: this.bannerData.text, sub: this.bannerData.sub, color: this.bannerData.color, big: this.bannerData.big } : null,
      flash: this.flashData, boss: this.setup.boss ? { name: BOSS_MAP[this.setup.boss].name, icon: BOSS_MAP[this.setup.boss].icon, phase: this.boss.phaseLabel() } : null,
      penalty: this.phase === 'penalties' ? this.penalties.hud() : null, hint, charge: this.controller.charging ? this.controller.charge : this.penalties.charging ? this.penalties.charge : 0,
      fps: this.loop.fps, passiveText: this.teams[0].passive.statusText(this), tactic: TACTIC_NAMES[this.teams[0].aiMode],
    });
    void force; void STAGE_NAME;
  }

  dispose() {
    this.disposed = true;
    this.loop.stop();
    this.input.detach();
    document.removeEventListener('visibilitychange', this.visHandler);
    window.removeEventListener('resize', this.resizeHandler);
    this.ro?.disconnect();
    AudioManager.stopAmbience();
    this.bus.clear();
    this.fx.clear();
    this.particles.dispose();
    this.stadium.dispose();
    this.renderer.dispose();
    this.renderer.domElement.remove();
  }
}
