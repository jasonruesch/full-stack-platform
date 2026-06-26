import {
  Button,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  IconButton,
  Input,
  Spinner,
  Stack,
  Text,
} from '@jasonruesch/react';
import { Check, Copy, Share2, Trash2 } from 'lucide-react';
import { Suspense, useState } from 'react';
import {
  useCollectionShares,
  useCreateShare,
  useDeleteShare,
} from '~/lib/collections.api';

function shareUrl(token: string): string {
  return `${window.location.origin}/share/${token}`;
}

function CopyButton({ value }: { value: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <IconButton
      variant="ghost"
      size="sm"
      aria-label="Copy link"
      onClick={async () => {
        await navigator.clipboard.writeText(value);
        setCopied(true);
        setTimeout(() => setCopied(false), 1500);
      }}
    >
      {copied ? <Check size={16} aria-hidden /> : <Copy size={16} aria-hidden />}
    </IconButton>
  );
}

function ShareList({ collectionId }: { collectionId: string }) {
  const { data: shares } = useCollectionShares(collectionId);
  const createShare = useCreateShare(collectionId);
  const deleteShare = useDeleteShare(collectionId);

  return (
    <Stack gap={4}>
      {shares.length === 0 ? (
        <Text tone="muted" size="sm">
          No public links yet. Create one to share this collection read-only.
        </Text>
      ) : (
        <Stack gap={2}>
          {shares.map((share) => (
            <div key={share.token} className="flex items-center gap-2">
              <Input readOnly value={shareUrl(share.token)} className="flex-1" />
              <CopyButton value={shareUrl(share.token)} />
              <IconButton
                variant="ghost"
                size="sm"
                aria-label="Revoke link"
                onClick={() => deleteShare.mutate(share.token)}
              >
                <Trash2 size={16} aria-hidden />
              </IconButton>
            </div>
          ))}
        </Stack>
      )}
      <Button
        variant="outline"
        onClick={() => createShare.mutate()}
        loading={createShare.isPending}
      >
        Create share link
      </Button>
    </Stack>
  );
}

/** Manage read-only public share links for a collection. */
export function ShareDialog({ collectionId }: { collectionId: string }) {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline">
          <Share2 size={16} aria-hidden /> Share
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Share collection</DialogTitle>
          <DialogDescription>
            Anyone with a link can view this collection — no account needed.
          </DialogDescription>
        </DialogHeader>
        <Suspense
          fallback={
            <div className="flex justify-center py-6">
              <Spinner label="Loading links…" />
            </div>
          }
        >
          <ShareList collectionId={collectionId} />
        </Suspense>
      </DialogContent>
    </Dialog>
  );
}
