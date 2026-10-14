import dotenv from 'dotenv';
import { z } from 'zod';

dotenv.config();

const sanitizeEnvValue = (val: unknown) => {
  if (typeof val !== 'string') return val;
  return val
    .replace(/[\r\n]|\\[rn]/g, '')
    .replace(/^["']|["']$/g, '')
    .trim();
};

const envSchema = z.object({
  PORT: z.preprocess(sanitizeEnvValue, z.string().default('3000').transform((val) => parseInt(val, 10))),
  NODE_ENV: z.preprocess(sanitizeEnvValue, z.enum(['development', 'production', 'test']).default('development')),
  TURSO_DATABASE_URL: z.preprocess(sanitizeEnvValue, z.string().default('file:./dev.db')),
  TURSO_AUTH_TOKEN: z.preprocess(sanitizeEnvValue, z.string().optional().default('')),
  JWT_SECRET: z.preprocess(sanitizeEnvValue, z.string().min(16, 'JWT_SECRET must be at least 16 characters long').default('super-secret-luphonix-jwt-key-dev-only-32-chars-long')),
  JWT_EXPIRES_IN: z.preprocess(sanitizeEnvValue, z.string().default('30d')),
  ALLOWED_ORIGIN: z.preprocess(sanitizeEnvValue, z.string().default('*')),
});

const parsedEnv = envSchema.safeParse(process.env);

if (!parsedEnv.success) {
  console.error('❌ Invalid environment variables:', parsedEnv.error.format());
  process.exit(1);
}

export const config = parsedEnv.data;
