/**
 * RBAC Guard Middleware
 *
 * Provides field-level access control for character sheet mutations.
 * Uses the shared RBAC matrix as the single source of truth.
 */

import type { Request, Response, NextFunction } from 'express';
import { Room } from '../models/Room.js';
import type { UserRole } from '../../../shared/types/index.js';
import {
  FIELD_CATEGORY_MAP,
  checkRBAC,
  type RBACCategory,
} from '../../../shared/types/rbac.js';
import type { ICharacter } from '../../../shared/types/character.js';

// ─── Determine User Role in Room ──────────────────────────────────

export async function getUserRoleInRoom(
  userId: string,
  roomId: string,
): Promise<{ role: UserRole; isOwner: boolean } | null> {
  const room = await Room.findById(roomId).lean();
  if (!room) return null;

  if (room.dmUserId.toString() === userId) {
    return { role: 'dm', isOwner: false };
  }

  const playerSlot = room.playerSlots.find(
    (slot) => slot.userId?.toString() === userId,
  );
  if (playerSlot && playerSlot.status === 'active') {
    return { role: 'player', isOwner: false };
  }

  return null;
}

// ─── Filter Update Payload by RBAC ────────────────────────────────

export interface RBACFilterResult {
  allowed: Record<string, unknown>;
  denied: Array<{ field: string; reason: string }>;
}

/**
 * Filters a character update payload, keeping only fields the user
 * is allowed to modify based on their role and ownership.
 */
export function filterUpdateByRBAC(
  updates: Record<string, unknown>,
  role: UserRole,
  isOwner: boolean,
): RBACFilterResult {
  const allowed: Record<string, unknown> = {};
  const denied: Array<{ field: string; reason: string }> = [];

  for (const [field, value] of Object.entries(updates)) {
    const result = checkRBAC({
      field: field as keyof ICharacter,
      role,
      isOwner,
    });

    if (result.canEdit) {
      allowed[field] = value;
    } else {
      denied.push({
        field,
        reason: result.reason ?? 'Немає доступу',
      });
    }
  }

  return { allowed, denied };
}

// ─── Express Middleware Factory ────────────────────────────────────

/**
 * Middleware that ensures the user has the correct role to access
 * the resource. Attaches `req.userRole` for downstream handlers.
 */
export function requireRole(...roles: UserRole[]) {
  return async (
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    if (!req.user) {
      res.status(401).json({ error: 'Не авторизовано.' });
      return;
    }

    const roomId =
      req.params['roomId'] ?? req.params['id'] ?? (req.body as Record<string, unknown>)?.['roomId'];

    if (!roomId) {
      res.status(400).json({ error: 'ID кімнати не вказано.' });
      return;
    }

    const userRole = await getUserRoleInRoom(
      req.user.userId,
      roomId as string,
    );

    if (!userRole) {
      res.status(403).json({ error: 'Ви не є учасником цієї кімнати.' });
      return;
    }

    if (!roles.includes(userRole.role)) {
      res.status(403).json({
        error: `Дія доступна лише для: ${roles.join(', ')}`,
      });
      return;
    }

    // Attach role info for controllers
    (req as Request & { userRole: UserRole }).userRole = userRole.role;
    next();
  };
}

/**
 * Middleware for DM-only actions (shorthand).
 */
export function requireDM() {
  return requireRole('dm');
}

/**
 * Get the RBAC category for a given field.
 */
export function getFieldCategory(
  field: string,
): RBACCategory | 'meta' | undefined {
  return FIELD_CATEGORY_MAP[field] as RBACCategory | 'meta' | undefined;
}
