import { addDays, formatISO, startOfDay, subDays } from 'date-fns';
import { getDb } from '@/db';
import { cycles, dayLogs, moods, symptoms } from '@/db/schema';
import { uuid } from '@/ids';

// If the decoy DB is empty, drop in a plausible-looking stretch of fake data.
// The goal: an observer who unlocks with the decoy passphrase sees an app
// that looks lived-in, not a suspicious "just installed" screen. Nothing
// inserted here should touch the real DB — this runs against whatever DB
// variant happens to be open (the caller is responsible for ensuring the
// decoy DB is the open one).
//
// Fake pattern: 4 cycles of ~28 days each, with predictable flow intensity,
// a scattering of common symptoms, and a few mood entries. Nothing personal
// or specific — just the shape of someone who's been using a tracker.

const FAKE_SYMPTOMS = ['cramps', 'bloating', 'headache', 'fatigue', 'acne'];
const FAKE_MOODS = ['calm', 'happy', 'anxious', 'tired'];

function iso(d: Date): string {
  return formatISO(startOfDay(d), { representation: 'date' });
}

export async function seedDecoyIfEmpty(): Promise<boolean> {
  const db = getDb();
  const existing = await db.select().from(cycles).limit(1);
  if (existing.length > 0) return false;

  const now = startOfDay(new Date());
  const nowIso = new Date().toISOString();

  // Build 4 cycles going backwards from ~5 days ago, each 28 days long with
  // a 4-5 day period at the start.
  for (let i = 0; i < 4; i++) {
    const start = subDays(now, 5 + i * 28);
    const periodLen = 4 + (i % 2); // 4 or 5 days
    const end = addDays(start, periodLen - 1);
    await db.insert(cycles).values({
      id: uuid(),
      startDate: iso(start),
      endDate: iso(end),
      predicted: false,
      notes: null,
      createdAt: nowIso,
    });

    // Day logs across the period with flow
    for (let d = 0; d < periodLen; d++) {
      const date = iso(addDays(start, d));
      const flow = d === 0 ? 1 : d === 1 ? 3 : d === 2 ? 2 : 1;
      const dayLogId = uuid();
      await db.insert(dayLogs).values({
        id: dayLogId,
        date,
        flow,
        mood: 1 + (d % 3),
        bbt: null,
        cervicalMucus: null,
        sexJson: null,
        lhTest: null,
        notes: null,
        updatedAt: nowIso,
      });

      // Symptom/mood rows — a couple of the common ones
      if (d < 2) {
        await db.insert(symptoms).values({
          id: uuid(),
          dayLogId,
          tag: FAKE_SYMPTOMS[(i + d) % FAKE_SYMPTOMS.length],
          intensity: 2,
        });
      }
      if (d === 0) {
        await db.insert(moods).values({
          id: uuid(),
          dayLogId,
          tag: FAKE_MOODS[i % FAKE_MOODS.length],
          intensity: 2,
        });
      }
    }
  }

  return true;
}
