/**
 * Inventory Transfer Socket Handlers — Atomic item/coin transfers
 *
 * Uses MongoDB transactions to ensure atomicity:
 * either both characters are updated or neither is.
 */

import mongoose from 'mongoose';
import type { TypedServer, TypedSocket } from './index.js';
import { Character } from '../models/Character.js';
import { getUserRoleInRoom } from '../middleware/rbac.js';

export function registerInventoryHandlers(
  io: TypedServer,
  socket: TypedSocket,
): void {
  const userId = socket.data['userId'] as string;

  // ── inventory:transfer ──
  socket.on('inventory:transfer', async (data) => {
    const fromCharacter = await Character.findById(data.fromCharacterId);
    const toCharacter = await Character.findById(data.toCharacterId);

    if (!fromCharacter || !toCharacter) {
      socket.emit('inventory:transfer-error', {
        message: 'Одного з персонажів не знайдено.',
      });
      return;
    }

    // Both must be in the same room
    if (fromCharacter.roomId.toString() !== toCharacter.roomId.toString()) {
      socket.emit('inventory:transfer-error', {
        message: 'Персонажі мають бути в одній кімнаті.',
      });
      return;
    }

    const roomId = fromCharacter.roomId.toString();
    const roleInfo = await getUserRoleInRoom(userId, roomId);
    if (!roleInfo) {
      socket.emit('inventory:transfer-error', {
        message: 'Ви не є учасником цієї кімнати.',
      });
      return;
    }

    // Only the owner of fromCharacter or DM can initiate transfer
    const isFromOwner = fromCharacter.userId.toString() === userId;
    if (!isFromOwner && roleInfo.role !== 'dm') {
      socket.emit('inventory:transfer-error', {
        message: 'Тільки власник або ДМ може ініціювати передачу.',
      });
      return;
    }

    // Start atomic transaction
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      // ── Transfer Items ──
      for (const transferItem of data.items) {
        const fromItemIndex = fromCharacter.inventory.findIndex(
          (item) => item.id === transferItem.itemId,
        );

        if (fromItemIndex === -1) {
          throw new Error(`Предмет "${transferItem.itemId}" не знайдено.`);
        }

        const fromItem = fromCharacter.inventory[fromItemIndex]!;

        if (fromItem.quantity < transferItem.quantity) {
          throw new Error(
            `Недостатня кількість "${fromItem.name}": є ${fromItem.quantity}, потрібно ${transferItem.quantity}.`,
          );
        }

        // Decrease from source
        fromItem.quantity -= transferItem.quantity;
        if (fromItem.quantity === 0) {
          fromCharacter.inventory.splice(fromItemIndex, 1);
        }

        // Add to target
        const existingToItem = toCharacter.inventory.find(
          (item) => item.id === transferItem.itemId,
        );
        if (existingToItem) {
          existingToItem.quantity += transferItem.quantity;
        } else {
          toCharacter.inventory.push({
            id: fromItem.id,
            name: fromItem.name,
            quantity: transferItem.quantity,
            weight: fromItem.weight,
            description: fromItem.description,
          });
        }
      }

      // ── Transfer Coins ──
      const coinTypes = ['cp', 'sp', 'ep', 'gp', 'pp'] as const;
      for (const coinType of coinTypes) {
        const amount = data.coins[coinType];
        if (amount && amount > 0) {
          if (fromCharacter.coins[coinType] < amount) {
            throw new Error(
              `Недостатньо ${coinType.toUpperCase()}: є ${fromCharacter.coins[coinType]}, потрібно ${amount}.`,
            );
          }
          fromCharacter.coins[coinType] -= amount;
          toCharacter.coins[coinType] += amount;
        }
      }

      // Save both characters within the transaction
      await fromCharacter.save({ session });
      await toCharacter.save({ session });

      await session.commitTransaction();

      // Broadcast updated inventories to room
      io.to(roomId).emit('inventory:transfer-complete', {
        fromCharacterId: data.fromCharacterId,
        toCharacterId: data.toCharacterId,
        fromInventory: fromCharacter.inventory.map((i) => ({
          id: i.id,
          name: i.name,
          quantity: i.quantity,
          weight: i.weight,
          description: i.description,
        })),
        fromCoins: { cp: fromCharacter.coins.cp, sp: fromCharacter.coins.sp, ep: fromCharacter.coins.ep, gp: fromCharacter.coins.gp, pp: fromCharacter.coins.pp },
        toInventory: toCharacter.inventory.map((i) => ({
          id: i.id,
          name: i.name,
          quantity: i.quantity,
          weight: i.weight,
          description: i.description,
        })),
        toCoins: { cp: toCharacter.coins.cp, sp: toCharacter.coins.sp, ep: toCharacter.coins.ep, gp: toCharacter.coins.gp, pp: toCharacter.coins.pp },
      });
    } catch (error) {
      await session.abortTransaction();
      socket.emit('inventory:transfer-error', {
        message:
          error instanceof Error ? error.message : 'Помилка при передачі.',
      });
    } finally {
      session.endSession();
    }
  });
}
