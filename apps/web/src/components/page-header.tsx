import { Heading, Text } from '@jasonruesch/react';
import type { ReactNode } from 'react';

/** Standard page heading with an optional description and trailing actions. */
export function PageHeader({
  title,
  description,
  actions,
}: {
  title: string;
  description?: string;
  actions?: ReactNode;
}) {
  return (
    <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
      <div>
        <Heading level={1} className="text-2xl font-bold tracking-tight">
          {title}
        </Heading>
        {description && (
          <Text tone="muted" className="mt-1">
            {description}
          </Text>
        )}
      </div>
      {actions && <div className="flex items-center gap-2">{actions}</div>}
    </div>
  );
}
