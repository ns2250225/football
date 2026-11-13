import React, { useEffect, useRef } from 'react';
import { FlagDef, Rarity, RARITY_COLOR, RARITY_NAME, TeamDef, TeamStats, STAT_NAMES, StatKey, KitDef, SkillDef, CATEGORY_NAME } from '../../game/types';
import { drawFlag } from '../../game/world/Textures';
import { useGame } from '../../store/gameStore';
import { AudioManager } from '../../game/audio/AudioManager';
import { levelText } from '../../game/skills/SkillRegistry';
import { XP_NEED } from '../../utils/balance';

export function Flag({ flag, w = 36, h = 24, className = '' }: { flag: FlagDef; w?: number; h?: number; className?: string }) {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const c = ref.current; if (!c) return;
    const ctx = c.getContext('2d'); if (!ctx) return;
    ctx.clearRect(0, 0, c.width, c.height);
    drawFlag(ctx, flag, 0, 0, c.width, c.height);
  }, [flag]);
  return <canvas ref={ref} width={w * 2} height={h * 2} style={{ width: w, height: h, imageRendering: 'pixelated', border: '2px solid #000' }} className={className} />;
}

export function RarityTag({ r }: { r: Rarity }) {
  return <span className="px-1.5 py-0.5 text-xs font-bold" style={{ background: RARITY_COLOR[r], color: '#111' }}>{RARITY_NAME[r]}</span>;
}

export function Bar({ value, max, color, h = 10 }: { value: number; max: number; color: string; h?: number }) {
  return <div className="bar" style={{ height: h }}><div style={{ width: `${Math.max(0, Math.min(100, (value / Math.max(1, max)) * 100))}%`, background: color }} /></div>;
}

export function Radar({ stats, compare, size = 200 }: { stats: TeamStats; compare?: TeamStats; size?: number }) {
  const keys: StatKey[] = ['speed', 'shooting', 'dribbling', 'passing', 'defense', 'stamina'];
  const c = size / 2, r = size * 0.36;
  const pt = (i: number, v: number) => { const a = -Math.PI / 2 + (i / 6) * Math.PI * 2; const rr = (Math.max(40, v) - 40) / 60 * r; return [c + Math.cos(a) * rr, c + Math.sin(a) * rr]; };
  const poly = (s: TeamStats) => keys.map((k, i) => pt(i, s[k]).join(',')).join(' ');
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      {[0.25, 0.5, 0.75, 1].map((f) => <polygon key={f} points={keys.map((_, i) => { const a = -Math.PI / 2 + (i / 6) * Math.PI * 2; return `${c + Math.cos(a) * r * f},${c + Math.sin(a) * r * f}`; }).join(' ')} fill="none" stroke="#4b5563" strokeWidth={1} />)}
      {keys.map((_, i) => { const a = -Math.PI / 2 + (i / 6) * Math.PI * 2; return <line key={i} x1={c} y1={c} x2={c + Math.cos(a) * r} y2={c + Math.sin(a) * r} stroke="#374151" />; })}
      {compare && <polygon points={poly(compare)} fill="rgba(248,113,113,0.25)" stroke="#f87171" strokeWidth={2} />}
      <polygon points={poly(stats)} fill="rgba(74,222,128,0.3)" stroke="#4ade80" strokeWidth={2} />
      {keys.map((k, i) => { const a = -Math.PI / 2 + (i / 6) * Math.PI * 2; const x = c + Math.cos(a) * (r + 18), y = c + Math.sin(a) * (r + 18); return <text key={k} x={x} y={y} fill="#e5e7eb" fontSize={11} textAnchor="middle" dominantBaseline="middle">{STAT_NAMES[k]} {stats[k]}</text>; })}
    </svg>
  );
}

export function Jersey({ kit, number = 10, size = 44 }: { kit: KitDef; number?: number; size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" style={{ imageRendering: 'pixelated' }}>
      <rect x="1" y="2" width="3" height="5" fill={kit.shirt} stroke="#000" strokeWidth="0.4" />
      <rect x="12" y="2" width="3" height="5" fill={kit.shirt} stroke="#000" strokeWidth="0.4" />
      <rect x="4" y="1" width="8" height="10" fill={kit.shirt} stroke="#000" strokeWidth="0.4" />
      <rect x="6" y="1" width="4" height="1.2" fill={kit.shirt2} />
      <rect x="4" y="11" width="8" height="3" fill={kit.shorts} stroke="#000" strokeWidth="0.4" />
      <text x="8" y="8.4" fontSize="4.4" fontWeight="bold" fill={kit.shirt2} textAnchor="middle">{number}</text>
    </svg>
  );
}

