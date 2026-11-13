// 程序化音频：所有音效与环境音均由 WebAudio 实时合成，无需外部资源，可完全离线运行
type Sfx = 'kick' | 'pass' | 'whistle' | 'whistle_long' | 'goal' | 'cheer' | 'boo' | 'post' | 'save' | 'tackle' | 'fire' | 'zap' | 'ice' | 'explosion'
  | 'wind' | 'magic' | 'magnet' | 'blink' | 'shield' | 'quake' | 'wave' | 'time' | 'rocket' | 'jump' | 'phantom' | 'curse' | 'golden'
  | 'levelup' | 'coin' | 'click' | 'ultimate' | 'evolve' | 'buff' | 'skill' | 'shot_skill' | 'defense' | 'thunder' | 'card' | 'select' | 'error';

class AudioManagerImpl {
  ctx: AudioContext | null = null;
  master: GainNode | null = null;
  sfxGain: GainNode | null = null;
  musicGain: GainNode | null = null;
  ambGain: GainNode | null = null;
  private noise: AudioBuffer | null = null;
  private amb: { src: AudioBufferSourceNode; filter: BiquadFilterNode; gain: GainNode } | null = null;
  private musicTimer = 0;
  private musicStep = 0;
  sfxVol = 0.8; musicVol = 0.4;
  private lastPlay = new Map<string, number>();

