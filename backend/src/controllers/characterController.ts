/**
 * Character Controller — CRUD with RBAC enforcement
 */

import type { Request, Response } from 'express';
import { Character } from '../models/Character.js';
import { Room } from '../models/Room.js';
import { getUserRoleInRoom, filterUpdateByRBAC } from '../middleware/rbac.js';
import { generatePlayerCode } from '../services/codeGenerator.js';

interface IAbilityScoreDoc {
  score: number;
  modifier: number;
}

// D&D 5e Skill to Attribute Mapping
const SKILL_TO_ATTRIBUTE_MAP: Record<string, 'STR' | 'DEX' | 'CON' | 'INT' | 'WIS' | 'CHA'> = {
  acrobatics: 'DEX',
  animalHandling: 'WIS',
  arcana: 'INT',
  athletics: 'STR',
  deception: 'CHA',
  history: 'INT',
  insight: 'WIS',
  intimidation: 'CHA',
  investigation: 'INT',
  medicine: 'WIS',
  nature: 'INT',
  perception: 'WIS',
  performance: 'CHA',
  persuasion: 'CHA',
  religion: 'INT',
  sleightOfHand: 'DEX',
  stealth: 'DEX',
  survival: 'WIS',
};

/** POST /api/characters — Create a new character (immutable fields set here) */
export async function createCharacter(req: Request, res: Response): Promise<void> {
  if (!req.user) { res.status(401).json({ error: 'Не авторизовано.' }); return; }

  const body = req.body as Record<string, unknown>;
  const roomId = body['roomId'] as string | undefined;
  if (!roomId) { res.status(400).json({ error: 'roomId обов\'язковий.' }); return; }

  // Verify user is in this room
  const room = await Room.findById(roomId);
  if (!room) { res.status(404).json({ error: 'Кімнату не знайдено.' }); return; }

  const isDM = room.dmUserId.toString() === req.user.userId;
  const playerSlot = room.playerSlots.find(
    (s) => s.userId?.toString() === req.user!.userId && s.status === 'active',
  );

  if (!isDM && !playerSlot) {
    res.status(403).json({ error: 'Ви не є учасником цієї кімнати.' });
    return;
  }

  const attributes = body['attributes'] as Record<string, IAbilityScoreDoc>;

  // Auto-calculate saving throws and skills based on initial attributes
  const savingThrows: Record<string, { proficient: boolean; bonus: number }> = {};
  for (const key of ['STR', 'DEX', 'CON', 'INT', 'WIS', 'CHA']) {
    savingThrows[key] = {
      proficient: false,
      bonus: attributes[key]?.modifier ?? 0,
    };
  }

  const skills: Record<string, { proficient: boolean; bonus: number }> = {};
  for (const [skill, attr] of Object.entries(SKILL_TO_ATTRIBUTE_MAP)) {
    skills[skill] = {
      proficient: false,
      bonus: attributes[attr]?.modifier ?? 0,
    };
  }

  const character = new Character({
    roomId,
    userId: req.user.userId,
    name: body['name'],
    race: body['race'],
    class: body['class'],
    level: body['level'] ?? 1,
    background: body['background'],
    alignment: body['alignment'],
    xp: body['xp'] ?? 0,
    armorClass: body['armorClass'] ?? 10,
    initiative: attributes['DEX']?.modifier ?? 0,
    speed: body['speed'] ?? 30,
    personalityTraits: (body['personalityTraits'] as string) ?? '',
    ideals: (body['ideals'] as string) ?? '',
    bonds: (body['bonds'] as string) ?? '',
    flaws: (body['flaws'] as string) ?? '',
    age: body['age'] ?? null,
    maxHP: body['maxHP'] ?? 10,
    currentHP: body['maxHP'] ?? 10,
    attributes,
    // Auto-calculated fields
    savingThrows,
    skills,
  });

  await character.save();

  // Link character to player slot if applicable
  if (playerSlot) {
    playerSlot.characterId = character._id;
    await room.save();
  } else if (isDM) {
    // If the DM created this character, generate a new player slot/code for it
    const newCode = generatePlayerCode();
    room.playerSlots.push({
      userId: null,
      characterId: character._id,
      playerCode: newCode,
      status: 'pending',
      joinedAt: null,
    });
    await room.save();
  }

  res.status(201).json(character.toJSON());
}

/** GET /api/characters/:id — Get character (full for owner/DM, filtered for others) */
export async function getCharacter(req: Request, res: Response): Promise<void> {
  if (!req.user) { res.status(401).json({ error: 'Не авторизовано.' }); return; }

  const character = await Character.findById(req.params['id']);
  if (!character) { res.status(404).json({ error: 'Персонажа не знайдено.' }); return; }

  const roleInfo = await getUserRoleInRoom(
    req.user.userId,
    character.roomId.toString(),
  );

  if (!roleInfo) {
    res.status(403).json({ error: 'Ви не є учасником цієї кімнати.' });
    return;
  }

  res.json(character.toJSON());
}

