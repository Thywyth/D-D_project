import mongoose, { Schema, type Document, type Model } from 'mongoose';
import bcrypt from 'bcryptjs';

const SALT_ROUNDS = 12;

export interface IUserDocument extends Document {
  _id: mongoose.Types.ObjectId;
  username: string;
  email: string;
  passwordHash: string;
  createdAt: Date;
  updatedAt: Date;
  comparePassword(candidatePassword: string): Promise<boolean>;
}

const userSchema = new Schema<IUserDocument>(
  {
    username: {
      type: String,
      required: [true, "Ім'я користувача обов'язкове"],
      unique: true,
      trim: true,
      minlength: [2, "Ім'я має містити мінімум 2 символи"],
      maxlength: [30, "Ім'я має містити максимум 30 символів"],
    },
    email: {
      type: String,
      required: [true, "Email обов'язковий"],
      unique: true,
      trim: true,
      lowercase: true,
      match: [/^[^\s@]+@[^\s@]+\.[^\s@]+$/, 'Невірний формат email'],
    },
    passwordHash: {
      type: String,
      required: true,
      select: false, // Never return password hash in queries by default
    },
  },
  {
    timestamps: true,
    toJSON: {
      transform(_doc, ret: Record<string, unknown>) {
        delete ret['passwordHash'];
        delete ret['__v'];
        return ret;
      },
    },
  },
);

// Pre-save hook: hash password before storing
userSchema.pre('save', async function () {
  if (!this.isModified('passwordHash')) return;
  this.passwordHash = await bcrypt.hash(this.passwordHash, SALT_ROUNDS);
});

// Instance method: compare candidate password against stored hash
userSchema.methods.comparePassword = async function (
  candidatePassword: string,
): Promise<boolean> {
  return bcrypt.compare(candidatePassword, this.passwordHash);
};

// Indexes
userSchema.index({ email: 1 }, { unique: true });
userSchema.index({ username: 1 }, { unique: true });

export const User: Model<IUserDocument> = mongoose.model<IUserDocument>(
  'User',
  userSchema,
);
