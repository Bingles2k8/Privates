import { asc, desc, eq, isNull } from 'drizzle-orm';
import { addDays, format, parseISO } from 'date-fns';
import { getDb } from '@/db';
import { contractions, kickCounts, pregnancies } from '@/db/schema';
import { uuid } from '@/ids';

export async function activePregnancy() {
  const db = getDb();
  const row = await db.query.pregnancies.findFirst({
    where: isNull(pregnancies.endedAt),
    orderBy: desc(pregnancies.createdAt),
  });
  return row ?? null;
}

export async function startPregnancy(lmpDate: string, notes?: string) {
  const db = getDb();
  const id = uuid();
  const due = format(addDays(parseISO(lmpDate), 280), 'yyyy-MM-dd');
  await db.insert(pregnancies).values({
    id,
    lmpDate,
    dueDate: due,
    endedAt: null,
    outcome: null,
    notes: notes ?? null,
    createdAt: new Date().toISOString(),
  });
  return id;
}

export async function updatePregnancyDueDate(id: string, dueDate: string) {
  const db = getDb();
  await db.update(pregnancies).set({ dueDate }).where(eq(pregnancies.id, id));
}

export async function endPregnancy(id: string, outcome: string, endedAt?: string) {
  const db = getDb();
  await db
    .update(pregnancies)
    .set({ endedAt: endedAt ?? new Date().toISOString(), outcome })
    .where(eq(pregnancies.id, id));
}

export async function addKickCount(pregnancyId: string, count: number, durationSeconds: number) {
  const db = getDb();
  const id = uuid();
  await db.insert(kickCounts).values({
    id,
    pregnancyId,
    startedAt: new Date().toISOString(),
    count,
    durationSeconds,
  });
  return id;
}

export async function recentKickCounts(pregnancyId: string, limit = 20) {
  const db = getDb();
  return db.query.kickCounts.findMany({
    where: eq(kickCounts.pregnancyId, pregnancyId),
    orderBy: desc(kickCounts.startedAt),
    limit,
  });
}

export async function startContraction(pregnancyId: string) {
  const db = getDb();
  const id = uuid();
  await db.insert(contractions).values({
    id,
    pregnancyId,
    startedAt: new Date().toISOString(),
    endedAt: null,
  });
  return id;
}

export async function endContraction(id: string) {
  const db = getDb();
  await db
    .update(contractions)
    .set({ endedAt: new Date().toISOString() })
    .where(eq(contractions.id, id));
}

export async function recentContractions(pregnancyId: string, limit = 30) {
  const db = getDb();
  return db.query.contractions.findMany({
    where: eq(contractions.pregnancyId, pregnancyId),
    orderBy: asc(contractions.startedAt),
    limit,
  });
}
