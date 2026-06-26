import type { CollectionWithCount, Share } from '@bookmarkvault/shared';
import { describe, expect, it } from 'vitest';
import { createUser, getApp } from '~/test/helpers.ts';

describe('collection routes', () => {
  it('creates, lists, updates, and deletes a collection', async () => {
    const app = await getApp();
    const { authHeader } = await createUser();

    const created = await app.inject({
      method: 'POST',
      url: '/api/collections',
      headers: authHeader,
      payload: { name: 'Reading', description: 'Later' },
    });
    expect(created.statusCode).toBe(201);
    const collection = created.json() as CollectionWithCount;
    expect(collection).toMatchObject({ name: 'Reading', bookmarkCount: 0 });

    const list = await app.inject({
      method: 'GET',
      url: '/api/collections',
      headers: authHeader,
    });
    expect((list.json() as CollectionWithCount[]).length).toBe(1);

    const patched = await app.inject({
      method: 'PATCH',
      url: `/api/collections/${collection.id}`,
      headers: authHeader,
      payload: { name: 'Renamed' },
    });
    expect((patched.json() as CollectionWithCount).name).toBe('Renamed');

    const removed = await app.inject({
      method: 'DELETE',
      url: `/api/collections/${collection.id}`,
      headers: authHeader,
    });
    expect(removed.statusCode).toBe(204);
  });

  it("hides another user's collection (404)", async () => {
    const app = await getApp();
    const owner = await createUser();
    const intruder = await createUser();

    const created = await app.inject({
      method: 'POST',
      url: '/api/collections',
      headers: owner.authHeader,
      payload: { name: 'Private' },
    });
    const { id } = created.json() as CollectionWithCount;

    const res = await app.inject({
      method: 'GET',
      url: `/api/collections/${id}`,
      headers: intruder.authHeader,
    });
    expect(res.statusCode).toBe(404);
  });

  it('exposes a shared collection publicly, without auth', async () => {
    const app = await getApp();
    const { authHeader } = await createUser();

    const created = await app.inject({
      method: 'POST',
      url: '/api/collections',
      headers: authHeader,
      payload: { name: 'Public picks' },
    });
    const { id } = created.json() as CollectionWithCount;

    const shared = await app.inject({
      method: 'POST',
      url: `/api/collections/${id}/shares`,
      headers: authHeader,
      payload: {},
    });
    expect(shared.statusCode).toBe(201);
    const { token } = shared.json() as Share;

    // No Authorization header — anyone with the link can read it.
    const publicRead = await app.inject({
      method: 'GET',
      url: `/api/shared/${token}`,
    });
    expect(publicRead.statusCode).toBe(200);
    expect(publicRead.json()).toMatchObject({
      collection: { name: 'Public picks' },
    });
  });

  it('imports bookmarks then exports them back', async () => {
    const app = await getApp();
    const { authHeader } = await createUser();

    const imported = await app.inject({
      method: 'POST',
      url: '/api/import',
      headers: authHeader,
      payload: {
        collectionName: 'Imported',
        bookmarks: [
          { url: 'https://example.com', title: 'Example', tags: ['ref'] },
          { url: 'https://fastify.dev' },
        ],
      },
    });
    expect(imported.statusCode).toBe(201);
    expect((imported.json() as { imported: number }).imported).toBe(2);

    const exported = await app.inject({
      method: 'GET',
      url: '/api/export',
      headers: authHeader,
    });
    const body = exported.json() as {
      collections: { name: string; bookmarks: { url: string }[] }[];
    };
    expect(body.collections[0].name).toBe('Imported');
    expect(body.collections[0].bookmarks).toHaveLength(2);
  });
});
