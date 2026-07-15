/**
 * Server-side RBAC Matrix re-export
 *
 * Single import point for backend code to access the shared RBAC definitions.
 */

export {
  RBAC_MATRIX,
  RBAC_META_FIELDS,
  FIELD_CATEGORY_MAP,
  checkRBAC,
  type RBACCategory,
  type RBACCheck,
  type RBACResult,
} from '../../../shared/types/rbac.js';
