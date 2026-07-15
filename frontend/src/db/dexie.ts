/**
 * Dexie.js IndexedDB Schema — Client-Side Offline Database
 *
 * Mirrors the server-side MongoDB schemas for offline-first operation.
 * The syncQueue table stores pending mutations for background sync
 * when the device comes back online.
 */

import Dexie, { type EntityTable } from 'dexie';

// ─── Offline Record Interfaces ────────────────────────────────────
// These mirror the shared ICharacter/IRoom/etc types but use string IDs
// and include a `_syncStatus` field for tracking offline state.

export type SyncStatus = 'synced' | 'pending' | 'conflict';

export interface OfflineCharacter {
  /** Server _id or local UUID if created offline */
  id: string;
  roomId: string;
  userId: string;

  // Immutable
  name: string;
  race: string;
  class: string;
  level: number;
  background: string;
  alignment: string;
  xp: number;
  armorClass: number;
  initiative: number;
  speed: number;
  personalityTraits: string;
  ideals: string;
  bonds: string;
  flaws: string;

  // DM Mutable
  attributes: Record<string, { score: number; modifier: number }>;
  proficiencyBonus: number;
  inspiration: boolean;
  passiveWisdom: number;
  hitDice: { total: number; current: number; dieType: string };
  deathSaves: { successes: number; failures: number };

  // Player Mutable
  savingThrows: Record<string, { proficient: boolean; bonus: number }>;
  skills: Record<string, { proficient: boolean; bonus: number }>;
  currentHP: number;
  maxHP: number;
  tempHP: number;
  featuresTraits: string[];
  languages: string[];
  toolProficiencies: string[];

  // Shared Mutable
  inventory: Array<{
    id: string;
    name: string;
    quantity: number;
    weight: number;
    description: string;
  }>;
  coins: { cp: number; sp: number; ep: number; gp: number; pp: number };

  // Meta
  age: number | null;
  status: 'alive' | 'dead' | 'archived';
  updatedAt: string;
  _syncStatus: SyncStatus;
}

export interface OfflineRoom {
  id: string;
  name: string;
  roomCode: string;
  dmUserId: string;
  playerSlots: Array<{
    userId: string | null;
    characterId: string | null;
    playerCode: string;
    status: string;
    joinedAt: string | null;
  }>;
  gameTime: { day: number; month: number; year: number };
  mapImageUrl: string | null;
  audioPresets: Array<{
    id: string;
    name: string;
    url: string;
    type: 'ambient' | 'sfx';
  }>;
  updatedAt: string;
  _syncStatus: SyncStatus;
}

export interface OfflineMapMarker {
  id: string;
  roomId: string;
  xPercent: number;
  yPercent: number;
  name: string;
  description: string;
  color: string;
  createdBy: string;
  updatedAt: string;
  _syncStatus: SyncStatus;
}

export interface OfflineFamilyTree {
  id: string;
  roomId: string;
  treeName: string;
  nodes: Array<{
    id: string;
    name: string;
    age: number | null;
    type: 'npc' | 'pc';
    parentIds: string[];
    hidden: boolean;
    description: string;
    posX: number;
    posY: number;
  }>;
  nodeNotes: Array<{
    nodeId: string;
    userId: string;
    content: string;
    updatedAt: string;
  }>;
  updatedAt: string;
  _syncStatus: SyncStatus;
}

export interface OfflineNotebook {
  id: string;
  userId: string;
  roomId: string;
  type: 'dm' | 'player';
  title: string;
  content: Record<string, unknown>;
  updatedAt: string;
  _syncStatus: SyncStatus;
}

export interface OfflineDiceRoll {
  id: string;
  userId: string;
  username: string;
  roomId: string;
  dieType: string;
  result: number;
  timestamp: string;
}

// ─── Sync Queue ───────────────────────────────────────────────────

export type SyncAction = 'create' | 'update' | 'delete';

