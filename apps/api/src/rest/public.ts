import type { SharedCollection } from '@bookmarkvault/shared';
import type { FastifyInstance } from 'fastify';
import { prisma } from '~/db.ts';
import { toBookmarkWithTags } from '~/lib/dto.ts';
import { HttpError } from '~/lib/http.ts';

/** Public, unauthenticated read access to a shared collection by token. */
export async function publicRoutes(app: FastifyInstance): Promise<void> {
  app.get('/api/shared/:token', async (request) => {
    const { token } = request.params as { token: string };

    const share = await prisma.share.findUnique({
      where: { token },
      include: {
        collection: {
          include: {
            owner: true,
            bookmarks: {
              orderBy: { createdAt: 'desc' },
              include: { tags: { include: { tag: true } } },
            },
          },
        },
      },
    });

    if (!share || (share.expiresAt && share.expiresAt < new Date())) {
      throw new HttpError(404, 'This share link is invalid or has expired');
    }

    const { collection } = share;
    const result: SharedCollection = {
      collection: {
        id: collection.id,
        name: collection.name,
        description: collection.description,
        color: collection.color,
        updatedAt: collection.updatedAt.toISOString(),
      },
      owner: {
        name: collection.owner.name,
        avatarUrl: collection.owner.avatarUrl,
      },
      bookmarks: collection.bookmarks.map(toBookmarkWithTags),
    };
    return result;
  });
}
