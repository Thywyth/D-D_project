/**
 * Dice Store — Roll history, server results, animation state
 */

import { create } from 'zustand';
import { api } from '../services/api';
import { socketService } from '../services/socket';
import { db } from '../db/dexie';
import type { DieType } from '../../../shared/types/index';

export interface DiceRollEntry {
  id: string;
  dieType: DieType;
  result: number;
  signature: string;
  timestamp: string;
  rolledBy: string;
  rolledByUserId: string;
  isLocal: boolean;
}

interface DiceState {
  history: DiceRollEntry[];
  lastRoll: DiceRollEntry | null;
  isRolling: boolean;
}

interface DiceActions {
  roll: (roomId: string, dieType: DieType) => Promise<void>;
  addResult: (entry: DiceRollEntry) => void;
  clearHistory: () => void;
}

const MAX_HISTORY = 50;

export const useDiceStore = create<DiceState & DiceActions>()((set, get) => ({
  // State
  history: [],
  lastRoll: null,
  isRolling: false,

  // Actions
  roll: async (roomId, dieType) => {
    set({ isRolling: true });

    const socket = socketService.instance;
    if (socket?.connected) {
      // Real-time path — result comes back via socket event
      socket.emit('dice:roll', { roomId, dieType });
      // isRolling will be cleared when the result arrives
    } else {
      // REST fallback
      try {
        const result = await api.post<DiceRollEntry>('/dice/roll', {
          roomId,
          dieType,
        });
        get().addResult({ ...result, isLocal: true });
      } catch (err) {
        console.error('[Dice] Roll failed:', err);
        set({ isRolling: false });
      }
    }
  },

  addResult: (entry) => {
    set((state) => {
      const newHistory = [entry, ...state.history].slice(0, MAX_HISTORY);
      return {
        history: newHistory,
        lastRoll: entry,
        isRolling: false,
      };
    });

    // Cache to IndexedDB
    void db.diceHistory.put({
      id: entry.id,
      userId: entry.rolledByUserId,
      username: entry.rolledBy,
      roomId: '',
      dieType: entry.dieType,
      result: entry.result,
      timestamp: entry.timestamp,
    });
  },

  clearHistory: () => set({ history: [], lastRoll: null }),
}));
