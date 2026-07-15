/** Dice module types */

import type { DieType } from './index.js';

export interface IDiceRoll {
  id: string;
  userId: string;
  username: string;
  roomId: string;
  dieType: DieType;
  result: number;
  timestamp: string;
}

/** Dice roll request payload */
export interface DiceRollPayload {
  roomId: string;
  dieType: DieType;
}

/** Dice roll result from server (cryptographic RNG) */
export interface DiceRollResult {
  id: string;
  dieType: DieType;
  result: number;
  rolledBy: string;     // username
  rolledByUserId: string;
  timestamp: string;
  /** HMAC signature for client-side verification */
  signature: string;
}

/** Dice value ranges by type */
export const DICE_RANGES: Record<DieType, { min: number; max: number; step: number }> = {
  d4:   { min: 1,  max: 4,   step: 1  },
  d6:   { min: 1,  max: 6,   step: 1  },
  d8:   { min: 1,  max: 8,   step: 1  },
  d12:  { min: 1,  max: 12,  step: 1  },
  d20:  { min: 1,  max: 20,  step: 1  },
  d100: { min: 0,  max: 90,  step: 10 }, // Percentile: 00, 10, 20, ..., 90
} as const;
