import type { BookmarkWithTags } from '@bookmarkvault/shared';
import {
  Button,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  Field,
  Input,
  Stack,
  Textarea,
} from '@jasonruesch/react';
import { Plus } from 'lucide-react';
import { type FormEvent, type ReactNode, useState } from 'react';
import { useCreateBookmark, useUpdateBookmark } from '~/lib/bookmarks.gql';

interface Props {
  collectionId: string;
  /** When provided, the dialog edits this bookmark instead of creating one. */
  bookmark?: BookmarkWithTags;
  trigger?: ReactNode;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

/** Create or edit a bookmark (URL, title, description) via GraphQL. */
export function BookmarkDialog({
  collectionId,
  bookmark,
  trigger,
  open: controlledOpen,
  onOpenChange,
}: Props) {
  const [uncontrolledOpen, setUncontrolledOpen] = useState(false);
  const open = controlledOpen ?? uncontrolledOpen;
  const setOpen = onOpenChange ?? setUncontrolledOpen;

  const [url, setUrl] = useState(bookmark?.url ?? '');
  const [title, setTitle] = useState(bookmark?.title ?? '');
  const [description, setDescription] = useState(bookmark?.description ?? '');

  const [createBookmark, createState] = useCreateBookmark();
  const [updateBookmark, updateState] = useUpdateBookmark();
  const isEdit = Boolean(bookmark);
  const pending = createState.loading || updateState.loading;

  const reset = () => {
    if (!isEdit) {
      setUrl('');
      setTitle('');
      setDescription('');
    }
  };

  const onSubmit = async (event: FormEvent) => {
    event.preventDefault();
    if (!url.trim()) return;
    if (isEdit) {
      await updateBookmark({
        variables: {
          id: bookmark!.id,
          url: url.trim(),
          title: title.trim() || undefined,
          description: description.trim() || null,
        },
      });
    } else {
      await createBookmark({
        variables: {
          collectionId,
          url: url.trim(),
          title: title.trim() || undefined,
          description: description.trim() || undefined,
        },
      });
    }
    setOpen(false);
    reset();
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      {trigger === null ? null : trigger ? (
        <DialogTrigger asChild>{trigger}</DialogTrigger>
      ) : (
        <DialogTrigger asChild>
          <Button>
            <Plus size={16} aria-hidden /> Add bookmark
          </Button>
        </DialogTrigger>
      )}
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{isEdit ? 'Edit bookmark' : 'Add bookmark'}</DialogTitle>
          <DialogDescription>
            {isEdit
              ? 'Update this bookmark.'
              : 'Paste a link to save it to this collection.'}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={onSubmit}>
          <Stack gap={4}>
            <Field label="URL" required>
              <Input
                type="url"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="https://example.com"
                autoFocus
                required
              />
            </Field>
            <Field label="Title" description="Defaults to the site if left blank">
              <Input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Optional"
              />
            </Field>
            <Field label="Notes">
              <Textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Optional"
                rows={2}
              />
            </Field>
          </Stack>
          <DialogFooter className="mt-6">
            <Button type="button" variant="ghost" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" loading={pending}>
              {isEdit ? 'Save' : 'Add'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
