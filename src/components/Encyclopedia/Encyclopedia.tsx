import { useState } from 'react';
import { useGame } from '../../store/gameStore';
import { Screen, Tabs, Flag, RarityTag, SkillPreview, SkillLevels, Modal } from '../common/UI';
import { TEAMS, teamRating } from '../../data/teams';
import { ACTIVE_SKILLS, PASSIVE_SKILLS, SHOOTING_SKILLS, DEFENSE_SKILLS, ULTIMATE_SKILLS, EVOLUTION_SKILLS, EVOLUTIONS } from '../../data/skills';
import { EQUIPMENT } from '../../data/equipment';
import { STADIUMS, WEATHERS } from '../../data/stadiums';
import { EVENTS } from '../../data/events';
import { BOSSES } from '../../data/bosses';
import { SkillDef, RARITY_COLOR, CATEGORY_NAME, SLOT_NAME, EQUIP_SLOTS } from '../../game/types';
import { SKILL_MAP } from '../../game/skills/SkillRegistry';
import { TeamDetail, unlockHint } from '../TeamSelect/TeamSelect';
import { EquipInfo } from '../Equipment/EquipmentPanel';
import { encyclopediaInitialTab } from '../MainMenu/MainMenu';

type Tab = 'teams' | 'skills' | 'equipment' | 'stadiums' | 'events';
type SkillTab = 'active' | 'passive' | 'shooting' | 'defense' | 'ultimate' | 'evolution';

function evoConditions(def: SkillDef): string {
  if (def.evolveFrom) return `${SKILL_MAP[def.evolveFrom.main].name} LV${def.evolveFrom.req[0]} + ${SKILL_MAP[def.evolveFrom.partner].name} LV${def.evolveFrom.req[1]}`;
  const list = EVOLUTIONS.filter((e) => e.main === def.id || e.partner === def.id);
  return list.length ? list.map((e) => `可进化为「${e.name}」（${SKILL_MAP[e.main].name} LV${e.req[0]} + ${SKILL_MAP[e.partner].name} LV${e.req[1]}）`).join('；') : '无';
}

function SkillEntry({ def, seen }: { def: SkillDef; seen: boolean }) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button onClick={() => setOpen(true)} className={`mc-panel p-2 text-left flex gap-2 rarity-${def.rarity} hover:brightness-125`} style={{ borderWidth: 3 }}>
        <span className="text-3xl" style={{ color: def.color }}>{def.icon}</span>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1"><span className="text-[10px] text-gray-400">{def.code}</span><b className="truncate" style={{ color: RARITY_COLOR[def.rarity] }}>{def.name}</b>{seen && <span className="text-[10px] text-green-400">✔已获得</span>}</div>
          <div className="text-xs text-gray-300 line-clamp-2">{def.desc}</div>
        </div>
      </button>
      {open && (
        <Modal onClose={() => setOpen(false)}>
          <div className="flex gap-3">
            <SkillPreview def={def} />
            <div className="flex-1">
              <div className="text-xl font-black" style={{ color: RARITY_COLOR[def.rarity] }}>{def.icon} {def.name}</div>
              <div className="flex gap-2 items-center mt-1"><RarityTag r={def.rarity} /><span className="text-xs">{CATEGORY_NAME[def.category]}{def.category === 'evolution' ? `（${CATEGORY_NAME[def.baseCategory]}）` : ''}</span><span className="text-xs text-gray-400">ID：{def.id}</span></div>
              <div className="text-sm mt-2">{def.desc}</div>
            </div>
          </div>
          <div className="grid gap-1 text-sm mt-3">
            <div>等级上限：<b>LV{def.maxLevel}</b>{def.cooldown ? ` · 冷却：${def.cooldown} 秒` : ''}{def.trigger ? ` · 触发：${def.trigger}` : ''}</div>
            <div>获取条件：{def.category === 'evolution' ? '满足进化配方后在升级三选一中出现' : def.category === 'ultimate' ? '升级三选一（3 级后高概率出现）/ 神秘技能箱' : '升级三选一 / 神秘技能箱 / 初始核心技能'}</div>
            <div>进化条件：{evoConditions(def)}</div>
            <div>动画：{def.anim} · 特效：{def.vfx} · 音效：{def.sfx}</div>
            <div className="mc-panel-light p-2"><SkillLevels def={def} /></div>
          </div>
          <button className="mc-btn small mt-3" onClick={() => setOpen(false)}>关闭</button>
        </Modal>
      )}
    </>
  );
}

