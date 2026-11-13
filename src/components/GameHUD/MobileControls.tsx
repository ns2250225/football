import { useRef, useState } from 'react';
import type { Input, Action } from '../../game/core/Input';
import { useLayout, toLogical } from '../../app/layout';

function Btn({ input, a, label, cls, hold, size }: { input: Input; a: Action; label: string; cls?: string; hold?: boolean; size: number }) {
  return (
    <button
      className={`mc-btn ${cls ?? ''} rounded-full !p-0 no-touch-action`}
      style={{ width: size, height: size, opacity: 0.88, fontSize: Math.max(11, size * 0.24) }}
      onPointerDown={(e) => { e.preventDefault(); (e.target as HTMLElement).setPointerCapture?.(e.pointerId); if (hold) input.vHold(a, true); else input.vPress(a); }}
      onPointerUp={(e) => { e.preventDefault(); if (hold) input.vHold(a, false); }}
      onPointerCancel={() => { if (hold) input.vHold(a, false); }}
      onContextMenu={(e) => e.preventDefault()}
    >{label}</button>
  );
}

/** 移动端横屏：左下虚拟摇杆 + 右下动作按钮（射门长按蓄力），尺寸随屏幕高度自适应 */
export default function MobileControls({ input }: { input: Input }) {
  const base = useRef<HTMLDivElement>(null);
  const [knob, setKnob] = useState({ x: 0, y: 0 });
  const touchId = useRef<number | null>(null);
  const lh = useLayout((s) => s.h);
  const k = Math.max(0.75, Math.min(1.15, lh / 430));
  const R = Math.round(50 * k);
  const S = (n: number) => Math.round(n * k);
  const update = (cx: number, cy: number) => {
    const el = base.current; if (!el) return;
    const r = el.getBoundingClientRect();
    // 屏幕坐标 → 逻辑坐标（竖屏强制横屏旋转时需要转换方向）
    const l = toLogical(cx - (r.left + r.width / 2), cy - (r.top + r.height / 2));
    let dx = l.x, dy = l.y;
    const len = Math.hypot(dx, dy);
    if (len > R) { dx = (dx / len) * R; dy = (dy / len) * R; }
    setKnob({ x: dx, y: dy });
    input.setJoy(dx / R, dy / R, true);
  };
  const end = () => { touchId.current = null; setKnob({ x: 0, y: 0 }); input.setJoy(0, 0, false); };
  const knobSize = S(52);
  return (
    <div className="absolute inset-0 pointer-events-none no-touch-action">
      <div
        ref={base}
        className="absolute pointer-events-auto rounded-full no-touch-action"
        style={{ left: 'max(14px, env(safe-area-inset-left))', bottom: 14, width: R * 2 + S(30), height: R * 2 + S(30), background: 'rgba(255,255,255,0.08)', border: '3px solid rgba(0,0,0,0.6)' }}
        onPointerDown={(e) => { touchId.current = e.pointerId; (e.target as HTMLElement).setPointerCapture?.(e.pointerId); update(e.clientX, e.clientY); }}
        onPointerMove={(e) => { if (touchId.current === e.pointerId) update(e.clientX, e.clientY); }}
        onPointerUp={end} onPointerCancel={end}
      >
        <div className="absolute rounded-full pointer-events-none" style={{ width: knobSize, height: knobSize, left: '50%', top: '50%', marginLeft: -knobSize / 2 + knob.x, marginTop: -knobSize / 2 + knob.y, background: 'rgba(255,255,255,0.35)', border: '3px solid #000' }} />
      </div>
      <div className="absolute bottom-3 pointer-events-auto grid gap-1.5 items-center justify-items-center" style={{ right: 'max(12px, env(safe-area-inset-right))', gridTemplateColumns: 'repeat(3, auto)' }}>
        <Btn input={input} a="skill" label="技能" cls="purple" size={S(52)} />
        <Btn input={input} a="ult" label="大招" cls="gold" size={S(52)} />
        <Btn input={input} a="switch" label="切换" size={S(46)} />
        <Btn input={input} a="long" label="长传" cls="blue" size={S(56)} />
        <Btn input={input} a="pass" label="短传" cls="blue" size={S(56)} />
        <Btn input={input} a="tackle" label="抢断" cls="red" size={S(56)} />
        <Btn input={input} a="sprint" label="冲刺" hold size={S(56)} />
        <div className="col-span-2 flex justify-center"><Btn input={input} a="shoot" label="射门" cls="green" hold size={S(72)} /></div>
      </div>
    </div>
  );
}
