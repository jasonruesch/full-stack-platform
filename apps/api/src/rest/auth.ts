import { loginSchema, registerSchema } from '@bookmarkvault/shared';
import type { FastifyInstance } from 'fastify';
import { hashPassword, verifyPassword } from '~/auth/password.ts';
import { signToken } from '~/plugins/auth.ts';
import { prisma } from '~/db.ts';
import { HttpError, parse } from '~/lib/http.ts';
import { toUser } from '~/lib/dto.ts';

/** Authentication routes: register, login, logout, current user. */
export async function authRoutes(app: FastifyInstance): Promise<void> {
  app.post('/api/auth/register', async (request, reply) => {
    const { name, email, password } = parse(registerSchema, request.body);

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      throw new HttpError(409, 'An account with that email already exists');
    }

    const user = await prisma.user.create({
      data: { name, email, passwordHash: await hashPassword(password) },
    });

    return reply.code(201).send({
      token: signToken(app, user.id),
      user: toUser(user),
    });
  });

  app.post('/api/auth/login', async (request) => {
    const { email, password } = parse(loginSchema, request.body);

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user || !(await verifyPassword(password, user.passwordHash))) {
      throw new HttpError(401, 'Incorrect email or password');
    }

    return { token: signToken(app, user.id), user: toUser(user) };
  });

  // Stateless JWT: logout is a client-side token discard. The endpoint exists so
  // the client can call it uniformly and for future token-revocation support.
  app.post(
    '/api/auth/logout',
    { preHandler: app.optionalAuth },
    async (_request, reply) => reply.code(204).send(),
  );

  app.get(
    '/api/auth/me',
    { preHandler: app.authenticate },
    async (request) => {
      const user = await prisma.user.findUnique({
        where: { id: request.userId! },
      });
      if (!user) throw new HttpError(401, 'Authentication required');
      return toUser(user);
    },
  );
}
