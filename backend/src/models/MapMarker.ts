import mongoose, { Schema, type Document, type Model } from 'mongoose';

export interface IMapMarkerDocument extends Document {
  _id: mongoose.Types.ObjectId;
  roomId: mongoose.Types.ObjectId;
  xPercent: number;
  yPercent: number;
  name: string;
  description: string;
  color: string;
  createdBy: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const mapMarkerSchema = new Schema<IMapMarkerDocument>(
  {
    roomId: {
      type: Schema.Types.ObjectId,
      ref: 'Room',
      required: true,
      index: true,
    },
    xPercent: {
      type: Number,
      required: [true, 'X координата обов\'язкова'],
      min: 0,
      max: 100,
    },
    yPercent: {
      type: Number,
      required: [true, 'Y координата обов\'язкова'],
      min: 0,
      max: 100,
    },
    name: {
      type: String,
      required: [true, "Назва маркера обов'язкова"],
      trim: true,
      maxlength: [60, 'Максимум 60 символів'],
    },
    description: {
      type: String,
      default: '',
      maxlength: [500, 'Максимум 500 символів'],
    },
    color: {
      type: String,
      default: '#f59e0b', // Amber accent
      match: [/^#[0-9A-Fa-f]{6}$/, 'Невірний формат кольору (hex)'],
    },
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
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

// Compound index for room-scoped queries
mapMarkerSchema.index({ roomId: 1, createdAt: -1 });

export const MapMarker: Model<IMapMarkerDocument> =
  mongoose.model<IMapMarkerDocument>('MapMarker', mapMarkerSchema);
