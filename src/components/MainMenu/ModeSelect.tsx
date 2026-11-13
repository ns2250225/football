import { useState } from 'react';
import { useGame } from '../../store/gameStore';
import { Screen } from '../common/UI';
import { GameMode, MODE_NAME, DIFFICULTY_NAME, DIFFICULTY_MULT, DIFFICULTY_AI, CustomOptions } from '../../game/types';
import { AudioManager } from '../../game/audio/AudioManager';

const MODES: { id: GameMode; icon: string; desc: string }[] = [
  { id: 'standard', icon: '🏆', desc: '正常难度，32 支球队按实力分档抽签，经典世界杯征程。' },
  { id: 'random', icon: '🎲', desc: '完全随机分组、随机球场与天气，更多赛事事件。' },
  { id: 'extreme', icon: '🔥', desc: '对手 AI 与技能强度提高，所有对手都携带 BOSS 机制。' },
  { id: 'custom', icon: '🛠️', desc: '自由选择难度、比赛时间、事件频率与技能掉落概率。' },
];

export default function ModeSelect() {
  const { go, beginRun, run } = useGame();
  const [mode, setMode] = useState<GameMode>('standard');
  const [diff, setDiff] = useState(1);
  const [custom, setCustom] = useState<CustomOptions>({ difficulty: 1, timeScale: 1, eventFreq: 1, dropLuck: 0 });
  const [confirm, setConfirm] = useState(false);
  const start = () => {
    if (run && !run.ended && !confirm) { setConfirm(true); return; }
    AudioManager.play('select');
    beginRun(mode, mode === 'custom' ? custom.difficulty : mode === 'extreme' ? Math.max(diff, 2) : diff, mode === 'custom' ? custom : { difficulty: diff, timeScale: 1, eventFreq: 1, dropLuck: 0 });
  };
  return (
    <Screen title="选择世界杯模式" onBack={() => go('menu')}>
      <div className="max-w-4xl mx-auto flex flex-col gap-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {MODES.map((m) => (
            <button key={m.id} onClick={() => { AudioManager.play('click'); setMode(m.id); }} className={`mc-panel p-4 text-left transition ${mode === m.id ? 'outline outline-4 outline-yellow-400' : 'opacity-85'}`}>
              <div className="text-3xl">{m.icon}</div>
              <div className="text-lg font-black pixel-text">{MODE_NAME[m.id]}</div>
              <div className="text-sm text-gray-300">{m.desc}</div>
            </button>
          ))}
        </div>
        {mode !== 'custom' ? (
          <div className="mc-panel p-4">
            <h3 className="font-black pixel-text mb-2">难度等级</h3>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
              {DIFFICULTY_NAME.map((n, i) => (
                <button key={n} className={`mc-btn ${diff === i ? 'gold' : ''} flex-col !items-start text-left`} disabled={mode === 'extreme' && i < 2} onClick={() => setDiff(i)}>
                  <span>{n}</span><span className="text-xs font-normal">属性 ×{DIFFICULTY_MULT[i]} · {DIFFICULTY_AI[i]}</span>
                </button>
              ))}
            </div>
            <p className="text-xs text-gray-400 mt-2">对手强度还会随赛事阶段增长：小组赛 ×1.0 → 16 强 ×1.1 → 8 强 ×1.2 → 半决赛 ×1.3 → 决赛 ×1.5</p>
          </div>
        ) : (
          <div className="mc-panel p-4 grid gap-3">
            <label className="grid gap-1">难度：{DIFFICULTY_NAME[custom.difficulty]}
              <input type="range" min={0} max={4} value={custom.difficulty} onChange={(e) => setCustom({ ...custom, difficulty: +e.target.value })} /></label>
            <label className="grid gap-1">比赛时间：每半场 {Math.round(90 * custom.timeScale)} 秒
              <input type="range" min={0.5} max={1.5} step={0.1} value={custom.timeScale} onChange={(e) => setCustom({ ...custom, timeScale: +e.target.value })} /></label>
            <label className="grid gap-1">事件频率：{['关闭', '普通', '较多', '狂欢'][custom.eventFreq]}
              <input type="range" min={0} max={3} value={custom.eventFreq} onChange={(e) => setCustom({ ...custom, eventFreq: +e.target.value })} /></label>
            <label className="grid gap-1">技能掉落幸运：+{Math.round(custom.dropLuck * 100)}%
              <input type="range" min={0} max={0.6} step={0.05} value={custom.dropLuck} onChange={(e) => setCustom({ ...custom, dropLuck: +e.target.value })} /></label>
          </div>
        )}
        {confirm && <div className="mc-panel p-3 text-orange-300 font-bold">⚠ 已有进行中的征程，开始新征程将覆盖当前存档。再次点击确认。</div>}
        <button className="mc-btn green text-xl py-3" onClick={start}>选择国家队 ▶</button>
      </div>
    </Screen>
  );
}
