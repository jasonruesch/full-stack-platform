import type { BookmarkWithTags, Tag } from '@bookmarkvault/shared';
import { createGraphQLError } from 'graphql-yoga';
import { prisma } from '~/db.ts';
import { toBookmarkWithTags, toTag } from '~/lib/dto.ts';
import { faviconFor, titleFromUrl } from '~/lib/http.ts';
import { builder, requireUser } from '~/graphql/builder.ts';

const bookmarkInclude = { tags: { include: { tag: true } } } as const;

/** Load a bookmark owned by the user, or throw. */
async function ownedBookmark(userId: string, id: string) {
  const row = await prisma.bookmark.findUnique({
    where: { id },
    include: bookmarkInclude,
  });
  if (!row || row.ownerId !== userId) {
    throw createGraphQLError('Bookmark not found', {
      extensions: { code: 'NOT_FOUND' },
    });
  }
  return row;
}

const TagType = builder.objectRef<Tag>('Tag').implement({
  fields: (t) => ({
    id: t.exposeID('id'),
    name: t.exposeString('name'),
    color: t.exposeString('color'),
  }),
});

const BookmarkType = builder
  .objectRef<BookmarkWithTags>('Bookmark')
  .implement({
    fields: (t) => ({
      id: t.exposeID('id'),
      collectionId: t.exposeString('collectionId'),
      url: t.exposeString('url'),
      title: t.exposeString('title'),
      description: t.exposeString('description', { nullable: true }),
      faviconUrl: t.exposeString('faviconUrl', { nullable: true }),
      createdAt: t.exposeString('createdAt'),
      updatedAt: t.exposeString('updatedAt'),
      tags: t.field({ type: [TagType], resolve: (b) => b.tags }),
    }),
  });

const BookmarkSortEnum = builder.enumType('BookmarkSort', {
  values: ['newest', 'oldest', 'title'] as const,
});

builder.queryFields((t) => ({
  bookmarks: t.field({
    type: [BookmarkType],
    args: {
      collectionId: t.arg.string(),
      tagIds: t.arg.stringList(),
      query: t.arg.string(),
      sort: t.arg({ type: BookmarkSortEnum }),
    },
    resolve: async (_root, args, ctx) => {
      const ownerId = requireUser(ctx);
      const q = args.query?.trim();
      const rows = await prisma.bookmark.findMany({
        where: {
          ownerId,
          ...(args.collectionId ? { collectionId: args.collectionId } : {}),
          ...(args.tagIds?.length
            ? { tags: { some: { tagId: { in: args.tagIds } } } }
            : {}),
          ...(q
            ? {
                OR: [
                  { title: { contains: q, mode: 'insensitive' } },
                  { description: { contains: q, mode: 'insensitive' } },
                  { url: { contains: q, mode: 'insensitive' } },
                ],
              }
            : {}),
        },
        orderBy:
          args.sort === 'oldest'
            ? { createdAt: 'asc' }
            : args.sort === 'title'
              ? { title: 'asc' }
              : { createdAt: 'desc' },
        include: bookmarkInclude,
      });
      return rows.map(toBookmarkWithTags);
    },
  }),

  bookmark: t.field({
    type: BookmarkType,
    nullable: true,
    args: { id: t.arg.string({ required: true }) },
    resolve: async (_root, args, ctx) => {
      const ownerId = requireUser(ctx);
      const row = await prisma.bookmark.findUnique({
        where: { id: args.id },
        include: bookmarkInclude,
      });
      if (!row || row.ownerId !== ownerId) return null;
      return toBookmarkWithTags(row);
    },
  }),

  tags: t.field({
    type: [TagType],
    resolve: async (_root, _args, ctx) => {
      const ownerId = requireUser(ctx);
      const rows = await prisma.tag.findMany({
        where: { ownerId },
        orderBy: { name: 'asc' },
      });
      return rows.map(toTag);
    },
  }),
}));

