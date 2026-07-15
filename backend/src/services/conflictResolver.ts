/**
 * Last-Write-Wins Conflict Resolver
 *
 * Compares updatedAt timestamps between local (offline) and server versions.
 * RBAC-override: DM-only fields from a player attempt are always rejected.
 */

import type { UserRole } from '../../../shared/types/index.js';
import { FIELD_CATEGORY_MAP } from '../../../shared/types/rbac.js';

export interface ConflictInput {
  field: string;
  localValue: unknown;
  serverValue: unknown;
  localTimestamp: string;
  serverTimestamp: string;
  role: UserRole;
  isOwner: boolean;
}

export interface ConflictResult {
  winner: 'local' | 'server';
  value: unknown;
  reason: string;
}

/**
 * Resolve a field-level conflict using Last-Write-Wins with RBAC override.
 *
 * Rules:
 * 1. If the field's RBAC category doesn't permit the role → server wins (RBAC override).
 * 2. Otherwise, the record with the later updatedAt wins.
 * 3. Ties go to the server (canonical source of truth).
 */
export function resolveConflict(input: ConflictInput): ConflictResult {
  const category = FIELD_CATEGORY_MAP[input.field];

  // RBAC override: if the role cannot edit this field, server always wins
  if (category === 'immutable' || category === 'meta') {
    return {
      winner: 'server',
      value: input.serverValue,
      reason: `Поле "${input.field}" є незмінним.`,
    };
  }

  if (category === 'dm_only' && input.role !== 'dm') {
    return {
      winner: 'server',
      value: input.serverValue,
      reason: `Поле "${input.field}" може змінювати лише ДМ.`,
    };
  }

  if (category === 'player_only' && (input.role !== 'player' || !input.isOwner)) {
    return {
      winner: 'server',
      value: input.serverValue,
      reason: `Поле "${input.field}" може змінювати лише гравець-власник.`,
    };
  }

  // LWW comparison
  const localTime = new Date(input.localTimestamp).getTime();
  const serverTime = new Date(input.serverTimestamp).getTime();

  if (localTime > serverTime) {
    return {
      winner: 'local',
      value: input.localValue,
      reason: 'Локальна версія новіша (LWW).',
    };
  }

  return {
    winner: 'server',
    value: input.serverValue,
    reason: localTime === serverTime
      ? 'Однаковий час — сервер має пріоритет.'
      : 'Серверна версія новіша (LWW).',
  };
}

/**
 * Resolve conflicts for a batch of fields.
 * Returns the merged update object containing winning values.
 */
export function resolveConflictBatch(
  localUpdates: Record<string, unknown>,
  serverRecord: Record<string, unknown>,
  localTimestamp: string,
  serverTimestamp: string,
  role: UserRole,
  isOwner: boolean,
): { merged: Record<string, unknown>; conflicts: ConflictResult[] } {
  const merged: Record<string, unknown> = {};
  const conflicts: ConflictResult[] = [];

  for (const [field, localValue] of Object.entries(localUpdates)) {
    const result = resolveConflict({
      field,
      localValue,
      serverValue: serverRecord[field],
      localTimestamp,
      serverTimestamp,
      role,
      isOwner,
    });

    conflicts.push(result);

    if (result.winner === 'local') {
      merged[field] = localValue;
    }
  }

  return { merged, conflicts };
}
