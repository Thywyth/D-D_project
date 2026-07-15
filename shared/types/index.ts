// @dnd-vtt/shared — Type Barrel Export

// ─── Base Types ───────────────────────────────────────────────────
export type UserRole = 'dm' | 'player';
export type CharacterStatus = 'alive' | 'dead' | 'archived';
export type DieType = 'd4' | 'd6' | 'd8' | 'd12' | 'd20' | 'd100';

export interface Timestamps {
  createdAt: string;
  updatedAt: string;
}

// ─── Re-exports ───────────────────────────────────────────────────
export type {
  IUser,
  IUserPublic,
  LoginPayload,
  RegisterPayload,
  AuthResponse,
  JwtPayload,
} from './user.js';

export type {
  IRoom,
  IRoomSummary,
  IPlayerSlot,
  IGameTime,
  IAudioPreset,
  PlayerSlotStatus,
  CreateRoomPayload,
  JoinRoomPayload,
  AdvanceTimePayload,
} from './room.js';

export type {
  ICharacter,
  AbilityName,
  IAbilityScore,
  AbilityScores,
  SkillName,
  ISkill,
  Skills,
  ISavingThrow,
  SavingThrows,
  IDeathSaves,
  IHitDice,
  ICoins,
  IInventoryItem,
  CreateCharacterPayload,
  UpdateCharacterPayload,
  InventoryTransferPayload,
} from './character.js';

export type {
  IMap,
  IMapMarker,
  CreateMarkerPayload,
  UpdateMarkerPayload,
} from './map.js';

export type {
  IFamilyTree,
  ITreeNode,
  ITreeNodeNote,
  TreeNodeType,
  CreateTreePayload,
  AddTreeNodePayload,
  UpdateTreeNodePayload,
  SaveNodeNotePayload,
} from './tree.js';

export type {
  INotebook,
  NotebookType,
  IToDoItem,
  SaveNotebookPayload,
} from './notebook.js';

export type {
  IDiceRoll,
  DiceRollPayload,
  DiceRollResult,
} from './dice.js';

export {
  DICE_RANGES,
} from './dice.js';

export type {
  RBACCategory,
  RBACCheck,
  RBACResult,
} from './rbac.js';

export {
  RBAC_MATRIX,
  RBAC_META_FIELDS,
  FIELD_CATEGORY_MAP,
  checkRBAC,
} from './rbac.js';

export type {
  ClientToServerEvents,
  ServerToClientEvents,
  InterServerEvents,
  SocketData,
} from './socket-events.js';
