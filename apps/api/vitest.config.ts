import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vitest/config';

// Integration tests run against a real Postgres (the schema must already be
// migrated — CI runs `prisma migrate deploy` first; locally point DATABASE_URL
// at a throwaway test database). Tests run serially so they can share one DB
// and reset it between cases without cross-test races.
export default defineConfig({
  resolve: {
    alias: { '~': fileURLToPath(new URL('./src', import.meta.url)) },
  },
  test: {
    globals: true,
    environment: 'node',
    env: { NODE_ENV: 'test' },
    include: ['src/**/*.{test,spec}.ts'],
    fileParallelism: false,
    setupFiles: ['./src/test/setup.ts'],
  },
});
