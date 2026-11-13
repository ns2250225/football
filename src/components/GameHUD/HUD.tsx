import { useHud } from '../../store/hudStore';
import { fmtTime } from '../../utils/math';
import { Bar } from '../common/UI';
import { useGame } from '../../store/gameStore';
import { getTeam } from '../../data/teams';
import { Flag } from '../common/UI';
import { ROLE_NAME } from '../../game/types';
import { useEffect, useState } from 'react';
import { useLayout } from '../../app/layout';
import { FullscreenButton } from '../common/FullscreenButton';

function Scoreboard() {
  const h = useHud();
  const c = useLayout((s) => s.compact);
  const run = useGame((s) => s.run);
  const plan = run?.plan;
  const home = run ? getTeam(run.teamId) : null, away = plan ? getTeam(plan.opponent) : null;
  return (
    <div className={`absolute ${c ? 'top-1' : 'top-2'} left-1/2 -translate-x-1/2 flex flex-col items-center pointer-events-none`}>
      <div className={`mc-panel flex items-center ${c ? 'gap-1.5 px-2 py-0.5' : 'gap-3 px-3 py-1'}`}>
        {home && <Flag flag={home.flag} w={c ? 20 : 28} h={c ? 14 : 19} />}
        <span className={`font-black pixel-text ${c ? 'text-base' : 'text-2xl'}`} style={{ color: h.homeColor }}>{h.homeCode}</span>
        <span className={`font-black pixel-text ${c ? 'text-xl' : 'text-3xl'}`}>{h.score[0]} : {h.score[1]}</span>
        <span className={`font-black pixel-text ${c ? 'text-base' : 'text-2xl'}`} style={{ color: h.awayColor }}>{h.awayCode}</span>
        {away && <Flag flag={away.flag} w={c ? 20 : 28} h={c ? 14 : 19} />}
      </div>
      <div className={`mc-panel px-2 py-0.5 font-bold pixel-text mt-0.5 ${c ? 'text-[11px]' : 'text-sm'}`}>{c ? '' : `${h.stageLabel} · `}{h.periodLabel} · <span className="text-yellow-300">{fmtTime(h.time)}</span></div>
      {h.replay && <div className="mt-1 px-3 py-1 bg-red-700 font-black text-sm border-2 border-black animate-pulse">● 进球回放（空格 / 点击跳过）</div>}
    </div>
  );
}

function LeftTop({ inline }: { inline?: boolean }) {
  const h = useHud();
  if (inline) return (
    <div className="flex flex-wrap gap-1 pointer-events-none">
      <div className="mc-panel px-1.5 py-0.5 text-[11px]">{h.weather}</div>
      {h.boss && <div className="mc-panel px-1.5 py-0.5 text-[11px] text-orange-300 font-bold">{h.boss.icon} {h.boss.name}{h.boss.phase ? ` · ${h.boss.phase.split('：')[0]}` : ''}</div>}
      {h.events.map((e) => <div key={e.name} className="mc-panel px-1.5 py-0.5 text-[11px] text-purple-300 font-bold">{e.icon} {e.name}</div>)}
    </div>
  );
  return (
    <div className="absolute top-2 left-2 flex flex-col gap-1 max-w-[42%] pointer-events-none">
      <div className="mc-panel px-2 py-1 text-xs">{h.stadium} · {h.weather}</div>
      {h.boss && <div className="mc-panel px-2 py-1 text-xs border-orange-500"><b className="text-orange-300">{h.boss.icon} BOSS：{h.boss.name}</b>{h.boss.phase && <div className="text-yellow-300">{h.boss.phase}</div>}</div>}
      {h.events.map((e) => <div key={e.name} className="mc-panel px-2 py-1 text-xs" title={e.desc}><b className="text-purple-300">{e.icon} {e.name}</b><span className="hidden md:inline text-gray-300"> · {e.desc}</span></div>)}
    </div>
  );
}

