import { useEffect, useRef, useState } from 'react';
import { useGame } from '../../store/gameStore';
import { GameEngine } from '../../game/core/GameEngine';
import { initialHud, useHud } from '../../store/hudStore';
import { XP_NEED } from '../../utils/balance';
import HUD from './HUD';
import MobileControls from './MobileControls';
import DraftModal, { EvolutionOverlay } from '../SkillSelection/DraftModal';
import ResultPanel from '../Result/ResultPanel';
import { SkillsPanel, TacticPicker } from '../Manage/TeamManage';
import EquipmentPanel from '../Equipment/EquipmentPanel';
import { Modal, Tabs } from '../common/UI';
import { AudioManager } from '../../game/audio/AudioManager';
import { DraftChoice } from '../../game/types';
import { RulesText, ControlsText } from '../Settings/Settings';

import { useLayout } from '../../app/layout';
import { FullscreenButton } from '../common/FullscreenButton';
function isTouch(): boolean { return useLayout.getState().touch; }

export default function MatchScreen() {
  const ref = useRef<HTMLDivElement>(null);
  const eng = useRef<GameEngine | null>(null);
  const [paused, setPaused] = useState(false);
  const [tactic, setTactic] = useState(false);
  const [halftime, setHalftime] = useState(false);
  const [ended, setEnded] = useState(false);
  const [evo, setEvo] = useState<string | null>(null);
  const [replaying, setReplaying] = useState(false);
  const [confirmQuit, setConfirmQuit] = useState(false);
  const [eReady, setEReady] = useState(false);
  const [pauseTab, setPauseTab] = useState<'menu' | 'rules' | 'controls'>('menu');
  const run = useGame((s) => s.run);
  const result = useGame((s) => s.result);
  const settings = useGame((s) => s.meta.settings);
  const showTouch = settings.touch === 'on' || (settings.touch === 'auto' && isTouch());
  const draftOpen = !!run?.draft && (run?.pendingDrafts ?? 0) > 0;

  const syncBuild = () => {
    const e = eng.current; const setup = useGame.getState().buildSetup();
    if (!e || !setup) return;
    e.applyBuild({ skills: setup.skills, ultimate: setup.ultimate, buildMods: setup.buildMods, equipShots: setup.equipShots, equipSpecials: setup.equipSpecials, slideImmune: setup.slideImmune, tactic: setup.tactic });
    const r = useGame.getState().run; if (r) e.setLevelInfo(r.level, r.xp, XP_NEED(r.level));
  };

  useEffect(() => {
    const setup = useGame.getState().buildSetup();
    if (!setup || !ref.current) { useGame.getState().go('hub'); return; }
    useHud.setState(initialHud());
    const e = new GameEngine(ref.current, setup, {
      onXp: (n) => {
        const pending = useGame.getState().gainXp(n);
        const r = useGame.getState().run; if (r) e.setLevelInfo(r.level, r.xp, XP_NEED(r.level));
        if (pending > 0 && e.phase !== 'ended') { e.pause('draft'); AudioManager.play('levelup'); useGame.getState().ensureDraft(); }
      },
      onHalftime: () => setHalftime(true),
      onEnd: (o) => { useGame.getState().finishMatch(o); setEnded(true); },
    });
    e.onPauseRequest = () => setPaused((p) => !p);
    e.onTacticRequest = () => setTactic((t) => !t);
    e.onHidden = () => { setPaused(true); useGame.getState().persist(); };
    eng.current = e;
    e.start();
    setEReady(true);
    return () => { e.dispose(); eng.current = null; AudioManager.startMusic('menu'); };
  }, []);

  useEffect(() => { const e = eng.current; if (!e) return; if (paused) e.pause('menu'); else e.resume('menu'); }, [paused]);
  // 暂停/战术面板打开时，用 Esc / Tab 关闭（引擎暂停时不处理按键）
  useEffect(() => {
    const h = (ev: KeyboardEvent) => {
      const inp = eng.current?.input;
      if (ev.code === 'Escape' && (paused || tactic)) { inp?.consume('pause'); setPaused(false); setTactic(false); }
      if (ev.code === 'Tab' && tactic) { ev.preventDefault(); inp?.consume('tactic'); setTactic(false); }
    };
    window.addEventListener('keydown', h);
    return () => window.removeEventListener('keydown', h);
  }, [paused, tactic]);
  useEffect(() => { const e = eng.current; if (!e) return; if (tactic) e.pause('tactic'); else e.resume('tactic'); }, [tactic]);
  useEffect(() => { const e = eng.current; if (!e) return; if (evo) e.pause('evo'); else e.resume('evo'); }, [evo]);
  useEffect(() => {
    const e = eng.current; if (!e) return;
    if (draftOpen) e.pause('draft');
    else if (e.pauseReasons.has('draft')) { syncBuild(); e.resume('draft'); }
  }, [draftOpen]);

  const onPicked = (c: DraftChoice) => { if (c.kind === 'evolve' && c.skillId) setEvo(c.skillId); syncBuild(); };

  const continueHalftime = () => { syncBuild(); setHalftime(false); eng.current?.resumeFromHalftime(); };

  const replayNames = eng.current ? eng.current.replays.map((r) => r.label) : [];
  const playReplay = (i: number) => { const e = eng.current; if (!e) return; setReplaying(true); e.playReplay(i, () => setReplaying(false)); };

  return (
    <div className="relative w-full h-full bg-black overflow-hidden">
      <div ref={ref} className="absolute inset-0" onPointerDown={() => eng.current?.input.vPress('skip')} />
      {!ended && <HUD touch={showTouch} onCast={(i) => eng.current?.skills.cast(i)} onPause={() => setPaused(true)} onTactic={() => setTactic(true)} />}
      {ended && replaying && <div className="absolute top-4 left-1/2 -translate-x-1/2 px-3 py-1 bg-red-700 font-black border-2 border-black">● 回放中（空格跳过）</div>}
      {showTouch && eReady && eng.current && !ended && !paused && !halftime && <MobileControls input={eng.current.input} />}
      {draftOpen && !ended && <DraftModal onPicked={onPicked} />}
      {evo && <EvolutionOverlay skillId={evo} onDone={() => setEvo(null)} />}
      {paused && !ended && (
        <Modal onClose={() => setPaused(false)}>
          <h2 className="text-2xl font-black pixel-text mb-2">⏸ 暂停</h2>
          <Tabs tabs={[{ id: 'menu', label: '菜单' }, { id: 'rules', label: '比赛规则' }, { id: 'controls', label: '操作说明' }]} value={pauseTab} onChange={setPauseTab} />
          {pauseTab === 'menu' && (
            <div className="flex flex-col gap-2 mt-2">
              <button className="mc-btn green" onClick={() => setPaused(false)}>▶ 继续比赛</button>
              <button className="mc-btn" onClick={() => { setPaused(false); setTactic(true); }}>📋 战术面板</button>
              <FullscreenButton className="w-full text-base py-2" />
              <label className="text-sm">音效 {Math.round(settings.sfx * 100)}%<input className="w-full" type="range" min={0} max={1} step={0.05} value={settings.sfx} onChange={(ev) => useGame.getState().setSettings({ sfx: +ev.target.value })} /></label>
              <label className="text-sm">音乐 {Math.round(settings.music * 100)}%<input className="w-full" type="range" min={0} max={1} step={0.05} value={settings.music} onChange={(ev) => useGame.getState().setSettings({ music: +ev.target.value })} /></label>
              {!confirmQuit ? <button className="mc-btn red" onClick={() => setConfirmQuit(true)}>🏳 放弃比赛（判负 0:3）</button>
                : <button className="mc-btn red" onClick={() => { setConfirmQuit(false); setPaused(false); eng.current?.forfeit(); }}>确认放弃比赛</button>}
            </div>
          )}
          {pauseTab === 'rules' && <div className="mt-2"><RulesText /></div>}
          {pauseTab === 'controls' && <div className="mt-2"><ControlsText /></div>}
        </Modal>
      )}
      {tactic && !ended && (
        <Modal onClose={() => setTactic(false)}>
          <h2 className="text-xl font-black pixel-text mb-2">📋 战术面板（比赛暂停中）</h2>
          <TacticPicker onPick={() => { syncBuild(); }} />
          <button className="mc-btn green mt-3 w-full" onClick={() => setTactic(false)}>返回比赛</button>
        </Modal>
      )}
      {halftime && !ended && <HalftimePanel onContinue={continueHalftime} />}
      {ended && result && !replaying && (
        <ResultPanel info={result} replays={replayNames} onReplay={playReplay} onContinue={() => { if ((useGame.getState().run?.pendingDrafts ?? 0) > 0) { useGame.getState().ensureDraft(); return; } useGame.getState().afterResult(); }} />
      )}
      {ended && draftOpen && <DraftModal onPicked={() => {}} />}
    </div>
  );
}

function HalftimePanel({ onContinue }: { onContinue: () => void }) {
  const [tab, setTab] = useState<'skills' | 'equip' | 'tactic'>('skills');
  const h = useHud();
  return (
    <div className="fixed inset-0 z-40 bg-black/75 flex items-center justify-center p-2">
      <div className="mc-panel w-full max-w-5xl max-h-full scroll-y p-3">
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-2xl font-black pixel-text">⏱ 中场休息 · {h.homeCode} {h.score[0]} : {h.score[1]} {h.awayCode}</h2>
          <button className="mc-btn green" onClick={onContinue}>开始下半场 ▶</button>
        </div>
        <div className="text-xs text-gray-300 mb-2">中场休息时可以管理技能（设置大招）、更换装备、调整战术。全队恢复部分体力。</div>
        <Tabs tabs={[{ id: 'skills', label: '技能' }, { id: 'equip', label: '装备' }, { id: 'tactic', label: '战术' }]} value={tab} onChange={setTab} />
        <div className="mt-2">
          {tab === 'skills' && <SkillsPanel />}
          {tab === 'equip' && <EquipmentPanel />}
          {tab === 'tactic' && <TacticPicker />}
        </div>
      </div>
    </div>
  );
}
