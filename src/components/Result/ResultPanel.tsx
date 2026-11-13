import { useState } from 'react';
import { useGame, ResultInfo } from '../../store/gameStore';
import { getTeam } from '../../data/teams';
import { Flag } from '../common/UI';
import { ROLE_NAME, STAGE_NAME } from '../../game/types';
import { nextPlayerMatch } from '../../game/tournament/WorldCup';
import type { TeamMatchStats } from '../../game/core/GameState';

export default function ResultPanel({ info, replays, onReplay, onContinue }: { info: ResultInfo; replays: string[]; onReplay: (i: number) => void; onContinue: () => void }) {
  const run = useGame((s) => s.run);
  const [tab, setTab] = useState<'sum' | 'players' | 'team'>('sum');
  const o = info.outcome;
  const me = run ? getTeam(run.teamId) : null, opp = getTeam(info.plan.opponent);
  const next = run ? nextPlayerMatch(run.tournament, run.teamId) : undefined;
  const title = o.forfeited ? '弃赛' : o.won ? '胜利！' : o.draw ? '平局' : '失败';
  const color = o.won ? '#4ade80' : o.draw ? '#e5e7eb' : '#f87171';
  const statRow = (label: string, a: number, b: number, suf = '') => (
    <div className="grid grid-cols-[1fr_auto_1fr] gap-2 items-center text-sm"><div className="text-right font-bold">{a}{suf}</div><div className="text-gray-400 text-xs w-20 text-center">{label}</div><div className="font-bold">{b}{suf}</div></div>
  );
  const ts = (s: TeamMatchStats) => s;
  return (
    <div className="fixed inset-0 z-40 bg-black/70 flex items-center justify-center p-2">
      <div className="mc-panel w-full max-w-3xl max-h-full scroll-y p-4 anim-pop">
        <div className="text-center">
          <div className="text-4xl md:text-5xl font-black title-text" style={{ color }}>{title}</div>
          <div className="text-xs text-gray-300">{STAGE_NAME[info.plan.stage]}</div>
          <div className="flex items-center justify-center gap-3 text-2xl font-black my-2">
            {me && <><Flag flag={me.flag} /> {me.name}</>}
            <span className="text-3xl">{o.gf} : {o.ga}</span>
            {opp.name} <Flag flag={opp.flag} />
          </div>
          {o.pens && <div className="text-sm">点球大战 {o.pens[0]} : {o.pens[1]}</div>}
          {o.et && !o.pens && <div className="text-sm">加时赛决出胜负</div>}
          {info.championWon && <div className="text-2xl font-black text-yellow-300 pixel-text mt-1">🏆 恭喜夺得世界杯冠军！</div>}
          {info.advanced && <div className="text-green-300 font-bold">🎉 小组出线，晋级 16 强！</div>}
          {info.eliminated && !info.championWon && !run?.ended && <div className="text-red-300 font-bold">你的球队被淘汰了</div>}
        </div>
        <div className="flex gap-1 my-2 justify-center">
          {(['sum', 'players', 'team'] as const).map((t) => <button key={t} className={`mc-tab ${tab === t ? 'active' : ''}`} onClick={() => setTab(t)}>{t === 'sum' ? '奖励' : t === 'players' ? '球员数据' : '球队数据'}</button>)}
        </div>
        {tab === 'sum' && (
          <div className="grid md:grid-cols-2 gap-2">
            <div className="mc-panel-light p-2 text-sm">
              <div className="font-bold mb-1">🪙 金币奖励（+{info.rewards.gold}）</div>
              {info.rewards.lines.map((l, i) => <div key={i} className="flex justify-between"><span>{l.label}</span><span className="text-yellow-300">+{l.gold}</span></div>)}
              <div className="font-bold mt-2">⭐ 经验奖励：+{o.xpEarned} XP{info.rewards.missionXp ? `（任务 +${info.rewards.missionXp}）` : ''}</div>
              {info.dropName && <div className="text-purple-300 mt-1">🎁 获得装备：{info.dropName}</div>}
            </div>
            <div className="mc-panel-light p-2 text-sm">
              <div className="font-bold mb-1">📜 比赛任务</div>
              {o.missions.map((m) => <div key={m.id} className={m.done ? 'text-green-400' : 'text-gray-400'}>{m.done ? '✔' : '✘'} {m.desc}</div>)}
              <div className="font-bold mt-2 mb-1">⚽ 进球</div>
              {o.scorers.length ? o.scorers.map((g, i) => <div key={i}>{g.minute}' {getTeam(g.team).name} {g.name}{g.own ? '（乌龙）' : ''}{g.assist ? `（助攻 ${g.assist}）` : ''}</div>) : <div className="text-gray-400">无进球</div>}
              {replays.length > 0 && <div className="mt-2"><div className="font-bold mb-1">🎬 进球回放</div><div className="flex flex-wrap gap-1">{replays.map((r, i) => <button key={i} className="mc-btn small blue" onClick={() => onReplay(i)}>▶ {r}</button>)}</div></div>}
            </div>
            {(info.newAch.length > 0 || info.unlocked.length > 0) && (
              <div className="mc-panel-light p-2 text-sm md:col-span-2">
                <div className="font-bold mb-1">🔓 解锁内容</div>
                {info.newAch.map((a) => <div key={a}>🏅 成就：{a}</div>)}
                {info.unlocked.map((t) => <div key={t} className="text-green-300">🌍 新球队：{getTeam(t).name}</div>)}
              </div>
            )}
            <div className="mc-panel-light p-2 text-sm md:col-span-2">
              <b>下一场：</b>{run?.ended ? '世界杯已结束' : next && next.home && next.away ? `${STAGE_NAME[next.stage]} vs ${getTeam(next.home === run!.teamId ? next.away : next.home).name}` : info.eliminated ? '已淘汰，可模拟剩余赛事' : '等待对阵产生'}
              {o.injuries.length > 0 && <div className="text-orange-300">🩹 受伤球员：{o.injuries.map((id) => run?.roster.find((r) => r.id === id)?.name).join('、')}</div>}
            </div>
          </div>
        )}
        {tab === 'players' && (
          <table className="w-full text-xs">
            <thead><tr className="text-gray-400"><th className="text-left">球员</th><th>位置</th><th>进球</th><th>助攻</th><th>射门</th><th>传球</th><th>抢断</th><th>过人</th><th>扑救</th><th>评分</th></tr></thead>
            <tbody>{o.players.map((p) => (
              <tr key={p.id + p.side} className={p.side === 0 ? '' : 'text-gray-400'}>
                <td>{p.side === 0 ? '🔵' : '🔴'} {p.number} {p.name}{p.name === o.bestPlayer && p.side === 0 ? ' 🌟MVP' : ''}</td><td className="text-center">{ROLE_NAME[p.role as keyof typeof ROLE_NAME]}</td>
                <td className="text-center">{p.goals}</td><td className="text-center">{p.assists}</td><td className="text-center">{p.shots}</td><td className="text-center">{p.passes}</td><td className="text-center">{p.tackles}</td><td className="text-center">{p.dribbles}</td><td className="text-center">{p.saves}</td><td className="text-center font-bold">{p.rating.toFixed(1)}</td>
              </tr>))}</tbody>
          </table>
        )}
        {tab === 'team' && (
          <div className="flex flex-col gap-1">
            {statRow('射门', o.shots[0], o.shots[1])}{statRow('射正', o.onTarget[0], o.onTarget[1])}{statRow('控球率', o.possession[0], o.possession[1], '%')}
            {statRow('传球成功', ts(o.teamStats).passes, o.oppStats.passes)}{statRow('抢断', o.teamStats.tackles, o.oppStats.tackles)}{statRow('过人', o.teamStats.dribbles, o.oppStats.dribbles)}
            {statRow('扑救', o.teamStats.saves, o.oppStats.saves)}{statRow('犯规', o.teamStats.fouls, o.oppStats.fouls)}{statRow('黄牌', o.teamStats.yellow, o.oppStats.yellow)}{statRow('红牌', o.teamStats.red, o.oppStats.red)}
            {statRow('角球', o.teamStats.corners, o.oppStats.corners)}{statRow('技能使用', o.skillUses, 0)}{statRow('大招释放', o.ultUses, 0)}
          </div>
        )}
        <button className="mc-btn green w-full mt-3 text-lg" onClick={onContinue}>继续 ▶ {run?.ended ? '（世界杯结算）' : '（商店）'}</button>
      </div>
    </div>
  );
}
