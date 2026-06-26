import type { AuthResponse } from '@bookmarkvault/shared';
import { useMutation } from '@tanstack/react-query';
import {
  Alert,
  AlertDescription,
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Field,
  Input,
  Stack,
  Text,
} from '@jasonruesch/react';
import { Bookmark } from 'lucide-react';
import { type FormEvent, useState } from 'react';
import { Navigate, useNavigate } from 'react-router';
import { z } from 'zod';
import type { RouteProps } from 'virtual:react-router-next/(auth)/login';
import { useDocumentTitle } from '~/lib/a11y';
import { api, ApiError } from '~/lib/api-client';
import { useCurrentUser } from '~/lib/use-auth';
import { AppLink } from '~/components/app-link';
import { useSessionStore } from '~/stores/session.store';

export const searchSchema = z.object({
  redirect: z.string().optional(),
});

const DEMO = { email: 'demo@bookmarkvault.app', password: 'password' };

export default function LoginPage({ searchParams }: RouteProps) {
  const user = useCurrentUser();
  const navigate = useNavigate();
  const setSession = useSessionStore((s) => s.setSession);
  const redirectTo = searchParams.redirect ?? '/collections';
  useDocumentTitle('Sign in');

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const login = useMutation({
    mutationFn: (credentials: { email: string; password: string }) =>
      api.post<AuthResponse>('/api/auth/login', credentials),
    onSuccess: ({ token, user: nextUser }) => {
      setSession(nextUser, token);
      navigate(redirectTo, { replace: true });
    },
  });

  if (user) return <Navigate to={redirectTo} replace />;

  const onSubmit = (event: FormEvent) => {
    event.preventDefault();
    login.mutate({ email, password });
  };

  const fillDemo = () => {
    setEmail(DEMO.email);
    setPassword(DEMO.password);
    login.mutate(DEMO);
  };

  const errorMessage =
    login.error instanceof ApiError
      ? login.error.message
      : login.error
        ? 'Unable to sign in. Please try again.'
        : null;

  return (
    <div className="flex min-h-dvh items-center justify-center bg-surface p-4">
      <Card className="w-full max-w-sm">
        <CardHeader>
          <span className="mb-2 flex size-10 items-center justify-center rounded-lg bg-accent text-on-accent">
            <Bookmark size={22} aria-hidden />
          </span>
          <CardTitle>Sign in to BookmarkVault</CardTitle>
          <CardDescription>Save, organize, and share your links.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={onSubmit} noValidate>
            <Stack gap={4}>
              {errorMessage && (
                <Alert variant="danger">
                  <AlertDescription>{errorMessage}</AlertDescription>
                </Alert>
              )}
              <Field label="Email" required>
                <Input
                  type="email"
                  name="email"
                  autoComplete="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </Field>
              <Field label="Password" required>
                <Input
                  type="password"
                  name="password"
                  autoComplete="current-password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </Field>
              <Button type="submit" fullWidth loading={login.isPending}>
                Sign in
              </Button>
              <Button
                type="button"
                variant="ghost"
                fullWidth
                onClick={fillDemo}
                disabled={login.isPending}
              >
                Use demo account
              </Button>
              <Text tone="subtle" size="xs" align="center">
                No account? <AppLink to="/register">Create one</AppLink>
              </Text>
            </Stack>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
