import { ApolloClient, HttpLink, InMemoryCache } from '@apollo/client';
import { CombinedGraphQLErrors } from '@apollo/client/errors';
import { SetContextLink } from '@apollo/client/link/context';
import { ErrorLink } from '@apollo/client/link/error';
import { getToken, useSessionStore } from '~/stores/session.store';

const httpLink = new HttpLink({ uri: '/graphql' });

// Attach the bearer token to every GraphQL request.
const authLink = new SetContextLink((prevContext) => {
  const token = getToken();
  return {
    headers: {
      ...prevContext.headers,
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  };
});

// Clear the session if the server reports the token is no longer valid.
const errorLink = new ErrorLink(({ error }) => {
  if (
    CombinedGraphQLErrors.is(error) &&
    error.errors.some((e) => e.extensions?.code === 'UNAUTHENTICATED')
  ) {
    useSessionStore.getState().clear();
  }
});

export function createApolloClient(): ApolloClient {
  return new ApolloClient({
    link: errorLink.concat(authLink).concat(httpLink),
    cache: new InMemoryCache(),
  });
}

export const apolloClient = createApolloClient();
