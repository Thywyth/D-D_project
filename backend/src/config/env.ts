import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.resolve(__dirname, '../../../.env') });

interface EnvConfig {
  readonly MONGODB_URI: string;
  readonly JWT_SECRET: string;
  readonly PORT: number;
  readonly NODE_ENV: 'development' | 'production' | 'test';
  readonly CORS_ORIGIN: string;
}

function requireEnv(key: string): string {
  const value = process.env[key];
  if (value === undefined || value === '') {
    throw new Error(`[Config] Missing required environment variable: ${key}`);
  }
  return value;
}

function optionalEnv(key: string, defaultValue: string): string {
  return process.env[key] ?? defaultValue;
}

export const env: EnvConfig = {
  MONGODB_URI: requireEnv('MONGODB_URI'),
  JWT_SECRET: requireEnv('JWT_SECRET'),
  PORT: parseInt(optionalEnv('PORT', '3001'), 10),
  NODE_ENV: optionalEnv('NODE_ENV', 'development') as EnvConfig['NODE_ENV'],
  CORS_ORIGIN: optionalEnv('CORS_ORIGIN', 'http://localhost:5173'),
} as const;

// Validate PORT is a valid number
if (isNaN(env.PORT) || env.PORT < 1 || env.PORT > 65535) {
  throw new Error(
    `[Config] Invalid PORT value: ${process.env['PORT']}. Must be between 1 and 65535.`
  );
}

console.log(`[Config] Environment loaded: ${env.NODE_ENV}, Port: ${env.PORT}`);
