import mongoose, { Schema, type Document, type Model } from 'mongoose';

// ─── Sub-document Interfaces ──────────────────────────────────────

interface IAbilityScoreDoc {
  score: number;
  modifier: number;
}

interface ISkillDoc {
  proficient: boolean;
  bonus: number;
}

interface ISavingThrowDoc {
  proficient: boolean;
  bonus: number;
}

interface IDeathSavesDoc {
  successes: number;
  failures: number;
}

interface IHitDiceDoc {
  total: number;
  current: number;
  dieType: 'd6' | 'd8' | 'd10' | 'd12';
}

interface ICoinsDoc {
  cp: number;
  sp: number;
  ep: number;
  gp: number;
  pp: number;
}

interface IInventoryItemDoc {
  id: string;
  name: string;
  quantity: number;
  weight: number;
  description: string;
}

// ─── Character Document Interface ─────────────────────────────────

export interface ICharacterDocument extends Document {
  _id: mongoose.Types.ObjectId;
  roomId: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;

  // Immutable
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

  // DM Mutable Only
  attributes: Record<string, IAbilityScoreDoc>;
  proficiencyBonus: number;
  inspiration: boolean;
  passiveWisdom: number;
  hitDice: IHitDiceDoc;
  deathSaves: IDeathSavesDoc;

  // Player Mutable Only
  savingThrows: Record<string, ISavingThrowDoc>;
  skills: Record<string, ISkillDoc>;
  currentHP: number;
  maxHP: number;
  tempHP: number;
  featuresTraits: string[];
  languages: string[];
  toolProficiencies: string[];

  // Shared Mutable
  inventory: IInventoryItemDoc[];
  coins: ICoinsDoc;

  // Meta
  age: number | null;
  status: 'alive' | 'dead' | 'archived';
  createdAt: Date;
  updatedAt: Date;
}

// ─── Sub-schemas ──────────────────────────────────────────────────

const deathSavesSchema = new Schema<IDeathSavesDoc>(
  {
    successes: { type: Number, default: 0, min: 0, max: 3 },
    failures: { type: Number, default: 0, min: 0, max: 3 },
  },
  { _id: false },
);

const hitDiceSchema = new Schema<IHitDiceDoc>(
  {
    total: { type: Number, default: 1, min: 0 },
    current: { type: Number, default: 1, min: 0 },
    dieType: {
      type: String,
      enum: ['d6', 'd8', 'd10', 'd12'],
      default: 'd8',
    },
  },
  { _id: false },
);

const coinsSchema = new Schema<ICoinsDoc>(
  {
    cp: { type: Number, default: 0, min: 0 },
    sp: { type: Number, default: 0, min: 0 },
    ep: { type: Number, default: 0, min: 0 },
    gp: { type: Number, default: 0, min: 0 },
    pp: { type: Number, default: 0, min: 0 },
  },
  { _id: false },
);

const inventoryItemSchema = new Schema<IInventoryItemDoc>(
  {
    id: { type: String, required: true },
    name: { type: String, required: true, trim: true },
    quantity: { type: Number, default: 1, min: 0 },
    weight: { type: Number, default: 0, min: 0 },
    description: { type: String, default: '' },
  },
  { _id: false },
);

// ─── Default Ability Score Factory ────────────────────────────────

function defaultAbilityScores(): Record<string, IAbilityScoreDoc> {
  return {
    STR: { score: 10, modifier: 0 },
    DEX: { score: 10, modifier: 0 },
    CON: { score: 10, modifier: 0 },
    INT: { score: 10, modifier: 0 },
    WIS: { score: 10, modifier: 0 },
    CHA: { score: 10, modifier: 0 },
  };
}

function defaultSavingThrows(): Record<string, ISavingThrowDoc> {
  return {
    STR: { proficient: false, bonus: 0 },
    DEX: { proficient: false, bonus: 0 },
    CON: { proficient: false, bonus: 0 },
    INT: { proficient: false, bonus: 0 },
    WIS: { proficient: false, bonus: 0 },
    CHA: { proficient: false, bonus: 0 },
  };
}

