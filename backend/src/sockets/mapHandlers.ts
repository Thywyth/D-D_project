/**
 * Map Socket Handlers — Real-time marker CRUD, map image updates
 */

import type { TypedServer, TypedSocket } from './index.js';
import { MapMarker } from '../models/MapMarker.js';
import { Room } from '../models/Room.js';
import { getUserRoleInRoom } from '../middleware/rbac.js';

export function registerMapHandlers(
  io: TypedServer,
  socket: TypedSocket,
): void {
  const userId = socket.data['userId'] as string;

  // ── map:set-image (DM only) ──
  socket.on('map:set-image', async (data) => {
    const roleInfo = await getUserRoleInRoom(userId, data.roomId);
    if (!roleInfo || roleInfo.role !== 'dm') return;

    await Room.findByIdAndUpdate(data.roomId, {
      mapImageUrl: data.imageUrl,
    });

    io.to(data.roomId).emit('map:image-set', {
      roomId: data.roomId,
      imageUrl: data.imageUrl,
    });
  });

  // ── map:add-marker (DM only) ──
  socket.on('map:add-marker', async (data) => {
    const roleInfo = await getUserRoleInRoom(userId, data.roomId);
    if (!roleInfo || roleInfo.role !== 'dm') return;

    const marker = new MapMarker({
      roomId: data.roomId,
      xPercent: data.xPercent,
      yPercent: data.yPercent,
      name: data.name,
      description: data.description ?? '',
      color: data.color ?? '#f59e0b',
      createdBy: userId,
    });

    await marker.save();

    io.to(data.roomId).emit('map:marker-added', {
      marker: marker.toJSON() as unknown as import('../../../shared/types/map.js').IMapMarker,
    });
  });

  // ── map:update-marker (DM only) ──
  socket.on('map:update-marker', async (data) => {
    const marker = await MapMarker.findById(data.markerId);
    if (!marker) return;

    const roleInfo = await getUserRoleInRoom(userId, marker.roomId.toString());
    if (!roleInfo || roleInfo.role !== 'dm') return;

    const updates = data.updates;
    if (updates.xPercent !== undefined) marker.xPercent = updates.xPercent;
    if (updates.yPercent !== undefined) marker.yPercent = updates.yPercent;
    if (updates.name !== undefined) marker.name = updates.name;
    if (updates.description !== undefined) marker.description = updates.description;
    if (updates.color !== undefined) marker.color = updates.color;

    await marker.save();

    io.to(marker.roomId.toString()).emit('map:marker-updated', {
      marker: marker.toJSON() as unknown as import('../../../shared/types/map.js').IMapMarker,
    });
  });

  // ── map:remove-marker (DM only) ──
  socket.on('map:remove-marker', async (data) => {
    const roleInfo = await getUserRoleInRoom(userId, data.roomId);
    if (!roleInfo || roleInfo.role !== 'dm') return;

    await MapMarker.findByIdAndDelete(data.markerId);

    io.to(data.roomId).emit('map:marker-removed', {
      markerId: data.markerId,
      roomId: data.roomId,
    });
  });
}
