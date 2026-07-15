/**
 * Character Socket Handlers — Real-time updates, sync requests
 */

import type { TypedServer, TypedSocket } from './index.js';
import { Character } from '../models/Character.js';
import { getUserRoleInRoom, filterUpdateByRBAC } from '../middleware/rbac.js';

export function registerCharacterHandlers(
  io: TypedServer,
  socket: TypedSocket,
): void {
  const userId = socket.data['userId'] as string;

  // ── character:update ──
  socket.on('character:update', async (data) => {
    const character = await Character.findById(data.characterId);
    if (!character) return;

    const roleInfo = await getUserRoleInRoom(
      userId,
      character.roomId.toString(),
    );
    if (!roleInfo) return;

    const isOwner = character.userId.toString() === userId;
    const { allowed } = filterUpdateByRBAC(
      data.updates as Record<string, unknown>,
      roleInfo.role,
      isOwner,
    );

    if (Object.keys(allowed).length === 0) return;

    // Apply allowed updates
    for (const [field, value] of Object.entries(allowed)) {
      (character as unknown as Record<string, unknown>)[field] = value;
    }

    character.markModified('attributes');
    character.markModified('savingThrows');
    character.markModified('skills');
    await character.save();

    // Broadcast to room (including sender for confirmation)
    io.to(character.roomId.toString()).emit('character:updated', {
      characterId: data.characterId,
      updates: allowed,
      updatedBy: userId,
    });
  });

  // ── character:request-sync ──
  socket.on('character:request-sync', async (data) => {
    const character = await Character.findById(data.characterId);
    if (!character) return;

    const roleInfo = await getUserRoleInRoom(
      userId,
      character.roomId.toString(),
    );
    if (!roleInfo) return;

    socket.emit('character:synced', {
      character: character.toJSON() as unknown as import('../../../shared/types/character.js').ICharacter,
    });
  });
}
