import { TAG_COLORS } from '@bookmarkvault/shared';
import {
  Button,
  Card,
  Field,
  IconButton,
  Input,
  Stack,
  Text,
  cn,
} from '@jasonruesch/react';
import { Tag as TagIcon, Trash2 } from 'lucide-react';
import { type FormEvent, useState } from 'react';
import { EmptyState } from '~/components/feedback';
import { PageHeader } from '~/components/page-header';
import { TagBadge } from '~/components/tag-badge';
import { useDocumentTitle } from '~/lib/a11y';
import { useCreateTag, useDeleteTag, useTags } from '~/lib/bookmarks.gql';

export default function TagsPage() {
  const { data } = useTags();
  const [createTag, createState] = useCreateTag();
  const [deleteTag] = useDeleteTag();
  const [name, setName] = useState('');
  const [color, setColor] = useState<string>(TAG_COLORS[0]);
  useDocumentTitle('Tags');

  const onSubmit = async (event: FormEvent) => {
    event.preventDefault();
    if (!name.trim()) return;
    await createTag({ variables: { name: name.trim(), color } });
    setName('');
  };

  return (
    <div className="mx-auto max-w-3xl">
      <PageHeader
        title="Tags"
        description="Labels you can apply to bookmarks across collections."
      />

      <Card className="mb-6 p-5">
        <form onSubmit={onSubmit}>
          <Stack gap={4}>
            <Field label="New tag">
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. must-read"
              />
            </Field>
            <Field label="Color">
              <div className="flex flex-wrap gap-2">
                {TAG_COLORS.map((c) => (
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
            <div>
              <Button type="submit" loading={createState.loading}>
                Add tag
              </Button>
            </div>
          </Stack>
        </form>
      </Card>

      {data.tags.length === 0 ? (
        <EmptyState
          icon={<TagIcon size={36} aria-hidden />}
          title="No tags yet"
          description="Create a tag above to start labeling bookmarks."
        />
      ) : (
        <ul className="flex flex-col gap-2">
          {data.tags.map((tag) => (
            <li
              key={tag.id}
              className="flex items-center justify-between rounded-lg border border-line px-4 py-2"
            >
              <TagBadge tag={tag} />
              <IconButton
                variant="ghost"
                size="sm"
                aria-label={`Delete ${tag.name}`}
                onClick={() => deleteTag({ variables: { id: tag.id } })}
              >
                <Trash2 size={16} aria-hidden />
              </IconButton>
            </li>
          ))}
        </ul>
      )}

      <Text tone="subtle" size="xs" className="mt-4">
        Deleting a tag removes it from any bookmarks it was applied to.
      </Text>
    </div>
  );
}
