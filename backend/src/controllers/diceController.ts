/**
 * Dice Controller — Server-side cryptographic RNG dice rolling
 */

import type { Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { rollDie } from '../services/rng.js';
import { getUserRoleInRoom } from '../middleware/rbac.js';
import type { DieType } from '../../../shared/types/index.js';
import { DICE_RANGES } from '../../../shared/types/dice.js';

const VALID_DIE_TYPES = Object.keys(DICE_RANGES);

/** POST /api/dice/roll — Roll a die (server-verified) */
export async function roll(req: Request, res: Response): Promise<void> {
  if (!req.user) { res.status(401).json({ error: 'Не авторизовано.' }); return; }

  const { roomId, dieType } = req.body as {
    roomId?: string;
    dieType?: string;
  };

  if (!roomId || !dieType) {
    res.status(400).json({ error: "roomId та dieType обов'язкові." });
    return;
  }

  if (!VALID_DIE_TYPES.includes(dieType)) {
    res.status(400).json({
      error: `Невірний тип кістки. Допустимі: ${VALID_DIE_TYPES.join(', ')}`,
    });
    return;
  }

  // Verify user is in the room
  const roleInfo = await getUserRoleInRoom(req.user.userId, roomId);
  if (!roleInfo) {
    res.status(403).json({ error: 'Ви не є учасником цієї кімнати.' });
    return;
  }

  const result = rollDie(dieType as DieType);

  res.json({
    id: uuidv4(),
    ...result,
    rolledBy: req.user.username,
    rolledByUserId: req.user.userId,
  });
}
