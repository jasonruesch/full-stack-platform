import { afterAll, afterEach } from 'vitest';
import { prisma } from '~/db.ts';
import { resetDb } from '~/test/helpers.ts';

// Each test starts from an empty database. Deleting users cascades to their
// collections, bookmarks, tags, and shares.
afterEach(async () => {
  await resetDb();
});

afterAll(async () => {
  await prisma.$disconnect();
});
