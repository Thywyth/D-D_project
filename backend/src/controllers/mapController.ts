/**
 * Map Controller — Markers CRUD
 */
import crypto from 'crypto';
import type { Request, Response } from 'express';
import { MapMarker } from '../models/MapMarker.js';
import { Room } from '../models/Room.js';
import { getUserRoleInRoom } from '../middleware/rbac.js';

/** POST /api/rooms/:roomId/markers — Add a marker */
export async function addMarker(req: Request, res: Response): Promise<void> {
  if (!req.user) { res.status(401).json({ error: 'Не авторизовано.' }); return; }

  const roomId = req.params['roomId'] as string;
  const roleInfo = await getUserRoleInRoom(req.user.userId, roomId);

  if (!roleInfo || roleInfo.role !== 'dm') {
    res.status(403).json({ error: 'Тільки ДМ може додавати маркери.' });
    return;
  }

  const { xPercent, yPercent, name, description, color } = req.body as {
    xPercent: number;
    yPercent: number;
    name: string;
    description?: string;
    color?: string;
  };

  if (xPercent == null || yPercent == null || !name) {
    res.status(400).json({ error: "Координати та назва обов'язкові." });
    return;
  }

  const marker = new MapMarker({
    roomId,
    xPercent,
    yPercent,
    name: name.trim(),
    description: description?.trim() ?? '',
    color: color ?? '#f59e0b',
    createdBy: req.user.userId,
  });

  await marker.save();
  res.status(201).json(marker.toJSON());
}

/** GET /api/rooms/:roomId/markers — List markers */
export async function listMarkers(req: Request, res: Response): Promise<void> {
  if (!req.user) { res.status(401).json({ error: 'Не авторизовано.' }); return; }

  const roomId = req.params['roomId'] as string;
  const roleInfo = await getUserRoleInRoom(req.user.userId, roomId);
  if (!roleInfo) { res.status(403).json({ error: 'Немає доступу.' }); return; }

  const markers = await MapMarker.find({ roomId }).sort({ createdAt: -1 }).lean();
  res.json(markers);
}

/** PATCH /api/rooms/:roomId/markers/:markerId — Update marker */
export async function updateMarker(req: Request, res: Response): Promise<void> {
  if (!req.user) { res.status(401).json({ error: 'Не авторизовано.' }); return; }

  const roomId = req.params['roomId'] as string;
  const markerId = req.params['markerId'] as string;
  const roleInfo = await getUserRoleInRoom(req.user.userId, roomId);
  if (!roleInfo || roleInfo.role !== 'dm') {
    res.status(403).json({ error: 'Тільки ДМ може редагувати маркери.' });
    return;
  }

  const marker = await MapMarker.findOneAndUpdate(
    { _id: markerId, roomId },
    { $set: req.body as Record<string, unknown> },
    { new: true, runValidators: true },
  );

  if (!marker) { res.status(404).json({ error: 'Маркер не знайдено.' }); return; }
  res.json(marker.toJSON());
}

/** DELETE /api/rooms/:roomId/markers/:markerId — Remove marker */
export async function deleteMarker(req: Request, res: Response): Promise<void> {
  if (!req.user) { res.status(401).json({ error: 'Не авторизовано.' }); return; }

  const roomId = req.params['roomId'] as string;
  const markerId = req.params['markerId'] as string;
  const roleInfo = await getUserRoleInRoom(req.user.userId, roomId);
  if (!roleInfo || roleInfo.role !== 'dm') {
    res.status(403).json({ error: 'Тільки ДМ може видаляти маркери.' });
    return;
  }

  const marker = await MapMarker.findOneAndDelete({ _id: markerId, roomId });
  if (!marker) { res.status(404).json({ error: 'Маркер не знайдено.' }); return; }

  res.json({ message: 'Маркер видалено.' });
}

/** POST /api/rooms/:roomId/maps — Add a new map to the room (DM only) */
export async function addMap(req: Request, res: Response): Promise<void> {
  if (!req.user) { res.status(401).json({ error: 'Не авторизовано.' }); return; }

  const roomId = req.params['roomId'] as string;
  const roleInfo = await getUserRoleInRoom(req.user.userId, roomId);
  if (!roleInfo || roleInfo.role !== 'dm') {
    res.status(403).json({ error: 'Тільки ДМ може додавати карти.' });
    return;
  }

  const { name, imageUrl } = req.body as { name?: string; imageUrl?: string };
  if (!name || !imageUrl) {
    res.status(400).json({ error: 'Назва та URL карти обов\'язкові.' });
    return;
  }

  const room = await Room.findById(roomId);
  if (!room) { res.status(404).json({ error: 'Кімнату не знайдено.' }); return; }

  const newMap = {
    id: crypto.randomUUID(),
    name,
    imageUrl,
  };

  room.maps.push(newMap);
  // If it's the first map, make it active
  if (room.maps.length === 1) {
    room.activeMapId = newMap.id;
  }

  await room.save();
  res.status(201).json({ maps: room.maps, activeMapId: room.activeMapId });
}

/** DELETE /api/rooms/:roomId/maps/:mapId — Delete a map (DM only) */
export async function deleteMap(req: Request, res: Response): Promise<void> {
  if (!req.user) { res.status(401).json({ error: 'Не авторизовано.' }); return; }

  const { roomId, mapId } = req.params as { roomId: string; mapId: string };
  const roleInfo = await getUserRoleInRoom(req.user.userId, roomId);
  if (!roleInfo || roleInfo.role !== 'dm') {
    res.status(403).json({ error: 'Тільки ДМ може видаляти карти.' });
    return;
  }

  const room = await Room.findById(roomId);
  if (!room) { res.status(404).json({ error: 'Кімнату не знайдено.' }); return; }

  room.maps = room.maps.filter((m) => m.id !== mapId);
  if (room.activeMapId === mapId) {
    room.activeMapId = room.maps[0]?.id ?? null;
  }

  await room.save();
  res.json({ maps: room.maps, activeMapId: room.activeMapId });
}

/** PATCH /api/rooms/:roomId/maps/active — Set the active map (DM only) */
export async function setActiveMap(req: Request, res: Response): Promise<void> {
  if (!req.user) { res.status(401).json({ error: 'Не авторизовано.' }); return; }

  const roomId = req.params['roomId'] as string;
  const { mapId } = req.body as { mapId: string };
  const roleInfo = await getUserRoleInRoom(req.user.userId, roomId);
  if (!roleInfo || roleInfo.role !== 'dm') {
    res.status(403).json({ error: 'Тільки ДМ може змінювати активну карту.' });
    return;
  }

  const room = await Room.findByIdAndUpdate(roomId, { activeMapId: mapId }, { new: true });
  if (!room) { res.status(404).json({ error: 'Кімнату не знайдено.' }); return; }

  res.json({ activeMapId: room.activeMapId });
}
