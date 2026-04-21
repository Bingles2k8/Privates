import { subDays, format, parseISO } from 'date-fns';
import { and, eq, inArray, lt, sql } from 'drizzle-orm';
import { getDb } from '@/db';
import { dayLogs, moods, symptoms } from '@/db/schema';
import {
  loadSettings,
  saveSettings,
  type RetentionCategory,
} from '@/data/settings';

const SWEEP_THROTTLE_HOURS = 20;

export type SweepReport = {
  ran: boolean;
  totals: Record<RetentionCategory, number>;
};

/**
 * Clears data older than the user's per-category retention. Runs at most
 * once per 20 hours. Cycles are untouched — period start/end dates are the
 * backbone of everything and the user can wipe them explicitly via
 * panicWipe or by editing individual cycles.
 *
 * Flow and mood (the 1-5 sliders stored on day_logs) are also preserved;
 * they're tiny and the user's "symptoms" retention toggle is for the
 * detailed symptom/mood tags, not those numeric summaries.
 */
export async function runRetentionSweep(opts?: { force?: boolean }): Promise<SweepReport> {
  const settings = await loadSettings();
  const ret = settings.retention;

  if (!opts?.force) {
    if (ret.lastSweepAt) {
      const last = parseISO(ret.lastSweepAt).getTime();
      if (Date.now() - last < SWEEP_THROTTLE_HOURS * 3600_000) {
        return { ran: false, totals: emptyTotals() };
      }
    }
  }

  const db = getDb();
  const totals: Record<RetentionCategory, number> = emptyTotals();

  const cutoffs = {
    notes: cutoffIso(ret.notes),
    symptoms: cutoffIso(ret.symptoms),
    moods: cutoffIso(ret.moods),
    bbt: cutoffIso(ret.bbt),
    sex: cutoffIso(ret.sex),
    lhTest: cutoffIso(ret.lhTest),
  };

  // Notes: null out dayLogs.notes where date < cutoff and notes is not null
  if (cutoffs.notes) {
    const res = await db
      .update(dayLogs)
      .set({ notes: null, updatedAt: new Date().toISOString() })
      .where(and(lt(dayLogs.date, cutoffs.notes), sql`${dayLogs.notes} IS NOT NULL`))
      .returning({ id: dayLogs.id });
    totals.notes = res.length;
  }

  if (cutoffs.bbt) {
    const res = await db
      .update(dayLogs)
      .set({ bbt: null, updatedAt: new Date().toISOString() })
      .where(and(lt(dayLogs.date, cutoffs.bbt), sql`${dayLogs.bbt} IS NOT NULL`))
      .returning({ id: dayLogs.id });
    totals.bbt = res.length;
  }

  if (cutoffs.sex) {
    const res = await db
      .update(dayLogs)
      .set({ sexJson: null, updatedAt: new Date().toISOString() })
      .where(and(lt(dayLogs.date, cutoffs.sex), sql`${dayLogs.sexJson} IS NOT NULL`))
      .returning({ id: dayLogs.id });
    totals.sex = res.length;
  }

  if (cutoffs.lhTest) {
    const res = await db
      .update(dayLogs)
      .set({ lhTest: null, updatedAt: new Date().toISOString() })
      .where(and(lt(dayLogs.date, cutoffs.lhTest), sql`${dayLogs.lhTest} IS NOT NULL`))
      .returning({ id: dayLogs.id });
    totals.lhTest = res.length;
  }

  if (cutoffs.symptoms) {
    const staleIds = await db
      .select({ id: dayLogs.id })
      .from(dayLogs)
      .where(lt(dayLogs.date, cutoffs.symptoms));
    if (staleIds.length > 0) {
      const ids = staleIds.map((r) => r.id);
      const res = await db
        .delete(symptoms)
        .where(inArray(symptoms.dayLogId, ids))
        .returning({ id: symptoms.id });
      totals.symptoms = res.length;
    }
  }

  if (cutoffs.moods) {
    const staleIds = await db
      .select({ id: dayLogs.id })
      .from(dayLogs)
      .where(lt(dayLogs.date, cutoffs.moods));
    if (staleIds.length > 0) {
      const ids = staleIds.map((r) => r.id);
      const res = await db
        .delete(moods)
        .where(inArray(moods.dayLogId, ids))
        .returning({ id: moods.id });
      totals.moods = res.length;
    }
  }

  // Persist lastSweepAt even if nothing was deleted, so the throttle holds.
  await saveSettings({
    ...settings,
    retention: { ...settings.retention, lastSweepAt: new Date().toISOString() },
  });

  return { ran: true, totals };
}

function cutoffIso(days: number): string | null {
  if (!days || days <= 0) return null;
  return format(subDays(new Date(), days), 'yyyy-MM-dd');
}

function emptyTotals(): Record<RetentionCategory, number> {
  return { notes: 0, symptoms: 0, moods: 0, bbt: 0, sex: 0, lhTest: 0 };
}

export function sweepSummary(totals: Record<RetentionCategory, number>): string | null {
  const bits: string[] = [];
  if (totals.notes) bits.push(`${totals.notes} note${totals.notes === 1 ? '' : 's'}`);
  if (totals.symptoms) bits.push(`${totals.symptoms} symptom tag${totals.symptoms === 1 ? '' : 's'}`);
  if (totals.moods) bits.push(`${totals.moods} mood tag${totals.moods === 1 ? '' : 's'}`);
  if (totals.bbt) bits.push(`${totals.bbt} BBT entr${totals.bbt === 1 ? 'y' : 'ies'}`);
  if (totals.sex) bits.push(`${totals.sex} sex log${totals.sex === 1 ? '' : 's'}`);
  if (totals.lhTest) bits.push(`${totals.lhTest} LH result${totals.lhTest === 1 ? '' : 's'}`);
  if (bits.length === 0) return null;
  return bits.join(' · ');
}
