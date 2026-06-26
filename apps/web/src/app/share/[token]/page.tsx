import type { SharedCollection } from '@bookmarkvault/shared';
import { notFound } from '@evolonix/react-router-next';
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
  Heading,
  Text,
} from '@jasonruesch/react';
import { useSuspenseQuery } from '@tanstack/react-query';
import { Bookmark, ExternalLink } from 'lucide-react';
import type { RouteProps } from 'virtual:react-router-next/share/[token]';
import { TagBadge } from '~/components/tag-badge';
import { useDocumentTitle } from '~/lib/a11y';
import { api, ApiError } from '~/lib/api-client';
import { initials, hostOf, relativeTime } from '~/lib/format';

function useSharedCollection(token: string) {
  return useSuspenseQuery({
    queryKey: ['shared', token],
    queryFn: async () => {
      try {
        return await api.get<SharedCollection>(`/api/shared/${token}`);
      } catch (error) {
        if (error instanceof ApiError && error.status === 404) notFound();
        throw error;
      }
    },
  });
}

export default function SharedCollectionPage({ params }: RouteProps) {
  const { data } = useSharedCollection(params.token);
  const { collection, owner, bookmarks } = data;
  useDocumentTitle(collection.name);

  return (
    <div className="min-h-dvh bg-canvas">
      <header className="border-b border-line bg-surface">
        <div className="mx-auto flex max-w-3xl items-center gap-2 px-4 py-3">
          <span className="flex size-7 items-center justify-center rounded-md bg-accent text-on-accent">
            <Bookmark size={16} aria-hidden />
          </span>
          <Text weight="bold">BookmarkVault</Text>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-4 py-10">
        <div
          className="mb-1 inline-block size-10 rounded-md"
          style={{ backgroundColor: collection.color }}
          aria-hidden
        />
        <Heading level={1} className="text-3xl font-bold tracking-tight">
          {collection.name}
        </Heading>
        {collection.description && (
          <Text tone="muted" className="mt-1">
            {collection.description}
          </Text>
        )}
        <div className="mt-3 flex items-center gap-2">
          <Avatar size="sm">
            <AvatarImage src={owner.avatarUrl ?? undefined} alt="" />
            <AvatarFallback>{initials(owner.name)}</AvatarFallback>
          </Avatar>
          <Text tone="subtle" size="sm">
            Shared by {owner.name} · {bookmarks.length} bookmarks
          </Text>
        </div>

        <ul className="mt-8 flex flex-col gap-3">
          {bookmarks.map((bookmark) => (
            <li
              key={bookmark.id}
              className="flex items-start gap-3 rounded-lg border border-line p-4"
            >
              {bookmark.faviconUrl ? (
                <img
                  src={bookmark.faviconUrl}
                  alt=""
                  width={20}
                  height={20}
                  className="mt-0.5 size-5 shrink-0 rounded"
                />
              ) : (
                <span className="mt-0.5 size-5 shrink-0 rounded bg-surface-strong" />
              )}
              <div className="min-w-0 flex-1">
                <a
                  href={bookmark.url}
                  target="_blank"
                  rel="noreferrer noopener"
                  className="flex items-center gap-1 font-medium text-fg hover:text-accent focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus"
                >
                  <span className="truncate">{bookmark.title}</span>
                  <ExternalLink size={13} aria-hidden className="shrink-0" />
                </a>
                <Text tone="subtle" size="xs">
                  {hostOf(bookmark.url)} · {relativeTime(bookmark.createdAt)}
                </Text>
                {bookmark.description && (
                  <Text tone="muted" size="sm" className="mt-1 line-clamp-2">
                    {bookmark.description}
                  </Text>
                )}
                {bookmark.tags.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {bookmark.tags.map((tag) => (
                      <TagBadge key={tag.id} tag={tag} />
                    ))}
                  </div>
                )}
              </div>
            </li>
          ))}
        </ul>
      </main>
    </div>
  );
}
