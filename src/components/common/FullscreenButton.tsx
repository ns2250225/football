import { useEffect, useState } from 'react';
import { useLayout, fullscreenSupported, isFullscreen, toggleFullscreen, onFullscreenChange } from '../../app/layout';
import { AudioManager } from '../../game/audio/AudioManager';

/**
 * 移动端全屏切换按钮（仅触屏设备显示；浏览器不支持全屏 API 时隐藏，如 iPhone Safari）
 * - iconOnly：仅显示图标（比赛 HUD 用）
 */
export function FullscreenButton({ className = '', iconOnly = false }: { className?: string; iconOnly?: boolean }) {
  const touch = useLayout((s) => s.touch);
  const [fs, setFs] = useState(() => (typeof document !== 'undefined' ? isFullscreen() : false));
  useEffect(() => onFullscreenChange(() => setFs(isFullscreen())), []);
  if (!touch || !fullscreenSupported()) return null;
  return (
    <button
      className={`mc-btn small ${className}`}
      title={fs ? '退出全屏' : '全屏显示'}
      // 阻止冒泡，避免与首次点击自动全屏的逻辑叠加（进入后立刻又退出）
      onPointerDown={(e) => e.stopPropagation()}
      onClick={() => { AudioManager.play('click'); void toggleFullscreen(); }}
    >
      {iconOnly ? (fs ? '⤡' : '⛶') : fs ? '⤡ 退出全屏' : '⛶ 全屏显示'}
    </button>
  );
}
