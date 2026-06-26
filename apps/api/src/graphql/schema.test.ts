import type { CollectionWithCount } from '@bookmarkvault/shared';
import { describe, expect, it } from 'vitest';
import { createUser, getApp, gql } from '~/test/helpers.ts';

async function makeCollection(authHeader: { authorization: string }) {
  const app = await getApp();
  const res = await app.inject({
    method: 'POST',
    url: '/api/collections',
    headers: authHeader,
    payload: { name: 'GQL' },
  });
  return (res.json() as CollectionWithCount).id;
}

describe('graphql bookmarks + tags', () => {
  it('requires authentication', async () => {
    const result = await gql('{ tags { id } }');
    expect(result.errors?.[0].extensions?.code).toBe('UNAUTHENTICATED');
  });

  it('creates, searches, tags, moves, and deletes bookmarks', async () => {
    const { token, authHeader } = await createUser();
    const collectionId = await makeCollection(authHeader);

    // create
    const created = await gql(
      `mutation ($c: String!, $u: String!, $t: String) {
         createBookmark(collectionId: $c, url: $u, title: $t) { id title tags { id } }
       }`,
      { c: collectionId, u: 'https://graphql.org', t: 'GraphQL' },
      token,
    );
    const bookmarkId = (created.data?.createBookmark as { id: string }).id;
    expect(bookmarkId).toBeTruthy();

    // full-text-ish search by title
    const found = await gql(
      `query ($q: String) { bookmarks(query: $q) { id title } }`,
      { q: 'graph' },
      token,
    );
    expect((found.data?.bookmarks as unknown[]).length).toBe(1);

    // create + attach a tag, then filter by it
    const tag = await gql(
      `mutation ($n: String!) { createTag(name: $n) { id name } }`,
      { n: 'important' },
      token,
    );
    const tagId = (tag.data?.createTag as { id: string }).id;
    await gql(
      `mutation ($b: String!, $t: String!) {
         addTagToBookmark(bookmarkId: $b, tagId: $t) { id tags { id name } }
       }`,
      { b: bookmarkId, t: tagId },
      token,
    );
    const filtered = await gql(
      `query ($t: [String!]) { bookmarks(tagIds: $t) { id } }`,
      { t: [tagId] },
      token,
    );
    expect((filtered.data?.bookmarks as unknown[]).length).toBe(1);

    // move to a second collection
    const otherId = await makeCollection(authHeader);
    const moved = await gql(
      `mutation ($id: String!, $to: String!) {
         moveBookmark(id: $id, toCollectionId: $to) { id collectionId }
       }`,
      { id: bookmarkId, to: otherId },
      token,
    );
    expect((moved.data?.moveBookmark as { collectionId: string }).collectionId).toBe(otherId);

    // delete
    const deleted = await gql(
      `mutation ($id: String!) { deleteBookmark(id: $id) }`,
      { id: bookmarkId },
      token,
    );
    expect(deleted.data?.deleteBookmark).toBe(true);
  });

  it("cannot read another user's bookmark", async () => {
    const owner = await createUser();
    const intruder = await createUser();
    const collectionId = await makeCollection(owner.authHeader);
    const created = await gql(
      `mutation ($c: String!, $u: String!) { createBookmark(collectionId: $c, url: $u) { id } }`,
      { c: collectionId, u: 'https://secret.example' },
      owner.token,
    );
    const id = (created.data?.createBookmark as { id: string }).id;

    const res = await gql(
      `query ($id: String!) { bookmark(id: $id) { id } }`,
      { id },
      intruder.token,
    );
    expect(res.data?.bookmark).toBeNull();
  });
});
