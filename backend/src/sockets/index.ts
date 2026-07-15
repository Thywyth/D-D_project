/**
 * Socket.IO Event Registry
 *
 * Registers all domain-specific socket handlers on each connection.
 * Authenticates sockets via JWT handshake middleware.
 */

import type { Server as SocketServer, Socket } from 'socket.io';
import { socketAuthMiddleware } from '../middleware/auth.js';
import { registerRoomHandlers } from './roomHandlers.js';
import { registerCharacterHandlers } from './characterHandlers.js';
import { registerInventoryHandlers } from './inventoryHandlers.js';
import { registerMapHandlers } from './mapHandlers.js';
import { registerTreeHandlers } from './treeHandlers.js';
import { registerAudioHandlers } from './audioHandlers.js';
import { registerDiceHandlers } from './diceHandlers.js';
import type {
  ClientToServerEvents,
  ServerToClientEvents,
  InterServerEvents,
  SocketData,
} from '../../../shared/types/socket-events.js';

export type TypedServer = SocketServer<
  ClientToServerEvents,
  ServerToClientEvents,
  InterServerEvents,
  SocketData
>;

export type TypedSocket = Socket<
  ClientToServerEvents,
  ServerToClientEvents,
  InterServerEvents,
  SocketData
>;

/**
 * Initialize Socket.IO with typed events and JWT auth.
 */
export function initializeSocketHandlers(io: SocketServer): void {
  const typedIO = io as unknown as TypedServer;

  // JWT authentication middleware
  typedIO.use(socketAuthMiddleware as Parameters<typeof typedIO.use>[0]);

  typedIO.on('connection', (socket) => {
    const typedSocket = socket as unknown as TypedSocket;
    const userId = socket.data['userId'] as string;
    const username = socket.data['username'] as string;

    console.log(`[Socket] Authenticated: ${username} (${userId}) — ${socket.id}`);

    // Register all domain handlers
    registerRoomHandlers(typedIO, typedSocket);
    registerCharacterHandlers(typedIO, typedSocket);
    registerInventoryHandlers(typedIO, typedSocket);
    registerMapHandlers(typedIO, typedSocket);
    registerTreeHandlers(typedIO, typedSocket);
    registerAudioHandlers(typedIO, typedSocket);
    registerDiceHandlers(typedIO, typedSocket);

    socket.on('disconnect', (reason) => {
      console.log(`[Socket] Disconnected: ${username} — ${reason}`);
    });
  });
}
