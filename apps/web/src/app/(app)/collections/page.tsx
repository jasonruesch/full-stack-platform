import { Card, Text } from '@jasonruesch/react';
import { FolderOpen } from 'lucide-react';
import { Link } from 'react-router';
import { EmptyState } from '~/components/feedback';
import { PageHeader } from '~/components/page-header';
import { useDocumentTitle } from '~/lib/a11y';
import { useCollections } from '~/lib/collections.api';
import { relativeTime } from '~/lib/format';
import { CreateCollectionDialog } from './_components/create-collection-dialog';

export default function CollectionsPage() {
  const { data: collections } = useCollections();
  useDocumentTitle('Collections');

  return (
    <div className="mx-auto max-w-5xl">
      <PageHeader
        title="Collections"
        description="Your saved links, grouped."
        actions={<CreateCollectionDialog />}
      />

      {collections.length === 0 ? (
        <EmptyState
          icon={<FolderOpen size={40} aria-hidden />}
          title="No collections yet"
          description="Create your first collection to start saving bookmarks."
          action={<CreateCollectionDialog />}
        />
      ) : (
        <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {collections.map((collection) => (
            <li key={collection.id}>
              <Link
                to={`/collections/${collection.id}`}
                className="block rounded-lg outline-offset-2 focus-visible:outline-2 focus-visible:outline-focus"
              >
                <Card className="h-full transition hover:border-line-strong hover:shadow-sm">
                  <div className="flex items-start gap-3 p-5">
                    <span
                      className="mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-md text-white"
                      style={{ backgroundColor: collection.color }}
                    >
                      <FolderOpen size={18} aria-hidden />
                    </span>
                    <div className="min-w-0">
                      <Text weight="semibold" className="truncate">
                        {collection.name}
                      </Text>
                      <Text tone="muted" size="sm" className="line-clamp-2">
                        {collection.description || 'No description'}
                      </Text>
                      <Text tone="subtle" size="xs" className="mt-2">
                        {collection.bookmarkCount}{' '}
                        {collection.bookmarkCount === 1
                          ? 'bookmark'
                          : 'bookmarks'}{' '}
                        · updated {relativeTime(collection.updatedAt)}
                      </Text>
                    </div>
                  </div>
                </Card>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
