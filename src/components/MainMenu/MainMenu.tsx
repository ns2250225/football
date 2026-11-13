import { useEffect, useState } from 'react';
import { useGame } from '../../store/gameStore';
import { getTeam } from '../../data/teams';
import { Flag } from '../common/UI';
import { AudioManager } from '../../game/audio/AudioManager';
import { STAGE_NAME, MODE_NAME, DIFFICULTY_NAME } from '../../game/types';
import { nextPlayerMatch } from '../../game/tournament/WorldCup';
import { ACHIEVEMENTS } from '../../data/achievements';
import { useLayout } from '../../app/layout';
import { FullscreenButton } from '../common/FullscreenButton';

export default function MainMenu() {
  const { run, go, meta, continueRun } = useGame();
  const [encTab, setEncTab] = useState(false);
  useEffect(() => { AudioManager.startMusic('menu'); }, []);
  const next = run ? nextPlayerMatch(run.tournament, run.teamId) : undefined;
  const achDone = Object.keys(meta.achievements).length;
  // 横屏矮屏（手机横屏）：标题与按钮左右两栏排布，避免底部被截断
  const short = useLayout((s) => s.h < 600 && s.w > s.h);
  const items: { label: string; icon: string; act: () => void; cls?: string; hidden?: boolean }[] = [
    { label: '开始世界杯', icon: '⚽', act: () => go('mode'), cls: 'green' },
    { label: '继续游戏', icon: '▶', act: () => continueRun(), cls: 'blue', hidden: !run },
    { label: '图鉴', icon: '📖', act: () => setEncTab(true) },
    { label: '成就系统', icon: '🏅', act: () => go('achievements') },
    { label: '游戏设置', icon: '⚙️', act: () => go('settings') },
  ];
  const runPanel = run && (
    <div className={`mc-panel w-full ${short ? 'p-2' : 'p-3'} flex items-center gap-3`}>
      <Flag flag={getTeam(run.teamId).flag} />
      <div className="flex-1 text-sm min-w-0">
        <div className="font-bold truncate">{getTeam(run.teamId).name} · {MODE_NAME[run.mode]} · {DIFFICULTY_NAME[run.difficulty]}</div>
        <div className="text-gray-300 truncate">LV.{run.level} · 🪙{run.gold} · {run.ended ? '征程已结束' : run.eliminated ? '已被淘汰' : next ? `下一场：${STAGE_NAME[next.stage]}` : ''}</div>
      </div>
    </div>
  );
  const buttons = (
    <div className={`flex flex-col w-full ${short ? 'gap-1.5' : 'gap-2 mt-2'}`}>
      {items.filter((i) => !i.hidden).map((i) => (
        <button key={i.label} className={`mc-btn ${i.cls ?? ''} ${short ? 'text-base py-1.5' : 'text-lg py-3'}`} onClick={() => { AudioManager.play('click'); i.act(); }}>{i.icon} {i.label}</button>
      ))}
    </div>
  );
  const footer = (
    <>
      <div className={`text-xs text-gray-300 pixel-text text-center ${short ? 'mt-2' : 'mt-3'}`}>已解锁球队 {meta.unlocked.length}/32 · 成就 {achDone}/{ACHIEVEMENTS.length} · 冠军 {meta.stats.champions} 次</div>
      <div className="text-[10px] text-gray-400 mt-1 text-center">原创方块风格美术，非 Minecraft 官方作品</div>
    </>
  );
  return (
    <div className="h-full w-full relative overflow-hidden grass-bg" onPointerDown={() => AudioManager.ensure()}>
      <MenuBackdrop />
      <div className="absolute inset-0 z-10 overflow-y-auto overflow-x-hidden">
        {short ? (
          <div className="min-h-full w-full flex items-center justify-center gap-6 px-4 py-3">
            <div className="flex flex-col items-center gap-1 flex-1 max-w-sm min-w-0">
              <div className="text-4xl anim-float">⚽</div>
              <h1 className="text-4xl font-black title-text text-center" style={{ color: '#fde047' }}>方块世界杯</h1>
              <div className="text-lg font-black title-text tracking-widest" style={{ color: '#86efac' }}>ROGUE FOOTBALL</div>
              <div className="text-xs text-gray-200 pixel-text text-center">32 支国家队 · 92 个基础技能 · 20 种进化 · 12 个终极大招</div>
              {footer}
            </div>
            <div className="flex flex-col items-center gap-1.5 flex-1 max-w-sm min-w-0">
              {runPanel}
              {buttons}
            </div>
          </div>
        ) : (
          <div className="min-h-full w-full flex flex-col items-center justify-center py-4">
            <div className="flex flex-col items-center gap-2 px-4 w-full max-w-xl">
              <div className="text-5xl md:text-6xl anim-float">⚽</div>
              <h1 className="text-4xl md:text-6xl font-black title-text text-center" style={{ color: '#fde047' }}>方块世界杯</h1>
              <div className="text-xl md:text-2xl font-black title-text tracking-widest" style={{ color: '#86efac' }}>ROGUE FOOTBALL</div>
              <div className="text-xs md:text-sm text-gray-200 pixel-text mb-3 text-center">32 支国家队 · 92 个基础技能 · 20 种进化 · 12 个终极大招</div>
              {runPanel}
              {buttons}
              {footer}
            </div>
          </div>
        )}
      </div>
      <FullscreenButton className="absolute top-2 right-2 z-20 px-3 py-1.5 text-sm" />
      {encTab && <EncyclopediaPicker onClose={() => setEncTab(false)} />}
    </div>
  );
}

