/**
 * Audio Store — Ambient music and SFX playback state
 *
 * DM controls audio; all clients receive play/stop/volume events.
 * The store manages the UI state; actual audio playback is handled
 * by the AudioPlayer component using the Web Audio API.
 */

import { create } from 'zustand';

export interface AudioPreset {
  key: string;
  name: string;
  url: string;
}

// Ukrainian ambient presets — 22 custom tracks in frontend/public/audio/ambient/
export const AUDIO_PRESETS: AudioPreset[] = [
  { key: 'battle_dragon', name: 'Битва (Дракон)', url: '/audio/ambient/Битва_дракон.mp3' },
  { key: 'battle_mass', name: 'Масова битва', url: '/audio/ambient/Битва_масова.mp3' },
  { key: 'battle_undead', name: 'Битва (Нечисть)', url: '/audio/ambient/Битва_нечисть.mp3' },
  { key: 'battle_blizzard', name: 'Битва (Хуртовина)', url: '/audio/ambient/Битва_хуртовина.mp3' },
  { key: 'battle_storm', name: 'Битва (Шторм)', url: '/audio/ambient/Битва_шторм.mp3' },
  { key: 'haunted_tower', name: 'Вежа з привидами', url: '/audio/ambient/Вежа_з_привидами.mp3' },
  { key: 'windy', name: 'Вітряно', url: '/audio/ambient/Вітряно.mp3' },
  { key: 'burning_building', name: 'Горяща будівля', url: '/audio/ambient/Горяща_будівля.mp3' },
  { key: 'rainy_village', name: 'Дощове селище', url: '/audio/ambient/Дощове_селище.mp3' },
  { key: 'rulers_office', name: 'Кабінет правителя', url: '/audio/ambient/Кабінет_правителя.mp3' },
  { key: 'caravan', name: 'Караван', url: '/audio/ambient/Караван.mp3' },
  { key: 'tavern1', name: 'Корчма 1', url: '/audio/ambient/Корчма1.mp3' },
  { key: 'tavern2', name: 'Корчма 2', url: '/audio/ambient/Корчма2.mp3' },
  { key: 'heavens', name: 'Небеса', url: '/audio/ambient/Небеса.mp3' },
  { key: 'night', name: 'Ніч', url: '/audio/ambient/Ніч.mp3' },
  { key: 'night_campfire1', name: 'Нічний костер 1', url: '/audio/ambient/Нічний_костер1.mp3' },
  { key: 'night_campfire2', name: 'Нічний костер 2', url: '/audio/ambient/Нічний_костер2.mp3' },
  { key: 'night_leaves', name: 'Нічний ліс', url: '/audio/ambient/Нічний_лист.mp3' },
  { key: 'hellish_creatures', name: 'Пекельні тварі', url: '/audio/ambient/Пекельні_тварі.mp3' },
  { key: 'pharaohs_chambers', name: 'Покої фараона', url: '/audio/ambient/Покої_фараона.mp3' },
  { key: 'dark_caves', name: 'Темні печери', url: '/audio/ambient/Темні_печери.mp3' },
  { key: 'festival', name: 'Фестиваль', url: '/audio/ambient/Фестиваль.mp3' },
];

interface AudioState {
  currentPreset: string | null;
  volume: number;
  isPlaying: boolean;
  lastSfx: string | null;
}

interface AudioActions {
  setPlaying: (preset: string, volume: number) => void;
  setStopped: () => void;
  setVolume: (volume: number) => void;
  triggerSfx: (preset: string) => void;
}

export const useAudioStore = create<AudioState & AudioActions>()((set) => ({
  // State
  currentPreset: null,
  volume: 0.5,
  isPlaying: false,
  lastSfx: null,

  // Actions (called by socket event listeners)
  setPlaying: (preset, volume) =>
    set({ currentPreset: preset, volume, isPlaying: true }),

  setStopped: () =>
    set({ currentPreset: null, isPlaying: false }),

  setVolume: (volume) => set({ volume }),

  triggerSfx: (preset) => set({ lastSfx: preset }),
}));
