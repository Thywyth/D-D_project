/**
 * useRBAC — Client-side RBAC field validation hook
 *
 * Uses the shared RBAC matrix to determine field editability.
 * Returns helpers for checking permissions in the character sheet UI.
 */

import { useMemo, useCallback } from 'react';
import {
  checkRBAC,
  FIELD_CATEGORY_MAP,
  type RBACCategory,
} from '../../../shared/types/rbac';
import type { UserRole, ICharacter } from '../../../shared/types/index';

interface UseRBACInput {
  role: UserRole | null;
  isOwner: boolean;
}

interface UseRBACResult {
  /** Check if a specific field can be edited */
  canEdit: (field: keyof ICharacter) => boolean;

  /** Get the RBAC category for a field */
  getCategory: (field: string) => RBACCategory | 'meta' | undefined;

  /** Filter a set of fields into editable/readonly groups */
  partitionFields: (fields: Array<keyof ICharacter>) => {
    editable: Array<keyof ICharacter>;
    readonly: Array<keyof ICharacter>;
  };

  /** Get CSS class for field styling based on editability */
  fieldClass: (field: keyof ICharacter) => string;
}

export function useRBAC({ role, isOwner }: UseRBACInput): UseRBACResult {
  const canEdit = useCallback(
    (field: keyof ICharacter): boolean => {
      if (!role) return false;
      const result = checkRBAC({ field, role, isOwner });
      return result.canEdit;
    },
    [role, isOwner],
  );

  const getCategory = useCallback(
    (field: string): RBACCategory | 'meta' | undefined => {
      return FIELD_CATEGORY_MAP[field] as RBACCategory | 'meta' | undefined;
    },
    [],
  );

  const partitionFields = useCallback(
    (fields: Array<keyof ICharacter>) => {
      const editable: Array<keyof ICharacter> = [];
      const readonly: Array<keyof ICharacter> = [];

      for (const field of fields) {
        if (canEdit(field)) {
          editable.push(field);
        } else {
          readonly.push(field);
        }
      }

      return { editable, readonly };
    },
    [canEdit],
  );

  const fieldClass = useCallback(
    (field: keyof ICharacter): string => {
      if (!role) return 'field-locked';
      const category = FIELD_CATEGORY_MAP[field as string];
      const editable = canEdit(field);

      if (!editable) return 'field-locked';
      if (category === 'dm_only') return 'field-dm';
      if (category === 'player_only') return 'field-player';
      if (category === 'shared') return 'field-shared';
      return 'field-locked';
    },
    [role, canEdit],
  );

  return useMemo(
    () => ({ canEdit, getCategory, partitionFields, fieldClass }),
    [canEdit, getCategory, partitionFields, fieldClass],
  );
}
