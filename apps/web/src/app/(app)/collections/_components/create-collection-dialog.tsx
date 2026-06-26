import { COLLECTION_COLORS } from '@bookmarkvault/shared';
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
  cn,
} from '@jasonruesch/react';
import { Plus } from 'lucide-react';
import { type FormEvent, type ReactNode, useState } from 'react';
import { useNavigate } from 'react-router';
import { useCreateCollection } from '~/lib/collections.api';

/** Dialog to create a collection; navigates into it on success. */
export function CreateCollectionDialog({ trigger }: { trigger?: ReactNode }) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [color, setColor] = useState<string>(COLLECTION_COLORS[0]);
  const navigate = useNavigate();
  const create = useCreateCollection();

  const onSubmit = (event: FormEvent) => {
    event.preventDefault();
    if (!name.trim()) return;
    create.mutate(
      { name: name.trim(), description: description.trim() || undefined, color },
      {
        onSuccess: (collection) => {
          setOpen(false);
          setName('');
          setDescription('');
          navigate(`/collections/${collection.id}`);
        },
      },
    );
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger ?? (
          <Button>
            <Plus size={16} aria-hidden /> New collection
          </Button>
        )}
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>New collection</DialogTitle>
          <DialogDescription>
            Group related bookmarks together.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={onSubmit}>
          <Stack gap={4}>
            <Field label="Name" required>
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Reading list"
                autoFocus
                required
              />
            </Field>
            <Field label="Description">
              <Textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Optional"
                rows={2}
              />
            </Field>
            <Field label="Color">
              <div className="flex flex-wrap gap-2">
                {COLLECTION_COLORS.map((c) => (
                  <button
                    key={c}
                    type="button"
                    aria-label={`Color ${c}`}
                    aria-pressed={color === c}
                    onClick={() => setColor(c)}
                    className={cn(
                      'size-7 rounded-full outline-offset-2 transition',
                      color === c
                        ? 'outline-2 outline-focus'
                        : 'hover:scale-110',
                    )}
                    style={{ backgroundColor: c }}
                  />
                ))}
              </div>
            </Field>
          </Stack>
          <DialogFooter className="mt-6">
            <Button
              type="button"
              variant="ghost"
              onClick={() => setOpen(false)}
            >
              Cancel
            </Button>
            <Button type="submit" loading={create.isPending}>
              Create
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
