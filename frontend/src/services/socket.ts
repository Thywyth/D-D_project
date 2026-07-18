/**
 * Socket.IO Service - Client singleton with authentication.
 */

import { io, Socket } from 'socket.io-client';
import { 
  ClientToServerEvents, 
  ServerToClientEvents 
} from '../../../shared/types/index';
import { useAuthStore } from '../stores/authStore';

// Якщо є VITE_SOCKET_URL — беремо його. 
// Якщо ні, але є VITE_API_URL — беремо його і відрізаємо '/api'.
// Якщо нічого немає (локальна розробка) — ставимо порт твого бекенду (наприклад, 10000).
const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 
  (import.meta.env.VITE_API_URL ? import.meta.env.VITE_API_URL.replace('/api', '') : 'http://localhost:10000');
  
class SocketService {
  private socket: Socket<ServerToClientEvents, ClientToServerEvents> | null = null;

  connect() {
    const { token } = useAuthStore.getState();
    
    if (this.socket?.connected) return this.socket;

    this.socket = io(SOCKET_URL, {
      auth: { token },
      reconnection: true,
      reconnectionAttempts: Infinity,
      reconnectionDelay: 1000,
      transports: ['websocket'],
    });

    this.socket.on('connect', () => {
      console.log('Socket connected:', this.socket?.id);
    });

    this.socket.on('connect_error', (err) => {
      console.error('Socket connection error:', err.message);
    });

    return this.socket;
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }

  get instance() {
    return this.socket || this.connect();
  }
}

export const socketService = new SocketService();
export type { Socket };
