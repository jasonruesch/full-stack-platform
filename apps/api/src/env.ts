import { z } from 'zod';

// Load apps/api/.env in development. In production (Docker/Fly) there is no
// .env file and the variables come from the real environment, so a missing
// file is expected — swallow the error.
try {
  process.loadEnvFile();
} catch {
  // no .env file present
}

/**
 * Validated process environment. Fails fast at boot if a required variable is
 * missing or malformed, so misconfiguration surfaces immediately rather than as
 * a confusing runtime error later.
 */
const envSchema = z.object({
  NODE_ENV: z
    .enum(['development', 'test', 'production'])
    .default('development'),
  DATABASE_URL: z.string().url(),
  JWT_SECRET: z
    .string()
    .min(16, 'JWT_SECRET must be at least 16 characters')
    .default('dev-insecure-secret-change-me'),
  PORT: z.coerce.number().int().positive().default(3000),
  HOST: z.string().default('0.0.0.0'),
  // Absolute path to the built web client to serve as static files. When unset,
  // the API runs API-only (the Vite dev server serves the client in dev).
  WEB_DIST: z.string().optional(),
});

export const env = envSchema.parse(process.env);

export type Env = z.infer<typeof envSchema>;
