import { and, asc, desc, eq, gte, lte } from 'drizzle-orm';
import { getDb } from '@/db';
import { medDoses, medications } from '@/db/schema';
import { uuid } from '@/ids';

export type MedSchedule = {
  timeOfDay: string;
  daysOfWeek: number[];
  reminderEnabled: boolean;
};

export async function listActiveMedications() {
  const db = getDb();
  return db.query.medications.findMany({
    where: eq(medications.active, true),
    orderBy: asc(medications.name),
  });
}

export async function createMedication(input: {
  name: string;
  kind: string;
  schedule?: MedSchedule | null;
  /** ISO date (yyyy-MM-dd) the device was inserted / shot was given. */
  insertedAt?: string | null;
  /** Days from `insertedAt` until replacement is due. */
  replacementDays?: number | null;
}) {
  const db = getDb();
  const id = uuid();
  await db.insert(medications).values({
    id,
    name: input.name,
    kind: input.kind,
    scheduleJson: input.schedule ? JSON.stringify(input.schedule) : null,
    active: true,
    startedAt: new Date().toISOString(),
    endedAt: null,
    insertedAt: input.insertedAt ?? null,
    replacementDays: input.replacementDays ?? null,
  });
  return id;
}

export async function endMedication(id: string) {
  const db = getDb();
  await db
    .update(medications)
    .set({ active: false, endedAt: new Date().toISOString() })
    .where(eq(medications.id, id));
}

export async function recordDose(input: {
  medicationId: string;
  scheduledFor: string;
  takenAt?: string | null;
  skipped?: boolean;
}) {
  const db = getDb();
  await db.insert(medDoses).values({
    id: uuid(),
    medicationId: input.medicationId,
    scheduledFor: input.scheduledFor,
    takenAt: input.takenAt ?? new Date().toISOString(),
    skipped: input.skipped ?? false,
  });
}

export async function recentDoses(medicationId: string, limit = 30) {
  const db = getDb();
  return db.query.medDoses.findMany({
    where: eq(medDoses.medicationId, medicationId),
    orderBy: desc(medDoses.scheduledFor),
    limit,
  });
}

export async function dosesBetween(startIso: string, endIso: string) {
  const db = getDb();
  return db.query.medDoses.findMany({
    where: and(gte(medDoses.scheduledFor, startIso), lte(medDoses.scheduledFor, endIso)),
  });
}
