import { importSchema } from '@bookmarkvault/shared';
import {
  Alert,
  AlertDescription,
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Stack,
  Text,
} from '@jasonruesch/react';
import { Download, Upload } from 'lucide-react';
import { useRef, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { AppearanceControls } from '~/components/appearance';
import { PageHeader } from '~/components/page-header';
import { useDocumentTitle } from '~/lib/a11y';
import { api, ApiError } from '~/lib/api-client';
import { useCurrentUser } from '~/lib/use-auth';

export default function SettingsPage() {
  const user = useCurrentUser();
  const queryClient = useQueryClient();
  const fileRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<{
    tone: 'success' | 'danger';
    text: string;
  } | null>(null);
  useDocumentTitle('Settings');

  const onExport = async () => {
    setBusy(true);
    setMessage(null);
    try {
      const data = await api.get<unknown>('/api/export');
      const blob = new Blob([JSON.stringify(data, null, 2)], {
        type: 'application/json',
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'bookmarkvault-export.json';
      a.click();
      URL.revokeObjectURL(url);
    } finally {
      setBusy(false);
    }
  };

  const onImportFile = async (file: File) => {
    setBusy(true);
    setMessage(null);
    try {
      const parsed = JSON.parse(await file.text());
      // Accept either a raw bookmark array or our export's collections shape.
      const collections = Array.isArray(parsed?.collections)
        ? parsed.collections
        : null;
      let total = 0;
      if (collections) {
        for (const c of collections) {
          const payload = importSchema.parse({
            collectionName: c.name,
            bookmarks: c.bookmarks,
          });
          const result = await api.post<{ imported: number }>(
            '/api/import',
            payload,
          );
          total += result.imported;
        }
      } else {
        const payload = importSchema.parse({
          collectionName: 'Imported',
          bookmarks: parsed,
        });
        const result = await api.post<{ imported: number }>(
          '/api/import',
          payload,
        );
        total = result.imported;
      }
      await queryClient.invalidateQueries({ queryKey: ['collections'] });
      setMessage({ tone: 'success', text: `Imported ${total} bookmarks.` });
    } catch (error) {
      const text =
        error instanceof ApiError
          ? error.message
          : 'That file could not be imported. Expected BookmarkVault JSON.';
      setMessage({ tone: 'danger', text });
    } finally {
      setBusy(false);
      if (fileRef.current) fileRef.current.value = '';
    }
  };

  return (
    <div className="mx-auto max-w-2xl">
      <PageHeader title="Settings" />

      <Stack gap={6}>
        <Card>
          <CardHeader>
            <CardTitle>Appearance</CardTitle>
            <CardDescription>Choose how BookmarkVault looks.</CardDescription>
          </CardHeader>
          <CardContent>
            <AppearanceControls />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Import &amp; export</CardTitle>
            <CardDescription>
              Move your bookmarks in and out as JSON.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Stack gap={4}>
              {message && (
                <Alert variant={message.tone === 'danger' ? 'danger' : 'success'}>
                  <AlertDescription>{message.text}</AlertDescription>
                </Alert>
              )}
              <div className="flex flex-wrap gap-3">
                <Button variant="outline" onClick={onExport} loading={busy}>
                  <Download size={16} aria-hidden /> Export
                </Button>
                <Button
                  variant="outline"
                  onClick={() => fileRef.current?.click()}
                  loading={busy}
                >
                  <Upload size={16} aria-hidden /> Import
                </Button>
                <input
                  ref={fileRef}
                  type="file"
                  accept="application/json"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) void onImportFile(file);
                  }}
                />
              </div>
            </Stack>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Account</CardTitle>
          </CardHeader>
          <CardContent>
            <Stack gap={1}>
              <Text weight="medium">{user?.name}</Text>
              <Text tone="muted" size="sm">
                {user?.email}
              </Text>
            </Stack>
          </CardContent>
        </Card>
      </Stack>
    </div>
  );
}
