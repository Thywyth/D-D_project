/** Role-Based Access Control (RBAC) matrix types and definitions */

import type { UserRole } from './index.js';
import type { ICharacter } from './character.js';

// ─── Field Categories ─────────────────────────────────────────────

export type RBACCategory =
  | 'immutable'    // Created once, editable by NONE
  | 'dm_only'      // DM can write, Player is read-only
  | 'player_only'  // Player can write, DM is read-only
  | 'shared';      // Both can modify (with transaction rules for inventory)

/**
 * Canonical RBAC field classification for D&D character sheets.
 * This is the single source of truth used by both client UI and server controllers.
 */
export const RBAC_MATRIX: Record<RBACCategory, ReadonlyArray<keyof ICharacter>> = {
  immutable: [
    'name',
    'race',
    'class',
    'level',
    'background',
    'alignment',
    'xp',
    'armorClass',
    'initiative',
    'speed',
    'personalityTraits',
    'ideals',
    'bonds',
    'flaws',
  ],

  dm_only: [
    'attributes',
    'proficiencyBonus',
    'inspiration',
    'passiveWisdom',
    'hitDice',
    'deathSaves',
  ],

  player_only: [
    'savingThrows',
    'skills',
    'currentHP',
    'maxHP',
    'tempHP',
    'featuresTraits',
    'languages',
    'toolProficiencies',
  ],

  shared: [
    'inventory',
    'coins',
  ],
} as const;

/** Meta fields excluded from RBAC (system-managed) */
export const RBAC_META_FIELDS: ReadonlyArray<keyof ICharacter> = [
  '_id',
  'roomId',
  'userId',
  'age',
  'status',
  'createdAt',
  'updatedAt',
] as const;

// ─── RBAC Helper Types ────────────────────────────────────────────

/** Check if a field can be edited by the given role */
export interface RBACCheck {
  field: keyof ICharacter;
  role: UserRole;
  isOwner: boolean; // Whether the user owns this character
}

export interface RBACResult {
  canEdit: boolean;
  category: RBACCategory | 'meta';
  reason?: string;
}

// ─── Field lookup map (computed at import time) ───────────────────

type FieldCategoryMap = Record<string, RBACCategory | 'meta'>;

function buildFieldCategoryMap(): FieldCategoryMap {
  const map: FieldCategoryMap = {};

  for (const [category, fields] of Object.entries(RBAC_MATRIX)) {
    for (const field of fields) {
      map[field] = category as RBACCategory;
    }
  }

  for (const field of RBAC_META_FIELDS) {
    map[field] = 'meta';
  }

  return map;
}

export const FIELD_CATEGORY_MAP: FieldCategoryMap = buildFieldCategoryMap();

/**
 * Check whether a given role can edit a specific character field.
 *
 * Rules:
 * - 'immutable' fields: NEVER editable after creation
 * - 'dm_only' fields: only editable by DM
 * - 'player_only' fields: only editable by the character's owner (player)
 * - 'shared' fields: editable by both DM and the character's owner
 * - 'meta' fields: NEVER editable (system-managed)
 */
export function checkRBAC(check: RBACCheck): RBACResult {
  const category = FIELD_CATEGORY_MAP[check.field];

  if (!category) {
    return { canEdit: false, category: 'meta', reason: 'Невідоме поле' };
  }

  if (category === 'meta') {
    return { canEdit: false, category: 'meta', reason: 'Системне поле' };
  }

  if (category === 'immutable') {
    return { canEdit: false, category, reason: 'Незмінне поле' };
  }

  if (category === 'dm_only') {
    const canEdit = check.role === 'dm';
    return {
      canEdit,
      category,
      reason: canEdit ? undefined : 'Тільки для ДМ',
    };
  }

  if (category === 'player_only') {
    const canEdit = check.role === 'player' && check.isOwner;
    return {
      canEdit,
      category,
      reason: canEdit ? undefined : 'Тільки для гравця-власника',
    };
  }

  if (category === 'shared') {
    const canEdit = check.role === 'dm' || check.isOwner;
    return {
      canEdit,
      category,
      reason: canEdit ? undefined : 'Немає доступу',
    };
  }

  return { canEdit: false, category: 'meta', reason: 'Невідома категорія' };
}
