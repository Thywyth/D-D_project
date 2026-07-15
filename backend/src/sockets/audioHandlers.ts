/**
 * Audio Socket Handlers — Ambient music and SFX control
 *
 * DM controls audio playback, all clients in the room receive
 * the play/stop/volume events to synchronize their local audio.
 */

import type { TypedServer, TypedSocket } from './index.js';
import { getUserRoleInRoom } from '../middleware/rbac.js';

export function registerAudioHandlers(
  io: TypedServer,
  socket: TypedSocket,
): void {
  const userId = socket.data['userId'] as string;

  // ── audio:play-ambient (DM only) ──
  socket.on('audio:play-ambient', async (data) => {
    const roleInfo = await getUserRoleInRoom(userId, data.roomId);
    if (!roleInfo || roleInfo.role !== 'dm') return;

    io.to(data.roomId).emit('audio:ambient-playing', {
      roomId: data.roomId,
      preset: data.preset,
      volume: data.volume,
    });
  });

  // ── audio:stop-ambient (DM only) ──
  socket.on('audio:stop-ambient', async (data) => {
    const roleInfo = await getUserRoleInRoom(userId, data.roomId);
    if (!roleInfo || roleInfo.role !== 'dm') return;

    io.to(data.roomId).emit('audio:ambient-stopped', {
      roomId: data.roomId,
    });
  });

  // ── audio:set-ambient-volume (DM only) ──
  socket.on('audio:set-ambient-volume', async (data) => {
    const roleInfo = await getUserRoleInRoom(userId, data.roomId);
    if (!roleInfo || roleInfo.role !== 'dm') return;

    io.to(data.roomId).emit('audio:ambient-volume-changed', {
      roomId: data.roomId,
      volume: data.volume,
    });
  });

  // ── audio:trigger-sfx (DM only) ──
  socket.on('audio:trigger-sfx', async (data) => {
    const roleInfo = await getUserRoleInRoom(userId, data.roomId);
    if (!roleInfo || roleInfo.role !== 'dm') return;

    io.to(data.roomId).emit('audio:sfx-triggered', {
      roomId: data.roomId,
      preset: data.preset,
      volume: data.volume,
    });
  });
}
