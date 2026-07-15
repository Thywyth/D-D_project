import mongoose, { Schema, type Document, type Model } from 'mongoose';

// ─── Sub-document Interfaces ──────────────────────────────────────

interface IPlayerSlotDoc {
  userId: mongoose.Types.ObjectId | null;
  characterId: mongoose.Types.ObjectId | null;
  playerCode: string;
  status: 'active' | 'dead' | 'archived' | 'pending';
  joinedAt: Date | null;
}

interface IGameTimeDoc {
  day: number;
  month: number;
  year: number;
}

interface IAudioPresetDoc {
  id: string;
  name: string;
  url: string;
  type: 'ambient' | 'sfx';
}

interface IMapDoc {
  id: string;
  name: string;
  imageUrl: string;
}

// ─── Room Document Interface ──────────────────────────────────────

export interface IRoomDocument extends Document {
  _id: mongoose.Types.ObjectId;
  name: string;
  roomCode: string;
  dmUserId: mongoose.Types.ObjectId;
  playerSlots: IPlayerSlotDoc[];
  gameTime: IGameTimeDoc;
  maps: IMapDoc[];
  activeMapId: string | null;
  audioPresets: IAudioPresetDoc[];
  createdAt: Date;
  updatedAt: Date;
}

// ─── Sub-schemas ──────────────────────────────────────────────────

const playerSlotSchema = new Schema<IPlayerSlotDoc>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    characterId: {
      type: Schema.Types.ObjectId,
      ref: 'Character',
      default: null,
    },
    playerCode: {
      type: String,
      required: true,
    },
    status: {
      type: String,
      enum: ['active', 'dead', 'archived', 'pending'],
      default: 'pending',
    },
    joinedAt: {
      type: Date,
      default: null,
    },
  },
  { _id: false },
);

const gameTimeSchema = new Schema<IGameTimeDoc>(
  {
    day: { type: Number, default: 1, min: 1, max: 31 },
    month: { type: Number, default: 1, min: 1, max: 12 },
    year: { type: Number, default: 1490 }, // Default Forgotten Realms year
  },
  { _id: false },
);

const audioPresetSchema = new Schema<IAudioPresetDoc>(
  {
    id: { type: String, required: true },
    name: { type: String, required: true },
    url: { type: String, required: false, default: '' }, // <--- ОСЬ ЦЕЙ РЯДОК ЗМІНЕНО
    type: {
      type: String,
      enum: ['ambient', 'sfx'],
      required: true,
    },
  },
  { _id: false },
);

const mapSubSchema = new Schema<IMapDoc>({
  id: { type: String, required: true },
  name: { type: String, required: true },
  imageUrl: { type: String, required: true }
}, { _id: false });

// ─── Room Schema ──────────────────────────────────────────────────

