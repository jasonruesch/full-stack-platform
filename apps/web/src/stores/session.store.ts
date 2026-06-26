import type { User } from '@bookmarkvault/shared';
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface SessionState {
  user: User | null;
  token: string | null;
  setSession: (user: User, token: string) => void;
  updateUser: (patch: Partial<User>) => void;
  clear: () => void;
}

/**
 * Authenticated session (client state). Persisted to localStorage so a reload
 * keeps the user signed in. The REST api-client and the Apollo auth link read
 * the token directly via `useSessionStore.getState()`.
 */
export const useSessionStore = create<SessionState>()(
  persist(
    (set) => ({
      user: null,
      token: null,
      setSession: (user, token) => set({ user, token }),
      updateUser: (patch) =>
        set((state) => ({
          user: state.user ? { ...state.user, ...patch } : state.user,
        })),
      clear: () => set({ user: null, token: null }),
    }),
    {
      name: 'bookmarkvault-session',
      partialize: (state) => ({ user: state.user, token: state.token }),
    },
  ),
);

/** Non-reactive token accessor for fetch/Apollo links. */
export function getToken(): string | null {
  return useSessionStore.getState().token;
}
