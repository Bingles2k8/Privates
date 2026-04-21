import { asc, desc, eq } from 'drizzle-orm';
import { getDb } from '@/db';
import { cycles, dayLogs } from '@/db/schema';
import { uuid } from '@/ids';
import { addDays, differenceInCalendarDays, format, parseISO } from 'date-fns';

export async function listCycles() {
  const db = getDb();
  return db.query.cycles.findMany({ orderBy: asc(cycles.startDate) });
}

export async function lastCycle() {
  const db = getDb();
  const row = await db.query.cycles.findFirst({ orderBy: desc(cycles.startDate) });
  return row ?? null;
}

export async function createCycle(startDate: string, endDate?: string | null, notes?: string) {
  const db = getDb();
  const id = uuid();
  await db.insert(cycles).values({
    id,
    startDate,
    endDate: endDate ?? null,
    predicted: false,
    notes: notes ?? null,
    createdAt: new Date().toISOString(),
  });
  return id;
}

export async function deriveCyclesFromFlow(): Promise<void> {
  const db = getDb();
  const flows = await db.query.dayLogs.findMany({ orderBy: asc(dayLogs.date) });
  const periodDays = flows.filter((d) => (d.flow ?? 0) >= 2).map((d) => d.date);

  // No real period flow logged yet — leave the table alone so the onboarding seed
  // (if any) still drives the "where you're at" readout until real data arrives.
  if (periodDays.length === 0) return;

  const anyFlowDays = new Set(flows.filter((d) => (d.flow ?? 0) > 0).map((d) => d.date));

  // Cycle starts: first period-flow day, then any period-flow day that's more than
  // 2 calendar days after the previous one (gaps ≤ 2 are treated as the same period).
  const starts: string[] = [periodDays[0]];
  for (let i = 1; i < periodDays.length; i++) {
    const gap = differenceInCalendarDays(parseISO(periodDays[i]), parseISO(periodDays[i - 1]));
    if (gap > 2) starts.push(periodDays[i]);
  }

  function endFromStart(start: string): string {
    let cursor = parseISO(start);
    while (anyFlowDays.has(format(addDays(cursor, 1), 'yyyy-MM-dd'))) {
      cursor = addDays(cursor, 1);
    }
    return format(cursor, 'yyyy-MM-dd');
  }

  const existing = await db.query.cycles.findMany();
  const byStart = new Map(existing.map((c) => [c.startDate, c]));
  const startsSet = new Set(starts);

  // Delete any cycle row that no longer matches a detected flow-start. This wipes
  // the onboarding seed the first time real flow data is logged, and also cleans up
  // stale rows from earlier incremental saves (e.g. logging April 2 then April 1 —
  // April 2's row needs to disappear once April 1 becomes the true start).
  for (const row of existing) {
    if (!startsSet.has(row.startDate)) {
      await db.delete(cycles).where(eq(cycles.id, row.id));
    }
  }

  // Upsert the authoritative set of cycles derived from flow data.
  for (const s of starts) {
    const end = endFromStart(s);
    const row = byStart.get(s);
    if (!row) {
      await createCycle(s, end);
    } else if (row.endDate !== end) {
      await db.update(cycles).set({ endDate: end }).where(eq(cycles.id, row.id));
    }
  }
}
