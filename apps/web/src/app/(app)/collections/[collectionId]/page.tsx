import { BOOKMARK_SORTS, SORT_LABELS, type BookmarkSort } from '@bookmarkvault/shared';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  IconButton,
  Input,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Spinner,
  cn,
} from '@jasonruesch/react';
import { Bookmark as BookmarkIcon, Pencil, Search, Settings, Trash2 } from 'lucide-react';
import { Suspense, useState } from 'react';
import { useNavigate } from 'react-router';
import type { RouteProps } from 'virtual:react-router-next/(app)/collections/[collectionId]';
import { EmptyState } from '~/components/feedback';
import { PageHeader } from '~/components/page-header';
import { TagBadge } from '~/components/tag-badge';
import { useDocumentTitle } from '~/lib/a11y';
import { useBookmarks, useTags } from '~/lib/bookmarks.gql';
import { useCollection, useDeleteCollection } from '~/lib/collections.api';
import { BookmarkCard } from './_components/bookmark-card';
import { BookmarkDialog } from './_components/bookmark-dialog';
import { EditCollectionDialog } from './_components/edit-collection-dialog';
import { ShareDialog } from './_components/share-dialog';
import type { Tag } from '~/types';

function BookmarkResults({
  collectionId,
  query,
  sort,
  tagIds,
  allTags,
}: {
  collectionId: string;
  query: string;
  sort: BookmarkSort;
  tagIds: string[];
  allTags: Tag[];
}) {
  const { data } = useBookmarks({
    collectionId,
    query: query || undefined,
    tagIds: tagIds.length ? tagIds : undefined,
    sort,
  });

  if (data.bookmarks.length === 0) {
    return (
      <EmptyState
        icon={<BookmarkIcon size={36} aria-hidden />}
        title={query || tagIds.length ? 'No matches' : 'No bookmarks yet'}
        description={
          query || tagIds.length
            ? 'Try a different search or clear the tag filters.'
            : 'Add your first link to this collection.'
        }
      />
    );
  }

  return (
    <ul className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
      {data.bookmarks.map((bookmark) => (
        <li key={bookmark.id}>
          <BookmarkCard
            bookmark={bookmark}
            allTags={allTags}
            collectionId={collectionId}
          />
        </li>
      ))}
    </ul>
  );
}

export default function CollectionDetailPage({ params }: RouteProps) {
  const { collectionId } = params;
  const { data: collection } = useCollection(collectionId);
  const { data: tagData } = useTags();
  const navigate = useNavigate();
  const deleteCollection = useDeleteCollection();
  useDocumentTitle(collection.name);

  const [query, setQuery] = useState('');
  const [sort, setSort] = useState<BookmarkSort>('newest');
  const [tagIds, setTagIds] = useState<string[]>([]);
  const [editing, setEditing] = useState(false);

  const toggleTag = (id: string) =>
    setTagIds((prev) =>
      prev.includes(id) ? prev.filter((t) => t !== id) : [...prev, id],
    );

  const onDelete = () => {
    if (!confirm(`Delete “${collection.name}” and all its bookmarks?`)) return;
    deleteCollection.mutate(collection.id, {
      onSuccess: () => navigate('/collections', { replace: true }),
    });
  };

  return (
    <div className="mx-auto max-w-5xl">
      <PageHeader
        title={collection.name}
        description={collection.description ?? undefined}
        actions={
          <>
            <ShareDialog collectionId={collection.id} />
            <BookmarkDialog collectionId={collection.id} />
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <IconButton variant="ghost" aria-label="Collection settings">
                  <Settings size={18} aria-hidden />
                </IconButton>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onSelect={() => setEditing(true)}>
                  <Pencil size={15} aria-hidden /> Edit
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onSelect={onDelete}>
                  <Trash2 size={15} aria-hidden /> Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </>
        }
      />

      <div className="mb-5 flex flex-wrap items-center gap-3">
        <div className="relative min-w-56 flex-1">
          <Search
            size={16}
            aria-hidden
            className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-fg-subtle"
          />
          <Input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search bookmarks…"
            aria-label="Search bookmarks"
            className="pl-9"
          />
        </div>
        <Select value={sort} onValueChange={(v) => setSort(v as BookmarkSort)}>
          <SelectTrigger className="w-44" aria-label="Sort bookmarks">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {BOOKMARK_SORTS.map((option) => (
              <SelectItem key={option} value={option}>
                {SORT_LABELS[option]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {tagData.tags.length > 0 && (
        <div className="mb-5 flex flex-wrap gap-2">
          {tagData.tags.map((tag) => (
            <button
              key={tag.id}
              type="button"
              aria-pressed={tagIds.includes(tag.id)}
              onClick={() => toggleTag(tag.id)}
              className={cn(
                'rounded-full outline-offset-2 transition focus-visible:outline-2 focus-visible:outline-focus',
                tagIds.includes(tag.id)
                  ? 'ring-2 ring-accent'
                  : 'opacity-70 hover:opacity-100',
              )}
            >
              <TagBadge tag={tag} />
            </button>
          ))}
        </div>
      )}

      <Suspense
        fallback={
          <div className="flex justify-center py-16">
            <Spinner label="Loading bookmarks…" />
          </div>
        }
      >
        <BookmarkResults
          collectionId={collection.id}
          query={query}
          sort={sort}
          tagIds={tagIds}
          allTags={tagData.tags}
        />
      </Suspense>

      <EditCollectionDialog
        collection={collection}
        open={editing}
        onOpenChange={setEditing}
      />
    </div>
  );
}
