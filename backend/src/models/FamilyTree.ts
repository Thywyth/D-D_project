import mongoose, { Schema, type Document, type Model } from 'mongoose';

// ─── Sub-document Interfaces ──────────────────────────────────────

interface ITreeNodeDoc {
  id: string;
  name: string;
  age: number | null;
  type: 'npc' | 'pc';
  parentIds: string[];
  hidden: boolean;
  description: string;
  posX: number;
  posY: number;
}

interface ITreeNodeNoteDoc {
  nodeId: string;
  userId: mongoose.Types.ObjectId;
  content: string;
  updatedAt: Date;
}

// ─── FamilyTree Document Interface ────────────────────────────────

export interface IFamilyTreeDocument extends Document {
  _id: mongoose.Types.ObjectId;
  roomId: mongoose.Types.ObjectId;
  treeName: string;
  nodes: ITreeNodeDoc[];
  nodeNotes: ITreeNodeNoteDoc[];
  createdAt: Date;
  updatedAt: Date;
}

// ─── Sub-schemas ──────────────────────────────────────────────────

const treeNodeSchema = new Schema<ITreeNodeDoc>(
  {
    id: {
      type: String,
      required: true,
    },
    name: {
      type: String,
      required: [true, "Ім'я вузла обов'язкове"],
      trim: true,
      maxlength: [60, 'Максимум 60 символів'],
    },
    age: {
      type: Number,
      default: null,
      min: 0,
    },
    type: {
      type: String,
      enum: ['npc', 'pc'],
      default: 'npc',
    },
    parentIds: {
      type: [String],
      default: [],
    },
    hidden: {
      type: Boolean,
      default: false,
    },
    description: {
      type: String,
      default: '',
      maxlength: [500, 'Максимум 500 символів'],
    },
    posX: {
      type: Number,
      default: 0,
    },
    posY: {
      type: Number,
      default: 0,
    },
  },
  { _id: false },
);

const treeNodeNoteSchema = new Schema<ITreeNodeNoteDoc>(
  {
    nodeId: {
      type: String,
      required: true,
    },
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    content: {
      type: String,
      default: '',
      maxlength: [2000, 'Максимум 2000 символів'],
    },
    updatedAt: {
      type: Date,
      default: Date.now,
    },
  },
  { _id: false },
);

// ─── FamilyTree Schema ────────────────────────────────────────────

const familyTreeSchema = new Schema<IFamilyTreeDocument>(
  {
    roomId: {
      type: Schema.Types.ObjectId,
      ref: 'Room',
      required: true,
      index: true,
    },
    treeName: {
      type: String,
      required: [true, "Назва дерева обов'язкова"],
      trim: true,
      maxlength: [60, 'Максимум 60 символів'],
    },
    nodes: {
      type: [treeNodeSchema],
      default: [],
    },
    nodeNotes: {
      type: [treeNodeNoteSchema],
      default: [],
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

// Compound index
familyTreeSchema.index({ roomId: 1, treeName: 1 });

export const FamilyTree: Model<IFamilyTreeDocument> =
  mongoose.model<IFamilyTreeDocument>('FamilyTree', familyTreeSchema);
