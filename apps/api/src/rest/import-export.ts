import { importSchema } from '@bookmarkvault/shared';
import type { FastifyInstance } from 'fastify';
import { prisma } from '~/db.ts';
import { HttpError, faviconFor, parse, titleFromUrl } from '~/lib/http.ts';
import { resolveTagIds } from '~/lib/tags.ts';

/**
 * Bulk import/export of bookmarks as JSON. Import either targets an existing
 * collection (`collectionId`) or creates a new one (`collectionName`). Export
 * returns the signed-in user's entire library in the same import-compatible
 * shape, so a round-trip is lossless.
 */
export async function importExportRoutes(app: FastifyInstance): Promise<void> {
  app.addHook('preHandler', app.authenticate);

  app.post('/api/import', async (request, reply) => {
    const userId = request.userId!;
    const { collectionId, collectionName, bookmarks } = parse(
      importSchema,
      request.body,
    );

    let targetId = collectionId;
    if (targetId) {
      const owned = await prisma.collection.findUnique({
        where: { id: targetId },
      });
      if (!owned || owned.ownerId !== userId) {
        throw new HttpError(404, 'Collection not found');
      }
    } else {
      const created = await prisma.collection.create({
        data: { ownerId: userId, name: collectionName?.trim() || 'Imported' },
      });
      targetId = created.id;
    }

    let imported = 0;
    for (const entry of bookmarks) {
      const bookmark = await prisma.bookmark.create({
        data: {
          collectionId: targetId,
          ownerId: userId,
          url: entry.url,
          title: entry.title?.trim() || titleFromUrl(entry.url),
          description: entry.description?.trim() || null,
          faviconUrl: faviconFor(entry.url),
        },
      });
      if (entry.tags?.length) {
        const tagIds = await resolveTagIds(userId, entry.tags);
        await prisma.bookmarkTag.createMany({
          data: tagIds.map((tagId) => ({ bookmarkId: bookmark.id, tagId })),
          skipDuplicates: true,
        });
      }
      imported += 1;
    }

    return reply.code(201).send({ collectionId: targetId, imported });
  });

  app.get('/api/export', async (request) => {
    const collections = await prisma.collection.findMany({
      where: { ownerId: request.userId! },
      orderBy: { createdAt: 'asc' },
      include: {
        bookmarks: {
          orderBy: { createdAt: 'asc' },
          include: { tags: { include: { tag: true } } },
        },
      },
    });

    return {
      exportedAt: new Date().toISOString(),
      collections: collections.map((c) => ({
        name: c.name,
        description: c.description,
        color: c.color,
        bookmarks: c.bookmarks.map((b) => ({
          url: b.url,
          title: b.title,
          description: b.description,
          tags: b.tags.map((t) => t.tag.name),
        })),
      })),
    };
  });
}
