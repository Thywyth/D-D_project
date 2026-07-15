/**
 * useSocket — Socket.IO connection lifecycle hook
 *
 * - Connects on mount if authenticated
 * - Registers all real-time event listeners
 * - Auto-reconnects with exponential backoff
 * - Wires socket events to Zustand stores
 */

import { useEffect, useRef, useCallback } from 'react';
import { socketService } from '../services/socket';
import { useAuthStore } from '../stores/authStore';
import { useSessionStore } from '../stores/sessionStore';
import { useCharacterStore } from '../stores/characterStore';
import { useDiceStore } from '../stores/diceStore';
import { useMapStore } from '../stores/mapStore';
import { useAudioStore } from '../stores/audioStore';
import { useTreeStore } from '../stores/treeStore';

export function useSocket(): {
  joinRoom: (roomId: string) => void;
  leaveRoom: (roomId: string) => void;
  isConnected: boolean;
} {
  const token = useAuthStore((s) => s.token);
  const connectedRef = useRef(false);

  // Store action refs
  const updateGameTime = useSessionStore((s) => s.updateGameTime);
  const setPlayers = useSessionStore((s) => s.setPlayers);
  const upsertCharacter = useCharacterStore((s) => s.upsertCharacter);
  const addDiceResult = useDiceStore((s) => s.addResult);
  const applyMarkerAdded = useMapStore((s) => s.applyMarkerAdded);
  const applyMarkerUpdated = useMapStore((s) => s.applyMarkerUpdated);
  const applyMarkerRemoved = useMapStore((s) => s.applyMarkerRemoved);
  const applyMapImageSet = useMapStore((s) => s.applyMapImageSet);
  const setAudioPlaying = useAudioStore((s) => s.setPlaying);
  const setAudioStopped = useAudioStore((s) => s.setStopped);
  const setAudioVolume = useAudioStore((s) => s.setVolume);
  const triggerSfx = useAudioStore((s) => s.triggerSfx);
  const applyTreeUpdate = useTreeStore((s) => s.applyTreeUpdate);

  useEffect(() => {
    if (!token) {
      socketService.disconnect();
      connectedRef.current = false;
      return;
    }

    const socket = socketService.connect();
    if (!socket) return;

    // ── Connection events ──
    socket.on('connect', () => {
      console.log('[Socket] Connected:', socket.id);
      connectedRef.current = true;
    });

    socket.on('disconnect', (reason: string) => {
      console.log('[Socket] Disconnected:', reason);
      connectedRef.current = false;
    });

    socket.on('connect_error', (err: Error) => {
      console.error('[Socket] Connection error:', err.message);
    });

    // ── Room events ──
    socket.on('room:player-count', (data: { count: number }) => {
      // Update player count — build slots array from count
      const slots = Array.from({ length: data.count }, (_, i) => ({
        userId: `player-${i}`,
        characterId: null,
        playerCode: '',
        status: 'active' as const,
        joinedAt: new Date().toISOString(),
      }));
      setPlayers(slots);
    });

    socket.on('room:time-advanced', (data: { gameTime: { day: number; month: number; year: number } }) => {
      updateGameTime(data.gameTime);
    });

    // ── Character events ──
    socket.on('character:updated', (data: { characterId: string; updates: Record<string, unknown>; updatedBy: string }) => {
      // Merge updates into existing character
      const chars = useCharacterStore.getState().characters;
      const existing = chars[data.characterId];
      if (existing) {
        upsertCharacter({ ...existing, ...data.updates } as typeof existing);
      }
    });

    socket.on('character:synced', (data: { character: any }) => {
      upsertCharacter(data.character);
    });

    // ── Dice events ──
    socket.on('dice:result', (data: {
      id: string;
      dieType: string;
      result: number;
      signature: string;
      timestamp: string;
      rolledBy: string;
      rolledByUserId: string;
    }) => {
      console.log('[Socket] dice:result received', data);
      addDiceResult({
        id: data.id,
        dieType: data.dieType as any,
        result: data.result,
        signature: data.signature,
        timestamp: data.timestamp,
        rolledBy: data.rolledBy,
        rolledByUserId: data.rolledByUserId,
        isLocal: false,
      });
    });

    // ── Map events ──
    socket.on('map:marker-added', (data: { marker: any }) => {
      applyMarkerAdded(data.marker);
    });

    socket.on('map:marker-updated', (data: { marker: any }) => {
      applyMarkerUpdated(data.marker);
    });

    socket.on('map:marker-removed', (data: { markerId: string }) => {
      applyMarkerRemoved(data.markerId);
    });

    socket.on('map:image-set', (data: { imageUrl: string | null }) => {
      applyMapImageSet(data.imageUrl);
    });

    // ── Audio events ──
    socket.on('audio:ambient-playing', (data: { preset: string; volume: number }) => {
      setAudioPlaying(data.preset, data.volume);
    });

    socket.on('audio:ambient-stopped', () => {
      setAudioStopped();
    });

    socket.on('audio:ambient-volume-changed', (data: { volume: number }) => {
      setAudioVolume(data.volume);
    });

    socket.on('audio:sfx-triggered', (data: { preset: string }) => {
      triggerSfx(data.preset);
    });

    // ── Tree events ──
    socket.on('tree:updated', (data: { tree: any }) => {
      applyTreeUpdate(data.tree);
    });

    return () => {
      socket.removeAllListeners();
      socketService.disconnect();
      connectedRef.current = false;
    };
  }, [
    token,
    updateGameTime,
    setPlayers,
    upsertCharacter,
    addDiceResult,
    applyMarkerAdded,
    applyMarkerUpdated,
    applyMarkerRemoved,
    applyMapImageSet,
    setAudioPlaying,
    setAudioStopped,
    setAudioVolume,
    triggerSfx,
    applyTreeUpdate,
  ]);

  const joinRoom = useCallback((roomId: string) => {
    const socket = socketService.instance;
    socket?.emit('room:join', { roomId });
  }, []);

  const leaveRoom = useCallback((roomId: string) => {
    const socket = socketService.instance;
    socket?.emit('room:leave', { roomId });
  }, []);

  return {
    joinRoom,
    leaveRoom,
    isConnected: connectedRef.current,
  };
}
