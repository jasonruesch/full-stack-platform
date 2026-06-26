import { existsSync } from 'node:fs';
import fastifyStatic from '@fastify/static';
import { Prisma } from '@prisma/client';
import Fastify, {
  type FastifyError,
  type FastifyInstance,
} from 'fastify';
import { env } from '~/env.ts';
import { registerGraphQL } from '~/graphql/yoga.ts';
import { HttpError } from '~/lib/http.ts';
import { registerAuth } from '~/plugins/auth.ts';
import { authRoutes } from '~/rest/auth.ts';
import { collectionRoutes } from '~/rest/collections.ts';
import { importExportRoutes } from '~/rest/import-export.ts';
import { publicRoutes } from '~/rest/public.ts';

/**
 * Build the fully-wired Fastify app. Exported (rather than started) so tests can
 * drive it with `app.inject()` without binding a port.
 */
export async function buildApp(): Promise<FastifyInstance> {
  const app = Fastify({
    logger: env.NODE_ENV !== 'test',
    disableRequestLogging: env.NODE_ENV === 'test',
  });

  app.setErrorHandler((error: FastifyError, _request, reply) => {
    if (error instanceof HttpError) {
      return reply.code(error.statusCode).send({ message: error.message });
    }
    // Unique-constraint violations → 409 Conflict.
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === 'P2002'
    ) {
      return reply.code(409).send({ message: 'That record already exists' });
    }
    if (error.statusCode && error.statusCode < 500) {
      return reply.code(error.statusCode).send({ message: error.message });
    }
    app.log.error(error);
    return reply.code(500).send({ message: 'Internal server error' });
  });

  await registerAuth(app);

  app.get('/api/health', async () => ({ status: 'ok' }));

  await app.register(authRoutes);
  await app.register(collectionRoutes);
  await app.register(importExportRoutes);
  await app.register(publicRoutes);
  await registerGraphQL(app);

  // In production the API also serves the built SPA from a single origin.
  if (env.WEB_DIST && existsSync(env.WEB_DIST)) {
    await app.register(fastifyStatic, { root: env.WEB_DIST });
    app.setNotFoundHandler((request, reply) => {
      // Unknown API/GraphQL paths are real 404s; everything else is a client
      // route, so hand back index.html and let the SPA router resolve it.
      if (
        request.method !== 'GET' ||
        request.url.startsWith('/api') ||
        request.url.startsWith('/graphql')
      ) {
        return reply.code(404).send({ message: 'Not found' });
      }
      return reply.sendFile('index.html');
    });
  }

  return app;
}
