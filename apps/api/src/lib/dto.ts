import type {
  Bookmark as BookmarkRow,
  Collection as CollectionRow,
  Share as ShareRow,
  Tag as TagRow,
  User as UserRow,
} from '@prisma/client';
import type {
  Bookmark,
  BookmarkWithTags,
  Collection,
  CollectionWithCount,
  Share,
  Tag,
  User,
} from '@bookmarkvault/shared';

/**
 * Map Prisma rows to the shared DTO shapes the client expects. The main job is
 * serializing `Date` columns to ISO strings and never leaking sensitive fields
 * (e.g. `passwordHash`) past this boundary.
 */

export function toUser(row: UserRow): User {
  return {
    id: row.id,
    name: row.name,
    email: row.email,
    avatarUrl: row.avatarUrl,
  };
}

export function toTag(row: TagRow): Tag {
  return {
    id: row.id,
    ownerId: row.ownerId,
    name: row.name,
    color: row.color,
  };
}

export function toCollection(row: CollectionRow): Collection {
  return {
    id: row.id,
    ownerId: row.ownerId,
    name: row.name,
    description: row.description,
    color: row.color,
    isPublic: row.isPublic,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}

export function toCollectionWithCount(
  row: CollectionRow & { _count: { bookmarks: number } },
): CollectionWithCount {
  return { ...toCollection(row), bookmarkCount: row._count.bookmarks };
}

export function toBookmark(row: BookmarkRow): Bookmark {
  return {
    id: row.id,
    collectionId: row.collectionId,
    ownerId: row.ownerId,
    url: row.url,
    title: row.title,
    description: row.description,
    faviconUrl: row.faviconUrl,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}

export function toBookmarkWithTags(
  row: BookmarkRow & { tags: { tag: TagRow }[] },
): BookmarkWithTags {
  return {
    ...toBookmark(row),
    tags: row.tags.map((t) => toTag(t.tag)),
  };
}

export function toShare(row: ShareRow): Share {
  return {
    token: row.token,
    collectionId: row.collectionId,
    expiresAt: row.expiresAt ? row.expiresAt.toISOString() : null,
    createdAt: row.createdAt.toISOString(),
  };
}
