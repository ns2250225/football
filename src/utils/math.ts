export const clamp = (v: number, a: number, b: number) => (v < a ? a : v > b ? b : v);
export const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
export const sat = (v: number) => clamp(v, 0, 1);
export function angleDiff(a: number, b: number): number { let d = b - a; while (d > Math.PI) d -= Math.PI * 2; while (d < -Math.PI) d += Math.PI * 2; return d; }
export function approach(cur: number, target: number, step: number): number { return cur < target ? Math.min(cur + step, target) : Math.max(cur - step, target); }
export function dist2(ax: number, az: number, bx: number, bz: number): number { const dx = ax - bx, dz = az - bz; return Math.sqrt(dx * dx + dz * dz); }
export function fmtTime(sec: number): string { const s = Math.max(0, Math.floor(sec)); return `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`; }
export function hexToRgb(hex: string): [number, number, number] { const h = hex.replace('#', ''); const n = parseInt(h.length === 3 ? h.split('').map((c) => c + c).join('') : h, 16); return [(n >> 16) & 255, (n >> 8) & 255, n & 255]; }
export function colorDist(a: string, b: string): number { const x = hexToRgb(a), y = hexToRgb(b); return Math.sqrt((x[0] - y[0]) ** 2 + (x[1] - y[1]) ** 2 + (x[2] - y[2]) ** 2); }
/** 点到线段距离（2D） */
export function pointSegDist(px: number, pz: number, ax: number, az: number, bx: number, bz: number): number {
  const vx = bx - ax, vz = bz - az; const wx = px - ax, wz = pz - az;
  const l2 = vx * vx + vz * vz; let t = l2 > 0 ? (wx * vx + wz * vz) / l2 : 0; t = clamp(t, 0, 1);
  const cx = ax + vx * t, cz = az + vz * t; return Math.hypot(px - cx, pz - cz);
}
