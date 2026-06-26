import { Navigate } from 'react-router';
import { useCurrentUser } from '~/lib/use-auth';

/** Index route: signed-in users go to their collections, others to login. */
export default function IndexPage() {
  const user = useCurrentUser();
  return <Navigate to={user ? '/collections' : '/login'} replace />;
}
