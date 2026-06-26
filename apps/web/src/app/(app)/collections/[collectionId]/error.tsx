import { useNavigate, useRouteError } from 'react-router';
import { DataError } from '~/components/feedback';

/** Scoped error boundary for a single collection. */
export default function CollectionError() {
  const error = useRouteError();
  const navigate = useNavigate();
  return (
    <DataError
      title="Couldn't load this collection"
      error={error}
      onRetry={() => navigate(0)}
    />
  );
}
