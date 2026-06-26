import { useApolloClient } from '@apollo/client/react';
import { useQueryClient } from '@tanstack/react-query';
import { useCallback } from 'react';
import { useNavigate } from 'react-router';
import { api } from '~/lib/api-client';
import { useSessionStore } from '~/stores/session.store';
import type { User } from '~/types';

/** The signed-in user, or null. Reactive. */
export function useCurrentUser(): User | null {
  return useSessionStore((s) => s.user);
}

/**
 * Sign the user out: tell the server, clear the session, and drop all cached
 * server state from both the REST (TanStack Query) and GraphQL (Apollo) caches
 * so no stale data leaks into the next session.
 */
export function useLogout(): () => Promise<void> {
  const navigate = useNavigate();
  const apollo = useApolloClient();
  const queryClient = useQueryClient();
  const clear = useSessionStore((s) => s.clear);

  return useCallback(async () => {
    try {
      await api.post('/api/auth/logout');
    } catch {
      // Logout is best-effort; clear locally regardless.
    }
    clear();
    queryClient.clear();
    await apollo.clearStore();
    navigate('/login', { replace: true });
  }, [apollo, clear, navigate, queryClient]);
}
