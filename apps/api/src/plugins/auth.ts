import fastifyJwt from '@fastify/jwt';
import type { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';
import { env } from '~/env.ts';

/**
 * Registers JWT support and two preHandlers:
 * - `authenticate`: rejects the request with 401 unless a valid bearer token is
 *   present, then populates `request.userId`.
 * - `optionalAuth`: populates `request.userId` when a valid token is present but
 *   never rejects — used by public, shareable endpoints.
 */
export async function registerAuth(app: FastifyInstance): Promise<void> {
  await app.register(fastifyJwt, { secret: env.JWT_SECRET });

  app.decorateRequest('userId', null);

  app.decorate(
    'authenticate',
    async function (request: FastifyRequest, reply: FastifyReply) {
      try {
        const { sub } = await request.jwtVerify<{ sub: string }>();
        request.userId = sub;
      } catch {
        return reply.code(401).send({ message: 'Authentication required' });
      }
    },
  );

  app.decorate(
    'optionalAuth',
    async function (request: FastifyRequest) {
      try {
        const { sub } = await request.jwtVerify<{ sub: string }>();
        request.userId = sub;
      } catch {
        request.userId = null;
      }
    },
  );
}

/** Issue a signed token for a user id. */
export function signToken(app: FastifyInstance, userId: string): string {
  return app.jwt.sign({ sub: userId });
}
