import { describe, expect, it } from 'vitest';
import { createUser, getApp } from '~/test/helpers.ts';

describe('auth routes', () => {
  it('registers a user and returns a usable token', async () => {
    const app = await getApp();
    const { token, user } = await createUser({ email: 'a@example.com' });
    expect(token).toBeTruthy();
    expect(user.email).toBe('a@example.com');
    // The token authenticates /api/auth/me.
    const me = await app.inject({
      method: 'GET',
      url: '/api/auth/me',
      headers: { authorization: `Bearer ${token}` },
    });
    expect(me.statusCode).toBe(200);
    expect(me.json()).toMatchObject({ id: user.id, email: 'a@example.com' });
  });

  it('never leaks the password hash', async () => {
    const { user } = await createUser();
    expect(user).not.toHaveProperty('passwordHash');
  });

  it('rejects a duplicate email with 409', async () => {
    const app = await getApp();
    await createUser({ email: 'dupe@example.com' });
    const res = await app.inject({
      method: 'POST',
      url: '/api/auth/register',
      payload: { name: 'Other', email: 'dupe@example.com', password: 'password123' },
    });
    expect(res.statusCode).toBe(409);
  });

  it('rejects bad credentials with 401', async () => {
    const app = await getApp();
    await createUser({ email: 'login@example.com', password: 'password123' });
    const res = await app.inject({
      method: 'POST',
      url: '/api/auth/login',
      payload: { email: 'login@example.com', password: 'wrong-password' },
    });
    expect(res.statusCode).toBe(401);
  });

  it('rejects /api/auth/me without a token', async () => {
    const app = await getApp();
    const res = await app.inject({ method: 'GET', url: '/api/auth/me' });
    expect(res.statusCode).toBe(401);
  });

  it('validates the registration payload', async () => {
    const app = await getApp();
    const res = await app.inject({
      method: 'POST',
      url: '/api/auth/register',
      payload: { name: '', email: 'not-an-email', password: 'short' },
    });
    expect(res.statusCode).toBe(400);
  });
});
