import type { Tag } from '@bookmarkvault/shared';

/**
 * A small colored pill for a tag. The tag's color drives both the dot and a
 * tinted background, derived at runtime so any hex value renders consistently.
 */
export function TagBadge({ tag }: { tag: Pick<Tag, 'name' | 'color'> }) {
  return (
    <span
      className="inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-xs font-medium"
      style={{ backgroundColor: `${tag.color}1a`, color: tag.color }}
    >
      <span
        className="size-1.5 rounded-full"
        style={{ backgroundColor: tag.color }}
        aria-hidden
      />
      {tag.name}
    </span>
  );
}
