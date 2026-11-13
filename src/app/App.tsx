import React, { lazy, Suspense, useEffect } from 'react';
import { useGame } from '../store/gameStore';
import MainMenu from '../components/MainMenu/MainMenu';
import ModeSelect from '../components/MainMenu/ModeSelect';
import TeamSelect, { CoreSelect } from '../components/TeamSelect/TeamSelect';
import TournamentHub from '../components/Tournament/TournamentHub';
import Shop from '../components/Shop/Shop';
import TeamManage from '../components/Manage/TeamManage';
import Encyclopedia from '../components/Encyclopedia/Encyclopedia';
import Achievements from '../components/Achievement/Achievements';
import Settings from '../components/Settings/Settings';
import { AudioManager } from '../game/audio/AudioManager';
import { initLayout, useLayout, tryLockLandscape } from './layout';

const MatchScreen = lazy(() => import('../components/GameHUD/MatchScreen'));
const TournamentEnd = lazy(() => import('../components/Result/TournamentEnd'));

/** 异常边界：发生异常时可恢复最近一次安全存档 */
class ErrorBoundary extends React.Component<{ children: React.ReactNode }, { err: Error | null }> {
  state = { err: null as Error | null };
  static getDerivedStateFromError(err: Error) { return { err }; }
  componentDidCatch(err: Error) { console.error(err); }
  render() {
    if (!this.state.err) return this.props.children;
    return (
      <div className="h-full flex items-center justify-center dirt-bg p-4">
        <div className="mc-panel p-5 max-w-md flex flex-col gap-3">
          <div className="text-2xl font-black pixel-text text-red-300">⚠ 游戏发生异常</div>
          <div className="text-sm text-gray-300 break-all">{String(this.state.err.message)}</div>
          <button className="mc-btn gold" onClick={async () => { const ok = await useGame.getState().restoreBackup(); this.setState({ err: null }); if (!ok) useGame.setState({ screen: 'menu' }); }}>🛟 恢复最近一次安全存档</button>
          <button className="mc-btn" onClick={() => { useGame.setState({ screen: 'menu' }); this.setState({ err: null }); }}>返回主菜单</button>
        </div>
      </div>
    );
  }
}

function AchievementToasts() {
  const toasts = useGame((s) => s.achToasts);
  const dismiss = useGame((s) => s.dismissAch);
  useEffect(() => {
    if (!toasts.length) return;
    const t = setTimeout(() => dismiss(toasts[0].id), 4200);
    return () => clearTimeout(t);
  }, [toasts, dismiss]);
  return (
    <div className="fixed top-16 left-1/2 -translate-x-1/2 z-[70] flex flex-col gap-1 pointer-events-none">
      {toasts.map((a) => (
        <div key={a.id} className="mc-panel px-4 py-2 anim-pop flex items-center gap-2 border-yellow-400">
          <span className="text-3xl">{a.icon}</span>
          <div><div className="text-xs text-yellow-300 font-bold">成就达成</div><div className="font-black">{a.name}</div>{a.reward && <div className="text-xs text-green-300">{a.reward}</div>}</div>
        </div>
      ))}
    </div>
  );
}

export default function App() {
  const { screen, ready, init } = useGame();
  useEffect(() => { init(); }, [init]);
  useEffect(() => {
    initLayout();
    const unlock = () => { AudioManager.ensure(); tryLockLandscape(); };
    window.addEventListener('pointerdown', unlock, { once: true });
    window.addEventListener('keydown', unlock, { once: true });
    const save = () => useGame.getState().persist();
    window.addEventListener('beforeunload', save);
    return () => window.removeEventListener('beforeunload', save);
  }, []);
  if (!ready) return <div className="h-full flex items-center justify-center grass-bg text-2xl font-black title-text">加载中…</div>;
  let view: React.ReactNode;
  switch (screen) {
    case 'menu': view = <MainMenu />; break;
    case 'mode': view = <ModeSelect />; break;
    case 'teamSelect': view = <TeamSelect />; break;
    case 'coreSelect': view = <CoreSelect />; break;
    case 'hub': view = <TournamentHub />; break;
    case 'match': view = <MatchScreen />; break;
    case 'shop': view = <Shop />; break;
    case 'manage': view = <TeamManage />; break;
    case 'encyclopedia': view = <Encyclopedia />; break;
    case 'achievements': view = <Achievements />; break;
    case 'settings': view = <Settings />; break;
    case 'tournamentEnd': view = <TournamentEnd />; break;
  }
  return (
    <LandscapeRoot>
    <ErrorBoundary>
      <Suspense fallback={<div className="h-full flex items-center justify-center grass-bg text-xl font-black title-text">正在加载球场…</div>}>
        <div className="h-full w-full">{view}</div>
      </Suspense>
      <AchievementToasts />
    </ErrorBoundary>
    </LandscapeRoot>
  );
}

/** 竖屏强制横屏：将整个游戏画面旋转 90°（模态框等 fixed 元素随之旋转） */
function LandscapeRoot({ children }: { children: React.ReactNode }) {
  const { rotated, w, h } = useLayout();
  const style: React.CSSProperties = rotated
    ? { position: 'fixed', top: 0, left: 0, width: w, height: h, transform: `translateX(${h}px) rotate(90deg)`, transformOrigin: 'top left', overflow: 'hidden' }
    : { position: 'relative', width: '100%', height: '100%', overflow: 'hidden' };
  return <div id="landscape-root" style={style}>{children}</div>;
}
