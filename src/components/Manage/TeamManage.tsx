import { useState } from 'react';
import { useGame } from '../../store/gameStore';
import { Screen, Tabs, RunTopInfo, SkillBadge, SkillLevels, Jersey } from '../common/UI';
import EquipmentPanel, { modsText } from '../Equipment/EquipmentPanel';
import { SKILL_MAP, levelText } from '../../game/skills/SkillRegistry';
import { evolutionStatus } from '../../store/skillStore';
import { CATEGORY_NAME, TacticMode, TACTIC_NAMES, TACTIC_DESC, ROLE_NAME, BaseCategory } from '../../game/types';
import { getTeam } from '../../data/teams';
import { playerOverall } from '../../data/players';
import { BOOST_MAP } from '../../data/shop';
import { buildMods } from '../../game/skills/SkillEvolution';

export function SkillsPanel() {
  const run = useGame((s) => s.run)!;
  const setUlt = useGame((s) => s.setUltimate);
  const [sel, setSel] = useState<string | null>(null);
  const cats: BaseCategory[] = ['active', 'passive', 'shooting', 'defense', 'ultimate'];
  const owned = run.skills.filter((s) => !s.absorbedInto);
  const evo = evolutionStatus(run);
  const selDef = sel ? SKILL_MAP[sel] : null;
  const total = buildMods(run);
  return (
    <div className="grid lg:grid-cols-[1fr_320px] gap-3">
      <div className="flex flex-col gap-2">
        {cats.map((c) => {
          const list = owned.filter((s) => SKILL_MAP[s.id]?.baseCategory === c);
          return (
            <div key={c} className="mc-panel p-2">
              <div className="font-bold text-sm mb-1">{CATEGORY_NAME[c]}（{list.length}）</div>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-1">
                {list.map((s) => (
                  <button key={s.id} onClick={() => setSel(s.id)} className="text-left"><SkillBadge def={SKILL_MAP[s.id]} level={s.level} small /></button>
                ))}
                {!list.length && <div className="text-xs text-gray-500">暂无</div>}
              </div>
            </div>
          );
        })}
        <div className="mc-panel p-2">
          <div className="font-bold text-sm mb-1">🧬 进化配方进度</div>
          <div className="grid md:grid-cols-2 gap-1 text-xs">
            {evo.map(({ evo: e, mainLv, partnerLv, owned: done, ready }) => (
              <div key={e.id} className={`mc-panel-light p-1 ${done ? 'text-yellow-300' : ready ? 'text-green-300' : mainLv || partnerLv ? '' : 'text-gray-500'}`}>
                {SKILL_MAP[e.result].icon} {e.name}：{SKILL_MAP[e.main].name} LV{mainLv}/{e.req[0]} + {SKILL_MAP[e.partner].name} LV{partnerLv}/{e.req[1]} {done ? '✔ 已进化' : ready ? '（可进化！升级时出现）' : ''}
              </div>
            ))}
          </div>
        </div>
      </div>
      <div className="flex flex-col gap-2">
        {selDef && (
          <div className="mc-panel p-2">
            <SkillBadge def={selDef} level={run.skills.find((s) => s.id === selDef.id)?.level} />
            <div className="text-sm mt-1">{selDef.desc}</div>
            {selDef.cooldown ? <div className="text-xs text-gray-300">冷却：{selDef.cooldown} 秒</div> : null}
            {selDef.trigger && <div className="text-xs text-gray-300">触发：{selDef.trigger}</div>}
            <div className="text-xs text-cyan-200 mt-1">当前：{levelText(selDef, run.skills.find((s) => s.id === selDef.id)?.level ?? 1)}</div>
            <div className="mt-1"><SkillLevels def={selDef} /></div>
            {selDef.category === 'ultimate' && (run.ultimate === selDef.id ? <div className="text-yellow-300 text-sm mt-1">★ 当前装备的大招</div> : <button className="mc-btn gold small mt-2" onClick={() => setUlt(selDef.id)}>设为当前大招（R 键释放）</button>)}
          </div>
        )}
        <div className="mc-panel p-2 text-xs">
          <div className="font-bold text-sm mb-1">📊 构筑总加成</div>
          <div className="text-gray-200">{modsText(total) || '暂无'}</div>
          <div className="font-bold text-sm mt-2">属性强化</div>
          {Object.entries(run.statBoosts).map(([id, n]) => <div key={id}>{BOOST_MAP[id]?.icon} {BOOST_MAP[id]?.name} ×{n}</div>)}
          {!Object.keys(run.statBoosts).length && <div className="text-gray-500">暂无</div>}
        </div>
      </div>
    </div>
  );
}