function defaultSkills(): Record<string, ISkillDoc> {
  const skillNames = [
    'acrobatics', 'animalHandling', 'arcana', 'athletics',
    'deception', 'history', 'insight', 'intimidation',
    'investigation', 'medicine', 'nature', 'perception',
    'performance', 'persuasion', 'religion', 'sleightOfHand',
    'stealth', 'survival',
  ];
  const result: Record<string, ISkillDoc> = {};
  for (const skill of skillNames) {
    result[skill] = { proficient: false, bonus: 0 };
  }
  return result;
}

// ─── Character Schema ─────────────────────────────────────────────

const characterSchema = new Schema<ICharacterDocument>(
  {
    roomId: {
      type: Schema.Types.ObjectId,
      ref: 'Room',
      required: true,
      index: true,
    },
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },

    // ── Immutable Fields ──
    name: {
      type: String,
      required: [true, "Ім'я персонажа обов'язкове"],
      trim: true,
      maxlength: [50, 'Максимум 50 символів'],
    },
    race: {
      type: String,
      required: [true, "Раса обов'язкова"],
      trim: true,
    },
    class: {
      type: String,
      required: [true, "Клас обов'язковий"],
      trim: true,
    },
    level: {
      type: Number,
      required: true,
      default: 1,
      min: 1,
      max: 20,
    },
    background: {
      type: String,
      required: [true, "Передісторія обов'язкова"],
      trim: true,
    },
    alignment: {
      type: String,
      required: [true, "Світогляд обов'язковий"],
      trim: true,
    },
    xp: {
      type: Number,
      default: 0,
      min: 0,
    },
    armorClass: {
      type: Number,
      required: true,
      default: 10,
      min: 0,
    },
    initiative: {
      type: Number,
      default: 0,
    },
    speed: {
      type: Number,
      required: true,
      default: 30,
      min: 0,
    },
    personalityTraits: {
      type: String,
      default: '',
    },
    ideals: {
      type: String,
      default: '',
    },
    bonds: {
      type: String,
      default: '',
    },
    flaws: {
      type: String,
      default: '',
    },

    // ── DM Mutable Only ──
    attributes: {
      type: Schema.Types.Mixed,
      default: defaultAbilityScores,
    },
    proficiencyBonus: {
      type: Number,
      default: 2,
      min: 0,
    },
    inspiration: {
      type: Boolean,
      default: false,
    },
    passiveWisdom: {
      type: Number,
      default: 10,
    },
    hitDice: {
      type: hitDiceSchema,
      default: () => ({ total: 1, current: 1, dieType: 'd8' }),
    },
    deathSaves: {
      type: deathSavesSchema,
      default: () => ({ successes: 0, failures: 0 }),
    },

    // ── Player Mutable Only ──
    savingThrows: {
      type: Schema.Types.Mixed,
      default: defaultSavingThrows,
    },
    skills: {
      type: Schema.Types.Mixed,
      default: defaultSkills,
    },
    currentHP: {
      type: Number,
      default: 10,
      min: 0,
    },
    maxHP: {
      type: Number,
      required: true,
      default: 10,
      min: 1,
    },
    tempHP: {
      type: Number,
      default: 0,
      min: 0,
    },
    featuresTraits: {
      type: [String],
      default: [],
    },
    languages: {
      type: [String],
      default: ['Спільна'],
    },
    toolProficiencies: {
      type: [String],
      default: [],
    },

    // ── Shared Mutable ──
    inventory: {
      type: [inventoryItemSchema],
      default: [],
    },
    coins: {
      type: coinsSchema,
      default: () => ({ cp: 0, sp: 0, ep: 0, gp: 0, pp: 0 }),
    },

    // ── Meta ──
    age: {
      type: Number,
      default: null,
    },
    status: {
      type: String,
      enum: ['alive', 'dead', 'archived'],
      default: 'alive',
      index: true,
    },
  },
  {
    timestamps: true,
    toJSON: {
      transform(_doc, ret: Record<string, unknown>) {
        delete ret['__v'];
        return ret;
      },
    },
  },
);

// Compound indexes
characterSchema.index({ roomId: 1, userId: 1 });
characterSchema.index({ roomId: 1, status: 1 });

export const Character: Model<ICharacterDocument> =
  mongoose.model<ICharacterDocument>('Character', characterSchema);
