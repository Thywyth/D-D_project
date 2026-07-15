/** Room / Session types */
import type { IMap } from './map.js';

export type PlayerSlotStatus = 'active' | 'dead' | 'archived' | 'pending';

export interface IPlayerSlot {
  userId: string | null;
  characterId: string | null;
  playerCode: string;
  status: PlayerSlotStatus;
  joinedAt: string | null;
}

export interface IGameTime {
  day: number;
  month: number;
  year: number;
}

export interface IAudioPreset {
  id: string;
  name: string;
  url: string;
  type: 'ambient' | 'sfx';
}

export interface IRoom {
  _id: string;
  name: string;
  roomCode: string;
  dmUserId: string;
  playerSlots: IPlayerSlot[];
  gameTime: IGameTime;
  maps: IMap[];
  activeMapId: string | null;
  audioPresets: IAudioPreset[];
  createdAt: string;
  updatedAt: string;
}

/** Room creation payload */
export interface CreateRoomPayload {
  name: string;
}

/** Join room payload */
export interface JoinRoomPayload {
  roomCode: string;
  playerCode: string;
}

/** Time advance payload */
export interface AdvanceTimePayload {
  days?: number;
  months?: number;
}

/** Room summary for lobby cards */
export interface IRoomSummary {
  _id: string;
  name: string;
  roomCode: string;
  role: 'dm' | 'player';
  characterName: string | null;
  playerCount: number;
  gameTime: IGameTime;
  updatedAt: string;
}
