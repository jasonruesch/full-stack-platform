import { Button, Heading, Stack, Text } from '@jasonruesch/react';
import { useNavigate } from 'react-router';
import { useDocumentTitle } from '~/lib/a11y';

/** Rendered when a collection id doesn't exist (notFound() in useCollection). */
export default function CollectionNotFound() {
  const navigate = useNavigate();
  useDocumentTitle('Collection not found');
  return (
    <Stack gap={3} align="center" className="py-16 text-center">
      <Heading level={3}>Collection not found</Heading>
      <Text tone="muted" className="max-w-sm">
        This collection may have been deleted or you don&apos;t have access to it.
      </Text>
      <Button className="mt-2" onClick={() => navigate('/collections')}>
        Back to collections
      </Button>
    </Stack>
  );
}
