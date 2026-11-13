import { StadiumDef, WeatherDef, WeatherKind } from '../game/types';

export const STADIUMS: StadiumDef[] = [
  { id: 'central', name: '世界杯中央球场', theme: 'central', icon: '🏟️', desc: '标准大型世界杯体育场，四面环绕的方块看台与巨型灯光塔。',
    skyTop: '#3f86d8', skyBottom: '#bfe3ff', fog: '#bfe3ff', fogDensity: 0.004, grassA: '#3fa34d', grassB: '#37923f', lineColor: '#f4f4f4', ground: '#5a5a5a',
    standColor: '#8b8f99', standAccent: '#2b5fae', crowd: ['#e63946', '#f1faee', '#457b9d', '#ffb703', '#2a9d8f'], ambient: 0.55, sun: 1.15, sunColor: '#fff6e0',
    hemiSky: '#cfe8ff', hemiGround: '#4a6b3a', props: 'city', ambience: { freq: 700, q: 0.6, vol: 0.35, tone: 1 }, weatherPool: ['sunny', 'sunny', 'rain', 'night', 'storm'] },
  { id: 'rainforest', name: '热带雨林球场', theme: 'rainforest', icon: '🌴', desc: '被茂密方块丛林包围的球场，湿润的空气与鸟鸣。',
    skyTop: '#2f8f6f', skyBottom: '#c9f2d5', fog: '#a8d8b0', fogDensity: 0.008, grassA: '#2f9e3e', grassB: '#278a34', lineColor: '#ecfccb', ground: '#4b3a22',
    standColor: '#6b4f2a', standAccent: '#3f7d20', crowd: ['#16a34a', '#facc15', '#f97316', '#e11d48', '#fef3c7'], ambient: 0.5, sun: 1.0, sunColor: '#fff3c4',
    hemiSky: '#bdf0c8', hemiGround: '#2c4a1e', props: 'jungle', ambience: { freq: 1800, q: 1.2, vol: 0.3, tone: 1.4 }, weatherPool: ['sunny', 'rain', 'rain', 'storm'] },
  { id: 'desert', name: '沙漠球场', theme: 'desert', icon: '🏜️', desc: '黄沙与仙人掌之间的绿洲球场，烈日当空。',
    skyTop: '#e7a64a', skyBottom: '#ffe6b3', fog: '#f3d39a', fogDensity: 0.006, grassA: '#7fb03a', grassB: '#709d33', lineColor: '#fff7e0', ground: '#d9b26a',
    standColor: '#c89b5a', standAccent: '#a0522d', crowd: ['#f5deb3', '#c1272d', '#006233', '#ffffff', '#d97706'], ambient: 0.6, sun: 1.35, sunColor: '#ffe2a8',
    hemiSky: '#ffe7b8', hemiGround: '#a07a3a', props: 'desert', ambience: { freq: 500, q: 0.4, vol: 0.3, tone: 0.8 }, weatherPool: ['sunny', 'sunny', 'sandstorm', 'night'] },
  { id: 'ice', name: '冰雪球场', theme: 'ice', icon: '🏔️', desc: '雪山脚下的冰面球场，寒风凛冽，地面湿滑。',
    skyTop: '#7fa8d6', skyBottom: '#eef6ff', fog: '#e6f0fb', fogDensity: 0.009, grassA: '#6fae8a', grassB: '#66a080', lineColor: '#ffffff', ground: '#e8f1fa',
    standColor: '#c7d6e6', standAccent: '#4a78a8', crowd: ['#1e3a8a', '#ffffff', '#93c5fd', '#ef4444', '#334155'], ambient: 0.65, sun: 0.9, sunColor: '#e8f2ff',
    hemiSky: '#e6f2ff', hemiGround: '#9fb5c8', props: 'snow', ambience: { freq: 400, q: 0.8, vol: 0.28, tone: 0.7 }, weatherPool: ['snow', 'snow', 'sunny', 'night'] },
  { id: 'volcano', name: '火山球场', theme: 'volcano', icon: '🌋', desc: '岩浆河环绕的黑曜石球场，火山在远处喷发。',
    skyTop: '#3a1414', skyBottom: '#d9653b', fog: '#5b2a1d', fogDensity: 0.01, grassA: '#4f7a2e', grassB: '#456b28', lineColor: '#ffd6a8', ground: '#2a1d1a',
    standColor: '#3b302c', standAccent: '#b91c1c', crowd: ['#f97316', '#111111', '#dc2626', '#fbbf24', '#78350f'], ambient: 0.45, sun: 0.9, sunColor: '#ffb27a',
    hemiSky: '#ff9b6a', hemiGround: '#3a1a10', props: 'volcano', ambience: { freq: 180, q: 0.5, vol: 0.38, tone: 0.5 }, weatherPool: ['sunny', 'storm', 'night'] },
  { id: 'future', name: '未来科技球场', theme: 'future', icon: '🌃', desc: '霓虹灯与全息屏组成的赛博都市球场。',
    skyTop: '#0b0b2a', skyBottom: '#3a1d6e', fog: '#1a1240', fogDensity: 0.007, grassA: '#2a8f6a', grassB: '#247d5c', lineColor: '#67e8f9', ground: '#15152b',
    standColor: '#2a2a44', standAccent: '#22d3ee', crowd: ['#22d3ee', '#e879f9', '#a3e635', '#f472b6', '#ffffff'], ambient: 0.5, sun: 0.7, sunColor: '#c4b5fd',
    hemiSky: '#7c3aed', hemiGround: '#0f172a', props: 'neon', ambience: { freq: 900, q: 2.0, vol: 0.3, tone: 1.8 }, weatherPool: ['night', 'night', 'rain', 'sunny'] },
  { id: 'sky', name: '天空浮岛球场', theme: 'sky', icon: '☁️', desc: '漂浮在云海之上的岛屿球场，四周悬浮着小岛。',
    skyTop: '#5aa8ff', skyBottom: '#ffffff', fog: '#e9f4ff', fogDensity: 0.005, grassA: '#4cbf5a', grassB: '#43ad50', lineColor: '#ffffff', ground: '#8b6b45',
    standColor: '#e5e7eb', standAccent: '#60a5fa', crowd: ['#fef3c7', '#93c5fd', '#fca5a5', '#a7f3d0', '#ffffff'], ambient: 0.7, sun: 1.2, sunColor: '#ffffff',
    hemiSky: '#ffffff', hemiGround: '#7fbf7f', props: 'sky', ambience: { freq: 1200, q: 0.7, vol: 0.25, tone: 1.2 }, weatherPool: ['sunny', 'sunny', 'rain', 'storm'] },
  { id: 'champion', name: '终极冠军球场', theme: 'champion', icon: '🏆', desc: '金色建筑与冠军装饰环绕的决赛圣殿，巨型奖杯矗立场边。',
    skyTop: '#1a1033', skyBottom: '#e3a54a', fog: '#6b4a2a', fogDensity: 0.004, grassA: '#3aa04a', grassB: '#339042', lineColor: '#ffe9a8', ground: '#3a2a12',
    standColor: '#c9a227', standAccent: '#7c2d12', crowd: ['#fbbf24', '#ffffff', '#dc2626', '#1d4ed8', '#16a34a'], ambient: 0.6, sun: 1.1, sunColor: '#ffd58a',
    hemiSky: '#ffd58a', hemiGround: '#5a3a1a', props: 'champion', ambience: { freq: 650, q: 0.5, vol: 0.45, tone: 1.1 }, weatherPool: ['night', 'sunny'] },
];
export const STADIUM_MAP: Record<string, StadiumDef> = Object.fromEntries(STADIUMS.map((s) => [s.id, s]));

