import { lazy, Suspense, useMemo, useState } from 'react';
import { useGame } from '../../store/gameStore';
import { TEAMS, teamRating, getTeam } from '../../data/teams';
import { getRoster, playerOverall } from '../../data/players';
import { ACHIEVEMENTS } from '../../data/achievements';
import { Flag, Jersey, Radar, Screen, Modal } from '../common/UI';
import { TeamDef, ROLE_NAME, TACTIC_NAMES } from '../../game/types';
import { AudioManager } from '../../game/audio/AudioManager';
import { STAGE_REACHED_NAME } from '../../game/tournament/WorldCup';
import { rand } from '../../utils/random';

const KitPreview3D = lazy(() => import('../common/KitPreview3D'));

export function unlockHint(teamId: string): string {
  const a = ACHIEVEMENTS.find((x) => x.reward.team === teamId);
  return a ? `完成成就「${a.name}」：${a.desc}` : '';
}

export function TeamDetail({ team, onSelect, locked, compare }: { team: TeamDef; onSelect?: () => void; locked?: boolean; compare?: TeamDef | null }) {
  const meta = useGame((s) => s.meta);
  const [away, setAway] = useState(false);
  const roster = getRoster(team);
  const hist = meta.teamHistory[team.id];
  return (
    <div className="grid md:grid-cols-2 gap-4">
      <div className="flex flex-col gap-3">
        <div className="flex items-center gap-3">
          <Flag flag={team.flag} w={60} h={40} />
          <div>
            <div className="text-2xl font-black pixel-text">{team.name} <span className="text-gray-400 text-base">{team.code}</span></div>
            <div className="text-sm text-gray-300">综合评分 <b className="text-yellow-300">{teamRating(team)}</b> · 战术：{team.style} · 默认：{TACTIC_NAMES[team.defaultTactic]}</div>
          </div>
        </div>
        <div className="flex justify-center"><Radar stats={team.stats} compare={compare?.stats} size={230} /></div>
        {compare && <div className="text-xs text-center text-gray-300"><span className="text-green-400">■ {team.name}</span>　<span className="text-red-400">■ {compare.name}</span></div>}
        <div className="mc-panel-light p-3">
          <div className="font-black text-yellow-300">{team.passive.icon} 专属被动：{team.passive.name}</div>
          <div className="text-sm">{team.passive.desc}</div>
          <div className="text-xs text-gray-300 mt-1">参数：{Object.entries(team.passive.params).map(([k, v]) => `${k}=${v}`).join('，')}</div>
        </div>
        <div className="mc-panel-light p-3 text-sm">
          <div className="font-bold mb-1">🏅 历史成就</div>
          {hist ? <div>参赛 {hist.runs} 次 · 最佳成绩：{STAGE_REACHED_NAME[hist.best] ?? '小组赛'} · 冠军 {hist.titles} 次</div> : <div className="text-gray-400">尚未使用该球队参赛</div>}
        </div>
      </div>
      <div className="flex flex-col gap-3">
        <div className="flex gap-2 items-center">
          <span className="font-bold">球衣预览</span>
          <button className={`mc-btn small ${!away ? 'gold' : ''}`} onClick={() => setAway(false)}>主场</button>
          <button className={`mc-btn small ${away ? 'gold' : ''}`} onClick={() => setAway(true)}>客场</button>
        </div>
        <Suspense fallback={<div className="mc-panel h-[220px] flex items-center justify-center">加载 3D 预览…</div>}>
          <KitPreview3D team={team} away={away} number={10} />
        </Suspense>
        <div className="mc-panel-light p-2">
          <div className="font-bold mb-1">球员阵容</div>
          <table className="w-full text-xs">
            <thead><tr className="text-gray-400"><th className="text-left">号码</th><th className="text-left">姓名</th><th>位置</th><th>速度</th><th>射门</th><th>控球</th><th>传球</th><th>抢断</th><th>综合</th></tr></thead>
            <tbody>{roster.map((p, i) => (
              <tr key={p.id} className={i >= 5 ? 'text-gray-400' : ''}>
                <td>{p.number}</td><td>{p.name}{i >= 5 ? '（替补）' : ''}</td><td className="text-center">{ROLE_NAME[p.role]}</td>
                <td className="text-center">{p.attrs.speed}</td><td className="text-center">{p.attrs.shotPower}</td><td className="text-center">{p.attrs.control}</td><td className="text-center">{p.attrs.passAccuracy}</td><td className="text-center">{p.attrs.tackle}</td><td className="text-center font-bold">{playerOverall(p)}</td>
              </tr>))}</tbody>
          </table>
        </div>
        {onSelect && (locked ? <div className="mc-panel p-3 text-orange-300 text-sm">🔒 未解锁：{unlockHint(team.id)}</div>
          : <button className="mc-btn green text-lg py-3" onClick={onSelect}>选择 {team.name} ▶</button>)}
      </div>
    </div>
  );
}

