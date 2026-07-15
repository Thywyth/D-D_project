/**
 * Dice Socket Handlers — Real-time dice rolls via crypto RNG
 */

import { v4 as uuidv4 } from 'uuid';
import type { TypedServer, TypedSocket } from './index.js';
import { rollDie } from '../services/rng.js';
import { getUserRoleInRoom } from '../middleware/rbac.js';
import type { DieType } from '../../../shared/types/index.js';
import { DICE_RANGES } from '../../../shared/types/dice.js';

const VALID_DIE_TYPES = new Set(Object.keys(DICE_RANGES));

export function registerDiceHandlers(
  io: TypedServer,
  socket: TypedSocket,
): void {
  const userId = socket.data['userId'] as string;
  const username = socket.data['username'] as string;

  // ── dice:roll ──
  socket.on('dice:roll', async (data) => {
    if (!VALID_DIE_TYPES.has(data.dieType)) return;

    const roleInfo = await getUserRoleInRoom(userId, data.roomId);
    if (!roleInfo) return;

    const result = rollDie(data.dieType as DieType);

    // Broadcast to entire room
    io.to(data.roomId).emit('dice:result', {
      id: uuidv4(),
      ...result,
      rolledBy: username,
      rolledByUserId: userId,
    });
  });
}
