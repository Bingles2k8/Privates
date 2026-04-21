import { and, asc, desc, eq, gte, isNotNull, like, lte, ne } from 'drizzle-orm';
import { getDb } from '@/db';
import { dayLogs, moods, symptoms } from '@/db/schema';
import { uuid } from '@/ids';

export type DayLogPatch = {
  flow?: number | null;
  mood?: number | null;
  bbt?: number | null;
  cervicalMucus?: string | null;
  sex?: { kind: string; partners?: number; orgasm?: boolean } | null;
  lhTest?: string | null;
  notes?: string | null;
  symptoms?: { tag: string; intensity?: number }[];
  moods?: { tag: string; intensity?: number }[];
};

export type DayLogFull = {
  id: string;
  date: string;
  flow: number | null;
  mood: number | null;
  bbt: number | null;
  cervicalMucus: string | null;
  sex: { kind: string; partners?: number; orgasm?: boolean } | null;
  lhTest: string | null;
  notes: string | null;
  symptoms: { tag: string; intensity: number }[];
  moods: { tag: string; intensity: number }[];
};

export async function getDayLog(date: string): Promise<DayLogFull | null> {
  const db = getDb();
  const row = await db.query.dayLogs.findFirst({ where: eq(dayLogs.date, date) });
  if (!row) return null;
  const [s, m] = await Promise.all([
    db.query.symptoms.findMany({ where: eq(symptoms.dayLogId, row.id) }),
    db.query.moods.findMany({ where: eq(moods.dayLogId, row.id) }),
  ]);
  return {
    id: row.id,
    date: row.date,
    flow: row.flow,
    mood: row.mood,
    bbt: row.bbt,
    cervicalMucus: row.cervicalMucus,
    sex: row.sexJson ? JSON.parse(row.sexJson) : null,
    lhTest: row.lhTest,
    notes: row.notes,
    symptoms: s.map((x) => ({ tag: x.tag, intensity: x.intensity })),
    moods: m.map((x) => ({ tag: x.tag, intensity: x.intensity })),
  };
}

export async function upsertDayLog(date: string, patch: DayLogPatch): Promise<string> {
  const db = getDb();
  const now = new Date().toISOString();
  const existing = await db.query.dayLogs.findFirst({ where: eq(dayLogs.date, date) });
  const id = existing?.id ?? uuid();

  const sexJson = patch.sex !== undefined ? (patch.sex ? JSON.stringify(patch.sex) : null) : existing?.sexJson ?? null;

  if (existing) {
    await db
      .update(dayLogs)
      .set({
        flow: patch.flow !== undefined ? patch.flow : existing.flow,
        mood: patch.mood !== undefined ? patch.mood : existing.mood,
        bbt: patch.bbt !== undefined ? patch.bbt : existing.bbt,
        cervicalMucus: patch.cervicalMucus !== undefined ? patch.cervicalMucus : existing.cervicalMucus,
        sexJson,
        lhTest: patch.lhTest !== undefined ? patch.lhTest : existing.lhTest,
        notes: patch.notes !== undefined ? patch.notes : existing.notes,
        updatedAt: now,
      })
      .where(eq(dayLogs.id, id));
  } else {
    await db.insert(dayLogs).values({
      id,
      date,
      flow: patch.flow ?? null,
      mood: patch.mood ?? null,
      bbt: patch.bbt ?? null,
      cervicalMucus: patch.cervicalMucus ?? null,
      sexJson,
      lhTest: patch.lhTest ?? null,
      notes: patch.notes ?? null,
      updatedAt: now,
    });
  }

  if (patch.symptoms !== undefined) {
    await db.delete(symptoms).where(eq(symptoms.dayLogId, id));
    if (patch.symptoms.length) {
      await db
        .insert(symptoms)
        .values(patch.symptoms.map((s) => ({ id: uuid(), dayLogId: id, tag: s.tag, intensity: s.intensity ?? 1 })));
    }
  }
  if (patch.moods !== undefined) {
    await db.delete(moods).where(eq(moods.dayLogId, id));
    if (patch.moods.length) {
      await db
        .insert(moods)
        .values(patch.moods.map((m) => ({ id: uuid(), dayLogId: id, tag: m.tag, intensity: m.intensity ?? 1 })));
    }
  }

  return id;
}

export async function listDayLogsBetween(startIso: string, endIso: string) {
  const db = getDb();
  return db.query.dayLogs.findMany({
    where: and(gte(dayLogs.date, startIso), lte(dayLogs.date, endIso)),
    orderBy: asc(dayLogs.date),
  });
}

export async function listRecentBbt(limit = 60) {
  const db = getDb();
  const rows = await db.query.dayLogs.findMany({
    orderBy: desc(dayLogs.date),
    limit,
  });
  return rows.filter((r) => r.bbt != null).reverse();
}

export async function listRecentMoods(limit = 90) {
  const db = getDb();
  const rows = await db.query.dayLogs.findMany({
    orderBy: desc(dayLogs.date),
    limit,
  });
  return rows.filter((r) => r.mood != null).reverse();
}

export async function listSymptomsInRange(startIso: string, endIso: string) {
  const db = getDb();
  const rows = await db.query.dayLogs.findMany({
    where: and(gte(dayLogs.date, startIso), lte(dayLogs.date, endIso)),
  });
  if (rows.length === 0) return [];
  const byId = new Map(rows.map((r) => [r.id, r.date]));
  const syms = await db.query.symptoms.findMany();
  const grouped = new Map<string, string[]>();
  for (const s of syms) {
    const date = byId.get(s.dayLogId);
    if (!date) continue;
    const arr = grouped.get(date) ?? [];
    arr.push(s.tag);
    grouped.set(date, arr);
  }
  return Array.from(grouped, ([date, tags]) => ({ date, tags }));
}

export async function searchNotes(query: string, limit = 50) {
  const db = getDb();
  const q = query.trim();
  if (q.length === 0) return [];
  const rows = await db.query.dayLogs.findMany({
    where: and(isNotNull(dayLogs.notes), like(dayLogs.notes, `%${q}%`)),
    orderBy: desc(dayLogs.date),
    limit,
  });
  return rows.filter((r) => r.notes && r.notes.length > 0).map((r) => ({
    date: r.date,
    notes: r.notes as string,
  }));
}

export async function listDaysWithNotes(limit = 50) {
  const db = getDb();
  const rows = await db.query.dayLogs.findMany({
    where: and(isNotNull(dayLogs.notes), ne(dayLogs.notes, '')),
    orderBy: desc(dayLogs.date),
    limit,
  });
  return rows.map((r) => ({ date: r.date, notes: r.notes as string }));
}

export async function tagUsageCounts(): Promise<{
  symptoms: Record<string, number>;
  moods: Record<string, number>;
}> {
  const db = getDb();
  const [sRows, mRows] = await Promise.all([
    db.query.symptoms.findMany(),
    db.query.moods.findMany(),
  ]);
  const s: Record<string, number> = {};
  const m: Record<string, number> = {};
  for (const r of sRows) s[r.tag] = (s[r.tag] ?? 0) + 1;
  for (const r of mRows) m[r.tag] = (m[r.tag] ?? 0) + 1;
  return { symptoms: s, moods: m };
}
