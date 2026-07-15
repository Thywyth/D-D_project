/**
 * Code Generator Service
 *
 * Generates unique codes for rooms and player invitations.
 * Room codes: 6 uppercase alphanumeric characters.
 * Player codes: 8 character UUID-based tokens (single-use).
 */

import { randomBytes } from 'crypto';
import { Room } from '../models/Room.js';

const ROOM_CODE_LENGTH = 6;
const PLAYER_CODE_LENGTH = 8;
const ALPHANUMERIC = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // Excluded confusing: 0,O,1,I

/**
 * Generate a random alphanumeric string of given length.
 */
function generateRandomCode(length: number, charset: string): string {
  const bytes = randomBytes(length);
  let result = '';
  for (let i = 0; i < length; i++) {
    result += charset[bytes[i]! % charset.length];
  }
  return result;
}

/**
 * Generate a unique room code (6 chars).
 * Retries if collision detected in database.
 */
export async function generateRoomCode(maxRetries = 10): Promise<string> {
  for (let i = 0; i < maxRetries; i++) {
    const code = generateRandomCode(ROOM_CODE_LENGTH, ALPHANUMERIC);
    const existing = await Room.findOne({ roomCode: code }).lean();
    if (!existing) {
      return code;
    }
  }
  throw new Error(
    `[CodeGenerator] Не вдалося згенерувати унікальний код кімнати після ${maxRetries} спроб.`,
  );
}

/**
 * Generate a unique player invitation code (8 chars).
 * These are single-use tokens given by the DM to a player.
 */
export function generatePlayerCode(): string {
  return generateRandomCode(PLAYER_CODE_LENGTH, ALPHANUMERIC);
}

/**
 * Verify that a player code exists in a room and is in 'pending' status.
 * Returns the slot index if valid, -1 otherwise.
 */
export async function verifyPlayerCode(
  roomCode: string,
  playerCode: string,
): Promise<{ roomId: string; slotIndex: number } | null> {
  const room = await Room.findOne({ roomCode: roomCode.toUpperCase() });
  if (!room) return null;

  const slotIndex = room.playerSlots.findIndex(
    (slot) => slot.playerCode === playerCode && slot.status === 'pending',
  );

  if (slotIndex === -1) return null;

  return { roomId: room._id.toString(), slotIndex };
}