function Missions({ touch }: { touch?: boolean }) {
  const missions = useHud((s) => s.missions);
  const compact = useLayout((s) => s.compact || s.w < 900);
  const [open, setOpen] = useState(!compact);
  return (
    <div className={`absolute ${touch ? 'top-10 right-1' : 'top-2 right-16'} pointer-events-auto flex flex-col items-end`}>
      <button className="mc-panel px-2 py-1 text-xs font-bold" onClick={() => setOpen(!open)}>📜 任务 {missions.filter((m) => m.done).length}/{missions.length}</button>
      {open && <div className="mc-panel p-2 mt-1 text-xs flex flex-col gap-1 w-56">
        {missions.map((m, i) => <div key={i} className={m.done ? 'text-green-400' : ''}>{m.done ? '✔' : '□'} {m.desc} <span className="text-gray-400">({Math.min(m.progress, m.target)}/{m.target})</span></div>)}
      </div>}
    </div>
  );
}

function PlayerStatus({ inline }: { inline?: boolean }) {
  const h = useHud();
  if (inline) return (
    <div className="mc-panel px-2 py-1 w-44 pointer-events-none text-[11px] flex flex-col gap-0.5">
      {h.controlled && <div className="font-black pixel-text truncate">{h.controlled.core ? '⭐' : ''}{h.controlled.number} {h.controlled.name}{h.controlled.injured ? ' 🩹' : ''} <span className="text-yellow-300">LV.{h.level}</span></div>}
      <Bar value={h.xp} max={h.xpNeed} color="#a3e635" h={5} />
      <div className="flex items-center gap-1"><span className="w-6">体力</span><div className="flex-1"><Bar value={h.stamina} max={h.staminaMax} color={h.stamina / h.staminaMax < 0.3 ? '#f97316' : '#22c55e'} h={7} /></div></div>
      <div className="flex items-center gap-1"><span className="w-6">{h.ultIcon || '大招'}</span><div className="flex-1"><Bar value={h.ult} max={1} color={h.ult >= 1 ? '#fde047' : h.ultColor} h={7} /></div><span className={h.ult >= 1 ? 'text-yellow-300 font-black' : ''}>{Math.round(h.ult * 100)}%</span></div>
    </div>
  );
  return (
    <div className="absolute bottom-2 left-2 mc-panel p-2 w-56 md:w-64 pointer-events-none text-xs flex flex-col gap-1">
      {h.controlled && <div className="font-black text-sm pixel-text truncate">{h.controlled.core ? '⭐ ' : ''}{h.controlled.number} {h.controlled.name} · {ROLE_NAME[h.controlled.role as keyof typeof ROLE_NAME]}{h.controlled.injured ? ' 🩹' : ''}</div>}
      <div className="flex justify-between"><span className="font-bold text-yellow-300">LV.{h.level}</span><span>经验 {h.xp} / {h.xpNeed}</span></div>
      <Bar value={h.xp} max={h.xpNeed} color="#a3e635" h={7} />
      <div className="flex justify-between"><span>体力</span><span>{Math.round(h.stamina)}</span></div>
      <Bar value={h.stamina} max={h.staminaMax} color={h.stamina / h.staminaMax < 0.3 ? '#f97316' : '#22c55e'} h={9} />
      <div className="flex justify-between"><span>{h.ultIcon} 大招能量{h.ultName ? `（${h.ultName}）` : '（未获得大招）'}</span><span className={h.ult >= 1 ? 'text-yellow-300 font-black animate-pulse' : ''}>{Math.round(h.ult * 100)}%</span></div>
      <Bar value={h.ult} max={1} color={h.ult >= 1 ? '#fde047' : h.ultColor} h={9} />
      <div className="flex justify-between text-[11px] text-gray-300"><span>战术：{h.tactic}</span><span className="text-cyan-300 truncate">{h.passiveText}</span></div>
    </div>
  );
}

