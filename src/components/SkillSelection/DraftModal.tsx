import { useEffect, useRef } from 'react';
import { useGame } from '../../store/gameStore';
import { DraftChoice, RARITY_COLOR, RARITY_NAME, CATEGORY_NAME, SLOT_NAME } from '../../game/types';
import { SKILL_MAP, levelText } from '../../game/skills/SkillRegistry';
import { EVOLUTIONS } from '../../data/skills';
import { BOOST_MAP } from '../../data/shop';
import { EQUIP_MAP } from '../../data/equipment';
import { AudioManager } from '../../game/audio/AudioManager';
import { RarityTag } from '../common/UI';

function evoHint(skillId: string): string | null {
  const list = EVOLUTIONS.filter((e) => e.main === skillId || e.partner === skillId);
  if (!list.length) return null;
  return list.map((e) => `${SKILL_MAP[e.main].name}(LV${e.req[0]}) + ${SKILL_MAP[e.partner].name}(LV${e.req[1]}) → ${e.name}`).join('；');
}

function ChoiceCard({ c, onPick, idx }: { c: DraftChoice; onPick: () => void; idx: number }) {
  const run = useGame((s) => s.run)!;
  let icon = '❔', name = '', cat = '', cur = '', effect = '', next = '', evo: string | null = null, color = RARITY_COLOR[c.rarity];
  if (c.kind === 'newSkill' || c.kind === 'upgrade' || c.kind === 'evolve') {
    const d = SKILL_MAP[c.skillId!];
    icon = d.icon; name = d.name; cat = CATEGORY_NAME[d.category];
    const os = run.skills.find((s) => s.id === d.id);
    if (c.kind === 'newSkill') { cur = '未拥有 → LV1'; effect = levelText(d, 1); next = d.maxLevel > 1 ? levelText(d, 2) : '已是最高等级'; }
    else if (c.kind === 'upgrade') { cur = `LV${os?.level ?? 1} → LV${(os?.level ?? 1) + 1}`; effect = levelText(d, os?.level ?? 1); next = levelText(d, (os?.level ?? 1) + 1); }
    else {
      const e = EVOLUTIONS.find((x) => x.result === d.id)!;
      cur = '技能进化！'; effect = d.desc; next = `${SKILL_MAP[e.main].name} + ${SKILL_MAP[e.partner].name} → ${d.name}（主技能被替换并保留基础属性）`;
    }
    if (d.cooldown) effect += `（冷却 ${d.cooldown} 秒）`;
    if (d.trigger) effect += `［${d.trigger}］`;
    evo = c.kind === 'evolve' ? '✨ 进化技能' : evoHint(d.id);
  } else if (c.kind === 'stat') {
    const b = BOOST_MAP[c.statId!];
    icon = b.icon; name = b.name; cat = '属性强化'; const n = run.statBoosts[b.id] ?? 0; cur = `${n}/${b.max} → ${n + 1}/${b.max}`; effect = b.desc; next = `累计 ${n + 1} 层`;
  } else if (c.kind === 'item') {
    const e = EQUIP_MAP[c.equipId!];
    icon = e.icon; name = e.name; cat = `特殊道具 · ${SLOT_NAME[e.slot]}`; cur = '获得装备'; effect = e.desc; next = e.special ? `特殊效果：${e.special.desc}` : '可在装备界面更换';
  } else { icon = '🪙'; name = `${c.gold} 金币`; cat = '金币奖励'; cur = '立即获得'; effect = `获得 ${c.gold} 金币，可在商店使用`; next = ''; color = '#fbbf24'; }
  return (
    <button onClick={onPick} className={`mc-panel rarity-${c.rarity} p-3 flex flex-col gap-1.5 text-left hover:brightness-125 anim-pop`} style={{ animationDelay: `${idx * 0.08}s`, borderWidth: 4 }}>
      <div className="flex items-center justify-between">
        <span className="flex items-center gap-1"><kbd className="px-1.5 text-xs font-black bg-black border-2 border-gray-500">{idx + 1}</kbd><RarityTag r={c.rarity} /></span>
        <span className="text-xs text-gray-300">{cat}</span>
      </div>
      <div className="text-5xl text-center my-1 anim-glow" style={{ color }}>{icon}</div>
      <div className="text-lg font-black text-center pixel-text" style={{ color: RARITY_COLOR[c.rarity] }}>{name}</div>
      <div className="text-xs text-center text-yellow-200 font-bold">{cur}</div>
      <div className="text-sm">{effect}</div>
      {next && <div className="text-xs text-cyan-200">升级后：{next}</div>}
      {evo && <div className="text-xs text-purple-300">🧬 可进化：{evo}</div>}
      <div className="mc-btn green small mt-auto w-full">选择</div>
    </button>
  );
}

