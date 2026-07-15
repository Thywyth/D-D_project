/** D&D 5e Character Sheet — Full Type Definitions */

import type { CharacterStatus } from './index.js';

// ─── Ability Scores ───────────────────────────────────────────────
export type AbilityName = 'STR' | 'DEX' | 'CON' | 'INT' | 'WIS' | 'CHA';

export interface IAbilityScore {
  score: number;
  modifier: number;
}

export type AbilityScores = Record<AbilityName, IAbilityScore>;

// ─── Skills ───────────────────────────────────────────────────────
export type SkillName =
  | 'acrobatics'
  | 'animalHandling'
  | 'arcana'
  | 'athletics'
  | 'deception'
  | 'history'
  | 'insight'
  | 'intimidation'
  | 'investigation'
  | 'medicine'
  | 'nature'
  | 'perception'
  | 'performance'
  | 'persuasion'
  | 'religion'
  | 'sleightOfHand'
  | 'stealth'
  | 'survival';

export interface ISkill {
  proficient: boolean;
  bonus: number;
}

export type Skills = Record<SkillName, ISkill>;

// ─── Saving Throws ────────────────────────────────────────────────
export interface ISavingThrow {
  proficient: boolean;
  bonus: number;
}

export type SavingThrows = Record<AbilityName, ISavingThrow>;

// ─── Death Saves ──────────────────────────────────────────────────
export interface IDeathSaves {
  successes: number; // 0–3
  failures: number;  // 0–3
}

// ─── Hit Dice ─────────────────────────────────────────────────────
export interface IHitDice {
  total: number;
  current: number;
  dieType: 'd6' | 'd8' | 'd10' | 'd12';
}

// ─── Coins ────────────────────────────────────────────────────────
export interface ICoins {
  cp: number; // Copper
  sp: number; // Silver
  ep: number; // Electrum
  gp: number; // Gold
  pp: number; // Platinum
}

// ─── Inventory Item ───────────────────────────────────────────────
export interface IInventoryItem {
  id: string;
  name: string;
  quantity: number;
  weight: number;
  description: string;
}

// ─── Full Character Sheet ─────────────────────────────────────────
export interface ICharacter {
  _id: string;
  roomId: string;
  userId: string;

  // ── Immutable Fields (set once, editable by NONE) ──
  name: string;
  race: string;
  class: string;
  level: number;
  background: string;
  alignment: string;
  xp: number;
  armorClass: number;
  initiative: number;
  speed: number;
  personalityTraits: string;
  ideals: string;
  bonds: string;
  flaws: string;

  // ── DM Mutable Only (read-only for Player) ──
  attributes: AbilityScores;
  proficiencyBonus: number;
  inspiration: boolean;
  passiveWisdom: number;
  hitDice: IHitDice;
  deathSaves: IDeathSaves;

  // ── Player Mutable Only (read-only for DM) ──
  savingThrows: SavingThrows;
  skills: Skills;
  currentHP: number;
  maxHP: number;
  tempHP: number;
  featuresTraits: string[];
  languages: string[];
  toolProficiencies: string[];

  // ── Shared / Transactional Mutable ──
  inventory: IInventoryItem[];
  coins: ICoins;

  // ── Meta ──
  age: number | null;
  status: CharacterStatus;
  createdAt: string;
  updatedAt: string;
}

// ─── Character Creation Payload ───────────────────────────────────
/** Immutable fields set at creation time */
export interface CreateCharacterPayload {
  roomId: string;
  name: string;
  race: string;
  class: string;
  level: number;
  background: string;
  alignment: string;
  xp: number;
  armorClass: number;
  initiative: number;
  speed: number;
  personalityTraits: string;
  ideals: string;
  bonds: string;
  flaws: string;
  age: number | null;
  maxHP: number;
}

// ─── Character Update Payload ─────────────────────────────────────
/** Partial update — server validates RBAC per field */
export type UpdateCharacterPayload = Partial<
  Omit<ICharacter, '_id' | 'roomId' | 'userId' | 'createdAt' | 'updatedAt' | 'status'>
>;

// ─── Inventory Transfer ───────────────────────────────────────────
export interface InventoryTransferPayload {
  fromCharacterId: string;
  toCharacterId: string;
  items: Array<{ itemId: string; quantity: number }>;
  coins: Partial<ICoins>;
}