export interface SyncQueueEntry {
  /** Auto-incremented ID */
  id?: number;
  /** HTTP method */
  action: SyncAction;
  /** API endpoint (e.g. /api/characters/abc123) */
  endpoint: string;
  /** Request payload */
  payload: Record<string, unknown>;
  /** ISO timestamp when the mutation was queued */
  timestamp: string;
  /** Number of retry attempts */
  retryCount: number;
  /** Last error message if retry failed */
  lastError: string | null;
}

// ─── Dexie Database Class ─────────────────────────────────────────

export class DnDVTTDatabase extends Dexie {
  characters!: EntityTable<OfflineCharacter, 'id'>;
  rooms!: EntityTable<OfflineRoom, 'id'>;
  mapMarkers!: EntityTable<OfflineMapMarker, 'id'>;
  familyTrees!: EntityTable<OfflineFamilyTree, 'id'>;
  notebooks!: EntityTable<OfflineNotebook, 'id'>;
  diceHistory!: EntityTable<OfflineDiceRoll, 'id'>;
  syncQueue!: EntityTable<SyncQueueEntry, 'id'>;

  constructor() {
    super('dnd-vtt-offline');

    this.version(1).stores({
      // Primary key + indexed fields (Dexie syntax)
      characters: 'id, roomId, userId, status, updatedAt, _syncStatus',
      rooms: 'id, roomCode, dmUserId, updatedAt, _syncStatus',
      mapMarkers: 'id, roomId, updatedAt, _syncStatus',
      familyTrees: 'id, roomId, updatedAt, _syncStatus',
      notebooks: 'id, [userId+roomId+type], updatedAt, _syncStatus',
      diceHistory: 'id, roomId, timestamp',
      syncQueue: '++id, action, endpoint, timestamp',
    });
  }
}

// ─── Singleton Instance ───────────────────────────────────────────

export const db = new DnDVTTDatabase();

// ─── Helper Functions ─────────────────────────────────────────────

/**
 * Queue a mutation for background sync when offline.
 * Called by Zustand store interceptors when navigator.onLine is false.
 */
export async function enqueueSyncAction(
  action: SyncAction,
  endpoint: string,
  payload: Record<string, unknown>,
): Promise<void> {
  await db.syncQueue.add({
    action,
    endpoint,
    payload,
    timestamp: new Date().toISOString(),
    retryCount: 0,
    lastError: null,
  });
}

/**
 * Get all pending sync queue entries in FIFO order.
 */
export async function getPendingSyncEntries(): Promise<SyncQueueEntry[]> {
  return db.syncQueue.orderBy('timestamp').toArray();
}

/**
 * Remove a sync queue entry after successful processing.
 */
export async function removeSyncEntry(id: number): Promise<void> {
  await db.syncQueue.delete(id);
}

/**
 * Mark a sync entry as failed with error message and increment retry count.
 */
export async function markSyncEntryFailed(
  id: number,
  error: string,
): Promise<void> {
  await db.syncQueue.update(id, {
    retryCount: (await db.syncQueue.get(id))?.retryCount ?? 0 + 1,
    lastError: error,
  });
}

/**
 * Clear all data for a specific room (used on room leave).
 */
export async function clearRoomData(roomId: string): Promise<void> {
  await db.transaction(
    'rw',
    [db.characters, db.mapMarkers, db.familyTrees, db.notebooks, db.diceHistory],
    async () => {
      await db.characters.where('roomId').equals(roomId).delete();
      await db.mapMarkers.where('roomId').equals(roomId).delete();
      await db.familyTrees.where('roomId').equals(roomId).delete();
      await db.notebooks.where('roomId').equals(roomId).delete();
      await db.diceHistory.where('roomId').equals(roomId).delete();
    },
  );
}

/**
 * Upsert a record into any offline table.
 * Used by the sync engine to merge server data into IndexedDB.
 */
export async function upsertRecord<T extends { id: string }>(
  table: EntityTable<T, 'id'>,
  record: T,
): Promise<void> {
  await table.put(record);
}
