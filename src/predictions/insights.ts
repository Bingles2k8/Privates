import { addDays, differenceInCalendarDays, format, parseISO } from 'date-fns';
import { realCycles, type CycleRecord } from './cycle';
import { COVER_OFFSET_C, COVER_SHIFT_C, storedToCelsius } from './bbt';

const MIN_PLAUSIBLE = 18;
const MAX_PLAUSIBLE = 60;
const MIN_PERIOD_DAYS = 1;
const MAX_PERIOD_DAYS = 14;

export type RegularityVerdict = 'very-regular' | 'regular' | 'variable' | 'irregular' | 'unknown';

export function periodLengths(cycles: CycleRecord[]): number[] {
  const lengths: number[] = [];
  for (const c of realCycles(cycles)) {
    if (!c.endDate) continue;
    const days = differenceInCalendarDays(parseISO(c.endDate), parseISO(c.startDate)) + 1;
    if (days >= MIN_PERIOD_DAYS && days <= MAX_PERIOD_DAYS) lengths.push(days);
  }
  return lengths.slice(-6);
}

export function cycleRegularity(cycleLengthStd: number, sampleSize: number): {
  verdict: RegularityVerdict;
  label: string;
  blurb: string;
} {
  if (sampleSize < 2) {
    return {
      verdict: 'unknown',
      label: 'not enough data',
      blurb: 'Log a few more cycles to see your regularity.',
    };
  }
  if (cycleLengthStd < 2) {
    return {
      verdict: 'very-regular',
      label: 'very regular',
      blurb: `Cycles within ±${cycleLengthStd.toFixed(1)}d — like clockwork.`,
    };
  }
  if (cycleLengthStd < 4) {
    return {
      verdict: 'regular',
      label: 'regular',
      blurb: `Cycles within ±${cycleLengthStd.toFixed(1)}d — pretty consistent.`,
    };
  }
  if (cycleLengthStd < 7) {
    return {
      verdict: 'variable',
      label: 'variable',
      blurb: `Cycles vary by ±${cycleLengthStd.toFixed(1)}d — not unusual.`,
    };
  }
  return {
    verdict: 'irregular',
    label: 'irregular',
    blurb: `Cycles vary by ±${cycleLengthStd.toFixed(1)}d — worth a chat with a clinician if it's new.`,
  };
}

export type PredictionAccuracy = {
  sampleSize: number;
  meanAbsError: number;
  lastErrors: { predicted: string; actual: string; diff: number }[];
};

export function predictionAccuracy(cycles: CycleRecord[]): PredictionAccuracy | null {
  // We're scoring how well we forecast vs. observed reality, so both the
  // history we backtest from and the actuals must be real cycles only.
  const sorted = realCycles(cycles).sort((a, b) => a.startDate.localeCompare(b.startDate));
  if (sorted.length < 4) return null;
  const errors: { predicted: string; actual: string; diff: number }[] = [];

  for (let i = 3; i < sorted.length; i++) {
    const history = sorted.slice(0, i);
    const lengths: number[] = [];
    for (let j = 1; j < history.length; j++) {
      const days = differenceInCalendarDays(
        parseISO(history[j].startDate),
        parseISO(history[j - 1].startDate),
      );
      if (days >= MIN_PLAUSIBLE && days <= MAX_PLAUSIBLE) lengths.push(days);
    }
    if (lengths.length < 2) continue;
    const recent = lengths.slice(-6);
    const mean = recent.reduce((a, b) => a + b, 0) / recent.length;
    const predicted = addDays(parseISO(history[history.length - 1].startDate), Math.round(mean));
    const actual = parseISO(sorted[i].startDate);
    const diff = differenceInCalendarDays(actual, predicted);
    errors.push({
      predicted: format(predicted, 'yyyy-MM-dd'),
      actual: sorted[i].startDate,
      diff,
    });
  }

  if (errors.length === 0) return null;
  const meanAbs = errors.reduce((a, b) => a + Math.abs(b.diff), 0) / errors.length;
  return {
    sampleSize: errors.length,
    meanAbsError: meanAbs,
    lastErrors: errors.slice(-5),
  };
}

