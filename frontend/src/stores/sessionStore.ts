/**
 * Session Store — Manages the active game session and room state.
 */

import { create } from 'zustand';
import type { IRoom, IPlayerSlot, IGameTime } from '../../../shared/types/index';
import { db } from '../db/dexie';
import { api } from '../services/api'; // <--- Додали імпорт API

interface SessionState {
  currentRoom: IRoom | null;
  activePlayers: IPlayerSlot[];
  gameTime: IGameTime;
  isLoading: boolean;

  // Actions
  setRoom: (room: IRoom) => void;
  updateRoom: (updates: Partial<IRoom>) => void;
  updateGameTime: (time: IGameTime) => void;
  setPlayers: (players: IPlayerSlot[]) => void;
  clearSession: () => void;

  // Network & Persistence
  fetchRoom: (roomId: string) => Promise<void>; // <--- Оголосили нову функцію
  loadRoomFromOffline: (roomId: string) => Promise<void>;
}

export const useSessionStore = create<SessionState>((set, get) => ({
  currentRoom: null,
  activePlayers: [],
  gameTime: { day: 1, month: 1, year: 1 },
  isLoading: false,

  setRoom: (room) => {
    set({
      currentRoom: room,
      activePlayers: room.playerSlots,
      gameTime: room.gameTime,
    });
    // Cache for offline — map _id to id for IndexedDB
    void db.rooms.put({
      id: room._id,
      name: room.name,
      roomCode: room.roomCode,
      dmUserId: room.dmUserId,
      playerSlots: room.playerSlots.map((s) => ({
        userId: s.userId,
        characterId: s.characterId,
        playerCode: s.playerCode,
        status: s.status as string,
        joinedAt: s.joinedAt,
      })),
      gameTime: room.gameTime,
      mapImageUrl: room.activeMapId
        ? room.maps.find((m) => m.id === room.activeMapId)?.imageUrl ?? null
        : null,
      audioPresets: room.audioPresets.map((a) => ({
        id: a.id,
        name: a.name,
        url: a.url,
        type: a.type,
      })),
      updatedAt: room.updatedAt,
      _syncStatus: 'synced',
    });
  },

  updateRoom: (updates) =>
    set((state) => {
      if (!state.currentRoom) return state;
      const updated = { ...state.currentRoom, ...updates };
      void db.rooms.update(updated._id, updates as any);
      return { currentRoom: updated };
    }),

  updateGameTime: (time) => set({ gameTime: time }),

  setPlayers: (players) => set({ activePlayers: players }),

  clearSession: () =>
    set({
      currentRoom: null,
      activePlayers: [],
      gameTime: { day: 1, month: 1, year: 1 },
    }),

  // НОВА ФУНКЦІЯ: Завантаження з бекенду
  fetchRoom: async (roomId) => {
    set({ isLoading: true });
    try {
      // Звертаємося до нашого бекенду за кімнатою
      const room = await api.get<IRoom>(`/rooms/${roomId}`);
      
      // Якщо успішно — використовуємо існуючий setRoom, який оновить стан і збереже в офлайн-базу
      get().setRoom(room);
      set({ isLoading: false });
    } catch (error) {
      console.error('Не вдалося завантажити кімнату з сервера', error);
      // Якщо немає інтернету або сервер впав — пробуємо дістати кімнату з локальної бази
      await get().loadRoomFromOffline(roomId);
    }
  },

  loadRoomFromOffline: async (roomId) => {
    set({ isLoading: true });
    const room = await db.rooms.get(roomId);
    if (room) {
      set({
        currentRoom: { ...room, _id: room.id } as unknown as IRoom,
        activePlayers: room.playerSlots as unknown as IPlayerSlot[],
        gameTime: room.gameTime,
        isLoading: false,
      });
    } else {
      set({ isLoading: false });
    }
  },
}));