export default function Encyclopedia() {
  const { go, meta } = useGame();
  const [tab, setTab] = useState<Tab>((encyclopediaInitialTab as Tab) ?? 'teams');
  const [skillTab, setSkillTab] = useState<SkillTab>('active');
  const [team, setTeam] = useState<string | null>(null);
  const [equip, setEquip] = useState<string | null>(null);
  const seen = new Set(meta.stats.skillsSeen);
  const found = new Set(meta.stats.equipFound);
  const skillLists: Record<SkillTab, SkillDef[]> = { active: ACTIVE_SKILLS, passive: PASSIVE_SKILLS, shooting: SHOOTING_SKILLS, defense: DEFENSE_SKILLS, ultimate: ULTIMATE_SKILLS, evolution: EVOLUTION_SKILLS };
  return (
    <Screen title="📖 图鉴" onBack={() => go('menu')}>
      <Tabs tabs={[{ id: 'teams', label: '球队图鉴' }, { id: 'skills', label: '技能图鉴' }, { id: 'equipment', label: '装备图鉴' }, { id: 'stadiums', label: '球场图鉴' }, { id: 'events', label: '事件 / BOSS / 天气' }]} value={tab} onChange={setTab} />
      <div className="mt-2">
        {tab === 'teams' && (
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-2">
            {TEAMS.map((t) => (
              <button key={t.id} onClick={() => setTeam(t.id)} className="mc-panel p-2 text-left hover:brightness-125" style={{ borderBottom: `5px solid ${t.home.shirt}` }}>
                <div className="flex items-center gap-1"><Flag flag={t.flag} w={26} h={17} /><b className="text-sm">{t.name}</b></div>
                <div className="text-xs text-gray-300">{t.style} · 评分 {teamRating(t)}</div>
                <div className="text-xs text-yellow-300">{t.passive.icon} {t.passive.name}</div>
                {!meta.unlocked.includes(t.id) && <div className="text-[10px] text-orange-300">🔒 {unlockHint(t.id)}</div>}
              </button>
            ))}
          </div>
        )}
        {tab === 'skills' && (<>
          <Tabs tabs={(Object.keys(skillLists) as SkillTab[]).map((k) => ({ id: k, label: `${CATEGORY_NAME[k]}（${skillLists[k].length}）` }))} value={skillTab} onChange={setSkillTab} />
          <div className="text-xs text-gray-400 my-1">基础技能 92 个 + 进化技能 20 个，全部可在实际游戏中获得。已获得：{[...seen].filter((id) => SKILL_MAP[id]).length}</div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-2">{skillLists[skillTab].map((d) => <SkillEntry key={d.id} def={d} seen={seen.has(d.id)} />)}</div>
        </>)}
        {tab === 'equipment' && (
          <div className="flex flex-col gap-3">
            {EQUIP_SLOTS.map((s) => (
              <div key={s}>
                <div className="font-black pixel-text mb-1">{SLOT_NAME[s]}</div>
                <div className="grid sm:grid-cols-2 lg:grid-cols-6 gap-2">
                  {EQUIPMENT.filter((e) => e.slot === s).map((e) => (
                    <button key={e.id} onClick={() => setEquip(e.id)} className={`mc-panel p-2 text-left rarity-${e.rarity}`} style={{ borderWidth: 3 }}>
                      <div className="text-2xl">{e.icon}</div><b className="text-sm" style={{ color: RARITY_COLOR[e.rarity] }}>{e.name}</b>{found.has(e.id) && <span className="text-[10px] text-green-400"> ✔</span>}
                      <div className="text-[11px] text-gray-300">{e.desc}</div>
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
        {tab === 'stadiums' && (
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-2">
            {STADIUMS.map((s) => (
              <div key={s.id} className={`mc-panel p-2 ${meta.stats.stadiums.includes(s.id) ? '' : 'opacity-80'}`}>
                <div className="h-24 mb-2 relative overflow-hidden border-2 border-black" style={{ background: `linear-gradient(${s.skyTop}, ${s.skyBottom})` }}>
                  <div className="absolute bottom-0 inset-x-0 h-8" style={{ background: `repeating-linear-gradient(90deg, ${s.grassA} 0 16px, ${s.grassB} 16px 32px)` }} />
                  <div className="absolute bottom-8 left-0 w-1/4 h-10" style={{ background: s.standColor, borderTop: `4px solid ${s.standAccent}` }} />
                  <div className="absolute bottom-8 right-0 w-1/4 h-10" style={{ background: s.standColor, borderTop: `4px solid ${s.standAccent}` }} />
                  <div className="absolute top-2 right-2 text-3xl">{s.icon}</div>
                  <div className="absolute bottom-9 left-1/2 flex gap-0.5">{s.crowd.map((c) => <span key={c} className="w-2 h-3" style={{ background: c }} />)}</div>
                </div>
                <b>{s.name}</b>{meta.stats.stadiums.includes(s.id) && <span className="text-[10px] text-green-400"> ✔已到访</span>}
                <div className="text-xs text-gray-300">{s.desc}</div>
                <div className="text-xs mt-1">天气：{s.weatherPool.map((w) => WEATHERS.find((x) => x.id === w)?.icon).join(' ')}</div>
              </div>
            ))}
          </div>
        )}
        {tab === 'events' && (
          <div className="grid lg:grid-cols-3 gap-3">
            <div className="mc-panel p-2"><div className="font-black mb-1">🎪 特殊比赛事件（16）</div>
              {EVENTS.map((e) => <div key={e.id} className="text-sm py-0.5"><b>{e.code} {e.icon} {e.name}</b>{meta.stats.eventsSeen.includes(e.id) && ' ✔'}<div className="text-xs text-gray-300">{e.desc}{e.conflicts ? `（与 ${e.conflicts.map((c) => EVENTS.find((x) => x.id === c)?.name).join('、')} 互斥）` : ''}</div></div>)}
            </div>
            <div className="mc-panel p-2"><div className="font-black mb-1">👹 精英 BOSS 模板（8）</div>
              {BOSSES.map((b) => <div key={b.id} className="text-sm py-1"><b>{b.icon} {b.name}</b>（{b.type} · {b.mech}）{meta.stats.bosses.includes(b.id) && ' ✔已击败'}<div className="text-xs text-gray-300">{b.desc}</div>{b.phases && <ul className="text-xs text-yellow-200 list-disc ml-4">{b.phases.map((p) => <li key={p}>{p}</li>)}</ul>}</div>)}
            </div>
            <div className="mc-panel p-2"><div className="font-black mb-1">🌦️ 天气（6）</div>
              {WEATHERS.map((w) => <div key={w.id} className="text-sm py-0.5"><b>{w.icon} {w.name}</b>{meta.stats.weathers.includes(w.id) && ' ✔'}<div className="text-xs text-gray-300">{w.desc}</div></div>)}
            </div>
          </div>
        )}
      </div>
      {team && <Modal wide onClose={() => setTeam(null)}><TeamDetail team={TEAMS.find((t) => t.id === team)!} /><button className="mc-btn small mt-3" onClick={() => setTeam(null)}>关闭</button></Modal>}
      {equip && <Modal onClose={() => setEquip(null)}><EquipInfo e={EQUIPMENT.find((e) => e.id === equip)!} /><button className="mc-btn small mt-3" onClick={() => setEquip(null)}>关闭</button></Modal>}
    </Screen>
  );
}