builder.mutationFields((t) => ({
  createBookmark: t.field({
    type: BookmarkType,
    args: {
      collectionId: t.arg.string({ required: true }),
      url: t.arg.string({ required: true }),
      title: t.arg.string(),
      description: t.arg.string(),
    },
    resolve: async (_root, args, ctx) => {
      const ownerId = requireUser(ctx);
      const collection = await prisma.collection.findUnique({
        where: { id: args.collectionId },
      });
      if (!collection || collection.ownerId !== ownerId) {
        throw createGraphQLError('Collection not found', {
          extensions: { code: 'NOT_FOUND' },
        });
      }
      const row = await prisma.bookmark.create({
        data: {
          collectionId: args.collectionId,
          ownerId,
          url: args.url,
          title: args.title?.trim() || titleFromUrl(args.url),
          description: args.description?.trim() || null,
          faviconUrl: faviconFor(args.url),
        },
        include: bookmarkInclude,
      });
      return toBookmarkWithTags(row);
    },
  }),

  updateBookmark: t.field({
    type: BookmarkType,
    args: {
      id: t.arg.string({ required: true }),
      url: t.arg.string(),
      title: t.arg.string(),
      description: t.arg.string(),
    },
    resolve: async (_root, args, ctx) => {
      const ownerId = requireUser(ctx);
      await ownedBookmark(ownerId, args.id);
      const row = await prisma.bookmark.update({
        where: { id: args.id },
        data: {
          ...(args.url !== undefined && args.url !== null
            ? { url: args.url, faviconUrl: faviconFor(args.url) }
            : {}),
          ...(args.title != null ? { title: args.title.trim() } : {}),
          ...(args.description !== undefined
            ? { description: args.description?.trim() || null }
            : {}),
        },
        include: bookmarkInclude,
      });
      return toBookmarkWithTags(row);
    },
  }),

  deleteBookmark: t.boolean({
    args: { id: t.arg.string({ required: true }) },
    resolve: async (_root, args, ctx) => {
      const ownerId = requireUser(ctx);
      await ownedBookmark(ownerId, args.id);
      await prisma.bookmark.delete({ where: { id: args.id } });
      return true;
    },
  }),

  moveBookmark: t.field({
    type: BookmarkType,
    args: {
      id: t.arg.string({ required: true }),
      toCollectionId: t.arg.string({ required: true }),
    },
    resolve: async (_root, args, ctx) => {
      const ownerId = requireUser(ctx);
      await ownedBookmark(ownerId, args.id);
      const dest = await prisma.collection.findUnique({
        where: { id: args.toCollectionId },
      });
      if (!dest || dest.ownerId !== ownerId) {
        throw createGraphQLError('Collection not found', {
          extensions: { code: 'NOT_FOUND' },
        });
      }
      const row = await prisma.bookmark.update({
        where: { id: args.id },
        data: { collectionId: args.toCollectionId },
        include: bookmarkInclude,
      });
      return toBookmarkWithTags(row);
    },
  }),

  addTagToBookmark: t.field({
    type: BookmarkType,
    args: {
      bookmarkId: t.arg.string({ required: true }),
      tagId: t.arg.string({ required: true }),
    },
    resolve: async (_root, args, ctx) => {
      const ownerId = requireUser(ctx);
      await ownedBookmark(ownerId, args.bookmarkId);
      const tag = await prisma.tag.findUnique({ where: { id: args.tagId } });
      if (!tag || tag.ownerId !== ownerId) {
        throw createGraphQLError('Tag not found', {
          extensions: { code: 'NOT_FOUND' },
        });
      }
      await prisma.bookmarkTag.upsert({
        where: {
          bookmarkId_tagId: { bookmarkId: args.bookmarkId, tagId: args.tagId },
        },
        create: { bookmarkId: args.bookmarkId, tagId: args.tagId },
        update: {},
      });
      return toBookmarkWithTags(await ownedBookmark(ownerId, args.bookmarkId));
    },
  }),

  removeTagFromBookmark: t.field({
    type: BookmarkType,
    args: {
      bookmarkId: t.arg.string({ required: true }),
      tagId: t.arg.string({ required: true }),
    },
    resolve: async (_root, args, ctx) => {
      const ownerId = requireUser(ctx);
      await ownedBookmark(ownerId, args.bookmarkId);
      await prisma.bookmarkTag.deleteMany({
        where: { bookmarkId: args.bookmarkId, tagId: args.tagId },
      });
      return toBookmarkWithTags(await ownedBookmark(ownerId, args.bookmarkId));
    },
  }),

  createTag: t.field({
    type: TagType,
    args: {
      name: t.arg.string({ required: true }),
      color: t.arg.string(),
    },
    resolve: async (_root, args, ctx) => {
      const ownerId = requireUser(ctx);
      const row = await prisma.tag.upsert({
        where: { ownerId_name: { ownerId, name: args.name.trim() } },
        create: {
          ownerId,
          name: args.name.trim(),
          ...(args.color ? { color: args.color } : {}),
        },
        update: args.color ? { color: args.color } : {},
      });
      return toTag(row);
    },
  }),

  deleteTag: t.boolean({
    args: { id: t.arg.string({ required: true }) },
    resolve: async (_root, args, ctx) => {
      const ownerId = requireUser(ctx);
      const tag = await prisma.tag.findUnique({ where: { id: args.id } });
      if (!tag || tag.ownerId !== ownerId) {
        throw createGraphQLError('Tag not found', {
          extensions: { code: 'NOT_FOUND' },
        });
      }
      await prisma.tag.delete({ where: { id: args.id } });
      return true;
    },
  }),
}));

export const schema = builder.toSchema();
