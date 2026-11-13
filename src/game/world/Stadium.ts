import * as THREE from 'three';
import { StadiumDef, WeatherKind } from '../types';
import { buildPitch, buildGoal } from './FootballField';
import { buildStadium, buildSky, StadiumBuild } from './StadiumBuilder';
import { CrowdSystem } from './CrowdSystem';
import { WeatherSystem } from './WeatherSystem';
import { WEATHER_MAP } from '../../data/stadiums';
import { FIELD } from '../../utils/physics';

/** 完整球场：天空盒、草坪、球门、看台、观众、灯光、天气、环境 */
export class Stadium {
  group = new THREE.Group();
  build: StadiumBuild;
  crowd: CrowdSystem;
  weather: WeatherSystem;
  hemi: THREE.HemisphereLight;
  sun: THREE.DirectionalLight;
  spots: THREE.SpotLight[] = [];
  baseHemi: number; baseSun: number;
  goals: THREE.Group[] = [];
  smokeT = 0;
  brightness = 1;

  constructor(public scene: THREE.Scene, public def: StadiumDef, weather: WeatherKind, night: boolean, quality: 'low' | 'medium' | 'high', goalW: number, goalH: number, homeColors: string[], onBolt: (p: THREE.Vector3) => void, brightness = 1) {
    const q = quality === 'low' ? 0.35 : quality === 'medium' ? 0.7 : 1;
    const w = WEATHER_MAP[weather];
    const dark = night || weather === 'night';
    // 亮度下限：保证任何球场/天气下草坪与球员清晰可见（夜晚靠灯光塔照明）
    const lightK = dark ? 0.6 : Math.max(0.78, w.light);
    const B = Math.max(0.6, Math.min(1.8, brightness));
    scene.background = new THREE.Color(def.skyBottom);
    const fogCol = new THREE.Color(def.fog);
    if (dark) fogCol.multiplyScalar(0.45);
    if (weather === 'sandstorm') fogCol.set('#c9a36a');
    const fogMul = weather === 'sandstorm' ? 2.6 : weather === 'rain' || weather === 'storm' ? 1.4 : weather === 'snow' ? 1.5 : 1;
    scene.fog = new THREE.FogExp2(fogCol, Math.min(0.011, def.fogDensity * fogMul));
    const sky = buildSky(def);
    if (dark) (sky.material as THREE.MeshBasicMaterial).color = new THREE.Color(0.3, 0.32, 0.48);
    else if (weather === 'rain' || weather === 'storm') (sky.material as THREE.MeshBasicMaterial).color = new THREE.Color(0.55, 0.58, 0.65);
    this.group.add(sky);
    this.group.add(buildPitch(def));
    for (const s of [-1, 1] as const) { const g = buildGoal(s, goalW, goalH); this.goals.push(g); this.group.add(g); }
    this.build = buildStadium(def, quality);
    this.group.add(this.build.group);
    // 灯光
    // 半球光地面色过暗的主题（火山、未来科技等）提亮，避免草坪发黑
    const ground = new THREE.Color(def.hemiGround);
    const gl = ground.r * 0.3 + ground.g * 0.59 + ground.b * 0.11;
    if (gl < 0.35) ground.lerp(new THREE.Color('#8a9a80'), 0.55);
    this.hemi = new THREE.HemisphereLight(def.hemiSky, ground, Math.max(1.15, (def.ambient + 0.75) * lightK + (dark ? 0.4 : 0)) * B);
    this.baseHemi = this.hemi.intensity;
    this.group.add(this.hemi);
    // 中性环境补光
    this.group.add(new THREE.AmbientLight('#ffffff', (dark ? 0.55 : 0.4) * B));
    const sunCol = new THREE.Color(def.sunColor).lerp(new THREE.Color('#ffffff'), dark ? 0.6 : 0.3);
    this.sun = new THREE.DirectionalLight(sunCol, Math.max(1.5, def.sun * lightK * 1.8) * (dark ? 0.75 : 1) * B);
    this.baseSun = this.sun.intensity;
    this.sun.position.set(-20, 40, 18);
    this.sun.target.position.set(0, 0, 0);
    if (quality !== 'low') {
      this.sun.castShadow = true;
      const sz = quality === 'high' ? 2048 : 1024;
      this.sun.shadow.mapSize.set(sz, sz);
      const cam = this.sun.shadow.camera;
      cam.left = -30; cam.right = 30; cam.top = 22; cam.bottom = -22; cam.near = 1; cam.far = 100;
      this.sun.shadow.bias = -0.0008;
    }
    this.group.add(this.sun, this.sun.target);
    if (dark) {
      // 夜间灯光塔：四座全部点亮，覆盖整个球场
      this.build.towerTops.forEach((t) => {
        const sp = new THREE.SpotLight('#fff8e6', 900 * B, 140, 0.95, 0.6, 1.2);
        sp.position.copy(t); sp.target.position.set(t.x * 0.2, 0, t.z * 0.2);
        this.group.add(sp, sp.target); this.spots.push(sp);
      });
    }
    this.crowd = new CrowdSystem(this.build.crowdSeats, def.crowd, q * 0.95, homeColors, def.id);
    this.group.add(this.crowd.mesh);
    scene.add(this.group);
    this.weather = new WeatherSystem(scene, weather, q, this.hemi, onBolt);
    this.brightness = B;
    void FIELD;
  }
  update(dt: number, t: number, center: THREE.Vector3, lightning: boolean, particles?: { trail: (p: THREE.Vector3, c: string, s: number, l?: number, j?: number) => void }) {
    this.hemi.intensity = this.baseHemi;
    this.crowd.update(dt, t);
    this.weather.update(dt, center, lightning);
    for (const a of this.build.animated) if (a.kind === 'cloud') { a.obj.position.x = a.base + Math.sin(t * 0.02 + a.base) * 20; }
    if (this.build.volcanoTop && particles) {
      this.smokeT -= dt;
      if (this.smokeT <= 0) { this.smokeT = 0.08; particles.trail(this.build.volcanoTop, Math.random() < 0.3 ? '#ff4500' : '#3f3f46', 2.2, 3.5, 4); }
    }
  }
  dispose() {
    this.weather.dispose();
    this.group.traverse((o) => {
      const m = o as THREE.Mesh;
      if (m.geometry) m.geometry.dispose();
    });
    this.group.removeFromParent();
  }
}