export default function TeamSelect() {
  const { go, meta, pickTeam } = useGame();
  const [detail, setDetail] = useState<TeamDef | null>(null);
  const [compareMode, setCompareMode] = useState(false);
  const [compareA, setCompareA] = useState<TeamDef | null>(null);
  const [compareB, setCompareB] = useState<TeamDef | null>(null);
  const sorted = useMemo(() => TEAMS, []);
  const click = (t: TeamDef) => {
    AudioManager.play('click');
    if (compareMode) { if (!compareA || (compareA && compareB)) { setCompareA(t); setCompareB(null); } else setCompareB(t); return; }
    setDetail(t);
  };
  const random = () => {
    const pool = TEAMS.filter((t) => meta.unlocked.includes(t.id));
    setDetail(rand.pick(pool));
    AudioManager.play('magic');
  };
  return (
    <Screen title="选择国家队（32 选 1）" onBack={() => go('mode')} right={
      <div className="flex gap-2">
        <button className={`mc-btn small ${compareMode ? 'gold' : ''}`} onClick={() => { setCompareMode(!compareMode); setCompareA(null); setCompareB(null); }}>⚖️ 属性对比</button>
        <button className="mc-btn small purple" onClick={random}>🎲 随机球队</button>
      </div>}>
      {compareMode && <div className="mc-panel p-2 mb-2 text-sm">对比模式：依次点击两支球队。{compareA && <b> {compareA.name}</b>}{compareB && <b> vs {compareB.name}</b>}</div>}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-2">
        {sorted.map((t) => {
          const locked = !meta.unlocked.includes(t.id);
          return (
            <button key={t.id} onClick={() => click(t)} className={`mc-panel p-2 flex flex-col items-center gap-1 relative hover:brightness-125 ${compareA?.id === t.id || compareB?.id === t.id ? 'outline outline-4 outline-yellow-400' : ''}`} style={{ borderBottom: `5px solid ${t.home.shirt}` }}>
              <div className="flex items-center gap-2 w-full justify-between">
                <Flag flag={t.flag} w={30} h={20} />
                <span className="text-yellow-300 font-black text-sm pixel-text">{teamRating(t)}</span>
              </div>
              <Jersey kit={t.home} number={10} size={40} />
              <div className="font-black text-sm pixel-text">{t.name}</div>
              <div className="text-[11px] text-gray-300">{t.style}</div>
              {locked && <div className="absolute inset-0 bg-black/60 flex flex-col items-center justify-center text-xs"><span className="text-2xl">🔒</span>未解锁</div>}
            </button>
          );
        })}
      </div>
      {detail && (
        <Modal wide onClose={() => setDetail(null)}>
          <TeamDetail team={detail} locked={!meta.unlocked.includes(detail.id)} onSelect={() => { AudioManager.play('select'); pickTeam(detail.id); }} />
          <button className="mc-btn red small mt-3" onClick={() => setDetail(null)}>关闭</button>
        </Modal>
      )}
      {compareA && compareB && (
        <Modal wide onClose={() => setCompareB(null)}>
          <h2 className="text-xl font-black pixel-text mb-2">⚖️ {compareA.name} vs {compareB.name}</h2>
          <div className="flex flex-col md:flex-row items-center gap-4">
            <Radar stats={compareA.stats} compare={compareB.stats} size={280} />
            <table className="text-sm">
              <tbody>
                {(['speed', 'shooting', 'dribbling', 'passing', 'defense', 'stamina'] as const).map((k) => (
                  <tr key={k}><td className="pr-3 text-gray-300">{({ speed: '速度', shooting: '射门', dribbling: '盘带', passing: '传球', defense: '防守', stamina: '体能' })[k]}</td>
                    <td className={`pr-3 font-bold ${compareA.stats[k] >= compareB.stats[k] ? 'text-green-400' : ''}`}>{compareA.stats[k]}</td>
                    <td className={`font-bold ${compareB.stats[k] >= compareA.stats[k] ? 'text-red-400' : ''}`}>{compareB.stats[k]}</td></tr>
                ))}
                <tr><td className="pr-3 text-gray-300">综合</td><td className="font-bold">{teamRating(compareA)}</td><td className="font-bold">{teamRating(compareB)}</td></tr>
                <tr><td className="pr-3 text-gray-300">被动</td><td className="pr-3">{compareA.passive.name}</td><td>{compareB.passive.name}</td></tr>
              </tbody>
            </table>
          </div>
          <button className="mc-btn small mt-3" onClick={() => { setCompareA(null); setCompareB(null); }}>重新选择</button>
        </Modal>
      )}
    </Screen>
  );
}

