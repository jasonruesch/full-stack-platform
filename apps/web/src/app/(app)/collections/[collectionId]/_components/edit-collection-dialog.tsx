import { COLLECTION_COLORS, type CollectionWithCount } from '@bookmarkvault/shared';
import {
  Button,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  Field,
  Input,
  Stack,
  Switch,
  Textarea,
  cn,
} from '@jasonruesch/react';
import { type FormEvent, useState } from 'react';
import { useUpdateCollection } from '~/lib/collections.api';

interface Props {
  collection: CollectionWithCount;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

/** Edit a collection's name, description, color, and public flag. */
export function EditCollectionDialog({ collection, open, onOpenChange }: Props) {
  const [name, setName] = useState(collection.name);
  const [description, setDescription] = useState(collection.description ?? '');
  const [color, setColor] = useState(collection.color);
  const [isPublic, setIsPublic] = useState(collection.isPublic);
  const update = useUpdateCollection(collection.id);

  const onSubmit = (event: FormEvent) => {
    event.preventDefault();
    if (!name.trim()) return;
    update.mutate(
      {
        name: name.trim(),
        description: description.trim() || undefined,
        color,
        isPublic,
      },
      { onSuccess: () => onOpenChange(false) },
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit collection</DialogTitle>
          <DialogDescription>Update collection details.</DialogDescription>
        </DialogHeader>
        <form onSubmit={onSubmit}>
          <Stack gap={4}>
            <Field label="Name" required>
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </Field>
            <Field label="Description">
              <Textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
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
                      color === c ? 'outline-2 outline-focus' : 'hover:scale-110',
                    )}
                    style={{ backgroundColor: c }}
                  />
                ))}
              </div>
            </Field>
            <label className="flex items-center justify-between gap-3">
              <span className="text-sm font-medium">Public</span>
              <Switch checked={isPublic} onCheckedChange={setIsPublic} />
            </label>
          </Stack>
          <DialogFooter className="mt-6">
            <Button
              type="button"
              variant="ghost"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button type="submit" loading={update.isPending}>
              Save
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
