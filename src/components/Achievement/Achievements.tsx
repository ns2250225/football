import { useGame } from '../../store/gameStore';
import { Screen, Bar } from '../common/UI';
import { ACHIEVEMENTS } from '../../data/achievements';
import { getTeam } from '../../data/teams';

export default function Achievements() {
  const { go, meta } = useGame();
  const done = Object.keys(meta.achievements).length;
  const st = meta.stats;
  return (
    <Screen title={`🏅 成就系统（${done}/${ACHIEVEMENTS.length}）`} onBack={() => go('menu')}>
      <div className="max-w-5xl mx-auto">
        <div className="mc-panel p-3 mb-3 grid grid-cols-2 md:grid-cols-6 gap-2 text-sm">
          <div>征程 <b>{st.runs}</b></div><div>冠军 <b>{st.champions}</b></div><div>比赛 <b>{st.matches}</b></div><div>胜/平/负 <b>{st.wins}/{st.draws}/{st.losses}</b></div><div>进球 <b>{st.goals}</b></div><div>助攻 <b>{st.assists}</b></div>
          <div>抢断 <b>{st.tackles}</b></div><div>扑救 <b>{st.saves}</b></div><div>技能 <b>{st.skillUses}</b></div><div>大招 <b>{st.ultUses}</b></div><div>进化 <b>{st.evolutions.length}</b></div><div>BOSS <b>{st.bosses.length}/8</b></div>
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-2">
          {ACHIEVEMENTS.map((a) => {
            const at = meta.achievements[a.id];
            const prog = a.progress?.(meta);
            return (
              <div key={a.id} className={`mc-panel p-2 flex gap-2 ${at ? '' : 'opacity-70'}`}>
                <div className={`text-3xl ${at ? '' : 'grayscale'}`}>{at ? a.icon : '🔒'}</div>
                <div className="flex-1 min-w-0">
                  <div className={`font-black ${at ? 'text-yellow-300' : ''}`}>{a.name}</div>
                  <div className="text-xs text-gray-300">{a.desc}</div>
                  <div className="text-xs text-green-300">奖励：{a.reward.team ? `解锁 ${getTeam(a.reward.team).name}` : `征程初始金币 +${a.reward.gold}`}</div>
                  {prog && !at && <div className="mt-1"><Bar value={prog[0]} max={prog[1]} color="#a3e635" h={6} /><div className="text-[10px] text-gray-400">{prog[0]}/{prog[1]}</div></div>}
                  {at && <div className="text-[10px] text-gray-400">{new Date(at).toLocaleDateString()} 达成</div>}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </Screen>
  );
}