  ensure() {
    if (this.ctx) { if (this.ctx.state === 'suspended') this.ctx.resume().catch(() => {}); return; }
    try {
      const Ctx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      this.ctx = new Ctx();
      this.master = this.ctx.createGain(); this.master.connect(this.ctx.destination);
      this.sfxGain = this.ctx.createGain(); this.sfxGain.connect(this.master);
      this.musicGain = this.ctx.createGain(); this.musicGain.connect(this.master);
      this.ambGain = this.ctx.createGain(); this.ambGain.connect(this.master);
      this.setVolumes(this.sfxVol, this.musicVol);
      const len = this.ctx.sampleRate * 2;
      this.noise = this.ctx.createBuffer(1, len, this.ctx.sampleRate);
      const d = this.noise.getChannelData(0);
      for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
    } catch { this.ctx = null; }
  }
  setVolumes(sfx: number, music: number) {
    this.sfxVol = sfx; this.musicVol = music;
    if (this.sfxGain) this.sfxGain.gain.value = sfx;
    if (this.ambGain) this.ambGain.gain.value = sfx * 0.6;
    if (this.musicGain) this.musicGain.gain.value = music * 0.35;
  }
  private tone(freq: number, dur: number, type: OscillatorType, vol: number, slide = 0, delay = 0) {
    if (!this.ctx || !this.sfxGain) return;
    const t = this.ctx.currentTime + delay;
    const o = this.ctx.createOscillator(); const g = this.ctx.createGain();
    o.type = type; o.frequency.setValueAtTime(freq, t);
    if (slide) o.frequency.exponentialRampToValueAtTime(Math.max(20, freq * slide), t + dur);
    g.gain.setValueAtTime(vol, t); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(g); g.connect(this.sfxGain); o.start(t); o.stop(t + dur + 0.02);
  }
  private burst(dur: number, freq: number, q: number, vol: number, type: BiquadFilterType = 'bandpass', delay = 0, slide = 1) {
    if (!this.ctx || !this.sfxGain || !this.noise) return;
    const t = this.ctx.currentTime + delay;
    const s = this.ctx.createBufferSource(); s.buffer = this.noise;
    const f = this.ctx.createBiquadFilter(); f.type = type; f.frequency.setValueAtTime(freq, t); f.Q.value = q;
    if (slide !== 1) f.frequency.exponentialRampToValueAtTime(Math.max(30, freq * slide), t + dur);
    const g = this.ctx.createGain(); g.gain.setValueAtTime(vol, t); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    s.connect(f); f.connect(g); g.connect(this.sfxGain); s.start(t, Math.random()); s.stop(t + dur + 0.05);
  }
  play(name: string, vol = 1) {
    this.ensure();
    if (!this.ctx) return;
    const now = performance.now();
    if ((this.lastPlay.get(name) ?? 0) > now - 40) return;
    this.lastPlay.set(name, now);
    const v = vol;
    switch (name as Sfx) {
      case 'kick': this.burst(0.08, 900, 1.2, 0.6 * v, 'lowpass'); this.tone(120, 0.1, 'sine', 0.5 * v, 0.5); break;
      case 'pass': this.burst(0.06, 1400, 1, 0.35 * v, 'lowpass'); this.tone(200, 0.06, 'sine', 0.25 * v, 0.6); break;
      case 'whistle': this.tone(2600, 0.25, 'square', 0.12 * v); this.tone(2650, 0.25, 'sine', 0.15 * v); break;
      case 'whistle_long': for (let i = 0; i < 3; i++) { this.tone(2600, i === 2 ? 0.7 : 0.22, 'square', 0.1 * v, 1, i * 0.32); } break;
      case 'goal': this.burst(2.2, 900, 0.4, 0.6 * v, 'bandpass', 0, 1.3); [523, 659, 784, 1046].forEach((f, i) => this.tone(f, 0.3, 'square', 0.1 * v, 1, i * 0.1)); break;
      case 'cheer': this.burst(1.4, 1100, 0.5, 0.35 * v, 'bandpass', 0, 1.2); break;
      case 'boo': this.burst(1.2, 300, 0.8, 0.3 * v, 'bandpass', 0, 0.7); break;
      case 'post': this.tone(880, 0.4, 'triangle', 0.35 * v, 0.98); this.tone(1320, 0.3, 'sine', 0.2 * v); break;
      case 'save': this.burst(0.15, 600, 1, 0.5 * v, 'lowpass'); this.tone(160, 0.15, 'sine', 0.4 * v, 0.6); break;
      case 'tackle': this.burst(0.18, 400, 0.8, 0.45 * v, 'lowpass'); break;
      case 'fire': this.burst(0.6, 600, 0.6, 0.5 * v, 'lowpass', 0, 0.4); this.tone(90, 0.4, 'sawtooth', 0.15 * v, 0.5); break;
      case 'zap': case 'thunder': this.burst(0.25, 3000, 2, 0.4 * v, 'highpass'); this.tone(1800, 0.2, 'sawtooth', 0.12 * v, 0.2); if (name === 'thunder') this.burst(1.2, 120, 0.5, 0.6 * v, 'lowpass', 0.05, 0.6); break;
      case 'ice': [1800, 2400, 3000].forEach((f, i) => this.tone(f, 0.25, 'sine', 0.12 * v, 1.1, i * 0.04)); this.burst(0.3, 5000, 3, 0.15 * v, 'highpass'); break;
      case 'explosion': this.burst(1.0, 200, 0.4, 0.9 * v, 'lowpass', 0, 0.3); this.tone(60, 0.8, 'sine', 0.6 * v, 0.4); break;
      case 'wind': this.burst(0.8, 800, 0.8, 0.3 * v, 'bandpass', 0, 2); break;
      case 'magic': case 'skill': [660, 880, 1320].forEach((f, i) => this.tone(f, 0.18, 'triangle', 0.13 * v, 1, i * 0.05)); break;
      case 'magnet': this.tone(220, 0.4, 'sine', 0.25 * v, 2.5); break;
      case 'blink': case 'phantom': this.tone(1400, 0.2, 'sine', 0.2 * v, 0.3); this.burst(0.2, 2000, 3, 0.15 * v); break;
      case 'shield': case 'defense': this.tone(500, 0.3, 'triangle', 0.25 * v, 1.5); break;
      case 'quake': this.burst(0.8, 90, 0.5, 0.8 * v, 'lowpass'); this.tone(45, 0.7, 'sine', 0.6 * v, 0.6); break;
      case 'wave': this.tone(300, 0.4, 'sawtooth', 0.2 * v, 0.3); this.burst(0.4, 700, 0.7, 0.3 * v); break;
      case 'time': this.tone(880, 0.8, 'sine', 0.2 * v, 0.25); this.tone(440, 0.8, 'triangle', 0.15 * v, 0.25); break;
      case 'rocket': this.burst(0.7, 400, 0.6, 0.5 * v, 'lowpass', 0, 2.5); break;
      case 'jump': this.tone(300, 0.15, 'square', 0.12 * v, 2); break;
      case 'curse': this.tone(140, 0.6, 'sawtooth', 0.2 * v, 0.6); this.tone(147, 0.6, 'sawtooth', 0.2 * v, 0.6); break;
      case 'golden': case 'buff': [784, 988, 1175, 1568].forEach((f, i) => this.tone(f, 0.22, 'triangle', 0.12 * v, 1, i * 0.06)); break;
      case 'shot_skill': this.burst(0.25, 1500, 1, 0.4 * v); this.tone(400, 0.25, 'square', 0.12 * v, 2); break;
      case 'levelup': [523, 659, 784, 1046, 1318].forEach((f, i) => this.tone(f, 0.18, 'square', 0.1 * v, 1, i * 0.07)); break;
      case 'coin': this.tone(988, 0.08, 'square', 0.12 * v); this.tone(1318, 0.2, 'square', 0.12 * v, 1, 0.08); break;
      case 'click': case 'select': this.tone(700, 0.05, 'square', 0.08 * v); break;
      case 'error': this.tone(180, 0.18, 'square', 0.12 * v); break;
      case 'card': this.tone(1200, 0.12, 'square', 0.1 * v); this.tone(800, 0.2, 'square', 0.1 * v, 1, 0.12); break;
      case 'ultimate': this.burst(1.5, 400, 0.4, 0.7 * v, 'bandpass', 0, 4); [262, 330, 392, 523, 659].forEach((f, i) => this.tone(f, 0.6, 'sawtooth', 0.08 * v, 1, i * 0.05)); break;
      case 'evolve': [392, 494, 587, 784, 988, 1175].forEach((f, i) => this.tone(f, 0.35, 'triangle', 0.13 * v, 1, i * 0.09)); this.burst(1.2, 2500, 1, 0.2 * v, 'bandpass', 0.3); break;
      default: this.tone(600, 0.1, 'triangle', 0.1 * v);
    }
  }
  /** 球场环境音（观众噪声），每座球场参数不同 */
  startAmbience(p: { freq: number; q: number; vol: number; tone: number }) {
    this.ensure();
    this.stopAmbience();
    if (!this.ctx || !this.noise || !this.ambGain) return;
    const src = this.ctx.createBufferSource(); src.buffer = this.noise; src.loop = true;
    const filter = this.ctx.createBiquadFilter(); filter.type = 'bandpass'; filter.frequency.value = p.freq; filter.Q.value = p.q;
    const gain = this.ctx.createGain(); gain.gain.value = p.vol * 0.4;
    src.connect(filter); filter.connect(gain); gain.connect(this.ambGain); src.start();
    this.amb = { src, filter, gain };
  }
  setExcite(x: number) {
    if (!this.amb || !this.ctx) return;
    this.amb.gain.gain.setTargetAtTime(0.12 + x * 0.35, this.ctx.currentTime, 0.3);
  }
  stopAmbience() { if (this.amb) { try { this.amb.src.stop(); } catch { /* noop */ } this.amb = null; } }
  /** 简单芯片风背景音乐 */
  startMusic(kind: 'menu' | 'match' | 'victory') {
    this.ensure();
    this.stopMusic();
    if (!this.ctx || !this.musicGain) return;
    const scales: Record<string, number[]> = { menu: [262, 330, 392, 494, 523, 494, 392, 330], match: [196, 247, 294, 392, 294, 247], victory: [523, 659, 784, 1046, 784, 659] };
    const notes = scales[kind];
    const bass = kind === 'menu' ? [131, 98, 110, 87] : [98, 73, 82, 65];
    const stepDur = kind === 'match' ? 0.32 : 0.26;
    this.musicStep = 0;
    this.musicTimer = window.setInterval(() => {
      if (!this.ctx || !this.musicGain) return;
      const t = this.ctx.currentTime;
      const n = notes[this.musicStep % notes.length];
      const o = this.ctx.createOscillator(); const g = this.ctx.createGain();
      o.type = 'square'; o.frequency.value = n; g.gain.setValueAtTime(0.05, t); g.gain.exponentialRampToValueAtTime(0.0001, t + stepDur * 0.9);
      o.connect(g); g.connect(this.musicGain); o.start(t); o.stop(t + stepDur);
      if (this.musicStep % 2 === 0) {
        const b = this.ctx.createOscillator(); const bg = this.ctx.createGain();
        b.type = 'triangle'; b.frequency.value = bass[Math.floor(this.musicStep / 4) % bass.length]; bg.gain.setValueAtTime(0.09, t); bg.gain.exponentialRampToValueAtTime(0.0001, t + stepDur * 1.8);
        b.connect(bg); bg.connect(this.musicGain); b.start(t); b.stop(t + stepDur * 2);
      }
      this.musicStep++;
    }, stepDur * 1000);
  }
  stopMusic() { if (this.musicTimer) { clearInterval(this.musicTimer); this.musicTimer = 0; } }
  suspend() { this.ctx?.suspend().catch(() => {}); }
  resume() { this.ctx?.resume().catch(() => {}); }
}

export const AudioManager = new AudioManagerImpl();