function EncyclopediaPicker({ onClose }: { onClose: () => void }) {
  const go = useGame((s) => s.go);
  const open = (tab: string) => { sessionStorageSafe(tab); go('encyclopedia'); };
  return (
    <div className="fixed inset-0 z-40 bg-black/60 flex items-center justify-center" onClick={onClose}>
      <div className="mc-panel p-4 w-80 max-h-[92%] overflow-y-auto flex flex-col gap-2 anim-pop" onClick={(e) => e.stopPropagation()}>
        <h2 className="text-lg font-black pixel-text mb-1">图鉴</h2>
        <button className="mc-btn" onClick={() => open('teams')}>🌍 球队图鉴</button>
        <button className="mc-btn" onClick={() => open('skills')}>✨ 技能图鉴</button>
        <button className="mc-btn" onClick={() => open('equipment')}>🎒 装备图鉴</button>
        <button className="mc-btn" onClick={() => open('stadiums')}>🏟️ 球场图鉴</button>
        <button className="mc-btn" onClick={() => open('events')}>🎪 事件 / BOSS / 天气</button>
        <button className="mc-btn red small mt-1" onClick={onClose}>关闭</button>
      </div>
    </div>
  );
}
export let encyclopediaInitialTab = 'teams';
function sessionStorageSafe(tab: string) { encyclopediaInitialTab = tab; }

function MenuBackdrop() {
  const blocks = Array.from({ length: 22 }, (_, i) => i);
  return (
    <div className="absolute inset-0 pointer-events-none">
      <div className="absolute inset-x-0 bottom-0 h-1/3" style={{ background: 'linear-gradient(#5b3a1e, #3b2612)' }} />
      <div className="absolute inset-x-0 bottom-1/3 h-6" style={{ background: '#3fa34d', borderTop: '4px solid #2f7d32' }} />
      {blocks.map((i) => (
        <div key={i} className="absolute anim-float" style={{
          left: `${(i * 37) % 100}%`, top: `${(i * 23) % 60}%`, width: 14 + (i % 4) * 8, height: 14 + (i % 4) * 8,
          background: ['#f7d417', '#1e3a8a', '#c8102e', '#ffffff', '#3fa34d', '#ff7a00'][i % 6], opacity: 0.35, border: '3px solid rgba(0,0,0,0.5)', animationDelay: `${i * 0.3}s`,
        }} />
      ))}
    </div>
  );
}
