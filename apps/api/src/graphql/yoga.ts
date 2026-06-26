import type { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';
import { createYoga } from 'graphql-yoga';
import { env } from '~/env.ts';
import { schema } from '~/graphql/schema.ts';

/**
 * Mount GraphQL Yoga at /graphql inside an encapsulated Fastify plugin. The
 * wildcard content-type parser keeps Fastify from consuming the request body so
 * Yoga can read the raw stream — scoped to this plugin so the REST routes keep
 * their normal JSON parsing. `optionalAuth` populates `request.userId`, which
 * becomes the GraphQL context.
 */
export async function registerGraphQL(app: FastifyInstance): Promise<void> {
  await app.register(async (graphql) => {
    graphql.addContentTypeParser('*', {}, (_req, _payload, done) =>
      done(null, null),
    );

    const yoga = createYoga<{ req: FastifyRequest; reply: FastifyReply }>({
      schema,
      graphqlEndpoint: '/graphql',
      graphiql: env.NODE_ENV !== 'production',
      logging: false,
      context: ({ req }) => ({ userId: req.userId }),
    });

    graphql.route({
      url: '/graphql',
      method: ['GET', 'POST', 'OPTIONS'],
      preHandler: app.optionalAuth,
      handler: async (req, reply) => {
        const response = await yoga.handleNodeRequestAndResponse(req, reply, {
          req,
          reply,
        });
        for (const [key, value] of response.headers) {
          reply.header(key, value);
        }
        reply.status(response.status);
        reply.send(response.body);
        return reply;
      },
    });
  });
}