export function CoreSelect() {
  const { go, pendingTeam, pickCore } = useGame();
  const team = getTeam(pendingTeam ?? 'brazil');
  const roster = getRoster(team);
  const options = useMemo(() => {
    const pools: Record<string, string[]> = {
      striker: ['spiral_shot', 'gravity_shot', 'bounce_shot', 'cloud_piercer', 'thunder_shot', 'frost_shot', 'iron_leg', 'precision_master'],
      winger: ['lightning_dash', 'blink_dribble', 'double_jump', 'whirlwind_dribble', 'energy_wave', 'swift_feet'],
      playmaker: ['magnet_pass', 'gravity_pull', 'speed_field', 'pass_master', 'counter_horn', 'iron_wall'],
    };
    return [
      { arch: 'striker', label: '射手型前锋', icon: '🎯', p: roster[3], skill: rand.pick(pools.striker), desc: '射门力量与精度突出，擅长终结。' },
      { arch: 'winger', label: '突破型边锋', icon: '💨', p: roster[4], skill: rand.pick(pools.winger), desc: '速度与盘带出众，擅长过人推进。' },
      { arch: 'playmaker', label: '组织型中场', icon: '🧠', p: roster[2], skill: rand.pick(pools.playmaker), desc: '传球视野开阔，串联全队进攻。' },
    ];
  }, [team.id]);
  return (
    <Screen title={`选择初始核心球员 · ${team.name}`} onBack={() => go('teamSelect')}>
      <div className="max-w-5xl mx-auto">
        <p className="text-sm text-gray-300 mb-3">核心球员由你默认操控，全属性 +8，携带一个初始技能。比赛中可按 Q 切换控制其他队员。</p>
        <div className="grid md:grid-cols-3 gap-3">
          {options.map((o) => (
            <CoreCard key={o.arch} o={o} team={team} onPick={() => { AudioManager.play('select'); pickCore(o.p.id, o.arch, o.skill); }} />
          ))}
        </div>
      </div>
    </Screen>
  );
}

import { SKILL_MAP } from '../../game/skills/SkillRegistry';
import { SkillBadge } from '../common/UI';
import type { RosterPlayer } from '../../game/types';

function CoreCard({ o, team, onPick }: { o: { arch: string; label: string; icon: string; p: RosterPlayer; skill: string; desc: string }; team: TeamDef; onPick: () => void }) {
  const a = o.p.attrs;
  const def = SKILL_MAP[o.skill];
  return (
    <div className="mc-panel p-4 flex flex-col gap-2">
      <div className="text-3xl">{o.icon}</div>
      <div className="text-lg font-black pixel-text">{o.label}</div>
      <div className="flex items-center gap-2"><Jersey kit={team.home} number={o.p.number} size={44} /><div><div className="font-bold">{o.p.name} · {o.p.number} 号</div><div className="text-xs text-gray-300">{ROLE_NAME[o.p.role]} · 综合 {playerOverall(o.p) + 8}</div></div></div>
      <div className="text-sm text-gray-300">{o.desc}</div>
      <div className="grid grid-cols-2 gap-x-3 text-xs">
        <span>速度 {a.speed + 8}</span><span>射门 {a.shotPower + 8}</span><span>精度 {a.shotAccuracy + 8}</span><span>控球 {a.control + 8}</span><span>传球 {a.passAccuracy + 8}</span><span>抢断 {a.tackle + 8}</span>
      </div>
      {def && <div><div className="text-xs text-gray-400 mb-1">初始技能</div><SkillBadge def={def} level={1} /><div className="text-xs text-gray-300 mt-1">{def.desc}</div></div>}
      <button className="mc-btn green mt-auto" onClick={onPick}>选择该球员</button>
    </div>
  );
}