export type PhaseSymptomCounts = {
  tag: string;
  total: number;
  byDay: Record<number, number>;
};

export function symptomsByPhase(
  cycles: CycleRecord[],
  daySymptoms: { date: string; tags: string[] }[],
  maxDays = 35,
): { top: PhaseSymptomCounts[]; cycleCount: number } {
  // Only count symptoms within real cycles — bucketing them into a forecast
  // window would attribute symptoms to a phase that hasn't happened.
  const sorted = realCycles(cycles).sort((a, b) => a.startDate.localeCompare(b.startDate));
  if (sorted.length < 1) return { top: [], cycleCount: 0 };

  const counts = new Map<string, PhaseSymptomCounts>();
  let cycleCount = 0;

  for (let i = 0; i < sorted.length; i++) {
    const start = parseISO(sorted[i].startDate);
    const next = sorted[i + 1] ? parseISO(sorted[i + 1].startDate) : null;
    const windowEnd = next ? Math.min(
      differenceInCalendarDays(next, start),
      maxDays,
    ) : maxDays;
    cycleCount += 1;

    for (const log of daySymptoms) {
      const logDate = parseISO(log.date);
      const dayInCycle = differenceInCalendarDays(logDate, start) + 1;
      if (dayInCycle < 1 || dayInCycle > windowEnd) continue;
      for (const tag of log.tags) {
        let entry = counts.get(tag);
        if (!entry) {
          entry = { tag, total: 0, byDay: {} };
          counts.set(tag, entry);
        }
        entry.total += 1;
        entry.byDay[dayInCycle] = (entry.byDay[dayInCycle] ?? 0) + 1;
      }
    }
  }

  const top = Array.from(counts.values())
    .sort((a, b) => b.total - a.total)
    .slice(0, 6);
  return { top, cycleCount };
}

export type BbtCoverLine = {
  /** Cover line in canonical \u00b0C. Convert to the user's display unit at the call site. */
  coverLine: number;
  preShiftIndex: number;
  confirmedShiftIndex: number | null;
};

/**
 * Detect a biphasic temperature shift and return a cover line.
 *
 * Input series may contain mixed-unit values (rows from before the user picked
 * a unit preference may be stored as \u00b0F). `storedToCelsius` normalizes via the
 * "value > 50 means \u00b0F" heuristic so the math runs in a single coordinate
 * system. The returned cover line is therefore always in \u00b0C and the chart
 * code is responsible for converting back if the user wants \u00b0F.
 *
 * The 0.1\u00b0C / 0.05\u00b0C constants live in `bbt.ts` and document why those
 * numbers (they're the \u00b0C analogue of the standard 0.2\u00b0F / 0.1\u00b0F rule).
 */
export function bbtCoverLine(
  series: { date: string; bbt: number }[],
): BbtCoverLine | null {
  if (series.length < 10) return null;

  const normalized = series
    .map((r) => ({ date: r.date, bbt: storedToCelsius(r.bbt) }))
    .filter((r): r is { date: string; bbt: number } => r.bbt != null);

  if (normalized.length < 10) return null;

  const last30 = normalized.slice(-30);

  for (let i = 6; i < last30.length - 2; i++) {
    const pre = last30.slice(i - 6, i).map((r) => r.bbt);
    const post = last30.slice(i, i + 3).map((r) => r.bbt);
    const highPre = Math.max(...pre);
    const lowPost = Math.min(...post);
    if (lowPost - highPre >= COVER_SHIFT_C) {
      return {
        coverLine: highPre + COVER_OFFSET_C,
        preShiftIndex: normalized.length - last30.length + i - 1,
        confirmedShiftIndex: normalized.length - last30.length + i + 2,
      };
    }
  }

  const pre = last30.slice(-6).map((r) => r.bbt);
  if (pre.length >= 3) {
    return {
      coverLine: Math.max(...pre) + COVER_OFFSET_C,
      preShiftIndex: normalized.length - 1,
      confirmedShiftIndex: null,
    };
  }
  return null;
}
