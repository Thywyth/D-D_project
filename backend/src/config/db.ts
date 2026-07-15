import mongoose from 'mongoose';
import { env } from './env.js';

const RETRY_DELAY_MS = 5000;
const MAX_RETRIES = 5;

export async function connectDB(retryCount = 0): Promise<void> {
  try {
    await mongoose.connect(env.MONGODB_URI, {
      dbName: 'dnd-vtt',
    });
    console.log('[MongoDB] Connected successfully.');
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error(`[MongoDB] Connection failed (attempt ${retryCount + 1}/${MAX_RETRIES}): ${message}`);

    if (retryCount < MAX_RETRIES - 1) {
      console.log(`[MongoDB] Retrying in ${RETRY_DELAY_MS / 1000}s...`);
      await new Promise((resolve) => setTimeout(resolve, RETRY_DELAY_MS));
      return connectDB(retryCount + 1);
    }

    throw new Error(`[MongoDB] Failed to connect after ${MAX_RETRIES} attempts.`);
  }
}

// Connection event listeners
mongoose.connection.on('connected', () => {
  console.log('[MongoDB] Mongoose connection established.');
});

mongoose.connection.on('disconnected', () => {
  console.warn('[MongoDB] Mongoose connection lost.');
});

mongoose.connection.on('error', (err) => {
  console.error('[MongoDB] Mongoose connection error:', err.message);
});

// Graceful disconnect
export async function disconnectDB(): Promise<void> {
  await mongoose.disconnect();
  console.log('[MongoDB] Disconnected gracefully.');
}
