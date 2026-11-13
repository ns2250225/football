import * as THREE from 'three';
import { FlagDef } from '../types';

const texCache = new Map<string, THREE.Texture>();

export function canvasTexture(key: string, w: number, h: number, draw: (ctx: CanvasRenderingContext2D) => void, repeat?: [number, number]): THREE.Texture {
  const k = key + (repeat ? repeat.join('x') : '');
  const cached = texCache.get(k);
  if (cached) return cached;
  const c = document.createElement('canvas');
  c.width = w; c.height = h;
  const ctx = c.getContext('2d')!;
  ctx.imageSmoothingEnabled = false;
  draw(ctx);
  const t = new THREE.CanvasTexture(c);
  t.magFilter = THREE.NearestFilter;
  t.minFilter = THREE.NearestMipmapNearestFilter;
  t.colorSpace = THREE.SRGBColorSpace;
  if (repeat) { t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(repeat[0], repeat[1]); }
  texCache.set(k, t);
  return t;
}

export function shade(hex: string, f: number): string {
  const c = new THREE.Color(hex);
  c.multiplyScalar(f);
  return '#' + c.getHexString();
}

/** 像素噪点填充（方块材质感） */
export function noiseFill(ctx: CanvasRenderingContext2D, w: number, h: number, base: string, amt = 0.12, px = 2, seed = 1) {
  let s = seed;
  const rnd = () => { s = (s * 16807) % 2147483647; return s / 2147483647; };
  const c = new THREE.Color(base);
  for (let y = 0; y < h; y += px) for (let x = 0; x < w; x += px) {
    const f = 1 + (rnd() - 0.5) * amt * 2;
    ctx.fillStyle = `rgb(${Math.min(255, c.r * 255 * f) | 0},${Math.min(255, c.g * 255 * f) | 0},${Math.min(255, c.b * 255 * f) | 0})`;
    ctx.fillRect(x, y, px, px);
  }
}

export function drawFlag(ctx: CanvasRenderingContext2D, f: FlagDef, x: number, y: number, w: number, h: number) {
  const cols = f.colors;
  ctx.save();
  ctx.beginPath(); ctx.rect(x, y, w, h); ctx.clip();
  const weights = f.weights ?? cols.map(() => 1);
  const total = weights.reduce((a, b) => a + b, 0);
  switch (f.type) {
    case 'h': { let yy = y; cols.forEach((c, i) => { const hh = (h * weights[i]) / total; ctx.fillStyle = c; ctx.fillRect(x, yy, w, hh + 1); yy += hh; }); break; }
    case 'v': { let xx = x; cols.forEach((c, i) => { const ww = (w * weights[i]) / total; ctx.fillStyle = c; ctx.fillRect(xx, y, ww + 1, h); xx += ww; }); break; }
    case 'nordic': ctx.fillStyle = cols[0]; ctx.fillRect(x, y, w, h); ctx.fillStyle = cols[1]; ctx.fillRect(x + w * 0.3, y, w * 0.14, h); ctx.fillRect(x, y + h * 0.42, w, h * 0.16); break;
    case 'cross': ctx.fillStyle = cols[0]; ctx.fillRect(x, y, w, h); ctx.fillStyle = cols[1]; ctx.fillRect(x + w * 0.43, y, w * 0.14, h); ctx.fillRect(x, y + h * 0.4, w, h * 0.2); break;
    case 'plus': ctx.fillStyle = cols[0]; ctx.fillRect(x, y, w, h); ctx.fillStyle = cols[1]; ctx.fillRect(x + w * 0.42, y + h * 0.18, w * 0.16, h * 0.64); ctx.fillRect(x + w * 0.28, y + h * 0.4, w * 0.44, h * 0.2); break;
    case 'circle': ctx.fillStyle = cols[0]; ctx.fillRect(x, y, w, h); ctx.fillStyle = cols[1]; ctx.beginPath(); ctx.arc(x + w / 2, y + h / 2, h * 0.3, 0, Math.PI * 2); ctx.fill(); break;
    case 'yinyang': ctx.fillStyle = cols[0]; ctx.fillRect(x, y, w, h); ctx.fillStyle = cols[1]; ctx.beginPath(); ctx.arc(x + w / 2, y + h / 2, h * 0.28, Math.PI, 0); ctx.fill(); ctx.fillStyle = cols[2]; ctx.beginPath(); ctx.arc(x + w / 2, y + h / 2, h * 0.28, 0, Math.PI); ctx.fill();
      ctx.fillStyle = '#000'; for (const dx of [-0.36, 0.3]) for (const dy of [-0.32, 0.22]) ctx.fillRect(x + w * (0.5 + dx), y + h * (0.5 + dy), w * 0.06, h * 0.1); break;
    case 'diamond': ctx.fillStyle = cols[0]; ctx.fillRect(x, y, w, h); ctx.fillStyle = cols[1]; ctx.beginPath(); ctx.moveTo(x + w * 0.5, y + h * 0.1); ctx.lineTo(x + w * 0.92, y + h * 0.5); ctx.lineTo(x + w * 0.5, y + h * 0.9); ctx.lineTo(x + w * 0.08, y + h * 0.5); ctx.fill();
      ctx.fillStyle = cols[2]; ctx.beginPath(); ctx.arc(x + w / 2, y + h / 2, h * 0.22, 0, Math.PI * 2); ctx.fill(); break;
    case 'solid': ctx.fillStyle = cols[0]; ctx.fillRect(x, y, w, h); break;
    case 'stripes': for (let i = 0; i < 9; i++) { ctx.fillStyle = cols[i % 2]; ctx.fillRect(x, y + (h * i) / 9, w, h / 9 + 1); } ctx.fillStyle = cols[0]; ctx.fillRect(x, y, w * 0.4, h * (5 / 9)); break;
    case 'canton': for (let i = 0; i < 13; i++) { ctx.fillStyle = i % 2 ? cols[1] : cols[0]; ctx.fillRect(x, y + (h * i) / 13, w, h / 13 + 1); } ctx.fillStyle = cols[2]; ctx.fillRect(x, y, w * 0.42, h * (7 / 13));
      ctx.fillStyle = '#fff'; for (let i = 0; i < 4; i++) for (let j = 0; j < 3; j++) ctx.fillRect(x + w * (0.04 + i * 0.1), y + h * (0.06 + j * 0.16), Math.max(1, w * 0.03), Math.max(1, h * 0.04)); break;
  }
  if (f.emblem && f.emblem.length <= 2 && /[☀-➿★✦✪☾☀♛⛨▦⛰]/.test(f.emblem)) {
    ctx.fillStyle = f.emblemColor ?? '#fff';
    ctx.font = `bold ${Math.round(h * 0.42)}px sans-serif`;
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    const ex = f.type === 'stripes' ? x + w * 0.2 : f.type === 'v' && f.weights ? x + w * 0.4 : x + w / 2;
    const ey = f.type === 'stripes' ? y + h * 0.28 : y + h / 2;
    ctx.fillText(f.emblem, ex, ey);
  }
  ctx.restore();
}

