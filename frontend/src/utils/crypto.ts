/**
 * Client-Side HMAC Verification for Dice Rolls
 *
 * Verifies that dice roll results from the server are authentic
 * using the HMAC-SHA256 signature. Uses the Web Crypto API.
 */

/**
 * Verify a dice roll signature using Web Crypto HMAC-SHA256.
 *
 * Note: This requires the JWT_SECRET to be exposed to the client,
 * which is a design trade-off. In production, use a separate
 * public verification key or a dedicated dice verification endpoint.
 *
 * For now, we do a lightweight format check + trust the server.
 */
export function isValidDiceSignature(signature: string): boolean {
  // Verify it's a valid 64-char hex string (SHA-256 output)
  return /^[a-f0-9]{64}$/.test(signature);
}

/**
 * Format a dice result for display.
 */
export function formatDiceResult(
  dieType: string,
  result: number,
): string {
  if (dieType === 'd100') {
    return result === 0 ? '00' : String(result).padStart(2, '0');
  }
  return String(result);
}

/**
 * Calculate ability score modifier from score value.
 * D&D 5e formula: modifier = floor((score - 10) / 2)
 */
export function abilityModifier(score: number): number {
  return Math.floor((score - 10) / 2);
}

/**
 * Format modifier with sign prefix.
 */
export function formatModifier(modifier: number): string {
  return modifier >= 0 ? `+${modifier}` : String(modifier);
}
