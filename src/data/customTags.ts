import { asc, eq } from 'drizzle-orm';
import { getDb } from '@/db';
import { customTags } from '@/db/schema';
import { uuid } from '@/ids';

export type TagKind = 'symptom' | 'mood';

export async function listCustomTags(kind: TagKind) {
  const db = getDb();
  return db.query.customTags.findMany({
    where: eq(customTags.kind, kind),
    orderBy: asc(customTags.label),
  });
}

export async function createCustomTag(kind: TagKind, label: string) {
  const db = getDb();
  const id = uuid();
  await db.insert(customTags).values({ id, kind, label });
  return id;
}

export async function deleteCustomTag(id: string) {
  const db = getDb();
  await db.delete(customTags).where(eq(customTags.id, id));
}
