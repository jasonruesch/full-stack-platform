import { TAG_COLORS } from '@bookmarkvault/shared';
import { prisma } from '~/db.ts';

/**
 * Find-or-create tags by name for an owner, returning their ids. Tag names are
 * unique per owner, so concurrent creates are guarded with an upsert.
 */
export async function resolveTagIds(
  ownerId: string,
  names: string[],
): Promise<string[]> {
  const unique = [...new Set(names.map((n) => n.trim()).filter(Boolean))];
  const ids: string[] = [];
  for (const [i, name] of unique.entries()) {
    const tag = await prisma.tag.upsert({
      where: { ownerId_name: { ownerId, name } },
      create: { ownerId, name, color: TAG_COLORS[i % TAG_COLORS.length] },
      update: {},
    });
    ids.push(tag.id);
  }
  return ids;
}
