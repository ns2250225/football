// 可复现随机数生成器（mulberry32）
export class RNG {
  s: number;
  constructor(seed: number) { this.s = (seed >>> 0) || 0x9e3779b9; }
  next(): number {
    let t = (this.s = (this.s + 0x6d2b79f5) >>> 0);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  }
  range(a: number, b: number): number { return a + (b - a) * this.next(); }
  int(a: number, b: number): number { return Math.floor(this.range(a, b + 1)); }
  chance(p: number): boolean { return this.next() < p; }
  pick<T>(arr: readonly T[]): T { return arr[Math.floor(this.next() * arr.length) % arr.length]; }
  shuffle<T>(arr: T[]): T[] {
    for (let i = arr.length - 1; i > 0; i--) { const j = Math.floor(this.next() * (i + 1)); [arr[i], arr[j]] = [arr[j], arr[i]]; }
    return arr;
  }
  gauss(): number { let u = 0, v = 0; while (u === 0) u = this.next(); while (v === 0) v = this.next(); return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v); }
  weighted<T>(items: T[], weights: number[]): T | undefined {
    let sum = 0; for (const w of weights) sum += Math.max(0, w);
    if (sum <= 0) return undefined;
    let r = this.next() * sum;
    for (let i = 0; i < items.length; i++) { r -= Math.max(0, weights[i]); if (r <= 0) return items[i]; }
    return items[items.length - 1];
  }
  poisson(lambda: number): number { const L = Math.exp(-lambda); let k = 0, p = 1; do { k++; p *= this.next(); } while (p > L); return k - 1; }
}
export function hashStr(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); }
  return h >>> 0;
}
export const rand = new RNG((Date.now() ^ (Math.random() * 1e9)) >>> 0);
export function newSeed(): number { return (Date.now() ^ Math.floor(Math.random() * 0xffffffff)) >>> 0; }
