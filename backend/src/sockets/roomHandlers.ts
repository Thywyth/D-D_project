/**
 * Room Socket Handlers — Join/Leave rooms, time advance broadcasts
 */

import type { TypedServer, TypedSocket } from './index.js';
import { Room } from '../models/Room.js';
import { getUserRoleInRoom } from '../middleware/rbac.js';
import { advanceAges, advanceGameTime } from '../services/ageCalculator.js';

export function registerRoomHandlers(
  io: TypedServer,
  socket: TypedSocket,
): void {
  const userId = socket.data['userId'] as string;
  const username = socket.data['username'] as string;

  // ── room:join ──
  socket.on('room:join', async (data) => {
    const roleInfo = await getUserRoleInRoom(userId, data.roomId);
    if (!roleInfo) {
      socket.emit('room:error', { message: 'Ви не є учасником цієї кімнати.' });
      return;
    }

    await socket.join(data.roomId);
    console.log(`[Socket] ${username} joined room ${data.roomId}`);

    // Notify other members
    socket.to(data.roomId).emit('room:joined', {
      roomId: data.roomId,
      userId,
      username,
    });

    // Broadcast player count
    const room = await io.in(data.roomId).fetchSockets();
    io.to(data.roomId).emit('room:player-count', {
      roomId: data.roomId,
      count: room.length,
    });
  });

  // ── room:leave ──
  socket.on('room:leave', async (data) => {
    await socket.leave(data.roomId);
    console.log(`[Socket] ${username} left room ${data.roomId}`);

    socket.to(data.roomId).emit('room:left', {
      roomId: data.roomId,
      userId,
    });

    const room = await io.in(data.roomId).fetchSockets();
    io.to(data.roomId).emit('room:player-count', {
      roomId: data.roomId,
      count: room.length,
    });
  });

  // ── room:advance-time (DM only) ──
  socket.on('room:advance-time', async (data) => {
    const roleInfo = await getUserRoleInRoom(userId, data.roomId);
    if (!roleInfo || roleInfo.role !== 'dm') {
      socket.emit('room:error', { message: 'Тільки ДМ може просувати час.' });
      return;
    }

    const room = await Room.findById(data.roomId);
    if (!room) {
      socket.emit('room:error', { message: 'Кімнату не знайдено.' });
      return;
    }

    const oldTime = { ...room.gameTime };
    const newTime = advanceGameTime(oldTime, data.days ?? 0, data.months ?? 0);

    room.gameTime = newTime;
    await room.save();

    const ageResult = await advanceAges(data.roomId, oldTime, newTime);

    // Broadcast time change to all in room
    io.to(data.roomId).emit('room:time-advanced', {
      roomId: data.roomId,
      gameTime: newTime,
      agedCharacters: ageResult.agedCharacters,
      agedNodes: ageResult.agedNodes,
    });
  });
}
