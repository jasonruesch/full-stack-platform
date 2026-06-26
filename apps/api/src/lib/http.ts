import type { z } from 'zod';

/** An error carrying an HTTP status, surfaced by the global error handler. */
export class HttpError extends Error {
  statusCode: number;
  constructor(statusCode: number, message: string) {
    super(message);
    this.name = 'HttpError';
    this.statusCode = statusCode;
  }
}

/**
 * Validate `data` against `schema`, throwing a 400 HttpError (with the first
 * issue's message) on failure. Returns the parsed, typed value on success.
 */
export function parse<T>(schema: z.ZodType<T>, data: unknown): T {
  const result = schema.safeParse(data);
  if (!result.success) {
    const first = result.error.issues[0];
    throw new HttpError(400, first?.message ?? 'Invalid request');
  }
  return result.data;
}

/** Best-effort favicon URL for a bookmark, derived from its origin. */
export function faviconFor(url: string): string | null {
  try {
    const origin = new URL(url).origin;
    return `https://www.google.com/s2/favicons?domain=${encodeURIComponent(
      origin,
    )}&sz=64`;
  } catch {
    return null;
  }
}

/** Derive a reasonable title from a URL when the user doesn't supply one. */
export function titleFromUrl(url: string): string {
  try {
    const u = new URL(url);
    return u.hostname.replace(/^www\./, '') + u.pathname.replace(/\/$/, '');
  } catch {
    return url;
  }
}