function SkillBar({ onCast, touch }: { onCast: (i: number) => void; touch?: boolean }) {
  const h = useHud();
  const sz = touch ? 'w-10 h-10 text-2xl' : 'w-11 h-11 md:w-14 md:h-14 text-2xl md:text-3xl';
  return (
    <div className={`absolute ${touch ? 'bottom-1' : 'bottom-2'} left-1/2 -translate-x-1/2 flex flex-col items-center gap-1 pointer-events-auto`}>
      {(h.nextShot || h.magnet) && <div className="mc-panel px-2 py-0.5 text-xs text-yellow-300">{h.nextShot ? `下一脚：${h.nextShot}` : ''}{h.magnet ? ' 磁力传球就绪' : ''}</div>}
      <div className="flex gap-1">
        {h.skills.map((s, i) => {
          const pct = s.cd > 0 ? s.cd / Math.max(0.1, s.max) : 0;
          return (
            <button key={s.id} onClick={() => onCast(i)} className={`relative ${sz} mc-panel-light flex items-center justify-center ${s.selected ? 'outline outline-3 outline-yellow-300' : ''}`} title={`${s.name} LV${s.lv}`}>
              <span style={{ color: s.color }}>{s.icon}</span>
              {pct > 0 && <div className="absolute inset-x-0 bottom-0 bg-black/65" style={{ height: `${pct * 100}%` }} />}
              {s.cd > 0 && <span className="absolute text-xs font-black pixel-text">{Math.ceil(s.cd)}</span>}
              <span className="absolute top-0 left-0.5 text-[10px] font-black pixel-text">{s.key}</span>
            </button>
          );
        })}
        {h.skills.length === 0 && <div className="mc-panel px-2 py-1 text-xs text-gray-400">暂无主动技能</div>}
      </div>
      {(h.shotSkills.length > 0 || h.defSkills.length > 0) && (
        <div className="flex gap-0.5">
          {[...h.shotSkills, ...h.defSkills].map((s) => (
            <div key={s.id} className="relative w-7 h-7 mc-panel flex items-center justify-center text-sm" title={s.name}>
              <span style={{ color: s.color, opacity: s.cd > 0 ? 0.35 : 1 }}>{s.icon}</span>
              {s.cd > 0 && <span className="absolute text-[9px] font-black pixel-text">{Math.ceil(s.cd)}</span>}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function Toasts({ touch }: { touch?: boolean }) {
  const toasts = useHud((s) => s.toasts);
  return (
    <div className={`absolute ${touch ? 'right-14 top-12 text-xs' : 'right-2 top-1/4'} flex flex-col items-end gap-1 pointer-events-none`}>
      {toasts.map((t) => <div key={t.id} className="mc-panel px-3 py-1 text-sm font-bold pixel-text" style={{ color: t.color, animation: 'toast-in 2.6s ease-out both' }}>{t.text}</div>)}
    </div>
  );
}

function BannerView() {
  const b = useHud((s) => s.banner);
  if (!b) return null;
  return (
    <div key={b.id} className="absolute inset-x-0 top-[22%] flex flex-col items-center pointer-events-none" style={{ animation: `banner-in ${b.big ? 2.4 : 1.8}s ease-out both` }}>
      <div className={`${b.big ? 'text-5xl md:text-7xl' : 'text-3xl md:text-4xl'} font-black title-text`} style={{ color: b.color, WebkitTextStroke: '2px #000' }}>{b.text}</div>
      {b.sub && <div className="text-lg md:text-xl font-bold pixel-text mt-1">{b.sub}</div>}
    </div>
  );
}

function FlashView() {
  const f = useHud((s) => s.flash);
  const [shown, setShown] = useState<number | null>(null);
  useEffect(() => { if (f && f.id !== shown) setShown(f.id); }, [f, shown]);
  if (!f || shown !== f.id) return null;
  return <div key={f.id} className="absolute inset-0 pointer-events-none" style={{ background: `radial-gradient(circle, ${f.color}aa, ${f.color}33)`, animation: 'flash 0.9s ease-out both' }} />;
}

function ChargeMeter() {
  const c = useHud((s) => s.charge);
  if (c <= 0) return null;
  return (
    <div className="absolute bottom-28 left-1/2 -translate-x-1/2 w-48 pointer-events-none">
      <div className="text-center text-xs font-black pixel-text">蓄力 {Math.round(c * 100)}%{c > 0.93 ? '（过度蓄力易偏高！）' : ''}</div>
      <div className="bar" style={{ height: 12 }}><div style={{ width: `${c * 100}%`, background: c > 0.93 ? '#ef4444' : c > 0.6 ? '#f59e0b' : '#22c55e' }} /></div>
    </div>
  );
}

function Hint() {
  const hint = useHud((s) => s.hint);
  if (!hint) return null;
  return <div className="absolute top-[30%] left-1/2 -translate-x-1/2 mc-panel px-3 py-1 text-sm font-bold pixel-text pointer-events-none">{hint}</div>;
}

function PenaltyView() {
  const p = useHud((s) => s.penalty);
  if (!p) return null;
  const dots = (arr: boolean[]) => Array.from({ length: Math.max(5, arr.length) }, (_, i) => <span key={i} className="inline-block w-3 h-3 mx-0.5 border border-black" style={{ background: i < arr.length ? (arr[i] ? '#22c55e' : '#ef4444') : '#374151' }} />);
  return (
    <div className="absolute inset-0 pointer-events-none">
      <div className="absolute top-24 left-1/2 -translate-x-1/2 mc-panel p-2 text-sm">
        <div className="text-center font-black pixel-text">点球大战 {p.score[0]} : {p.score[1]}</div>
        <div>我方 {dots(p.kicks[0])}</div><div>对方 {dots(p.kicks[1])}</div>
      </div>
      {p.role === 'shoot' && (
        <div className="absolute bottom-40 left-1/2 -translate-x-1/2">
          <div className="relative border-4 border-white" style={{ width: 240, height: 90, background: 'rgba(255,255,255,0.08)' }}>
            <div className="absolute w-5 h-5 border-4 border-yellow-300 rounded-full" style={{ left: `${(p.aimZ + 1) / 2 * 100}%`, bottom: `${p.aimY * 100}%`, transform: 'translate(-50%, 50%)' }} />
          </div>
        </div>
      )}
      <div className="absolute bottom-32 left-1/2 -translate-x-1/2 mc-panel px-3 py-1 text-sm font-bold text-center max-w-[90%]">{p.hint}</div>
    </div>
  );
}

export default function HUD({ onCast, onPause, onTactic, touch }: { onCast: (i: number) => void; onPause: () => void; onTactic: () => void; touch?: boolean }) {
  const fps = useHud((s) => s.fps);
  const showFps = useGame((s) => s.meta.settings.showFps);
  return (
    <div className="absolute inset-0 pointer-events-none select-none" style={{ paddingLeft: 'env(safe-area-inset-left)', paddingRight: 'env(safe-area-inset-right)' }}>
      <FlashView />
      <Scoreboard />
      {touch ? (
        // 触屏横屏：状态与事件集中在左上角，左下留给摇杆、右下留给动作按钮
        <div className="absolute top-1 left-1 flex flex-col gap-1 max-w-[32%]">
          <PlayerStatus inline />
          <LeftTop inline />
        </div>
      ) : (<><LeftTop /><PlayerStatus /></>)}
      <Missions touch={touch} />
      <div className={`absolute ${touch ? 'top-1 right-1 flex-row' : 'top-2 right-2 flex-col'} flex gap-1 pointer-events-auto`}>
        <button className="mc-btn small" onClick={onPause} title="暂停 (Esc)">⏸</button>
        <button className="mc-btn small" onClick={onTactic} title="战术面板 (Tab)">📋</button>
        <FullscreenButton iconOnly />
      </div>
      {showFps && <div className="absolute top-14 right-2 text-xs pixel-text">FPS {fps}</div>}
      <SkillBar onCast={onCast} touch={touch} />
      <Toasts touch={touch} />
      <BannerView />
      <ChargeMeter />
      <Hint />
      <PenaltyView />
    </div>
  );
}
