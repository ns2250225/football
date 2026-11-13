// 轻量事件总线：比赛内各系统通过它解耦通信
export type GameEventName =
  | 'pass' | 'passComplete' | 'intercept' | 'tackleWin' | 'tackleFail' | 'dribblePast' | 'shot' | 'shotOnTarget' | 'goal' | 'save'
  | 'foul' | 'card' | 'out' | 'switch' | 'skillCast' | 'ultCast' | 'duelWin' | 'possession' | 'header' | 'kickoff' | 'hit' | 'ballLost';

export type Listener = (data: any) => void;

export class EventBus {
  private map = new Map<GameEventName, Listener[]>();
  on(name: GameEventName, fn: Listener): () => void {
    const arr = this.map.get(name) ?? [];
    arr.push(fn);
    this.map.set(name, arr);
    return () => { const a = this.map.get(name); if (a) this.map.set(name, a.filter((f) => f !== fn)); };
  }
  emit(name: GameEventName, data?: any) {
    const arr = this.map.get(name);
    if (arr) for (const fn of arr) fn(data);
  }
  clear() { this.map.clear(); }
}
