import { type AuthResponse, registerSchema } from '@bookmarkvault/shared';
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
import { useDocumentTitle } from '~/lib/a11y';
import { api, ApiError } from '~/lib/api-client';
import { useCurrentUser } from '~/lib/use-auth';
import { AppLink } from '~/components/app-link';
import { useSessionStore } from '~/stores/session.store';

export default function RegisterPage() {
  const user = useCurrentUser();
  const navigate = useNavigate();
  const setSession = useSessionStore((s) => s.setSession);
  useDocumentTitle('Create account');

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [validationError, setValidationError] = useState<string | null>(null);

  const register = useMutation({
    mutationFn: (input: { name: string; email: string; password: string }) =>
      api.post<AuthResponse>('/api/auth/register', input),
    onSuccess: ({ token, user: nextUser }) => {
      setSession(nextUser, token);
      navigate('/collections', { replace: true });
    },
  });

  if (user) return <Navigate to="/collections" replace />;

  const onSubmit = (event: FormEvent) => {
    event.preventDefault();
    const parsed = registerSchema.safeParse({ name, email, password });
    if (!parsed.success) {
      setValidationError(parsed.error.issues[0]?.message ?? 'Invalid details');
      return;
    }
    setValidationError(null);
    register.mutate(parsed.data);
  };

  const errorMessage =
    validationError ??
    (register.error instanceof ApiError
      ? register.error.message
      : register.error
        ? 'Unable to create your account. Please try again.'
        : null);

  return (
    <div className="flex min-h-dvh items-center justify-center bg-surface p-4">
      <Card className="w-full max-w-sm">
        <CardHeader>
          <span className="mb-2 flex size-10 items-center justify-center rounded-lg bg-accent text-on-accent">
            <Bookmark size={22} aria-hidden />
          </span>
          <CardTitle>Create your account</CardTitle>
          <CardDescription>Start saving links in seconds.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={onSubmit} noValidate>
            <Stack gap={4}>
              {errorMessage && (
                <Alert variant="danger">
                  <AlertDescription>{errorMessage}</AlertDescription>
                </Alert>
              )}
              <Field label="Name" required>
                <Input
                  name="name"
                  autoComplete="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />
              </Field>
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
              <Field label="Password" required description="At least 8 characters">
                <Input
                  type="password"
                  name="password"
                  autoComplete="new-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </Field>
              <Button type="submit" fullWidth loading={register.isPending}>
                Create account
              </Button>
              <Text tone="subtle" size="xs" align="center">
                Already have an account? <AppLink to="/login">Sign in</AppLink>
              </Text>
            </Stack>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
