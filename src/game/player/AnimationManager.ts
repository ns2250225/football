import { AnimName } from '../types';
import type { PlayerModel } from './PlayerModel';

/**
 * 程序化动画库：18 种动画共享同一套方块骨骼。
 * t 为动画已播放时间，k 为移动速度系数（0~1），dir 为扑救方向。
 */
export function applyPose(m: PlayerModel, anim: AnimName, t: number, k: number, dir = 1) {
  m.resetLimbs();
  const s = Math.sin;
  switch (anim) {
    case 'Idle': {
      const b = s(t * 2.5) * 0.04;
      m.body.position.y = b * 0.5; m.lArm.rotation.z = -0.08 - b; m.rArm.rotation.z = 0.08 + b; m.head.rotation.y = s(t * 0.7) * 0.2;
      break;
    }
    case 'Walk': {
      const a = s(t * 8) * 0.45;
      m.lLeg.rotation.x = a; m.rLeg.rotation.x = -a; m.lArm.rotation.x = -a * 0.7; m.rArm.rotation.x = a * 0.7;
      m.body.position.y = Math.abs(s(t * 8)) * 0.03;
      break;
    }
    case 'Run': case 'Sprint': case 'Dribble': {
      const f = anim === 'Sprint' ? 15 : anim === 'Dribble' ? 10 : 12;
      const amp = anim === 'Sprint' ? 1.05 : anim === 'Dribble' ? 0.65 : 0.85;
      const a = s(t * f) * amp * (0.5 + 0.5 * k);
      m.lLeg.rotation.x = a; m.rLeg.rotation.x = -a; m.lArm.rotation.x = -a * 0.85; m.rArm.rotation.x = a * 0.85;
      m.body.rotation.x = anim === 'Sprint' ? 0.28 : anim === 'Dribble' ? 0.16 : 0.12;
      m.body.position.y = Math.abs(s(t * f)) * 0.07;
      if (anim === 'Dribble') { m.lArm.rotation.z = -0.35; m.rArm.rotation.z = 0.35; m.head.rotation.x = 0.25; }
      break;
    }
    case 'Pass': {
      const p = Math.min(1, t / 0.3);
      m.rLeg.rotation.x = p < 0.4 ? 0.7 * (p / 0.4) : 0.7 - 1.9 * ((p - 0.4) / 0.6);
      m.lArm.rotation.z = -0.6; m.rArm.rotation.z = 0.4; m.body.rotation.y = -0.2 * p;
      break;
    }
    case 'Shoot': case 'LongShoot': {
      const big = anim === 'LongShoot' ? 1.3 : 1;
      const p = Math.min(1, t / 0.4);
      m.rLeg.rotation.x = p < 0.35 ? 1.1 * big * (p / 0.35) : 1.1 * big - 2.9 * big * ((p - 0.35) / 0.65);
      m.body.rotation.x = p < 0.35 ? -0.1 : -0.3 * big;
      m.lArm.rotation.z = -0.9 * big; m.rArm.rotation.z = 0.5; m.lArm.rotation.x = -0.4;
      m.body.position.y = p > 0.5 ? 0.05 : 0;
      break;
    }
    case 'Tackle': {
      m.pose.rotation.x = -1.05; m.pose.position.y = 0.32;
      m.rLeg.rotation.x = -1.2; m.lLeg.rotation.x = 0.4; m.lArm.rotation.x = -1.6; m.rArm.rotation.z = 0.9; m.head.rotation.x = 0.6;
      break;
    }
    case 'Jump': case 'Header': {
      m.lLeg.rotation.x = 0.7; m.rLeg.rotation.x = -0.25; m.lArm.rotation.x = -2.4; m.rArm.rotation.x = -2.4;
      if (anim === 'Header') { const p = Math.min(1, t / 0.35); m.body.rotation.x = 0.5 * s(p * Math.PI); m.head.rotation.x = 0.6 * s(p * Math.PI); m.lArm.rotation.x = 0.6; m.rArm.rotation.x = 0.6; }
      break;
    }
    case 'Fall': {
      const p = Math.min(1, t / 0.35);
      m.pose.rotation.x = -1.45 * p; m.pose.position.y = 0.25 * p;
      m.lArm.rotation.z = -1.2; m.rArm.rotation.z = 1.2; m.lLeg.rotation.x = -0.3; m.rLeg.rotation.x = 0.2;
      break;
    }
    case 'Hit': {
      const p = Math.min(1, t / 0.3);
      m.body.rotation.x = -0.35 * s(p * Math.PI); m.lArm.rotation.z = -1.4 * s(p * Math.PI); m.rArm.rotation.z = 1.4 * s(p * Math.PI);
      m.head.rotation.x = -0.4 * s(p * Math.PI);
      break;
    }
    case 'Celebrate': {
      const j = Math.abs(s(t * 7));
      m.pose.position.y = j * 0.35; m.lArm.rotation.z = -2.6 - s(t * 14) * 0.25; m.rArm.rotation.z = 2.6 + s(t * 14) * 0.25;
      m.lLeg.rotation.x = j * 0.4; m.rLeg.rotation.x = -j * 0.2; m.head.rotation.x = -0.3;
      break;
    }
    case 'GoalkeeperDive': {
      const p = Math.min(1, t / 0.25);
      m.pose.rotation.z = -1.35 * dir * p; m.pose.position.y = 0.55 * s(Math.min(1, t / 0.5) * Math.PI) + 0.25 * p;
      m.lArm.rotation.z = -2.9; m.rArm.rotation.z = 2.9; m.lLeg.rotation.z = -0.25; m.rLeg.rotation.z = 0.25;
      break;
    }
    case 'GoalkeeperCatch': {
      m.lArm.rotation.x = -1.4; m.rArm.rotation.x = -1.4; m.lArm.rotation.z = 0.25; m.rArm.rotation.z = -0.25;
      m.body.rotation.x = 0.25; m.lLeg.rotation.x = -0.35; m.rLeg.rotation.x = -0.35; m.body.position.y = -0.08;
      break;
    }
    case 'Victory': {
      const j = Math.abs(s(t * 5));
      m.pose.position.y = j * 0.25; m.lArm.rotation.z = -2.8; m.rArm.rotation.z = 2.8; m.head.rotation.x = -0.4;
      break;
    }
    case 'Defeat': {
      m.head.rotation.x = 0.7; m.body.rotation.x = 0.35; m.lArm.rotation.x = 0.1; m.rArm.rotation.x = 0.1; m.lArm.rotation.z = -0.05; m.rArm.rotation.z = 0.05;
      break;
    }
  }
}