export function grassTexture(a: string, b: string, line: string, key: string): THREE.Texture {
  return canvasTexture('grass_' + key, 256, 256, (ctx) => {
    noiseFill(ctx, 256, 256, a, 0.08, 4, 7);
    ctx.globalAlpha = 0.5; noiseFill(ctx, 256, 128, b, 0.08, 4, 11); ctx.globalAlpha = 1;
    void line;
  });
}

export function blockTexture(base: string, key: string, amt = 0.14): THREE.Texture {
  return canvasTexture('block_' + key + base, 32, 32, (ctx) => {
    noiseFill(ctx, 32, 32, base, amt, 4, 3);
    ctx.strokeStyle = shade(base, 0.75); ctx.lineWidth = 2; ctx.strokeRect(1, 1, 30, 30);
  });
}

export function ballTexture(): THREE.Texture {
  return canvasTexture('ball', 16, 16, (ctx) => {
    ctx.fillStyle = '#f5f5f5'; ctx.fillRect(0, 0, 16, 16);
    ctx.fillStyle = '#1a1a1a';
    [[6, 6, 4, 4], [0, 0, 3, 3], [13, 0, 3, 3], [0, 13, 3, 3], [13, 13, 3, 3]].forEach(([x, y, w, h]) => ctx.fillRect(x, y, w, h));
    ctx.fillStyle = '#cfcfcf'; ctx.fillRect(3, 7, 3, 1); ctx.fillRect(10, 7, 3, 1); ctx.fillRect(7, 3, 1, 3); ctx.fillRect(7, 10, 1, 3);
  });
}

export function textTexture(key: string, text: string, bg: string, fg: string, w = 256, h = 64, font = 'bold 34px monospace'): THREE.Texture {
  return canvasTexture('txt_' + key, w, h, (ctx) => {
    ctx.fillStyle = bg; ctx.fillRect(0, 0, w, h);
    ctx.fillStyle = fg; ctx.font = font; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText(text, w / 2, h / 2 + 2);
  });
}
