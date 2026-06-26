/**
 * Canonical domain models for BookmarkVault, shared by the API (Prisma row →
 * DTO mapping) and the web client (REST + GraphQL response typing) so both
 * sides speak one vocabulary.
 */

export interface User {
  id: string;
  name: string;
  email: string;
  avatarUrl: string | null;
}

export interface Tag {
  id: string;
  ownerId: string;
  name: string;
  color: string;
}

export interface Collection {
  id: string;
  ownerId: string;
  name: string;
  description: string | null;
  color: string;
  isPublic: boolean;
  createdAt: string;
  updatedAt: string;
}

/** A collection enriched with its bookmark count — REST list/detail shape. */
export interface CollectionWithCount extends Collection {
  bookmarkCount: number;
}

export interface Bookmark {
  id: string;
  collectionId: string;
  ownerId: string;
  url: string;
  title: string;
  description: string | null;
  faviconUrl: string | null;
  createdAt: string;
  updatedAt: string;
}

/** A bookmark with its tags resolved — what GraphQL returns to the UI. */
export interface BookmarkWithTags extends Bookmark {
  tags: Tag[];
}

export interface Share {
  token: string;
  collectionId: string;
  expiresAt: string | null;
  createdAt: string;
}

/** Public, unauthenticated view of a shared collection. */
export interface SharedCollection {
  collection: Pick<
    Collection,
    'id' | 'name' | 'description' | 'color' | 'updatedAt'
  >;
  owner: Pick<User, 'name' | 'avatarUrl'>;
  bookmarks: BookmarkWithTags[];
}

export interface AuthResponse {
  token: string;
  user: User;
}

export type BookmarkSort = 'newest' | 'oldest' | 'title';

export const COLLECTION_COLORS = [
  '#6366f1',
  '#0ea5e9',
  '#10b981',
  '#f59e0b',
  '#ef4444',
  '#ec4899',
  '#8b5cf6',
] as const;

export const TAG_COLORS = [
  '#64748b',
  '#0ea5e9',
  '#10b981',
  '#f59e0b',
  '#ef4444',
  '#8b5cf6',
] as const;

export const BOOKMARK_SORTS: readonly BookmarkSort[] = [
  'newest',
  'oldest',
  'title',
] as const;

export const SORT_LABELS: Record<BookmarkSort, string> = {
  newest: 'Newest first',
  oldest: 'Oldest first',
  title: 'Title (A–Z)',
};
