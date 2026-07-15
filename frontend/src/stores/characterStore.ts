/**
 * Character Store - Offline-first character state management.
 * 
 * Intercepts mutations for Optimistic UI and background sync.
 */

import { create } from 'zustand';
import type { ICharacter, UpdateCharacterPayload } from '../../../shared/types/index';
import { db, enqueueSyncAction } from '../db/dexie';
import { api } from '../services/api';
import { useSyncStore } from './syncStore';

interface CharacterState {
  characters: Record<string, ICharacter>;
  activeCharacterId: string | null;
  isLoading: boolean;

  // Actions
  setActiveCharacter: (id: string) => void;
  upsertCharacter: (character: ICharacter) => void;
  fetchCharacters: (roomId: string) => Promise<void>;
  
  // Mutations (Offline-Aware)
  updateCharacter: (id: string, updates: UpdateCharacterPayload) => Promise<void>;
  changeHP: (id: string, amount: number) => Promise<void>;
  transferCoins: (sourceId: string, targetId: string, coinType: 'cp' | 'sp' | 'ep' | 'gp' | 'pp', amount: number) => Promise<void>;
}

export const useCharacterStore = create<CharacterState>((set, get) => ({
  characters: {},
  activeCharacterId: null,
  isLoading: false,

  setActiveCharacter: (id) => set({ activeCharacterId: id }),

  upsertCharacter: (char) => set((state) => ({
    characters: { ...state.characters, [char._id]: char }
  })),

  fetchCharacters: async (roomId) => {
    set({ isLoading: true });
    try {
      // Try online first
      if (navigator.onLine) {
        const chars = await api.get<ICharacter[]>(`/characters/room/${roomId}`);
        const charMap: Record<string, ICharacter> = {};
        for (const c of chars) {
          const id = c._id;
          charMap[id] = c;
          await db.characters.put({ ...c, id, _syncStatus: 'synced' } as any);
        }
        set({ characters: charMap, isLoading: false });
      } else {
        // Fallback to offline
        const offlineChars = await db.characters.where('roomId').equals(roomId).toArray();
        const charMap: Record<string, ICharacter> = {};
        offlineChars.forEach(c => { charMap[c.id] = c as any; });
        set({ characters: charMap, isLoading: false });
      }
    } catch (error) {
      console.error('Failed to fetch characters:', error);
      set({ isLoading: false });
    }
  },

  updateCharacter: async (id, updates) => {
    const { characters } = get();
    const original = characters[id];
    if (!original) return;

    // 1. Optimistic UI Update
    const updated = { ...original, ...updates };
    set({ characters: { ...characters, [id]: updated } });

    // 2. Local DB Update
    await db.characters.update(id, { ...updates, updatedAt: new Date().toISOString() } as any);

    // 3. Handle Sync
    if (navigator.onLine) {
      try {
        await api.patch(`/characters/${id}`, updates);
      } catch (error) {
        console.error('Failed to sync character update, queuing...', error);
        await enqueueSyncAction('update', `/characters/${id}`, updates as any);
        useSyncStore.getState().refreshPendingCount();
      }
    } else {
      await enqueueSyncAction('update', `/characters/${id}`, updates as any);
      useSyncStore.getState().refreshPendingCount();
    }
  },

  changeHP: async (id, amount) => {
    const { characters } = get();
    const char = characters[id];
    if (!char) return;

    const newHP = Math.max(0, Math.min(char.maxHP, char.currentHP + amount));
    await get().updateCharacter(id, { currentHP: newHP });
  },

  transferCoins: async (sourceId, targetId, coinType, amount) => {
    try {
      await api.post('/characters/transfer-coins', {
        sourceCharacterId: sourceId,
        targetCharacterId: targetId,
        coinType,
        amount,
      });
      
      // Після успішної передачі на бекенді, оновлюємо дані кімнати
      const { characters, fetchCharacters } = get();
      const roomId = characters[sourceId]?.roomId;
      if (roomId) {
        await fetchCharacters(roomId);
      }
    } catch (error) {
      console.error('Помилка передачі монет:', error);
    }
  },
}));
