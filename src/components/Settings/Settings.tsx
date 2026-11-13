import { useRef, useState } from 'react';
import { useGame } from '../../store/gameStore';
import { Screen, Tabs } from '../common/UI';
import { FullscreenButton } from '../common/FullscreenButton';
import { exportSave, parseImport } from '../../store/saveStore';
import { Settings as S } from '../../game/types';

export function RulesText() {
  return (
    <div className="text-sm space-y-1 text-gray-200">
      <p><b>比赛形式：</b>5v5（门将 1、后卫 1、中场 1、前锋 2），上下半场各 90 秒（游戏时间），中场休息可管理技能与装备。</p>
      <p><b>进球：</b>足球整体越过两门柱之间、横梁之下的球门线才算进球。进球后由失球方中圈开球。</p>
      <p><b>界外球：</b>足球整体越过边线，由对方掷界外球（只能传球，不能直接射门）。</p>
      <p><b>角球 / 球门球：</b>防守方最后触球越过底线为角球；进攻方最后触球为球门球。</p>
      <p><b>犯规与任意球：</b>抢断失败撞到对手、从背后铲球都可能犯规，由对方在犯规地点罚任意球；在禁区内犯规判罚点球。</p>
      <p><b>黄牌 / 红牌：</b>犯规可能被出示黄牌，两黄变一红；严重犯规直接红牌，被罚下的球员本场不能再上场。</p>
      <p><b>越位（5v5 简化）：</b>为保证快节奏，本作<b>不设越位规则</b>，前锋可以自由前插。</p>
      <p><b>淘汰赛：</b>常规时间战平进入 60 秒加时赛，仍战平进行点球大战（5 轮 + 突然死亡）。</p>
      <p><b>小组排名：</b>积分 → 净胜球 → 总进球 → 相互比赛成绩 → 抽签。小组前两名晋级 16 强。</p>
      <p><b>技能规则：</b>技能用于创造进球、突破与防守机会，不会直接判定进球；瞬移类技能不能进入球门区域，换位不会让足球瞬移。</p>
    </div>
  );
}

export function ControlsText() {
  const rows: [string, string][] = [
    ['WASD / 方向键', '移动'], ['Shift', '冲刺（消耗体力）'], ['空格（按住）', '蓄力射门 / 松开射出（空中球为头球/凌空）'], ['J', '短传（无球时请求队友传球）'], ['K', '长传 / 传中'],
    ['L', '抢断（冲刺中为铲球）'], ['Q', '切换控制球员'], ['E', '释放当前选中的主动技能'], ['1~4', '直接释放对应主动技能'], ['F', '切换选中的主动技能'], ['R', '释放大招（能量 100%）'],
    ['Tab', '战术面板'], ['Esc', '暂停'], ['射门方向', '射门时按住 W/S 选择射向球门的远/近角'],
  ];
  return (
    <div className="text-sm">
      <table className="w-full"><tbody>{rows.map(([k, v]) => <tr key={k}><td className="pr-3 py-0.5 font-bold text-yellow-300 whitespace-nowrap">{k}</td><td>{v}</td></tr>)}</tbody></table>
      <p className="mt-2 text-gray-300">移动端：左侧虚拟摇杆移动，右侧按钮射门（长按蓄力）、短传、长传、抢断、技能、大招、切换与冲刺。建议横屏游玩。</p>
    </div>
  );
}

