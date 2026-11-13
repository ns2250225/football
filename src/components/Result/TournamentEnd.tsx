import { useEffect, useMemo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { useRef } from 'react';
import * as THREE from 'three';
import { useGame } from '../../store/gameStore';
import { Screen, Flag } from '../common/UI';
import { getTeam } from '../../data/teams';
import { STAGE_REACHED_NAME, teamStageReached } from '../../game/tournament/WorldCup';
import { AudioManager } from '../../game/audio/AudioManager';
import { MODE_NAME, DIFFICULTY_NAME } from '../../game/types';

function Trophy() {
  const g = useRef<THREE.Group>(null);
  useFrame((s) => { if (g.current) g.current.rotation.y = s.clock.elapsedTime * 0.8; });
  const gold = new THREE.MeshStandardMaterial({ color: '#facc15', metalness: 0.8, roughness: 0.25 });
  const base = new THREE.MeshStandardMaterial({ color: '#7c2d12', roughness: 0.6 });
  const box = (w: number, h: number, d: number, y: number, m: THREE.Material, x = 0, z = 0) => <mesh position={[x, y, z]} material={m}><boxGeometry args={[w, h, d]} /></mesh>;
  return (
    <group ref={g} position={[0, -1.2, 0]}>
      {box(1.4, 0.4, 1.4, 0.2, base)}{box(1.1, 0.3, 1.1, 0.55, gold)}{box(0.45, 0.9, 0.45, 1.15, gold)}{box(0.9, 0.5, 0.9, 1.85, gold)}
      {box(1.3, 0.7, 1.3, 2.4, gold)}{box(0.2, 0.6, 0.2, 2.4, gold, 0.8)}{box(0.2, 0.6, 0.2, 2.4, gold, -0.8)}{box(1.0, 0.15, 1.0, 2.82, gold)}
      <mesh position={[0, 3.1, 0]} material={gold}><icosahedronGeometry args={[0.35, 0]} /></mesh>
    </group>
  );
}

export default function TournamentEnd() {
  const { run, finishRun } = useGame();
  useEffect(() => { AudioManager.startMusic(run?.championWon ? 'victory' : 'menu'); }, []);
  const stats = useMemo(() => {
    if (!run) return null;
    const t = run.tournament;
    const scorers: Record<string, { name: string; team: string; goals: number; assists: number }> = {};
    let goals = 0, matches = 0, pens = 0;
    const teamGoals: Record<string, number> = {};
    for (const m of t.matches) {
      if (!m.result) continue;
      matches++; goals += m.result.homeGoals + m.result.awayGoals; if (m.result.pens) pens++;
      if (m.home) teamGoals[m.home] = (teamGoals[m.home] ?? 0) + m.result.homeGoals;
      if (m.away) teamGoals[m.away] = (teamGoals[m.away] ?? 0) + m.result.awayGoals;
      for (const g of m.result.scorers) {
        if (g.own) continue;
        const k = g.team + g.name; scorers[k] = scorers[k] ?? { name: g.name, team: g.team, goals: 0, assists: 0 }; scorers[k].goals++;
        if (g.assist) { const ka = g.team + g.assist; scorers[ka] = scorers[ka] ?? { name: g.assist, team: g.team, goals: 0, assists: 0 }; scorers[ka].assists++; }
      }
    }
    const top = Object.values(scorers).sort((a, b) => b.goals - a.goals || b.assists - a.assists).slice(0, 8);
    const best = Object.values(scorers).sort((a, b) => b.goals * 2 + b.assists - (a.goals * 2 + a.assists))[0];
    const myBest = Object.values(scorers).filter((s) => s.team === run.teamId).sort((a, b) => b.goals * 2 + b.assists - (a.goals * 2 + a.assists))[0];
    const attack = Object.entries(teamGoals).sort((a, b) => b[1] - a[1])[0];
    return { goals, matches, pens, top, best, myBest, attack };
  }, [run]);
  if (!run || !stats) return null;
  const t = run.tournament;
  const champ = run.championWon;
  const myStage = teamStageReached(t, run.teamId);
  const ranking = [t.champion, t.runnerUp, t.third, t.fourth];
  return (
    <Screen title="🏆 世界杯结算">
      <div className="max-w-5xl mx-auto grid md:grid-cols-2 gap-3">
        <div className="mc-panel p-3 flex flex-col items-center">
          <div className={`text-3xl font-black title-text ${champ ? 'text-yellow-300' : ''}`}>{champ ? '世界杯冠军！' : `最终成绩：${STAGE_REACHED_NAME[myStage]}`}</div>
          <div className="text-sm text-gray-300">{getTeam(run.teamId).name} · {MODE_NAME[run.mode]} · {DIFFICULTY_NAME[run.difficulty]} · LV.{run.level}</div>
          <div className="w-full h-64">
            <Canvas camera={{ position: [0, 1.2, 5], fov: 45 }}>
              <color attach="background" args={['#1a1033']} />
              <ambientLight intensity={0.6} /><directionalLight position={[3, 5, 3]} intensity={2.2} /><pointLight position={[-3, 2, 2]} intensity={20} color="#fde68a" />
              <Trophy />
            </Canvas>
          </div>
          {t.champion && <div className="flex items-center gap-2 text-xl font-black"><Flag flag={getTeam(t.champion).flag} /> 冠军：{getTeam(t.champion).name}</div>}
        </div>
        <div className="flex flex-col gap-3">
          <div className="mc-panel p-3">
            <div className="font-black mb-1">🥇 最终排名</div>
            {ranking.map((id, i) => id && <div key={i} className={`flex items-center gap-2 ${id === run.teamId ? 'text-yellow-300 font-black' : ''}`}>{['🥇', '🥈', '🥉', '4️⃣'][i]} <Flag flag={getTeam(id).flag} w={22} h={15} /> {getTeam(id).name}</div>)}
            {!ranking.includes(run.teamId) && <div className="text-gray-300 mt-1">你的球队：{STAGE_REACHED_NAME[myStage]}</div>}
          </div>
          <div className="mc-panel p-3 text-sm">
            <div className="font-black mb-1">🌟 最佳球员</div>
            {stats.best && <div>赛事最佳：{stats.best.name}（{getTeam(stats.best.team).name}）· {stats.best.goals} 球 {stats.best.assists} 助</div>}
            {stats.myBest && <div>本队最佳：{stats.myBest.name} · {stats.myBest.goals} 球 {stats.myBest.assists} 助</div>}
          </div>
          <div className="mc-panel p-3 text-sm">
            <div className="font-black mb-1">📊 整届赛事数据</div>
            <div>比赛 {stats.matches} 场 · 总进球 {stats.goals} · 场均 {(stats.goals / Math.max(1, stats.matches)).toFixed(2)} · 点球大战 {stats.pens} 场</div>
            {stats.attack && <div>最佳攻击力：{getTeam(stats.attack[0]).name}（{stats.attack[1]} 球）</div>}
            <div className="font-bold mt-2">射手榜</div>
            {stats.top.map((s, i) => <div key={i}>{i + 1}. {s.name}（{getTeam(s.team).name}）{s.goals} 球 {s.assists} 助</div>)}
          </div>
          <div className="mc-panel p-3 text-sm">
            <div className="font-black mb-1">🗺️ 我的征程</div>
            {run.log.map((l, i) => <div key={i}>{l.won ? '✅' : l.draw ? '➖' : '❌'} vs {getTeam(l.opponent).name} {l.gf}:{l.ga}{l.pens ? `（点 ${l.pens[0]}:${l.pens[1]}）` : ''}</div>)}
          </div>
          <button className="mc-btn green text-lg" onClick={finishRun}>返回主菜单，开启下一届世界杯 ▶</button>
        </div>
      </div>
    </Screen>
  );
}
