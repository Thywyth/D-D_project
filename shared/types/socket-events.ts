/** Socket.IO event type definitions for real-time communication */

import type { DiceRollResult, DiceRollPayload } from './dice.js';
import type { ICharacter, InventoryTransferPayload, UpdateCharacterPayload } from './character.js';
import type { IMapMarker, CreateMarkerPayload, UpdateMarkerPayload } from './map.js';
import type {
  IFamilyTree,
  AddTreeNodePayload,
  UpdateTreeNodePayload,
  SaveNodeNotePayload,
} from './tree.js';
import type { IGameTime, AdvanceTimePayload } from './room.js';

// ─── Client → Server Events ──────────────────────────────────────

export interface ClientToServerEvents {
  // Room
  'room:join': (data: { roomId: string }) => void;
  'room:leave': (data: { roomId: string }) => void;
  'room:advance-time': (data: AdvanceTimePayload & { roomId: string }) => void;

  // Character
  'character:update': (data: {
    characterId: string;
    updates: UpdateCharacterPayload;
  }) => void;
  'character:request-sync': (data: { characterId: string }) => void;

  // Inventory Transfer
  'inventory:transfer': (data: InventoryTransferPayload) => void;

  // Map
  'map:set-image': (data: { roomId: string; imageUrl: string }) => void;
  'map:add-marker': (data: CreateMarkerPayload) => void;
  'map:update-marker': (data: { markerId: string; updates: UpdateMarkerPayload }) => void;
  'map:remove-marker': (data: { markerId: string; roomId: string }) => void;

  // Family Tree
  'tree:add-node': (data: AddTreeNodePayload) => void;
  'tree:update-node': (data: {
    treeId: string;
    nodeId: string;
    updates: UpdateTreeNodePayload;
  }) => void;
  'tree:remove-node': (data: { treeId: string; nodeId: string }) => void;
  'tree:toggle-visibility': (data: {
    treeId: string;
    nodeId: string;
    hidden: boolean;
  }) => void;
  'tree:save-note': (data: SaveNodeNotePayload) => void;

  // Audio
  'audio:play-ambient': (data: {
    roomId: string;
    preset: string;
    volume: number;
  }) => void;
  'audio:stop-ambient': (data: { roomId: string }) => void;
  'audio:set-ambient-volume': (data: { roomId: string; volume: number }) => void;
  'audio:trigger-sfx': (data: {
    roomId: string;
    preset: string;
    volume: number;
  }) => void;

  // Dice
  'dice:roll': (data: DiceRollPayload) => void;
}

// ─── Server → Client Events ──────────────────────────────────────

export interface ServerToClientEvents {
  // Room
  'room:joined': (data: {
    roomId: string;
    userId: string;
    username: string;
  }) => void;
  'room:left': (data: { roomId: string; userId: string }) => void;
  'room:time-advanced': (data: {
    roomId: string;
    gameTime: IGameTime;
    agedCharacters: Array<{ characterId: string; newAge: number }>;
    agedNodes: Array<{ treeId: string; nodeId: string; newAge: number }>;
  }) => void;
  'room:player-count': (data: { roomId: string; count: number }) => void;
  'room:error': (data: { message: string }) => void;

  // Character
  'character:updated': (data: {
    characterId: string;
    updates: Partial<ICharacter>;
    updatedBy: string;
  }) => void;
  'character:status-changed': (data: {
    characterId: string;
    status: ICharacter['status'];
    updatedBy: string;
  }) => void;
  'character:synced': (data: { character: ICharacter }) => void;

  // Inventory Transfer
  'inventory:transfer-complete': (data: {
    fromCharacterId: string;
    toCharacterId: string;
    fromInventory: ICharacter['inventory'];
    fromCoins: ICharacter['coins'];
    toInventory: ICharacter['inventory'];
    toCoins: ICharacter['coins'];
  }) => void;
  'inventory:transfer-error': (data: { message: string }) => void;

  // Map
  'map:image-set': (data: { roomId: string; imageUrl: string }) => void;
  'map:marker-added': (data: { marker: IMapMarker }) => void;
  'map:marker-updated': (data: { marker: IMapMarker }) => void;
  'map:marker-removed': (data: { markerId: string; roomId: string }) => void;

  // Family Tree
  'tree:updated': (data: { tree: IFamilyTree }) => void;
  'tree:node-visibility-changed': (data: {
    treeId: string;
    nodeId: string;
    hidden: boolean;
  }) => void;

  // Audio
  'audio:ambient-playing': (data: {
    roomId: string;
    preset: string;
    volume: number;
  }) => void;
  'audio:ambient-stopped': (data: { roomId: string }) => void;
  'audio:ambient-volume-changed': (data: {
    roomId: string;
    volume: number;
  }) => void;
  'audio:sfx-triggered': (data: {
    roomId: string;
    preset: string;
    volume: number;
  }) => void;

  // Dice
  'dice:result': (data: DiceRollResult) => void;
}

// ─── Inter-Server Events ──────────────────────────────────────────

export interface InterServerEvents {
  ping: () => void;
}

// ─── Socket Data ──────────────────────────────────────────────────

export interface SocketData {
  userId: string;
  username: string;
}
