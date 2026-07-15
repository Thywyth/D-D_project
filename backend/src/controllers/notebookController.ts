import type { Request, Response } from 'express';
import { Notebook } from '../models/Notebook.js';
import { Room } from '../models/Room.js';
import { getUserRoleInRoom } from '../middleware/rbac.js';

/**
 * GET /api/notebooks/room/:roomId
 * Fetches notebooks relevant to the user for a specific room.
 * If they don't exist, it creates default DM and/or Player notebooks on-demand.
 */
export async function getRoomNotebooks(req: Request, res: Response): Promise<void> {
  if (!req.user) {
    res.status(401).json({ error: 'Не авторизовано.' });
    return;
  }

  const roomId = req.params['roomId'] as string;
  const { userId, username } = req.user;

  const roleInfo = await getUserRoleInRoom(userId, roomId);
  if (!roleInfo) {
    res.status(403).json({ error: 'Ви не є учасником цієї кімнати.' });
    return;
  }

  const responseNotebooks = [];

  // Find or create the DM notebook for the room
  let dmNotebook = await Notebook.findOne({ roomId, type: 'dm' });
  if (!dmNotebook) {
    const room = await Room.findById(roomId).select('dmUserId').lean();
    if (!room) {
      res.status(404).json({ error: 'Кімнату не знайдено.' });
      return;
    }
    dmNotebook = await Notebook.create({
      roomId,
      userId: room.dmUserId,
      type: 'dm',
      title: 'Нотатки Майстра',
    });
  }
  responseNotebooks.push(dmNotebook);

  // If the requester is a player, find or create their personal notebook
  if (roleInfo.role === 'player') {
    let playerNotebook = await Notebook.findOne({ roomId, type: 'player', userId });
    if (!playerNotebook) {
      playerNotebook = await Notebook.create({
        roomId,
        userId,
        type: 'player',
        title: `Щоденник: ${username}`,
      });
    }
    responseNotebooks.push(playerNotebook);
  }

  res.json(responseNotebooks.map(n => n.toJSON()));
}

/**
 * PATCH /api/notebooks/:id
 * Updates the content of a specific notebook.
 */
export async function updateNotebook(req: Request, res: Response): Promise<void> {
  if (!req.user) {
    res.status(401).json({ error: 'Не авторизовано.' });
    return;
  }

  const { id } = req.params;
  const { content } = req.body as { content?: unknown };
  const { userId } = req.user;

  if (!Array.isArray(content)) {
    res.status(400).json({ error: 'Невірний формат контенту.' });
    return;
  }

  const notebook = await Notebook.findById(id);
  if (!notebook) {
    res.status(404).json({ error: 'Нотатник не знайдено.' });
    return;
  }

  const isOwner = notebook.userId.toString() === userId;
  const roleInfo = await getUserRoleInRoom(userId, notebook.roomId.toString());
  if (!isOwner && roleInfo?.role !== 'dm') {
    res.status(403).json({ error: 'Ви не можете редагувати цей нотатник.' });
    return;
  }

  notebook.content = content as any[];
  notebook.markModified('content');
  await notebook.save();

  res.json(notebook.toJSON());
}