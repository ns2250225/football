import { create } from 'zustand';

/**
 * 横屏布局管理：
 * - 触屏设备竖屏时，整个游戏画面旋转 90° 强制横屏显示；
 * - 支持时进入全屏并锁定横屏方向（Android 等），此时无需旋转；
 * - 逻辑高度较小时启用紧凑模式（缩小根字号与 HUD）。
 */
export interface LayoutState { rotated: boolean; w: number; h: number; compact: boolean; touch: boolean }

function isTouch(): boolean { return typeof window !== 'undefined' && (('ontouchstart' in window) || navigator.maxTouchPoints > 0); }

function compute(): LayoutState {
  const vw = window.innerWidth, vh = window.innerHeight;
  const touch = isTouch();
  const rotated = touch && vh > vw * 1.05;
  const w = rotated ? vh : vw, h = rotated ? vw : vh;
  return { rotated, w, h, compact: touch ? h < 560 : h < 520, touch };
}

export const useLayout = create<LayoutState>(() => (typeof window === 'undefined' ? { rotated: false, w: 1280, h: 720, compact: false, touch: false } : compute()));

let inited = false;
export function initLayout() {
  if (inited) return; inited = true;
  const apply = () => {
    const s = compute();
    useLayout.setState(s);
    document.documentElement.style.fontSize = s.compact ? (s.h < 400 ? '12.5px' : '14px') : '';
  };
  apply();
  window.addEventListener('resize', apply);
  window.addEventListener('orientationchange', () => { apply(); setTimeout(apply, 250); });
  (screen.orientation as unknown as EventTarget | undefined)?.addEventListener?.('change', apply);
}

/** 将屏幕坐标增量转换为（可能旋转后的）逻辑坐标增量 */
export function toLogical(dx: number, dy: number): { x: number; y: number } {
  return useLayout.getState().rotated ? { x: dy, y: -dx } : { x: dx, y: dy };
}

/** 尝试全屏并锁定横屏（需在用户手势中调用；不支持的浏览器回退为 CSS 旋转） */
export async function tryLockLandscape() {
  if (!isTouch()) return;
  try {
    const el = document.documentElement as HTMLElement & { webkitRequestFullscreen?: () => Promise<void> };
    if (!document.fullscreenElement) {
      if (el.requestFullscreen) await el.requestFullscreen({ navigationUI: 'hide' } as FullscreenOptions);
      else if (el.webkitRequestFullscreen) await el.webkitRequestFullscreen();
    }
    const o = screen.orientation as unknown as { lock?: (t: string) => Promise<void> };
    if (o?.lock) await o.lock('landscape');
  } catch { /* 不支持时保持 CSS 旋转方案 */ }
}

type FsDoc = Document & { webkitFullscreenElement?: Element; webkitExitFullscreen?: () => Promise<void> };
type FsEl = HTMLElement & { webkitRequestFullscreen?: () => Promise<void> };

/** 浏览器是否支持全屏 API（iPhone Safari 不支持） */
export function fullscreenSupported(): boolean {
  if (typeof document === 'undefined') return false;
  const el = document.documentElement as FsEl;
  return !!(el.requestFullscreen || el.webkitRequestFullscreen);
}

export function isFullscreen(): boolean {
  const d = document as FsDoc;
  return !!(d.fullscreenElement || d.webkitFullscreenElement);
}

/** 切换全屏（需在用户手势中调用）；进入全屏时同时尝试锁定横屏 */
export async function toggleFullscreen() {
  const d = document as FsDoc;
  try {
    if (isFullscreen()) {
      if (d.exitFullscreen) await d.exitFullscreen();
      else if (d.webkitExitFullscreen) await d.webkitExitFullscreen();
    } else {
      await tryLockLandscape();
      if (!isFullscreen()) {
        const el = document.documentElement as FsEl;
        if (el.requestFullscreen) await el.requestFullscreen();
        else if (el.webkitRequestFullscreen) await el.webkitRequestFullscreen();
      }
    }
  } catch { /* 忽略 */ }
}

/** 订阅全屏状态变化 */
export function onFullscreenChange(cb: () => void): () => void {
  document.addEventListener('fullscreenchange', cb);
  document.addEventListener('webkitfullscreenchange', cb);
  return () => {
    document.removeEventListener('fullscreenchange', cb);
    document.removeEventListener('webkitfullscreenchange', cb);
  };
}