export default function Settings() {
  const { go, meta, setSettings, run, replaceAll, restoreBackup } = useGame();
  const [tab, setTab] = useState<'general' | 'controls' | 'rules' | 'save'>('general');
  const [msg, setMsg] = useState<string | null>(null);
  const file = useRef<HTMLInputElement>(null);
  const st = meta.settings;
  const Toggle = ({ k, label }: { k: keyof S; label: string }) => (
    <label className="flex items-center justify-between mc-panel-light p-2"><span>{label}</span><input type="checkbox" checked={!!st[k]} onChange={(e) => setSettings({ [k]: e.target.checked } as Partial<S>)} /></label>
  );
  return (
    <Screen title="⚙️ 游戏设置" onBack={() => go('menu')} right={<FullscreenButton />}>
      <div className="max-w-3xl mx-auto">
        <Tabs tabs={[{ id: 'general', label: '画面与声音' }, { id: 'controls', label: '操作说明' }, { id: 'rules', label: '比赛规则' }, { id: 'save', label: '存档' }]} value={tab} onChange={setTab} />
        <div className="mc-panel p-3 mt-2 flex flex-col gap-2">
          {tab === 'general' && (<>
            <div className="font-bold">画质档位</div>
            <div className="grid grid-cols-3 gap-2">
              {(['low', 'medium', 'high'] as const).map((q) => <button key={q} className={`mc-btn ${st.quality === q ? 'gold' : ''} flex-col`} onClick={() => setSettings({ quality: q })}>
                <span>{q === 'low' ? '低' : q === 'medium' ? '中' : '高'}</span>
                <span className="text-[11px] font-normal">{q === 'low' ? '阴影关 · 粒子少 · 观众简化 · 分辨率 0.7' : q === 'medium' ? '简单阴影 · FXAA · 分辨率 0.85' : '完整阴影 · 高质量抗锯齿 · 分辨率 1.0'}</span>
              </button>)}
            </div>
            <label>球场亮度 {Math.round((st.brightness ?? 1) * 100)}%<input className="w-full" type="range" min={0.7} max={1.6} step={0.05} value={st.brightness ?? 1} onChange={(e) => setSettings({ brightness: +e.target.value })} /></label>
            <label>音效音量 {Math.round(st.sfx * 100)}%<input className="w-full" type="range" min={0} max={1} step={0.05} value={st.sfx} onChange={(e) => setSettings({ sfx: +e.target.value })} /></label>
            <label>音乐音量 {Math.round(st.music * 100)}%<input className="w-full" type="range" min={0} max={1} step={0.05} value={st.music} onChange={(e) => setSettings({ music: +e.target.value })} /></label>
            <Toggle k="hints" label="显示非关键提示（技能选择仍会暂停游戏）" />
            <Toggle k="shake" label="镜头震动" />
            <Toggle k="autoSwitch" label="接球 / 丢球时自动切换控制球员" />
            <Toggle k="showFps" label="显示帧率" />
            <div className="font-bold">触屏控制</div>
            <div className="grid grid-cols-3 gap-2">{(['auto', 'on', 'off'] as const).map((t) => <button key={t} className={`mc-btn small ${st.touch === t ? 'gold' : ''}`} onClick={() => setSettings({ touch: t })}>{t === 'auto' ? '自动检测' : t === 'on' ? '始终显示' : '关闭'}</button>)}</div>
            <div className="text-xs text-gray-400">画质与亮度设置在下一场比赛开始时生效。</div>
          </>)}
          {tab === 'controls' && <ControlsText />}
          {tab === 'rules' && <RulesText />}
          {tab === 'save' && (<>
            <div className="text-sm text-gray-300">存档保存在本机浏览器（IndexedDB + LocalStorage 备份）。比赛结束、技能选择、商店购买以及每场比赛开始前都会自动保存。</div>
            <button className="mc-btn blue" onClick={() => exportSave(run, meta)}>📤 导出存档文件</button>
            <button className="mc-btn" onClick={() => file.current?.click()}>📥 导入存档文件</button>
            <input ref={file} type="file" accept=".json,application/json" className="hidden" onChange={async (e) => {
              const f = e.target.files?.[0]; if (!f) return;
              const data = await parseImport(f);
              if (!data) { setMsg('存档文件无效'); return; }
              await replaceAll(data.run, data.meta); setMsg('导入成功');
            }} />
            <button className="mc-btn gold" onClick={async () => setMsg((await restoreBackup()) ? '已恢复最近一次安全存档' : '没有可用的安全存档')}>🛟 恢复最近一次安全存档</button>
            {msg && <div className="font-bold text-yellow-300">{msg}</div>}
          </>)}
        </div>
      </div>
    </Screen>
  );
}
