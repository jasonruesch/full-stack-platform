import '@fastify/jwt';
import 'fastify';

/** Shape of the signed JWT payload. */
export interface JwtPayload {
  sub: string;
}

declare module '@fastify/jwt' {
  interface FastifyJWT {
    payload: JwtPayload;
    user: JwtPayload;
  }
}

declare module 'fastify' {
  interface FastifyInstance {
    /** preHandler that requires a valid bearer token (401 otherwise). */
    authenticate: import('fastify').preHandlerHookHandler;
    /** preHandler that resolves the user if a token is present, else continues. */
    optionalAuth: import('fastify').preHandlerHookHandler;
  }
  interface FastifyRequest {
    /** The authenticated user id, populated by `authenticate`/`optionalAuth`. */
    userId: string | null;
  }
}
