/**
 * useSync — FIFO sync queue processor
 *
 * When the device comes back online, this hook:
 * 1. Reads all pending entries from the Dexie syncQueue (FIFO order).
 * 2. Replays each mutation against the server API.
 * 3. Removes successfully synced entries.
 * 4. Updates the syncStore with status.
 */

import { useEffect, useRef, useCallback } from 'react';
import {
  getPendingSyncEntries,
  removeSyncEntry,
} from '../db/dexie';
import { api } from '../services/api';
import { useOnline } from './useOnline';
import { useSyncStore } from '../stores/syncStore';

export function useSync(): void {
  const isOnline = useOnline();
  const syncingRef = useRef(false);

  const setSyncing = useSyncStore((s) => s.setSyncing);
  const setLastSync = useSyncStore((s) => s.setLastSync);
  const setLastError = useSyncStore((s) => s.setLastError);
  const refreshPendingCount = useSyncStore((s) => s.refreshPendingCount);

  const processSyncQueue = useCallback(async () => {
    if (syncingRef.current) return;
    syncingRef.current = true;
    setSyncing(true);

    try {
      const entries = await getPendingSyncEntries();

      if (entries.length === 0) {
        setSyncing(false);
        syncingRef.current = false;
        return;
      }

      console.log(`[Sync] Processing ${entries.length} pending entries...`);

      for (const entry of entries) {
        try {
          switch (entry.action) {
            case 'update':
              await api.patch(entry.endpoint, entry.payload);
              break;
            case 'create':
              await api.post(entry.endpoint, entry.payload);
              break;
            case 'delete':
              await api.delete(entry.endpoint);
              break;
          }

          // Remove successfully synced entry
          if (entry.id !== undefined) {
            await removeSyncEntry(entry.id);
          }

          console.log(
            `[Sync] ✓ ${entry.action} ${entry.endpoint}`,
          );
        } catch (err) {
          console.error(
            `[Sync] ✗ Failed: ${entry.action} ${entry.endpoint}`,
            err,
          );
          // Don't remove — will retry next time
          setLastError(
            `Помилка синхронізації ${entry.endpoint}`,
          );
        }
      }

      setLastSync(new Date().toISOString());
      await refreshPendingCount();
    } catch (err) {
      console.error('[Sync] Queue processing failed:', err);
      setLastError('Помилка обробки черги синхронізації.');
    } finally {
      setSyncing(false);
      syncingRef.current = false;
    }
  }, [setSyncing, setLastSync, setLastError, refreshPendingCount]);

  // Trigger sync when coming back online
  useEffect(() => {
    if (isOnline) {
      void processSyncQueue();
    }
  }, [isOnline, processSyncQueue]);

  // Periodic pending count refresh (every 10 seconds)
  useEffect(() => {
    const interval = setInterval(() => {
      void refreshPendingCount();
    }, 10000);

    // Initial count
    void refreshPendingCount();

    return () => clearInterval(interval);
  }, [refreshPendingCount]);
}
