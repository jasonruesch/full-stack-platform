import { Navigate, Outlet, useLocation } from 'react-router';
import { AppShell } from '~/components/app-shell';
import { useCurrentUser } from '~/lib/use-auth';

/**
 * Auth guard for the entire authenticated area. Unauthenticated visitors are
 * redirected to /login with a `redirect` back to where they were headed.
 */
export default function AppLayout() {
  const user = useCurrentUser();
  const location = useLocation();

  if (!user) {
    const redirect = encodeURIComponent(location.pathname + location.search);
    return <Navigate to={`/login?redirect=${redirect}`} replace />;
  }

  return (
    <AppShell>
      <Outlet />
    </AppShell>
  );
}
