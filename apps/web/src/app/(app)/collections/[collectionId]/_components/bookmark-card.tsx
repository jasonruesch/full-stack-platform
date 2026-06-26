import type { BookmarkWithTags, Tag } from '@bookmarkvault/shared';
import {
  Card,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  IconButton,
  Popover,
  PopoverContent,
  PopoverTrigger,
  Text,
} from '@jasonruesch/react';
import {
  ExternalLink,
  MoreVertical,
  Pencil,
  Tag as TagIcon,
  Trash2,
} from 'lucide-react';
import { useState } from 'react';
import { TagBadge } from '~/components/tag-badge';
import {
  useAddTag,
  useDeleteBookmark,
  useRemoveTag,
} from '~/lib/bookmarks.gql';
import { hostOf, relativeTime } from '~/lib/format';
import { BookmarkDialog } from './bookmark-dialog';

/** Toggleable list of the user's tags for one bookmark. */
function TagPopover({
  bookmark,
  allTags,
}: {
  bookmark: BookmarkWithTags;
  allTags: Tag[];
}) {
  const [addTag] = useAddTag();
  const [removeTag] = useRemoveTag();
  const selected = new Set(bookmark.tags.map((t) => t.id));

  return (
    <Popover>
      <PopoverTrigger asChild>
        <IconButton variant="ghost" size="sm" aria-label="Edit tags">
          <TagIcon size={16} aria-hidden />
        </IconButton>
      </PopoverTrigger>
      <PopoverContent className="w-56">
        {allTags.length === 0 ? (
          <Text tone="muted" size="sm">
            No tags yet. Create some on the Tags page.
          </Text>
        ) : (
          <div className="flex max-h-64 flex-col gap-1 overflow-y-auto">
            {allTags.map((tag) => {
              const isOn = selected.has(tag.id);
              return (
                <button
                  key={tag.id}
                  type="button"
                  aria-pressed={isOn}
                  onClick={() =>
                    isOn
                      ? removeTag({
                          variables: { bookmarkId: bookmark.id, tagId: tag.id },
                        })
                      : addTag({
                          variables: { bookmarkId: bookmark.id, tagId: tag.id },
                        })
                  }
                  className={
                    'flex items-center justify-between rounded px-2 py-1.5 text-left text-sm hover:bg-surface ' +
                    (isOn ? 'font-medium' : '')
                  }
                >
                  <TagBadge tag={tag} />
                  {isOn && <span aria-hidden>✓</span>}
                </button>
              );
            })}
          </div>
        )}
      </PopoverContent>
    </Popover>
  );
}

export function BookmarkCard({
  bookmark,
  allTags,
  collectionId,
}: {
  bookmark: BookmarkWithTags;
  allTags: Tag[];
  collectionId: string;
}) {
  const [editing, setEditing] = useState(false);
  const [deleteBookmark] = useDeleteBookmark();

  return (
    <Card className="flex h-full flex-col gap-3 p-4">
      <div className="flex items-start gap-3">
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
          <Text tone="subtle" size="xs" className="truncate">
            {hostOf(bookmark.url)} · {relativeTime(bookmark.createdAt)}
          </Text>
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <IconButton variant="ghost" size="sm" aria-label="Bookmark actions">
              <MoreVertical size={16} aria-hidden />
            </IconButton>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onSelect={() => setEditing(true)}>
              <Pencil size={15} aria-hidden /> Edit
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onSelect={() => deleteBookmark({ variables: { id: bookmark.id } })}
            >
              <Trash2 size={15} aria-hidden /> Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {bookmark.description && (
        <Text tone="muted" size="sm" className="line-clamp-3">
          {bookmark.description}
        </Text>
      )}

      <div className="mt-auto flex items-center justify-between gap-2 pt-1">
        <div className="flex flex-wrap gap-1.5">
          {bookmark.tags.map((tag) => (
            <TagBadge key={tag.id} tag={tag} />
          ))}
        </div>
        <TagPopover bookmark={bookmark} allTags={allTags} />
      </div>

      <BookmarkDialog
        collectionId={collectionId}
        bookmark={bookmark}
        open={editing}
        onOpenChange={setEditing}
        trigger={null}
      />
    </Card>
  );
}
