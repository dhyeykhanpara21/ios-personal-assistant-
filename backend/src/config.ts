import dotenv from 'dotenv';
import { z } from 'zod';

dotenv.config();

const trimString = (val: unknown) => (typeof val === 'string' ? val.trim() : val);

const envSchema = z.object({
  PORT: z.preprocess(trimString, z.string().default('3000').transform((val) => parseInt(val, 10))),
  NODE_ENV: z.preprocess(trimString, z.enum(['development', 'production', 'test']).default('development')),
  TURSO_DATABASE_URL: z.preprocess(trimString, z.string().default('file:./dev.db')),
  TURSO_AUTH_TOKEN: z.preprocess(trimString, z.string().optional().default('')),
  JWT_SECRET: z.preprocess(trimString, z.string().min(16, 'JWT_SECRET must be at least 16 characters long').default('super-secret-luphonix-jwt-key-dev-only-32-chars-long')),
  JWT_EXPIRES_IN: z.preprocess(trimString, z.string().default('30d')),
  ALLOWED_ORIGIN: z.preprocess(trimString, z.string().default('*')),
});

const parsedEnv = envSchema.safeParse(process.env);

if (!parsedEnv.success) {
  console.error('❌ Invalid environment variables:', parsedEnv.error.format());
  process.exit(1);
}

export const config = parsedEnv.data;
