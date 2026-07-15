/**
 * Sync Store — Manages the offline mutation queue state.
 *
 * Works in tandem with Dexie.js to track pending operations.
 */

import { create } from 'zustand';
import { getPendingSyncEntries } from '../db/dexie';

interface SyncState {
  isSyncing: boolean;
  pendingCount: number;
  lastSyncTime: string | null;
  lastError: string | null;

  // Actions
  refreshPendingCount: () => Promise<void>;
  setSyncing: (isSyncing: boolean) => void;
  setLastSync: (timestamp: string) => void;
  setLastError: (error: string | null) => void;
  completeSync: () => void;
}

export const useSyncStore = create<SyncState>((set) => ({
  isSyncing: false,
  pendingCount: 0,
  lastSyncTime: null,
  lastError: null,

  refreshPendingCount: async () => {
    const entries = await getPendingSyncEntries();
    set({ pendingCount: entries.length });
  },

  setSyncing: (isSyncing) => set({ isSyncing }),

  setLastSync: (timestamp) =>
    set({ lastSyncTime: timestamp, lastError: null }),

  setLastError: (error) => set({ lastError: error }),

  completeSync: () =>
    set({
      isSyncing: false,
      lastSyncTime: new Date().toISOString(),
    }),
}));