export default function DraftModal({ onPicked }: { onPicked: (c: DraftChoice) => void }) {
  const run = useGame((s) => s.run);
  const pick = useGame((s) => s.pickDraft);
  const reroll = useGame((s) => s.rerollDraft);
  const onPickedRef = useRef(onPicked);
  onPickedRef.current = onPicked;
  // 键盘 1 / 2 / 3（含小键盘）直接选择对应奖励
  useEffect(() => {
    const h = (e: KeyboardEvent) => {
      const m = /^(?:Digit|Numpad)([1-3])$/.exec(e.code);
      if (!m) return;
      // 捕获阶段拦截，避免同一按键同时触发比赛中的技能释放
      e.preventDefault(); e.stopImmediatePropagation();
      if (e.repeat) return;
      const st = useGame.getState();
      if (!st.run?.draft) return;
      const r = st.pickDraft(Number(m[1]) - 1);
      if (r) onPickedRef.current(r);
    };
    window.addEventListener('keydown', h, { capture: true });
    return () => window.removeEventListener('keydown', h, { capture: true });
  }, []);
  if (!run || !run.draft) return null;
  const canReroll = run.draftFreeReroll || run.rerollTokens > 0;
  return (
    <div className="fixed inset-0 z-50 bg-black/75 flex items-center justify-center p-2">
      <div className="w-full max-w-4xl max-h-full scroll-y">
        <div className="text-center mb-2">
          <div className="text-3xl md:text-4xl font-black title-text text-yellow-300">⬆ 升级！LV.{run.level}</div>
          <div className="text-sm text-gray-300">选择一项奖励（剩余 {run.pendingDrafts} 次，可按键盘 1 / 2 / 3 选择）· 比赛已暂停 · 品质：{(['common', 'rare', 'epic', 'legendary'] as const).map((r) => <span key={r} style={{ color: RARITY_COLOR[r] }}> {RARITY_NAME[r]}</span>)}</div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {run.draft.map((c, i) => <ChoiceCard key={c.key + i} c={c} idx={i} onPick={() => { const r = pick(i); if (r) onPicked(r); }} />)}
        </div>
        <div className="flex justify-center mt-3">
          <button className="mc-btn purple" disabled={!canReroll} onClick={() => { if (!reroll()) AudioManager.play('error'); }}>🔄 刷新奖励（{run.draftFreeReroll ? '本次免费' : `刷新券 ×${run.rerollTokens}`}）</button>
        </div>
      </div>
    </div>
  );
}

export function EvolutionOverlay({ skillId, onDone }: { skillId: string; onDone: () => void }) {
  const d = SKILL_MAP[skillId];
  const e = EVOLUTIONS.find((x) => x.result === skillId);
  if (!d) return null;
  return (
    <div className="fixed inset-0 z-[60] flex flex-col items-center justify-center" style={{ background: 'radial-gradient(circle, rgba(124,58,237,0.6), rgba(0,0,0,0.92))' }} onClick={onDone}>
      <div className="text-xl font-black pixel-text text-purple-200 mb-2">技能进化</div>
      {e && <div className="flex items-center gap-4 text-4xl mb-4 anim-pop"><span>{SKILL_MAP[e.main].icon}</span><span className="text-2xl">+</span><span>{SKILL_MAP[e.partner].icon}</span></div>}
      <div className="text-8xl" style={{ color: d.color, animation: 'evo-burst 1.2s ease-out both', filter: `drop-shadow(0 0 30px ${d.color})` }}>{d.icon}</div>
      <div className="text-4xl md:text-5xl font-black title-text mt-4" style={{ color: d.color }}>{d.name}</div>
      <div className="text-sm max-w-md text-center mt-2">{d.desc}</div>
      <div className="text-xs text-gray-300 mt-4">点击继续</div>
    </div>
  );
}