export const WEATHERS: WeatherDef[] = [
  { id: 'sunny', name: '晴天', icon: '☀️', desc: '阳光明媚，标准比赛条件。', friction: 1, playerSpeed: 1, wind: 0, light: 1 },
  { id: 'rain', name: '雨天', icon: '🌧️', desc: '草皮湿滑，足球滚动更远，球员加速略慢。', friction: 0.8, playerSpeed: 0.97, wind: 0.2, light: 0.75 },
  { id: 'storm', name: '雷暴', icon: '⛈️', desc: '暴雨与雷鸣，球场随机闪电，视野变暗。', friction: 0.78, playerSpeed: 0.96, wind: 0.6, light: 0.5 },
  { id: 'snow', name: '雪天', icon: '🌨️', desc: '积雪阻滞足球滚动，球员速度降低。', friction: 1.3, playerSpeed: 0.94, wind: 0.3, light: 0.85 },
  { id: 'sandstorm', name: '沙尘暴', icon: '🌪️', desc: '黄沙漫天，视野降低，强风改变足球轨迹。', friction: 1.1, playerSpeed: 0.96, wind: 1.2, light: 0.7 },
  { id: 'night', name: '夜晚', icon: '🌙', desc: '夜间比赛，灯光塔照亮球场。', friction: 1, playerSpeed: 1, wind: 0, light: 0.35 },
];
export const WEATHER_MAP = Object.fromEntries(WEATHERS.map((w) => [w.id, w])) as Record<WeatherKind, WeatherDef>;