export function Modal({ children, onClose, wide }: { children: React.ReactNode; onClose?: () => void; wide?: boolean }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-2" onClick={onClose}>
      <div className={`mc-panel anim-pop max-h-full scroll-y p-4 ${wide ? 'w-full max-w-5xl' : 'w-full max-w-xl'}`} onClick={(e) => e.stopPropagation()}>{children}</div>
    </div>
  );
}

export function Tabs<T extends string>({ tabs, value, onChange }: { tabs: { id: T; label: string }[]; value: T; onChange: (t: T) => void }) {
  return (
    <div className="flex gap-1 overflow-x-auto pb-1">
      {tabs.map((t) => <button key={t.id} className={`mc-tab ${value === t.id ? 'active' : ''}`} onClick={() => { AudioManager.play('click'); onChange(t.id); }}>{t.label}</button>)}
    </div>
  );
}

export function Screen({ title, children, onBack, right }: { title: string; children: React.ReactNode; onBack?: () => void; right?: React.ReactNode }) {
  return (
    <div className="h-full w-full flex flex-col dirt-bg">
      <div className="flex items-center gap-3 px-3 py-2 grass-bg border-b-4 border-black shrink-0">
        {onBack && <button className="mc-btn small" onClick={onBack}>◀ 返回</button>}
        <h1 className="text-xl md:text-2xl font-black title-text flex-1 truncate">{title}</h1>
        {right}
      </div>
      <div className="flex-1 min-h-0 scroll-y p-2 md:p-4">{children}</div>
    </div>
  );
}

export function RunTopInfo() {
  const run = useGame((s) => s.run);
  if (!run) return null;
  return (
    <div className="flex items-center gap-3 text-sm font-bold pixel-text">
      <span title="金币">🪙 {run.gold}</span>
      <span title="等级">LV.{run.level} <span className="text-xs text-gray-300">{run.xp}/{XP_NEED(run.level)}</span></span>
      <span title="球队疲劳" className={run.teamFatigue > 50 ? 'text-orange-400' : ''}>😓 {run.teamFatigue}</span>
      {run.rerollTokens > 0 && <span title="刷新券">🎫 {run.rerollTokens}</span>}
    </div>
  );
}

export function SkillBadge({ def, level, small }: { def: SkillDef; level?: number; small?: boolean }) {
  return (
    <div className={`mc-panel-light rarity-${def.rarity} flex items-center gap-2 ${small ? 'p-1' : 'p-2'}`} title={`${def.name}：${def.desc}`}>
      <span className={small ? 'text-xl' : 'text-2xl'} style={{ color: def.color }}>{def.icon}</span>
      <div className="min-w-0">
        <div className="text-sm font-bold truncate" style={{ color: RARITY_COLOR[def.rarity] }}>{def.name}{level ? ` LV${level}` : ''}</div>
        {!small && <div className="text-xs text-gray-300">{CATEGORY_NAME[def.category]}</div>}
      </div>
    </div>
  );
}

/** 技能动画预览：用像素粒子动画展示技能效果 */
export function SkillPreview({ def }: { def: SkillDef }) {
  const shooting = def.baseCategory === 'shooting' || !!def.shot;
  return (
    <div className="relative w-24 h-24 mc-panel flex items-center justify-center overflow-hidden" style={{ background: '#16301a' }}>
      <div className="absolute inset-x-0 bottom-0 h-4" style={{ background: '#2f7d32' }} />
      <span className="text-4xl anim-glow" style={{ color: def.color }}>{def.icon}</span>
      {[0, 1, 2].map((i) => (
        <span key={i} className="absolute w-2 h-2" style={{ background: def.color, top: '50%', left: '50%', marginTop: -4, marginLeft: -4, animation: shooting ? `preview-shoot 1.2s ${i * 0.4}s linear infinite` : `preview-orbit ${1.4 + i * 0.3}s linear infinite`, boxShadow: `0 0 6px ${def.color}` }} />
      ))}
    </div>
  );
}

export function SkillLevels({ def }: { def: SkillDef }) {
  return <ul className="text-xs text-gray-300 space-y-0.5">{Array.from({ length: def.maxLevel }, (_, i) => <li key={i}>{levelText(def, i + 1)}</li>)}</ul>;
}

export function teamColorStyle(t: TeamDef): React.CSSProperties { return { borderColor: t.home.shirt }; }
