import { describe, expect, it } from 'vitest';
import { hostOf, initials } from '~/lib/format';

describe('format helpers', () => {
  it('derives up to two initials', () => {
    expect(initials('Demo User')).toBe('DU');
    expect(initials('madonna')).toBe('M');
    expect(initials('Ada Lovelace Byron')).toBe('AL');
  });

  it('strips the scheme and www from a host', () => {
    expect(hostOf('https://www.example.com/a/b?c=1')).toBe('example.com');
    expect(hostOf('http://fastify.dev')).toBe('fastify.dev');
  });

  it('returns the raw value for an unparseable URL', () => {
    expect(hostOf('not a url')).toBe('not a url');
  });
});
