/**
 * Room Controller — CRUD, Join, Generate Player Code, Time Advance
 */

import type { Request, Response } from 'express';
import { Room } from '../models/Room.js';
import { Character } from '../models/Character.js';
import { generateRoomCode, generatePlayerCode } from '../services/codeGenerator.js';
import { advanceAges, advanceGameTime } from '../services/ageCalculator.js';
import { isValidRoomName, sanitizeString } from '../utils/validators.js';
import type { UserRole } from '../../../shared/types/index.js';

/** POST /api/rooms — Create a new room (user becomes DM) */
export async function createRoom(req: Request, res: Response): Promise<void> {
  if (!req.user) { res.status(401).json({ error: 'Не авторизовано.' }); return; }

  const { name, startingYear = 1490 } = req.body as { name?: string, startingYear?: number };
  if (!name) { res.status(400).json({ error: "Назва кімнати обов'язкова." }); return; }

  const nameError = isValidRoomName(sanitizeString(name));
  if (nameError) { res.status(400).json({ error: nameError }); return; }

  const roomCode = await generateRoomCode();

  const room = new Room({
    name: sanitizeString(name),
    roomCode,
    dmUserId: req.user.userId,
    gameTime: { day: 1, month: 1, year: startingYear },
  });

  await room.save();
  res.status(201).json(room.toJSON());
}

/** GET /api/rooms — List rooms the user belongs to */
export async function listRooms(req: Request, res: Response): Promise<void> {
  if (!req.user) { res.status(401).json({ error: 'Не авторизовано.' }); return; }

  const userId = req.user.userId;

  // Rooms where user is DM or a player
  const rooms = await Room.find({
    $or: [
      { dmUserId: userId },
      { 'playerSlots.userId': userId },
    ],
  }).lean();

  const summaries = await Promise.all(
    rooms.map(async (room) => {
      const isDM = room.dmUserId.toString() === userId;
      let characterName: string | null = null;

      if (!isDM) {
        const slot = room.playerSlots.find(
          (s) => s.userId?.toString() === userId,
        );
        if (slot?.characterId) {
          const character = await Character.findById(slot.characterId)
            .select('name')
            .lean();
          characterName = character?.name ?? null;
        }
      }

      const activeCount = room.playerSlots.filter(
        (s) => s.status === 'active',
      ).length;

      return {
        _id: room._id.toString(),
        name: room.name,
        roomCode: room.roomCode,
        role: (isDM ? 'dm' : 'player') as UserRole,
        characterName,
        playerCount: activeCount + 1, // +1 for DM
        gameTime: room.gameTime,
        updatedAt: room.updatedAt.toISOString(),
      };
    }),
  );

  res.json(summaries);
}

/** GET /api/rooms/:id — Get room details */
export async function getRoom(req: Request, res: Response): Promise<void> {
  if (!req.user) { res.status(401).json({ error: 'Не авторизовано.' }); return; }

  const room = await Room.findById(req.params['id']);
  if (!room) { res.status(404).json({ error: 'Кімнату не знайдено.' }); return; }

  const userId = req.user.userId;
  const isDM = room.dmUserId.toString() === userId;
  const isPlayer = room.playerSlots.some(
    (s) => s.userId?.toString() === userId && s.status === 'active',
  );

  if (!isDM && !isPlayer) {
    res.status(403).json({ error: 'Ви не є учасником цієї кімнати.' });
    return;
  }

  res.json(room.toJSON());
}

/** POST /api/rooms/join — Join a room via roomCode + playerCode */
export async function joinRoom(req: Request, res: Response): Promise<void> {
  if (!req.user) { res.status(401).json({ error: 'Не авторизовано.' }); return; }

  const { roomCode, playerCode } = req.body as {
    roomCode?: string;
    playerCode?: string;
  };

  if (!roomCode || !playerCode) {
    res.status(400).json({ error: 'Код кімнати та код гравця обов\'язкові.' });
    return;
  }

  const room = await Room.findOne({ roomCode: roomCode.toUpperCase() });
  if (!room) { res.status(404).json({ error: 'Кімнату не знайдено.' }); return; }

  const slotIndex = room.playerSlots.findIndex(
    (slot) => slot.playerCode === playerCode && slot.status === 'pending',
  );

  if (slotIndex === -1) {
    res.status(400).json({ error: 'Невірний або вже використаний код гравця.' });
    return;
  }

  // Link user to slot
  const slot = room.playerSlots[slotIndex]!;
  slot.userId = req.user.userId as unknown as null; // Mongoose casts
  slot.status = 'active';
  slot.joinedAt = new Date() as unknown as null;

  await room.save();

  // 🚀 НОВИЙ КОД: Прив'язуємо персонажа до користувача
  if (slot.characterId) {
    await Character.findByIdAndUpdate(slot.characterId, {
      userId: req.user.userId
    });
  }

  res.json({
    roomId: room._id.toString(),
    roomName: room.name,
    slotIndex,
    message: 'Успішно приєднано до кімнати!',
  });
}

/** POST /api/rooms/:id/generate-code — DM generates a new player code */
export async function generateCode(req: Request, res: Response): Promise<void> {
  if (!req.user) { res.status(401).json({ error: 'Не авторизовано.' }); return; }

  const room = await Room.findById(req.params['id']);
  if (!room) { res.status(404).json({ error: 'Кімнату не знайдено.' }); return; }

  if (room.dmUserId.toString() !== req.user.userId) {
    res.status(403).json({ error: 'Тільки ДМ може генерувати коди гравців.' });
    return;
  }

  const playerCode = generatePlayerCode();

  room.playerSlots.push({
    userId: null,
    characterId: null,
    playerCode,
    status: 'pending',
    joinedAt: null,
  });

  await room.save();

  res.status(201).json({
    playerCode,
    message: 'Код гравця згенеровано.',
  });
}

/** PATCH /api/rooms/:id/time — Advance game time (DM only) */
export async function advanceTime(req: Request, res: Response): Promise<void> {
  if (!req.user) { res.status(401).json({ error: 'Не авторизовано.' }); return; }

  const room = await Room.findById(req.params['id']);
  if (!room) { res.status(404).json({ error: 'Кімнату не знайдено.' }); return; }

  if (room.dmUserId.toString() !== req.user.userId) {
    res.status(403).json({ error: 'Тільки ДМ може просувати час.' });
    return;
  }

  const { days = 0, months = 0 } = req.body as {
    days?: number;
    months?: number;
  };

  if (days <= 0 && months <= 0) {
    res.status(400).json({ error: 'Вкажіть кількість днів або місяців.' });
    return;
  }

  const oldTime = { ...room.gameTime };
  const newTime = advanceGameTime(oldTime, days, months);

  // Update room game time
  room.gameTime = newTime;
  await room.save();

  // Auto-age characters and tree nodes
  const ageResult = await advanceAges(
    room._id.toString(),
    oldTime,
    newTime,
  );

  res.json({
    gameTime: newTime,
    ...ageResult,
    message: `Час просунуто на ${days} дн. та ${months} міс.`,
  });
}
