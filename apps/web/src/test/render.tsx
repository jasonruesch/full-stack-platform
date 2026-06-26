import { ApolloProvider } from '@apollo/client/react';
import { TooltipProvider } from '@jasonruesch/react';
import { QueryClientProvider } from '@tanstack/react-query';
import { render } from '@testing-library/react';
import type { ReactElement, ReactNode } from 'react';
import { MemoryRouter } from 'react-router';
import { createApolloClient } from '~/lib/apollo';
import { createQueryClient } from '~/lib/query-client';

/**
 * Render a component with the same providers the app mounts (Apollo, Query,
 * Tooltip) plus a MemoryRouter, using fresh clients per test so cache state
 * never leaks between cases.
 */
export function renderWithProviders(
  ui: ReactElement,
  { route = '/' }: { route?: string } = {},
) {
  const queryClient = createQueryClient();
  const apolloClient = createApolloClient();

  function Wrapper({ children }: { children: ReactNode }) {
    return (
      <MemoryRouter initialEntries={[route]}>
        <ApolloProvider client={apolloClient}>
          <QueryClientProvider client={queryClient}>
            <TooltipProvider>{children}</TooltipProvider>
          </QueryClientProvider>
        </ApolloProvider>
      </MemoryRouter>
    );
  }

  return render(ui, { wrapper: Wrapper });
}
