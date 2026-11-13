import { create } from 'zustand';

export interface HudSkill { id: string; icon: string; name: string; color: string; lv: number; key: string; cd: number; max: number; selected: boolean; kind: 'active' | 'shot' | 'def' }
export interface HudToast { id: number; text: string; color: string }
export interface HudBanner { id: number; text: string; sub: string; color: string; big: boolean }
export interface HudPenalty { score: [number, number]; kicks: [boolean[], boolean[]]; role: 'shoot' | 'save' | 'wait'; aimZ: number; aimY: number; charge: number; hint: string }

export interface HudState {
  score: [number, number]; homeCode: string; awayCode: string; homeColor: string; awayColor: string;
  time: number; periodLabel: string; stageLabel: string; phase: string;
  stamina: number; staminaMax: number; ult: number; ultName: string; ultIcon: string; ultColor: string;
  level: number; xp: number; xpNeed: number;
  skills: HudSkill[]; shotSkills: HudSkill[]; defSkills: HudSkill[]; nextShot: string | null; magnet: boolean;
  controlled: { name: string; number: number; role: string; injured: boolean; core: boolean } | null;
  events: { icon: string; name: string; desc: string }[];
  missions: { desc: string; progress: number; target: number; done: boolean }[];
  toasts: HudToast[]; banner: HudBanner | null; flash: { id: number; color: string } | null;
  boss: { name: string; icon: string; phase: string } | null;
  penalty: HudPenalty | null; hint: string | null; charge: number; fps: number;
  passiveText: string; tactic: string; weather: string; stadium: string; replay: boolean;
}

export const initialHud = (): HudState => ({
  score: [0, 0], homeCode: '', awayCode: '', homeColor: '#fff', awayColor: '#fff', time: 0, periodLabel: '', stageLabel: '', phase: 'intro',
  stamina: 100, staminaMax: 100, ult: 0, ultName: '', ultIcon: '', ultColor: '#fde047', level: 1, xp: 0, xpNeed: 100,
  skills: [], shotSkills: [], defSkills: [], nextShot: null, magnet: false, controlled: null, events: [], missions: [], toasts: [], banner: null, flash: null,
  boss: null, penalty: null, hint: null, charge: 0, fps: 60, passiveText: '', tactic: '', weather: '', stadium: '', replay: false,
});

export const useHud = create<HudState>(() => initialHud());
