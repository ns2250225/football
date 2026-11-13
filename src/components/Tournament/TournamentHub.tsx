import { useState } from 'react';
import { useGame } from '../../store/gameStore';
import { getTeam, TEAMS } from '../../data/teams';
import { STADIUM_MAP, WEATHER_MAP } from '../../data/stadiums';
import { EVENT_MAP } from '../../data/events';
import { BOSS_MAP } from '../../data/bosses';
import { Flag, Screen, Tabs, RunTopInfo, SkillBadge, Modal } from '../common/UI';
import { STAGE_NAME, MatchRecord, TournamentState, MODE_NAME, DIFFICULTY_NAME, EQUIP_SLOTS, SLOT_NAME } from '../../game/types';
import { groupStandings } from '../../game/tournament/Standings';
import { slotLabel } from '../../game/tournament/KnockoutStage';
import { eliminatedTeams } from '../../store/tournamentStore';
import { SKILL_MAP } from '../../game/skills/SkillRegistry';
import { EQUIP_MAP } from '../../data/equipment';
import { exportSave } from '../../store/saveStore';
import { teamStageReached, STAGE_REACHED_NAME } from '../../game/tournament/WorldCup';

function TeamTag({ id, me, dim, short }: { id: string | null; me?: string; dim?: boolean; short?: boolean }) {
  if (!id) return <span className="text-gray-500">待定</span>;
  const t = getTeam(id);
  return <span className={`inline-flex items-center gap-1 ${id === me ? 'text-yellow-300 font-black' : ''} ${dim ? 'opacity-45 line-through' : ''}`}><Flag flag={t.flag} w={18} h={12} />{short ? t.code : t.name}</span>;
}
function Score({ m }: { m: MatchRecord }) {
  if (!m.result) return <span className="text-gray-500">vs</span>;
  const r = m.result;
  return <span className="font-black">{r.homeGoals}:{r.awayGoals}{r.pens ? <span className="text-xs text-gray-300">（点 {r.pens[0]}:{r.pens[1]}）</span> : r.et ? <span className="text-xs text-gray-300">（加）</span> : null}</span>;
}

