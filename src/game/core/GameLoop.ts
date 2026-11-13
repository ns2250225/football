// 固定时间步长游戏循环：物理以固定步长推进，渲染跟随显示刷新
export class GameLoop {
  private raf = 0;
  private last = 0;
  private acc = 0;
  running = false;
  fps = 60;
  private fpsAcc = 0; private fpsFrames = 0;
  constructor(private step: number, private update: (dt: number) => void, private render: (dt: number, alpha: number) => void) {}
  start() {
    if (this.running) return;
    this.running = true;
    this.last = performance.now();
    const tick = (now: number) => {
      if (!this.running) return;
      let frame = (now - this.last) / 1000;
      this.last = now;
      if (frame > 0.1) frame = 0.1; // 防止切换标签后时间暴涨
      this.acc += frame;
      let n = 0;
      while (this.acc >= this.step && n < 16) { this.update(this.step); this.acc -= this.step; n++; }
      if (n >= 16) this.acc = 0;
      this.render(frame, this.acc / this.step);
      this.fpsAcc += frame; this.fpsFrames++;
      if (this.fpsAcc >= 0.5) { this.fps = Math.round(this.fpsFrames / this.fpsAcc); this.fpsAcc = 0; this.fpsFrames = 0; }
      this.raf = requestAnimationFrame(tick);
    };
    this.raf = requestAnimationFrame(tick);
  }
  stop() { this.running = false; cancelAnimationFrame(this.raf); }
}
