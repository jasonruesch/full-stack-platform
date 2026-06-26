import { TAG_COLORS, COLLECTION_COLORS } from '@bookmarkvault/shared';
import { faker } from '@faker-js/faker';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { nanoid } from 'nanoid';

const prisma = new PrismaClient();

// Deterministic data: the same seed yields the same library every run, so the
// demo and tests are reproducible.
faker.seed(20240617);

const DEMO_EMAIL = 'demo@bookmarkvault.app';
const DEMO_PASSWORD = 'password';

const COLLECTIONS = [
  { name: 'Reading List', description: 'Articles and essays to get to.' },
  { name: 'Dev Tools', description: 'Libraries, docs, and references.' },
  { name: 'Design Inspiration', description: 'Portfolios and UI galleries.' },
  { name: 'Recipes', description: 'Things to cook this month.' },
];

const TAG_NAMES = [
  'article',
  'video',
  'reference',
  'tutorial',
  'tool',
  'inspiration',
  'must-read',
];

function faviconFor(url: string): string {
  const origin = new URL(url).origin;
  return `https://www.google.com/s2/favicons?domain=${encodeURIComponent(
    origin,
  )}&sz=64`;
}

async function main() {
  // Reset so seeding is idempotent.
  await prisma.user.deleteMany({ where: { email: DEMO_EMAIL } });

  const user = await prisma.user.create({
    data: {
      email: DEMO_EMAIL,
      name: 'Demo User',
      passwordHash: await bcrypt.hash(DEMO_PASSWORD, 10),
      avatarUrl: faker.image.avatarGitHub(),
    },
  });

  const tags = await Promise.all(
    TAG_NAMES.map((name, i) =>
      prisma.tag.create({
        data: {
          ownerId: user.id,
          name,
          color: TAG_COLORS[i % TAG_COLORS.length],
        },
      }),
    ),
  );

  let firstCollectionId = '';
  for (const [i, def] of COLLECTIONS.entries()) {
    const collection = await prisma.collection.create({
      data: {
        ownerId: user.id,
        name: def.name,
        description: def.description,
        color: COLLECTION_COLORS[i % COLLECTION_COLORS.length],
        isPublic: i === 0,
      },
    });
    if (i === 0) firstCollectionId = collection.id;

    const count = faker.number.int({ min: 6, max: 12 });
    for (let b = 0; b < count; b += 1) {
      const url = faker.internet.url();
      const bookmark = await prisma.bookmark.create({
        data: {
          collectionId: collection.id,
          ownerId: user.id,
          url,
          title: faker.commerce.productName(),
          description: faker.lorem.sentence(),
          faviconUrl: faviconFor(url),
        },
      });
      const sample = faker.helpers.arrayElements(tags, { min: 0, max: 3 });
      if (sample.length) {
        await prisma.bookmarkTag.createMany({
          data: sample.map((t) => ({ bookmarkId: bookmark.id, tagId: t.id })),
          skipDuplicates: true,
        });
      }
    }
  }

  // A public share link for the first (public) collection.
  await prisma.share.create({
    data: { token: nanoid(16), collectionId: firstCollectionId },
  });

  console.log(`Seeded demo account: ${DEMO_EMAIL} / ${DEMO_PASSWORD}`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
