import { QueryClient } from '@tanstack/react-query';

/**
 * Shared TanStack Query client for the REST layer. `useSuspenseQuery` calls
 * suspend, which the filesystem router renders as the nearest `loading.tsx`;
 * thrown errors surface at the nearest `error.tsx`.
 */
export function createQueryClient(): QueryClient {
  return new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        staleTime: 30_000,
        refetchOnWindowFocus: false,
      },
    },
  });
}

export const queryClient = createQueryClient();