export function MatchDetail({ m, onClose }: { m: MatchRecord; onClose: () => void }) {
  const r = m.result;
  return (
    <Modal onClose={onClose}>
      <div className="text-sm text-gray-300">{STAGE_NAME[m.stage]}{m.group ? ` · ${m.group} 组 第 ${m.matchday} 轮` : ''} · 第 {m.id} 场 · {STADIUM_MAP[m.stadiumId].name} · {WEATHER_MAP[m.weather].icon}</div>
      <div className="flex items-center justify-center gap-4 text-xl my-3"><TeamTag id={m.home} /><Score m={m} /><TeamTag id={m.away} /></div>
      {r ? (
        <div className="grid gap-2 text-sm">
          <div className="grid grid-cols-3 text-center"><span>{r.shots[0]}</span><span className="text-gray-400">射门</span><span>{r.shots[1]}</span></div>
          <div className="grid grid-cols-3 text-center"><span>{r.onTarget[0]}</span><span className="text-gray-400">射正</span><span>{r.onTarget[1]}</span></div>
          <div className="grid grid-cols-3 text-center"><span>{r.possession[0]}%</span><span className="text-gray-400">控球率</span><span>{r.possession[1]}%</span></div>
          <div className="mc-panel-light p-2"><div className="font-bold">⚽ 进球</div>{r.scorers.length ? r.scorers.map((g, i) => <div key={i}>{g.minute}' {getTeam(g.team).name} {g.name}{g.own ? '（乌龙）' : ''}{g.assist ? `（助攻 ${g.assist}）` : ''}</div>) : <div className="text-gray-400">无进球</div>}</div>
          <div className="mc-panel-light p-2"><div className="font-bold">🟨🟥 红黄牌</div>{r.cards.length ? r.cards.map((c, i) => <div key={i}>{c.minute}' {c.type === 'yellow' ? '🟨' : '🟥'} {getTeam(c.team).name} {c.name}</div>) : <div className="text-gray-400">无</div>}</div>
          {r.events.length > 0 && <div className="mc-panel-light p-2"><div className="font-bold">📋 比赛事件</div>{r.events.map((e, i) => <div key={i}>{e.replace(/特殊事件：(\w+)/, (_, id) => `特殊事件：${EVENT_MAP[id]?.name ?? id}`).replace(/BOSS：(\w+)/, (_, id) => `BOSS：${BOSS_MAP[id]?.name ?? id}`)}</div>)}</div>}
          {r.byPlayer && <div className="text-xs text-cyan-300">玩家亲自操作的比赛</div>}
        </div>
      ) : <div className="text-center text-gray-400">比赛尚未进行</div>}
      <button className="mc-btn small mt-3" onClick={onClose}>关闭</button>
    </Modal>
  );
}

export function GroupsView({ t, me }: { t: TournamentState; me: string }) {
  const [sel, setSel] = useState<MatchRecord | null>(null);
  const elim = eliminatedTeams(t);
  return (
    <div className="grid sm:grid-cols-2 xl:grid-cols-4 gap-3">
      {t.groups.map((g) => {
        const rows = groupStandings(t, g.name);
        const ms = t.matches.filter((m) => m.group === g.name);
        return (
          <div key={g.name} className={`mc-panel p-2 ${g.teams.includes(me) ? 'outline outline-2 outline-yellow-400' : ''}`}>
            <div className="font-black pixel-text mb-1">{g.name} 组</div>
            <table className="w-full text-xs">
              <thead><tr className="text-gray-400"><th className="text-left">球队</th><th>赛</th><th>胜</th><th>平</th><th>负</th><th>净</th><th>分</th></tr></thead>
              <tbody>{rows.map((r, i) => (
                <tr key={r.team} className={i < 2 ? 'bg-green-900/30' : ''}><td><TeamTag id={r.team} me={me} dim={elim.has(r.team)} /></td><td className="text-center">{r.p}</td><td className="text-center">{r.w}</td><td className="text-center">{r.d}</td><td className="text-center">{r.l}</td><td className="text-center">{r.gd > 0 ? '+' : ''}{r.gd}</td><td className="text-center font-black">{r.pts}</td></tr>
              ))}</tbody>
            </table>
            <div className="mt-1 grid gap-0.5">
              {ms.map((m) => (
                <button key={m.id} onClick={() => setSel(m)} className="flex items-center justify-between text-[11px] hover:bg-white/10 px-1">
                  <span className="text-gray-500 w-6">R{m.matchday}</span><span className="flex-1 text-right"><TeamTag id={m.home} me={me} short /></span><span className="w-14 text-center"><Score m={m} /></span><span className="flex-1"><TeamTag id={m.away} me={me} short /></span>
                </button>
              ))}
            </div>
          </div>
        );
      })}
      {sel && <MatchDetail m={sel} onClose={() => setSel(null)} />}
    </div>
  );
}

export function BracketView({ t, me }: { t: TournamentState; me: string }) {
  const [sel, setSel] = useState<MatchRecord | null>(null);
  const col = (ids: number[], title: string) => (
    <div className="flex flex-col justify-around gap-2 min-w-[170px]">
      <div className="text-center font-black pixel-text text-sm">{title}</div>
      {ids.map((id) => {
        const m = t.matches.find((x) => x.id === id)!;
        const w = m.result?.winner;
        const mine = m.home === me || m.away === me;
        return (
          <button key={id} onClick={() => setSel(m)} className={`mc-panel p-1.5 text-xs text-left hover:brightness-125 ${mine ? 'outline outline-2 outline-yellow-400' : ''}`}>
            <div className="text-[10px] text-gray-500">第 {id} 场 · {STADIUM_MAP[m.stadiumId].icon}</div>
            <div className={`flex justify-between ${w && w === m.home ? 'text-green-300 font-bold' : ''}`}>{m.home ? <TeamTag id={m.home} me={me} /> : <span className="text-gray-500">{slotLabel(m.slotHome)}</span>}<span>{m.result?.homeGoals ?? ''}</span></div>
            <div className={`flex justify-between ${w && w === m.away ? 'text-green-300 font-bold' : ''}`}>{m.away ? <TeamTag id={m.away} me={me} /> : <span className="text-gray-500">{slotLabel(m.slotAway)}</span>}<span>{m.result?.awayGoals ?? ''}</span></div>
            {m.result?.pens && <div className="text-[10px] text-gray-400">点球 {m.result.pens[0]}:{m.result.pens[1]}</div>}
          </button>
        );
      })}
    </div>
  );
  return (
    <div>
      {t.champion && <div className="mc-panel p-3 mb-3 text-center text-lg font-black text-yellow-300 pixel-text">🏆 世界杯冠军：{getTeam(t.champion).name}{t.runnerUp ? `　🥈 亚军：${getTeam(t.runnerUp).name}` : ''}{t.third ? `　🥉 季军：${getTeam(t.third).name}` : ''}</div>}
      <div className="flex gap-3 overflow-x-auto pb-2">
        {col([49, 50, 53, 54, 51, 52, 55, 56], '16 强')}
        {col([57, 58, 59, 60], '8 强')}
        {col([61, 62], '半决赛')}
        <div className="flex flex-col justify-around gap-6">{col([64], '决赛')}{col([63], '三四名决赛')}</div>
      </div>
      {sel && <MatchDetail m={sel} onClose={() => setSel(null)} />}
    </div>
  );
}

function JourneyView() {
  const run = useGame((s) => s.run)!;
  const t = run.tournament;
  const myMatches = t.matches.filter((m) => m.home === run.teamId || m.away === run.teamId);
  const [sel, setSel] = useState<MatchRecord | null>(null);
  const active = run.skills.filter((s) => !s.absorbedInto);
  return (
    <div className="grid lg:grid-cols-2 gap-3">
      <div className="mc-panel p-3">
        <div className="font-black pixel-text mb-2">🗺️ 晋级路线</div>
        <div className="flex flex-wrap gap-1 mb-3 text-xs">
          {['小组赛', '16 强', '8 强', '4 强', '决赛', '冠军'].map((s, i) => (
            <span key={s} className={`px-2 py-1 border-2 border-black ${teamStageReached(t, run.teamId) >= i ? 'bg-green-700' : 'bg-gray-700'}`}>{s}</span>
          ))}
        </div>
        {myMatches.map((m) => (
          <button key={m.id} onClick={() => setSel(m)} className="w-full flex items-center gap-2 text-sm px-1 py-1 hover:bg-white/10">
            <span className="w-20 text-gray-400 text-xs text-left">{STAGE_NAME[m.stage]}</span>
            <span className="flex-1 text-right"><TeamTag id={m.home} me={run.teamId} /></span><Score m={m} /><span className="flex-1 text-left"><TeamTag id={m.away} me={run.teamId} /></span>
          </button>
        ))}
        <div className="text-xs text-gray-400 mt-2">当前阶段：{STAGE_REACHED_NAME[teamStageReached(t, run.teamId)]}</div>
      </div>
      <div className="mc-panel p-3">
        <div className="font-black pixel-text mb-2">🧩 当前构筑（{MODE_NAME[run.mode]} · {DIFFICULTY_NAME[run.difficulty]}）</div>
        <div className="grid grid-cols-2 gap-1">{active.map((s) => SKILL_MAP[s.id] && <SkillBadge key={s.id} def={SKILL_MAP[s.id]} level={s.level} small />)}</div>
        <div className="font-bold mt-3 mb-1">🎒 装备</div>
        <div className="grid grid-cols-3 gap-1 text-xs">{EQUIP_SLOTS.map((s) => <div key={s} className="mc-panel-light p-1">{SLOT_NAME[s]}：{run.equipSlots[s] ? EQUIP_MAP[run.equipSlots[s]!].name : '空'}</div>)}</div>
        <div className="text-xs text-gray-300 mt-2">已击败 BOSS：{run.bossesBeaten.map((b) => BOSS_MAP[b]?.name).join('、') || '无'}</div>
      </div>
      {sel && <MatchDetail m={sel} onClose={() => setSel(null)} />}
    </div>
  );
}

function AllTeams({ t, me }: { t: TournamentState; me: string }) {
  const elim = eliminatedTeams(t);
  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-2">
      {TEAMS.map((tm) => {
        const g = t.groups.find((x) => x.teams.includes(tm.id))!;
        const st = teamStageReached(t, tm.id);
        return (
          <div key={tm.id} className={`mc-panel p-2 text-xs ${elim.has(tm.id) ? 'opacity-50' : ''} ${tm.id === me ? 'outline outline-2 outline-yellow-400' : ''}`}>
            <div className="flex items-center gap-1"><Flag flag={tm.flag} w={22} h={15} /><b>{tm.name}</b></div>
            <div className="text-gray-400">{g.name} 组 · {elim.has(tm.id) ? '已淘汰' : t.champion === tm.id ? '🏆 冠军' : STAGE_REACHED_NAME[st]}</div>
          </div>
        );
      })}
    </div>
  );
}

export default function TournamentHub() {
  const { run, go, startMatch, simulateRest, meta } = useGame();
  const [tab, setTab] = useState<'groups' | 'knockout' | 'journey' | 'teams'>('groups');
  const [confirmQuit, setConfirmQuit] = useState(false);
  if (!run) return null;
  const t = run.tournament;
  const plan = run.plan;
  const team = getTeam(run.teamId);
  const injured = run.lineup.map((id) => run.roster.find((r) => r.id === id)).filter((p) => (p?.injured ?? 0) > 0);
  return (
    <Screen title={`${team.name} · 世界杯征程`} onBack={() => go('menu')} right={<RunTopInfo />}>
      <div className="grid xl:grid-cols-[1fr_340px] gap-3">
        <div className="min-w-0">
          <Tabs tabs={[{ id: 'groups', label: '小组赛' }, { id: 'knockout', label: '淘汰赛' }, { id: 'journey', label: '我的征程' }, { id: 'teams', label: '全部球队' }]} value={tab} onChange={setTab} />
          <div className="mt-2">
            {tab === 'groups' && <GroupsView t={t} me={run.teamId} />}
            {tab === 'knockout' && <BracketView t={t} me={run.teamId} />}
            {tab === 'journey' && <JourneyView />}
            {tab === 'teams' && <AllTeams t={t} me={run.teamId} />}
          </div>
        </div>
        <div className="flex flex-col gap-3">
          {plan && !run.eliminated && !run.ended ? (
            <div className="mc-panel p-3 flex flex-col gap-2">
              <div className="font-black pixel-text text-lg">下一场比赛</div>
              <div className="text-sm text-gray-300">{STAGE_NAME[plan.stage]} · 第 {plan.matchId} 场</div>
              <div className="flex items-center justify-around text-lg font-black my-1"><TeamTag id={run.teamId} me={run.teamId} /><span>VS</span><TeamTag id={plan.opponent} /></div>
              <div className="text-sm">🏟️ {STADIUM_MAP[plan.stadiumId].name} · {WEATHER_MAP[plan.weather].icon} {WEATHER_MAP[plan.weather].name}</div>
              {plan.boss && <div className="mc-panel-light p-2 text-sm"><b className="text-orange-300">{BOSS_MAP[plan.boss].icon} BOSS：{BOSS_MAP[plan.boss].name}</b>（{BOSS_MAP[plan.boss].type}）<div className="text-xs">{BOSS_MAP[plan.boss].desc}</div></div>}
              {!plan.boss && plan.elite && <div className="text-sm text-orange-300">⭐ 精英球队（获胜额外 60 金币）</div>}
              {plan.events.length > 0 && <div className="text-sm">{plan.events.map((id) => <div key={id}>🎪 {EVENT_MAP[id].icon} <b>{EVENT_MAP[id].name}</b>：{EVENT_MAP[id].desc}</div>)}</div>}
              <div className="text-sm"><div className="font-bold">📜 比赛任务</div>{plan.missions.map((m) => <div key={m.id}>· {m.desc}（🪙{m.gold} / {m.xp}XP）</div>)}</div>
              {injured.length > 0 && <div className="text-xs text-orange-300">⚠ 首发中有受伤球员：{injured.map((p) => p!.name).join('、')}（可在球队管理中替换）</div>}
              {run.teamFatigue > 50 && <div className="text-xs text-orange-300">⚠ 球队疲劳较高，速度与体力下降</div>}
              <button className="mc-btn green text-lg py-3" onClick={startMatch}>⚽ 开始比赛</button>
            </div>
          ) : (
            <div className="mc-panel p-3 flex flex-col gap-2">
              {run.ended ? <div className="font-black text-lg">世界杯已结束</div> : <div className="font-black text-lg text-red-300">你的球队已被淘汰</div>}
              {!run.ended && <button className="mc-btn gold" onClick={simulateRest}>⏩ 模拟剩余赛事</button>}
              {run.ended && <button className="mc-btn gold" onClick={() => go('tournamentEnd')}>🏆 查看世界杯结算</button>}
            </div>
          )}
          <button className="mc-btn blue" onClick={() => go('manage')}>👕 球队管理（阵容 / 技能 / 装备 / 战术）</button>
          {run.shop && <button className="mc-btn gold" onClick={() => go('shop')}>🛒 商店</button>}
          <button className="mc-btn small" onClick={() => exportSave(run, meta)}>💾 导出存档</button>
          <button className="mc-btn small red" onClick={() => setConfirmQuit(true)}>放弃本次征程</button>
          {confirmQuit && (
            <Modal onClose={() => setConfirmQuit(false)}>
              <div className="font-bold mb-3">确定放弃当前征程吗？进度将无法恢复。</div>
              <div className="flex gap-2"><button className="mc-btn red" onClick={() => useGame.getState().abandonRun()}>确定放弃</button><button className="mc-btn" onClick={() => setConfirmQuit(false)}>取消</button></div>
            </Modal>
          )}
        </div>
      </div>
    </Screen>
  );
}
