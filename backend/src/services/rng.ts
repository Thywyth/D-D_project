/**
 * Cryptographic RNG Service for Dice Rolling
 *
 * Uses Node.js crypto.randomInt() for secure random number generation.
 * Provides HMAC signatures so clients can verify results.
 */

import { randomInt, createHmac } from 'crypto';
import { env } from '../config/env.js';
import type { DieType } from '../../../shared/types/index.js';
import { DICE_RANGES } from '../../../shared/types/dice.js';

export interface RollResult {
  dieType: DieType;
  result: number;
  signature: string;
  timestamp: string;
}

/**
 * Roll a single die using cryptographic RNG.
 *
 * - Standard dice (d4, d6, d8, d12, d20): uniform random in [1, max]
 * - Percentile die (d100): random value from {00, 10, 20, ..., 90}
 */
export function rollDie(dieType: DieType): RollResult {
  const range = DICE_RANGES[dieType];
  let result: number;

  if (dieType === 'd100') {
    // Percentile: generate 0-9 then multiply by step (10)
    const rawRoll = randomInt(0, 10); // 0 to 9 inclusive
    result = rawRoll * range.step; // 0, 10, 20, ..., 90
  } else {
    // Standard dice: generate in [min, max]
    result = randomInt(range.min, range.max + 1);
  }

  const timestamp = new Date().toISOString();

  // HMAC signature for client-side verification
  const signature = createHmac('sha256', env.JWT_SECRET)
    .update(`${dieType}:${result}:${timestamp}`)
    .digest('hex');

  return { dieType, result, signature, timestamp };
}

/**
 * Verify a dice roll result using its HMAC signature.
 */
export function verifyRoll(
  dieType: DieType,
  result: number,
  timestamp: string,
  signature: string,
): boolean {
  const expected = createHmac('sha256', env.JWT_SECRET)
    .update(`${dieType}:${result}:${timestamp}`)
    .digest('hex');
  return expected === signature;
}
