import { useMemo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import * as THREE from 'three';
import { TeamDef } from '../../game/types';
import { PlayerModel, pickGkKit } from '../../game/player/PlayerModel';
import { applyPose } from '../../game/player/AnimationManager';

function Model({ team, away, gk, number }: { team: TeamDef; away?: boolean; gk?: boolean; number: number }) {
  const model = useMemo(() => {
    const kit = gk ? pickGkKit(team.home.shirt, team.away.shirt) : away ? team.away : team.home;
    return new PlayerModel({ kit, number, isGK: !!gk, height: 1, build: 1, skin: team.skin[0], hair: team.hair[0], accessory: 1, flag: team.flag, ringColor: '#22d3ee', teamKey: team.id + (gk ? 'gk' : away ? 'a' : 'h') });
  }, [team, away, gk, number]);
  useFrame((state) => {
    applyPose(model, 'Idle', state.clock.elapsedTime, 0);
    model.root.rotation.y = state.clock.elapsedTime * 0.6;
  });
  return <primitive object={model.root} position={[0, -0.9, 0]} />;
}

/** 球衣 3D 预览（React Three Fiber + Drei） */
export default function KitPreview3D({ team, away, gk, number = 10, height = 220 }: { team: TeamDef; away?: boolean; gk?: boolean; number?: number; height?: number }) {
  return (
    <div style={{ height }} className="w-full mc-panel">
      <Canvas camera={{ position: [0, 0.6, 3.4], fov: 40 }} gl={{ antialias: true }} onCreated={({ gl }) => { gl.outputColorSpace = THREE.SRGBColorSpace; }}>
        <color attach="background" args={['#1d2b1d']} />
        <hemisphereLight args={['#ffffff', '#335533', 1.4]} />
        <directionalLight position={[3, 5, 4]} intensity={1.6} />
        <Model team={team} away={away} gk={gk} number={number} />
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.9, 0]}><circleGeometry args={[1.2, 24]} /><meshLambertMaterial color="#3fa34d" /></mesh>
        <OrbitControls enablePan={false} enableZoom={false} />
      </Canvas>
    </div>
  );
}
