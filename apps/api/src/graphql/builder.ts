import SchemaBuilder from '@pothos/core';
import { createGraphQLError } from 'graphql-yoga';

/** Per-request GraphQL context: the authenticated user id, or null. */
export interface GraphQLContext {
  userId: string | null;
}

export const builder = new SchemaBuilder<{ Context: GraphQLContext }>({});

builder.queryType({});
builder.mutationType({});

/** Return the authed user id or throw an UNAUTHENTICATED error the client maps. */
export function requireUser(ctx: GraphQLContext): string {
  if (!ctx.userId) {
    throw createGraphQLError('Authentication required', {
      extensions: { code: 'UNAUTHENTICATED' },
    });
  }
  return ctx.userId;
}
