import {
  createCollectionSchema,
  createShareSchema,
  updateCollectionSchema,
} from '@bookmarkvault/shared';
import type { FastifyInstance } from 'fastify';
import { nanoid } from 'nanoid';
import { prisma } from '~/db.ts';
import { toCollectionWithCount, toShare } from '~/lib/dto.ts';
import { HttpError, parse } from '~/lib/http.ts';

/** Throw 404 unless the collection exists and is owned by the user. */
async function requireOwned(userId: string, id: string) {
  const collection = await prisma.collection.findUnique({ where: { id } });
  if (!collection || collection.ownerId !== userId) {
    throw new HttpError(404, 'Collection not found');
  }
  return collection;
}

/** Authenticated collection CRUD + share-link management. */
export async function collectionRoutes(app: FastifyInstance): Promise<void> {
  app.addHook('preHandler', app.authenticate);

  app.get('/api/collections', async (request) => {
    const rows = await prisma.collection.findMany({
      where: { ownerId: request.userId! },
      orderBy: { updatedAt: 'desc' },
      include: { _count: { select: { bookmarks: true } } },
    });
    return rows.map(toCollectionWithCount);
  });

  app.post('/api/collections', async (request, reply) => {
    const input = parse(createCollectionSchema, request.body);
    const row = await prisma.collection.create({
      data: { ...input, ownerId: request.userId! },
      include: { _count: { select: { bookmarks: true } } },
    });
    return reply.code(201).send(toCollectionWithCount(row));
  });

  app.get('/api/collections/:id', async (request) => {
    const { id } = request.params as { id: string };
    await requireOwned(request.userId!, id);
    const row = await prisma.collection.findUniqueOrThrow({
      where: { id },
      include: { _count: { select: { bookmarks: true } } },
    });
    return toCollectionWithCount(row);
  });

  app.patch('/api/collections/:id', async (request) => {
    const { id } = request.params as { id: string };
    await requireOwned(request.userId!, id);
    const input = parse(updateCollectionSchema, request.body);
    const row = await prisma.collection.update({
      where: { id },
      data: input,
      include: { _count: { select: { bookmarks: true } } },
    });
    return toCollectionWithCount(row);
  });

  app.delete('/api/collections/:id', async (request, reply) => {
    const { id } = request.params as { id: string };
    await requireOwned(request.userId!, id);
    await prisma.collection.delete({ where: { id } });
    return reply.code(204).send();
  });

  app.get('/api/collections/:id/shares', async (request) => {
    const { id } = request.params as { id: string };
    await requireOwned(request.userId!, id);
    const rows = await prisma.share.findMany({
      where: { collectionId: id },
      orderBy: { createdAt: 'desc' },
    });
    return rows.map(toShare);
  });

  app.post('/api/collections/:id/shares', async (request, reply) => {
    const { id } = request.params as { id: string };
    await requireOwned(request.userId!, id);
    const { expiresAt } = parse(createShareSchema, request.body ?? {});
    const row = await prisma.share.create({
      data: {
        token: nanoid(16),
        collectionId: id,
        expiresAt: expiresAt ? new Date(expiresAt) : null,
      },
    });
    // Sharing implies the collection is readable via the link.
    await prisma.collection.update({
      where: { id },
      data: { isPublic: true },
    });
    return reply.code(201).send(toShare(row));
  });

  app.delete('/api/shares/:token', async (request, reply) => {
    const { token } = request.params as { token: string };
    const share = await prisma.share.findUnique({ where: { token } });
    if (share) {
      await requireOwned(request.userId!, share.collectionId);
      await prisma.share.delete({ where: { token } });
    }
    return reply.code(204).send();
  });
}
