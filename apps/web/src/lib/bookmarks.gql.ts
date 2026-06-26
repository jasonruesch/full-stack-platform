import type { BookmarkSort, BookmarkWithTags, Tag } from '@bookmarkvault/shared';
import { gql } from '@apollo/client';
import { useMutation, useSuspenseQuery } from '@apollo/client/react';

/**
 * GraphQL operations for the bookmark/tag layer. Documents are hand-written and
 * typed via generics on the hooks (no codegen step). Mutations refetch the
 * active `Bookmarks`/`Tags` queries by name so the UI stays consistent without
 * hand-managing the normalized cache.
 */

const BOOKMARK_FIELDS = gql`
  fragment BookmarkFields on Bookmark {
    id
    collectionId
    url
    title
    description
    faviconUrl
    createdAt
    updatedAt
    tags {
      id
      name
      color
    }
  }
`;

export const BOOKMARKS_QUERY = gql`
  ${BOOKMARK_FIELDS}
  query Bookmarks(
    $collectionId: String
    $tagIds: [String!]
    $query: String
    $sort: BookmarkSort
  ) {
    bookmarks(
      collectionId: $collectionId
      tagIds: $tagIds
      query: $query
      sort: $sort
    ) {
      ...BookmarkFields
    }
  }
`;

export const TAGS_QUERY = gql`
  query Tags {
    tags {
      id
      name
      color
    }
  }
`;

const CREATE_BOOKMARK = gql`
  ${BOOKMARK_FIELDS}
  mutation CreateBookmark(
    $collectionId: String!
    $url: String!
    $title: String
    $description: String
  ) {
    createBookmark(
      collectionId: $collectionId
      url: $url
      title: $title
      description: $description
    ) {
      ...BookmarkFields
    }
  }
`;

const UPDATE_BOOKMARK = gql`
  ${BOOKMARK_FIELDS}
  mutation UpdateBookmark(
    $id: String!
    $url: String
    $title: String
    $description: String
  ) {
    updateBookmark(id: $id, url: $url, title: $title, description: $description) {
      ...BookmarkFields
    }
  }
`;

const DELETE_BOOKMARK = gql`
  mutation DeleteBookmark($id: String!) {
    deleteBookmark(id: $id)
  }
`;

const MOVE_BOOKMARK = gql`
  ${BOOKMARK_FIELDS}
  mutation MoveBookmark($id: String!, $toCollectionId: String!) {
    moveBookmark(id: $id, toCollectionId: $toCollectionId) {
      ...BookmarkFields
    }
  }
`;

const ADD_TAG = gql`
  ${BOOKMARK_FIELDS}
  mutation AddTag($bookmarkId: String!, $tagId: String!) {
    addTagToBookmark(bookmarkId: $bookmarkId, tagId: $tagId) {
      ...BookmarkFields
    }
  }
`;

const REMOVE_TAG = gql`
  ${BOOKMARK_FIELDS}
  mutation RemoveTag($bookmarkId: String!, $tagId: String!) {
    removeTagFromBookmark(bookmarkId: $bookmarkId, tagId: $tagId) {
      ...BookmarkFields
    }
  }
`;

const CREATE_TAG = gql`
  mutation CreateTag($name: String!, $color: String) {
    createTag(name: $name, color: $color) {
      id
      name
      color
    }
  }
`;

const DELETE_TAG = gql`
  mutation DeleteTag($id: String!) {
    deleteTag(id: $id)
  }
`;

const REFETCH = ['Bookmarks', 'Tags'];

export interface BookmarksVars {
  collectionId?: string;
  tagIds?: string[];
  query?: string;
  sort?: BookmarkSort;
}

/** Bookmarks matching the given filter (suspends). */
export function useBookmarks(variables: BookmarksVars) {
  return useSuspenseQuery<{ bookmarks: BookmarkWithTags[] }, BookmarksVars>(
    BOOKMARKS_QUERY,
    { variables },
  );
}

/** All of the user's tags (suspends). */
export function useTags() {
  return useSuspenseQuery<{ tags: Tag[] }>(TAGS_QUERY);
}

export function useCreateBookmark() {
  return useMutation(CREATE_BOOKMARK, {
    refetchQueries: REFETCH,
    awaitRefetchQueries: true,
  });
}

export function useUpdateBookmark() {
  return useMutation(UPDATE_BOOKMARK, { refetchQueries: REFETCH });
}

export function useDeleteBookmark() {
  return useMutation(DELETE_BOOKMARK, {
    refetchQueries: REFETCH,
    awaitRefetchQueries: true,
  });
}

export function useMoveBookmark() {
  return useMutation(MOVE_BOOKMARK, { refetchQueries: REFETCH });
}

export function useAddTag() {
  return useMutation(ADD_TAG, { refetchQueries: REFETCH });
}

export function useRemoveTag() {
  return useMutation(REMOVE_TAG, { refetchQueries: REFETCH });
}

export function useCreateTag() {
  return useMutation(CREATE_TAG, {
    refetchQueries: REFETCH,
    awaitRefetchQueries: true,
  });
}

export function useDeleteTag() {
  return useMutation(DELETE_TAG, {
    refetchQueries: REFETCH,
    awaitRefetchQueries: true,
  });
}
