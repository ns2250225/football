// 统一输入：PC 键盘 + 移动端虚拟摇杆/按钮
export type Action = 'shoot' | 'pass' | 'long' | 'tackle' | 'switch' | 'skill' | 'ult' | 'tactic' | 'pause' | 'sprint' | 'skill1' | 'skill2' | 'skill3' | 'skill4' | 'cycle' | 'skip';

const KEYMAP: Record<string, Action> = {
  Space: 'shoot', KeyJ: 'pass', KeyK: 'long', KeyL: 'tackle', KeyQ: 'switch', KeyE: 'skill', KeyR: 'ult', Tab: 'tactic', Escape: 'pause',
  ShiftLeft: 'sprint', ShiftRight: 'sprint', Digit1: 'skill1', Digit2: 'skill2', Digit3: 'skill3', Digit4: 'skill4', KeyF: 'cycle', Enter: 'skip',
};

export class Input {
  private keys = new Set<string>();
  private down = new Set<Action>();
  private pressed = new Set<Action>();
  private released = new Set<Action>();
  private vDown = new Set<Action>();
  joy = { x: 0, y: 0, active: false };
  enabled = true;
  private onKeyDown = (e: KeyboardEvent) => {
    if (!this.enabled) return;
    const tag = (e.target as HTMLElement)?.tagName;
    if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return;
    if (e.code === 'Tab' || e.code === 'Space' || e.code.startsWith('Arrow')) e.preventDefault();
    if (this.keys.has(e.code)) return;
    this.keys.add(e.code);
    const a = KEYMAP[e.code];
    if (a) { this.down.add(a); this.pressed.add(a); }
  };
  private onKeyUp = (e: KeyboardEvent) => {
    this.keys.delete(e.code);
    const a = KEYMAP[e.code];
    if (a && !Object.entries(KEYMAP).some(([k, v]) => v === a && this.keys.has(k))) { this.down.delete(a); this.released.add(a); }
  };
  private onBlur = () => { this.keys.clear(); this.down.clear(); this.vDown.clear(); this.joy = { x: 0, y: 0, active: false }; };

  attach() {
    window.addEventListener('keydown', this.onKeyDown);
    window.addEventListener('keyup', this.onKeyUp);
    window.addEventListener('blur', this.onBlur);
  }
  detach() {
    window.removeEventListener('keydown', this.onKeyDown);
    window.removeEventListener('keyup', this.onKeyUp);
    window.removeEventListener('blur', this.onBlur);
  }
  /** 屏幕坐标系移动向量：x 右为正，z 下为正（与摄像机对应） */
  move(): { x: number; z: number } {
    let x = 0, z = 0;
    if (this.keys.has('KeyA') || this.keys.has('ArrowLeft')) x -= 1;
    if (this.keys.has('KeyD') || this.keys.has('ArrowRight')) x += 1;
    if (this.keys.has('KeyW') || this.keys.has('ArrowUp')) z -= 1;
    if (this.keys.has('KeyS') || this.keys.has('ArrowDown')) z += 1;
    if (this.joy.active) { x += this.joy.x; z += this.joy.y; }
    const l = Math.hypot(x, z);
    if (l > 1) { x /= l; z /= l; }
    return { x, z };
  }
  isDown(a: Action): boolean { return this.down.has(a) || this.vDown.has(a); }
  consume(a: Action): boolean { if (this.pressed.has(a)) { this.pressed.delete(a); return true; } return false; }
  consumeRelease(a: Action): boolean { if (this.released.has(a)) { this.released.delete(a); return true; } return false; }
  peek(a: Action): boolean { return this.pressed.has(a); }
  clearFrame() { this.pressed.clear(); this.released.clear(); }
  // 虚拟按键（移动端）
  vPress(a: Action) { this.pressed.add(a); }
  vHold(a: Action, on: boolean) {
    if (on) { if (!this.vDown.has(a)) { this.vDown.add(a); this.pressed.add(a); } }
    else if (this.vDown.has(a)) { this.vDown.delete(a); this.released.add(a); }
  }
  setJoy(x: number, y: number, active: boolean) { this.joy = { x, y, active }; }
}
