/**
 * Map Store — Markers and map image state
 */

import { create } from 'zustand';
import { api, APIError } from '../services/api';
import { db, enqueueSyncAction } from '../db/dexie';
import type { IMap, IMapMarker } from '../../../shared/types/index';

interface MapState {
  markers: IMapMarker[];
  maps: IMap[];
  activeMapId: string | null;
  isLoading: boolean;
  error: string | null;
}

interface MapActions {
  setRoomMapData: (data: { maps: IMap[]; activeMapId: string | null }) => void;
  fetchMarkers: (roomId: string) => Promise<void>;
  addMarker: (roomId: string, marker: Omit<IMapMarker, '_id' | 'roomId' | 'createdBy' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  updateMarker: (roomId: string, markerId: string, updates: Partial<IMapMarker>) => Promise<void>;
  removeMarker: (roomId: string, markerId: string) => Promise<void>;
  addMap: (roomId: string, mapData: { name: string; imageUrl: string }) => Promise<void>;
  deleteMap: (roomId: string, mapId: string) => Promise<void>;
  setActiveMap: (roomId: string, mapId: string) => Promise<void>;
  applyMarkerAdded: (marker: IMapMarker) => void;
  applyMarkerUpdated: (marker: IMapMarker) => void;
  applyMarkerRemoved: (markerId: string) => void;
  applyMapImageSet: (imageUrl: string | null) => void;
  clearError: () => void;
}

export const useMapStore = create<MapState & MapActions>()((set, get) => ({
  // State
  markers: [],
  maps: [],
  activeMapId: null,
  isLoading: false,
  error: null,

  // Actions
  setRoomMapData: (data) => {
    set({ maps: data.maps, activeMapId: data.activeMapId });
  },
  fetchMarkers: async (roomId) => {
    set({ isLoading: true, error: null });
    try {
      const markers = await api.get<IMapMarker[]>(
        `/maps/${roomId}/markers`,
      );
      set({ markers, isLoading: false });

      // Cache to IndexedDB
      for (const m of markers) {
        await db.mapMarkers.put({
          id: m._id,
          roomId: m.roomId,
          xPercent: m.xPercent,
          yPercent: m.yPercent,
          name: m.name,
          description: m.description,
          color: m.color,
          createdBy: m.createdBy,
          updatedAt: m.updatedAt ?? new Date().toISOString(),
          _syncStatus: 'synced',
        });
      }
    } catch (err: unknown) {
      // IndexedDB fallback
      const cached = await db.mapMarkers
        .where('roomId')
        .equals(roomId)
        .toArray();

      if (cached.length > 0) {
        set({
          markers: cached.map((m) => ({
            _id: m.id,
            roomId: m.roomId,
            xPercent: m.xPercent,
            yPercent: m.yPercent,
            name: m.name,
            description: m.description,
            color: m.color,
            createdBy: m.createdBy,
          }) as IMapMarker),
          isLoading: false,
          error: 'Завантажено з кешу (офлайн).',
        });
      } else {
        const message =
          err instanceof APIError
            ? (err.data?.error ?? err.message)
            : 'Помилка завантаження маркерів.';
        set({ isLoading: false, error: message });
      }
    }
  },

  addMarker: async (roomId, marker) => {
    try {
      const created = await api.post<IMapMarker>(
        `/maps/${roomId}/markers`,
        marker,
      );
      set((state) => ({ markers: [...state.markers, created] }));
    } catch (err: unknown) {
      const message =
        err instanceof APIError
          ? (err.data?.error ?? err.message)
          : 'Помилка додавання маркера.';
      set({ error: message });
    }
  },

  updateMarker: async (roomId, markerId, updates) => {
    // Optimistic
    set((state) => ({
      markers: state.markers.map((m) =>
        m._id === markerId ? { ...m, ...updates } : m,
      ),
    }));

    if (navigator.onLine) {
      try {
        await api.patch(`/maps/${roomId}/markers/${markerId}`, updates);
      } catch {
        // Revert — refetch
        void get().fetchMarkers(roomId);
      }
    } else {
      await enqueueSyncAction(
        'update',
        `/maps/${roomId}/markers/${markerId}`,
        updates as Record<string, unknown>,
      );
    }
  },

  removeMarker: async (roomId, markerId) => {
    set((state) => ({
      markers: state.markers.filter((m) => m._id !== markerId),
    }));

    try {
      await api.delete(`/maps/${roomId}/markers/${markerId}`);
    } catch {
      void get().fetchMarkers(roomId);
    }
  },

  addMap: async (roomId, mapData) => {
    try {
      const result = await api.post<{ maps: IMap[]; activeMapId: string | null }>(
        `/maps/${roomId}/maps`,
        mapData,
      );
      set({ maps: result.maps, activeMapId: result.activeMapId });
    } catch (err: unknown) {
      const message =
        err instanceof APIError
          ? (err.data?.error ?? err.message)
          : 'Помилка додавання карти.';
      set({ error: message });
    }
  },

  deleteMap: async (roomId, mapId) => {
    // Optimistic update
    const oldState = get();
    const newMaps = oldState.maps.filter((m) => m.id !== mapId);
    const newActiveId = oldState.activeMapId === mapId ? (newMaps[0]?.id ?? null) : oldState.activeMapId;
    set({ maps: newMaps, activeMapId: newActiveId });

    try {
      await api.delete(`/maps/${roomId}/maps/${mapId}`);
    } catch {
      set({ maps: oldState.maps, activeMapId: oldState.activeMapId }); // Revert
    }
  },

  setActiveMap: async (roomId, mapId) => {
    const oldActiveId = get().activeMapId;
    set({ activeMapId: mapId }); // Optimistic
    try {
      await api.patch(`/maps/${roomId}/maps/active`, { mapId });
    } catch {
      set({ activeMapId: oldActiveId }); // Revert
    }
  },

  // Socket event handlers
  applyMarkerAdded: (marker) =>
    set((state) => ({ markers: [...state.markers, marker] })),

  applyMarkerUpdated: (marker) =>
    set((state) => ({
      markers: state.markers.map((m) =>
        m._id === marker._id ? marker : m,
      ),
    })),

  applyMarkerRemoved: (markerId) =>
    set((state) => ({
      markers: state.markers.filter((m) => m._id !== markerId),
    })),

  applyMapImageSet: (_imageUrl) => {
    // This is now obsolete. Map updates should come from the room object.
    console.warn('applyMapImageSet is deprecated and should be removed.');
  },

  clearError: () => set({ error: null }),
}));
