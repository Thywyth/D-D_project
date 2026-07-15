import mongoose, { Schema, type Document, type Model } from 'mongoose';

interface IToDoItemDoc {
  id: string;
  text: string;
  isCompleted: boolean;
  isFavorite: boolean;
  createdAt: string;
}

export interface INotebookDocument extends Document {
  _id: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  roomId: mongoose.Types.ObjectId;
  type: 'dm' | 'player';
  title: string;
  /** Array of To-Do items */
  content: IToDoItemDoc[];
  createdAt: Date;
  updatedAt: Date;
}

const notebookSchema = new Schema<INotebookDocument>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    roomId: {
      type: Schema.Types.ObjectId,
      ref: 'Room',
      required: true,
      index: true,
    },
    type: {
      type: String,
      enum: ['dm', 'player'],
      required: true,
    },
    title: {
      type: String,
      default: 'Нотатки',
      trim: true,
      maxlength: [100, 'Максимум 100 символів'],
    },
    content: {
      type: [new Schema<IToDoItemDoc>({
        id: { type: String, required: true },
        text: { type: String, required: true, trim: true },
        isCompleted: { type: Boolean, default: false },
        isFavorite: { type: Boolean, default: false },
        createdAt: { type: String, required: true },
      }, { _id: false })],
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

// Unique compound index: one notebook per user per room per type
notebookSchema.index({ userId: 1, roomId: 1, type: 1 }, { unique: true });

export const Notebook: Model<INotebookDocument> =
  mongoose.model<INotebookDocument>('Notebook', notebookSchema);