const roomSchema = new Schema<IRoomDocument>(
  {
    name: {
      type: String,
      required: [true, "Назва кімнати обов'язкова"],
      trim: true,
      minlength: [2, 'Мінімум 2 символи'],
      maxlength: [60, 'Максимум 60 символів'],
    },
    roomCode: {
      type: String,
      required: true,
      unique: true,
      uppercase: true,
      match: [/^[A-Z0-9]{6}$/, 'Код кімнати має бути 6 символів (A-Z, 0-9)'],
    },
    dmUserId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    playerSlots: {
      type: [playerSlotSchema],
      default: [],
    },
    gameTime: {
      type: gameTimeSchema,
      default: () => ({ day: 1, month: 1, year: 1490 }),
    },
    maps: {
      type: [mapSubSchema],
      default: [],
    },
    activeMapId: {
      type: String,
      default: null,
    },
    audioPresets: {
      type: [audioPresetSchema],
      default: () => [
        // ── Ambient (22 custom tracks) ──
        { id: 'battle_dragon', name: 'Битва (Дракон)', url: '/audio/ambient/Битва_дракон.mp3', type: 'ambient' },
        { id: 'battle_mass', name: 'Масова битва', url: '/audio/ambient/Битва_масова.mp3', type: 'ambient' },
        { id: 'battle_undead', name: 'Битва (Нечисть)', url: '/audio/ambient/Битва_нечисть.mp3', type: 'ambient' },
        { id: 'battle_blizzard', name: 'Битва (Хуртовина)', url: '/audio/ambient/Битва_хуртовина.mp3', type: 'ambient' },
        { id: 'battle_storm', name: 'Битва (Шторм)', url: '/audio/ambient/Битва_шторм.mp3', type: 'ambient' },
        { id: 'haunted_tower', name: 'Вежа з привидами', url: '/audio/ambient/Вежа_з_привидами.mp3', type: 'ambient' },
        { id: 'windy', name: 'Вітряно', url: '/audio/ambient/Вітряно.mp3', type: 'ambient' },
        { id: 'burning_building', name: 'Горяща будівля', url: '/audio/ambient/Горяща_будівля.mp3', type: 'ambient' },
        { id: 'rainy_village', name: 'Дощове селище', url: '/audio/ambient/Дощове_селище.mp3', type: 'ambient' },
        { id: 'rulers_office', name: 'Кабінет правителя', url: '/audio/ambient/Кабінет_правителя.mp3', type: 'ambient' },
        { id: 'caravan', name: 'Караван', url: '/audio/ambient/Караван.mp3', type: 'ambient' },
        { id: 'tavern1', name: 'Корчма 1', url: '/audio/ambient/Корчма1.mp3', type: 'ambient' },
        { id: 'tavern2', name: 'Корчма 2', url: '/audio/ambient/Корчма2.mp3', type: 'ambient' },
        { id: 'heavens', name: 'Небеса', url: '/audio/ambient/Небеса.mp3', type: 'ambient' },
        { id: 'night', name: 'Ніч', url: '/audio/ambient/Ніч.mp3', type: 'ambient' },
        { id: 'night_campfire1', name: 'Нічний костер 1', url: '/audio/ambient/Нічний_костер1.mp3', type: 'ambient' },
        { id: 'night_campfire2', name: 'Нічний костер 2', url: '/audio/ambient/Нічний_костер2.mp3', type: 'ambient' },
        { id: 'night_leaves', name: 'Нічний ліс', url: '/audio/ambient/Нічний_лист.mp3', type: 'ambient' },
        { id: 'hellish_creatures', name: 'Пекельні тварі', url: '/audio/ambient/Пекельні_тварі.mp3', type: 'ambient' },
        { id: 'pharaohs_chambers', name: 'Покої фараона', url: '/audio/ambient/Покої_фараона.mp3', type: 'ambient' },
        { id: 'dark_caves', name: 'Темні печери', url: '/audio/ambient/Темні_печери.mp3', type: 'ambient' },
        { id: 'festival', name: 'Фестиваль', url: '/audio/ambient/Фестиваль.mp3', type: 'ambient' },
        // ── SFX (one-shot triggers) ──
        { id: 'dragon_roar', name: 'Рев дракона', url: '/audio/effects/dragon-roar.wav', type: 'sfx' },
        { id: 'sword_clash', name: 'Зіткнення мечів', url: '/audio/effects/sword-01.wav', type: 'sfx' },
        { id: 'thunder', name: 'Грім', url: '/audio/effects/thunder.wav', type: 'sfx' },
        { id: 'magic_cast', name: 'Заклинання', url: '/audio/effects/magic-spell.wav', type: 'sfx' },
        { id: 'door_open', name: 'Двері', url: '/audio/effects/door-knocking.wav', type: 'sfx' },
        { id: 'explosion', name: 'Вибух', url: '/audio/effects/explosion_01.wav', type: 'sfx' },
        { id: 'healing', name: 'Зцілення', url: '/audio/effects/health-pickup.wav', type: 'sfx' },
        { id: 'death', name: 'Смерть', url: '/audio/effects/death.wav', type: 'sfx' },
        { id: 'coins', name: 'Монети', url: '/audio/effects/coin-dropping.wav', type: 'sfx' },
        { id: 'bell', name: 'Дзвін', url: '/audio/effects/door_bell.wav', type: 'sfx' },
        { id: 'scream', name: 'Крик', url: '/audio/effects/scream.mp3', type: 'sfx' },
        { id: 'footsteps', name: 'Кроки', url: '/audio/effects/footsteps-1.wav', type: 'sfx' },
        { id: 'fireball', name: 'Файрбол', url: '/audio/effects/fireball-skill.wav', type: 'sfx' }
      ],
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

// Indexes
roomSchema.index({ dmUserId: 1 });
roomSchema.index({ 'playerSlots.userId': 1 });
roomSchema.index({ 'playerSlots.playerCode': 1 });

export const Room: Model<IRoomDocument> = mongoose.model<IRoomDocument>(
  'Room',
  roomSchema,
);