/** GET /api/characters/room/:roomId — List all characters in a room */
export async function listRoomCharacters(req: Request, res: Response): Promise<void> {
  if (!req.user) { res.status(401).json({ error: 'Не авторизовано.' }); return; }

  const roomId = req.params['roomId'] as string;
  const roleInfo = await getUserRoleInRoom(req.user.userId, roomId);

  if (!roleInfo) {
    res.status(403).json({ error: 'Ви не є учасником цієї кімнати.' });
    return;
  }

  const characters = await Character.find({ roomId }).lean();
  res.json(characters);
}

/** PATCH /api/characters/:id — Update character (RBAC-enforced field filtering) */
export async function updateCharacter(req: Request, res: Response): Promise<void> {
  if (!req.user) { res.status(401).json({ error: 'Не авторизовано.' }); return; }

  const character = await Character.findById(req.params['id']);
  if (!character) { res.status(404).json({ error: 'Персонажа не знайдено.' }); return; }

  const roleInfo = await getUserRoleInRoom(
    req.user.userId,
    character.roomId.toString(),
  );

  if (!roleInfo) {
    res.status(403).json({ error: 'Ви не є учасником цієї кімнати.' });
    return;
  }

  const isOwner = character.userId.toString() === req.user.userId;
  const updates = req.body as Record<string, unknown>;

  // Filter updates through RBAC matrix
  const { allowed, denied } = filterUpdateByRBAC(
    updates,
    roleInfo.role,
    isOwner,
  );

  if (Object.keys(allowed).length === 0) {
    res.status(403).json({
      error: 'Жодне поле не дозволено для редагування.',
      denied,
    });
    return;
  }

  // Apply allowed updates
  for (const [field, value] of Object.entries(allowed)) {
    (character as unknown as Record<string, unknown>)[field] = value;
  }

  character.markModified('attributes');
  character.markModified('savingThrows');
  character.markModified('skills');
  await character.save();

  res.json({
    character: character.toJSON(),
    denied: denied.length > 0 ? denied : undefined,
  });
}

/** PATCH /api/characters/:id/status — DM toggles alive/dead/archived */
export async function updateCharacterStatus(
  req: Request,
  res: Response,
): Promise<void> {
  if (!req.user) { res.status(401).json({ error: 'Не авторизовано.' }); return; }

  const character = await Character.findById(req.params['id']);
  if (!character) { res.status(404).json({ error: 'Персонажа не знайдено.' }); return; }

  const roleInfo = await getUserRoleInRoom(
    req.user.userId,
    character.roomId.toString(),
  );

  if (!roleInfo || roleInfo.role !== 'dm') {
    res.status(403).json({ error: 'Тільки ДМ може змінювати статус персонажа.' });
    return;
  }

  const { status } = req.body as { status?: string };
  if (!status || !['alive', 'dead', 'archived'].includes(status)) {
    res.status(400).json({ error: 'Невірний статус. Допустимі: alive, dead, archived.' });
    return;
  }

  character.status = status as 'alive' | 'dead' | 'archived';
  await character.save();

  // If archived, update player slot
  if (status === 'archived' || status === 'dead') {
    const room = await Room.findById(character.roomId);
    if (room) {
      const slot = room.playerSlots.find(
        (s) => s.characterId?.toString() === character._id.toString(),
      );
      if (slot) {
        slot.status = status as 'dead' | 'archived';
        await room.save();
      }
    }
  }

  res.json({
    characterId: character._id.toString(),
    status: character.status,
    message: `Статус змінено на "${status}".`,
  });
}
/** POST /api/characters/transfer-coins — Transfer coins between characters */
export async function transferCoins(req: Request, res: Response): Promise<void> {
  if (!req.user) { res.status(401).json({ error: 'Не авторизовано.' }); return; }

  const { sourceCharacterId, targetCharacterId, coinType, amount } = req.body as {
    sourceCharacterId?: string;
    targetCharacterId?: string;
    coinType?: 'cp' | 'sp' | 'ep' | 'gp' | 'pp';
    amount?: number;
  };

  if (!sourceCharacterId || !targetCharacterId || !coinType || !amount || amount <= 0) {
    res.status(400).json({ error: 'Невірні параметри передачі.' }); 
    return;
  }

  const sourceChar = await Character.findById(sourceCharacterId);
  const targetChar = await Character.findById(targetCharacterId);

  if (!sourceChar || !targetChar) {
    res.status(404).json({ error: 'Персонажа не знайдено.' }); 
    return;
  }

  const roleInfo = await getUserRoleInRoom(req.user.userId, sourceChar.roomId.toString());
  const isOwner = sourceChar.userId.toString() === req.user.userId;

  if (!roleInfo || (roleInfo.role !== 'dm' && !isOwner)) {
    res.status(403).json({ error: 'Немає доступу для передачі монет з цього персонажа.' }); 
    return;
  }

  if (sourceChar.coins[coinType] < amount) {
    res.status(400).json({ error: 'Недостатньо монет для передачі.' }); 
    return;
  }

  // Виконуємо транзакцію
  sourceChar.coins[coinType] -= amount;
  targetChar.coins[coinType] += amount;

  sourceChar.markModified('coins');
  targetChar.markModified('coins');

  await sourceChar.save();
  await targetChar.save();

  res.json({ message: 'Монети успішно передано!' });
}