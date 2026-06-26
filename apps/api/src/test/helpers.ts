import type { AuthResponse } from '@bookmarkvault/shared';
import type { FastifyInstance } from 'fastify';
import { prisma } from '~/db.ts';
import { buildApp } from '~/server.ts';

let app: FastifyInstance | null = null;

/** A ready Fastify app, built once and reused across the test file. */
export async function getApp(): Promise<FastifyInstance> {
  if (!app) {
    app = await buildApp();
    await app.ready();
  }
  return app;
}

/** Empty the database. User deletes cascade to all owned records. */
export async function resetDb(): Promise<void> {
  await prisma.user.deleteMany();
}

let counter = 0;

/** Register a fresh user and return the auth payload + Authorization header. */
export async function createUser(
  overrides: Partial<{ name: string; email: string; password: string }> = {},
): Promise<AuthResponse & { authHeader: { authorization: string } }> {
  counter += 1;
  const body = {
    name: overrides.name ?? `User ${counter}`,
    email: overrides.email ?? `user${counter}@example.com`,
    password: overrides.password ?? 'password123',
  };
  const instance = await getApp();
  const res = await instance.inject({
    method: 'POST',
    url: '/api/auth/register',
    payload: body,
  });
  const data = res.json() as AuthResponse;
  return { ...data, authHeader: { authorization: `Bearer ${data.token}` } };
}

/** Execute a GraphQL operation as a given user (or anonymously). */
export async function gql(
  query: string,
  variables: Record<string, unknown> = {},
  token?: string,
): Promise<{ data?: Record<string, unknown>; errors?: { message: string; extensions?: Record<string, unknown> }[] }> {
  const instance = await getApp();
  const res = await instance.inject({
    method: 'POST',
    url: '/graphql',
    headers: {
      'content-type': 'application/json',
      ...(token ? { authorization: `Bearer ${token}` } : {}),
    },
    payload: JSON.stringify({ query, variables }),
  });
  return res.json();
}