export function TacticPicker({ onPick }: { onPick?: (m: TacticMode | null) => void }) {
  const run = useGame((s) => s.run)!;
  const setTactic = useGame((s) => s.setTactic);
  const team = getTeam(run.teamId);
  const modes: TacticMode[] = ['attack', 'defend', 'possession', 'counter', 'press', 'allBack'];
  const pick = (m: TacticMode | null) => { setTactic(m); onPick?.(m); };
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
      <button className={`mc-btn ${run.tacticMode === null ? 'gold' : ''} flex-col`} onClick={() => pick(null)}><span>🤖 自动</span><span className="text-xs font-normal">球队默认：{TACTIC_NAMES[team.defaultTactic]}，并随比分调整</span></button>
      {modes.map((m) => (
        <button key={m} className={`mc-btn ${run.tacticMode === m ? 'gold' : ''} flex-col`} onClick={() => pick(m)}><span>{TACTIC_NAMES[m]}</span><span className="text-xs font-normal">{TACTIC_DESC[m]}</span></button>
      ))}
    </div>
  );
}

function LineupPanel() {
  const run = useGame((s) => s.run)!;
  const swap = useGame((s) => s.swapLineup);
  const team = getTeam(run.teamId);
  const [sel, setSel] = useState<number | null>(null);
  const subs = run.roster.filter((r) => !run.lineup.includes(r.id));
  const status = (id: string) => { const p = run.roster.find((r) => r.id === id)!; return (p.injured ?? 0) > 0 ? `🩹 受伤（${p.injured} 场）` : '健康'; };
  return (
    <div className="grid md:grid-cols-2 gap-3">
      <div className="mc-panel p-2">
        <div className="font-bold mb-1">首发阵容（5 人：门将 1 · 后卫 1 · 中场 1 · 前锋 2）</div>
        {run.lineup.map((id, i) => {
          const p = run.roster.find((r) => r.id === id)!;
          return (
            <button key={id} onClick={() => p.role !== 'GK' && setSel(i)} className={`w-full flex items-center gap-2 p-1 text-left hover:bg-white/10 ${sel === i ? 'bg-yellow-900/40' : ''}`}>
              <Jersey kit={team.home} number={p.number} size={30} />
              <div className="flex-1 text-sm"><b>{p.name}</b>{run.coreId === id ? ' ⭐核心' : ''}<div className="text-xs text-gray-400">{ROLE_NAME[p.role]} · 综合 {playerOverall(p)} · {status(id)}</div></div>
              {p.role !== 'GK' && <span className="text-xs text-gray-400">替换 ▶</span>}
            </button>
          );
        })}
        <div className="text-xs text-gray-400 mt-1">球队疲劳 {run.teamFatigue}/100：疲劳会降低移动速度与体力上限。可在商店购买能量饮料或体能恢复剂。</div>
      </div>
      <div className="mc-panel p-2">
        <div className="font-bold mb-1">替补席</div>
        {subs.map((p) => (
          <button key={p.id} disabled={sel === null} onClick={() => { if (sel !== null) { swap(sel, p.id); setSel(null); } }} className="w-full flex items-center gap-2 p-1 text-left hover:bg-white/10 disabled:opacity-60">
            <Jersey kit={team.home} number={p.number} size={30} />
            <div className="flex-1 text-sm"><b>{p.name}</b><div className="text-xs text-gray-400">{ROLE_NAME[p.role]} · 综合 {playerOverall(p)} · {status(p.id)}</div></div>
          </button>
        ))}
        {sel !== null && <div className="text-xs text-yellow-300 mt-1">选择一名替补换下 {run.roster.find((r) => r.id === run.lineup[sel])?.name}</div>}
      </div>
    </div>
  );
}

export default function TeamManage() {
  const go = useGame((s) => s.go);
  const [tab, setTab] = useState<'lineup' | 'skills' | 'equip' | 'tactic'>('skills');
  return (
    <Screen title="球队成长 · 管理" onBack={() => go('hub')} right={<RunTopInfo />}>
      <Tabs tabs={[{ id: 'skills', label: '技能' }, { id: 'equip', label: '装备' }, { id: 'lineup', label: '阵容' }, { id: 'tactic', label: '战术' }]} value={tab} onChange={setTab} />
      <div className="mt-2">
        {tab === 'skills' && <SkillsPanel />}
        {tab === 'equip' && <EquipmentPanel />}
        {tab === 'lineup' && <LineupPanel />}
        {tab === 'tactic' && <div className="mc-panel p-3"><div className="text-sm text-gray-300 mb-2">AI 队友将按照所选战术跑位与配合（比赛中也可按 Tab 打开战术面板）。</div><TacticPicker /></div>}
      </div>
    </Screen>
  );
}
