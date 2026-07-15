/**
 * Crypto Service - Validating HMAC-signed dice results.
 *
 * Ensures that dice results sent from the server haven't been tampered with.
 */

import type { DiceRollResult } from '../../../shared/types/index';

/**
 * Validates the HMAC signature of a dice roll.
 * Uses the Web Crypto SubtleCrypto API for client-side verification.
 *
 * The server signs: `${dieType}:${result}:${timestamp}` with HMAC-SHA256.
 */
export async function validateDiceResult(
  rollResult: DiceRollResult,
  secret: string,
): Promise<boolean> {
  const { dieType, result, timestamp, signature } = rollResult;

  if (!signature) return false;

  const encoder = new TextEncoder();
  const message = encoder.encode(`${dieType}:${result}:${timestamp}`);
  const keyData = encoder.encode(secret);

  const key = await crypto.subtle.importKey(
    'raw',
    keyData,
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['verify'],
  );

  const signatureBytes = new Uint8Array(
    signature.match(/.{1,2}/g)!.map((byte: string) => parseInt(byte, 16)),
  );

  return await crypto.subtle.verify('HMAC', key, signatureBytes, message);
}

/**
 * Simple UUID generator for offline-created records.
 */
export function generateOfflineId(): string {
  return `offline-${crypto.randomUUID()}`;
}
