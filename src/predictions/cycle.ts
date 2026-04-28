import { addDays, differenceInCalendarDays, parseISO } from 'date-fns';

export type CycleRecord = {
  startDate: string;
  endDate?: string | null;
  /**
   * `true` for cycles that were forecast rather than observed (e.g. forward-fill
   * placeholders). All rolling-average / prediction math filters these out so a
   * forecast never feeds the model that produced it.
   */
  predicted?: boolean | null;
};

export type CyclePrediction = {
  nextPeriodStart: string;
  cycleLengthMean: number;
  cycleLengthStdDev: number;
  confidenceDays: number;
  sampleSize: number;
};

/**
 * One forecasted cycle in a horizon series. `index === 1` is the next cycle
 * after today's; later indices fade in the UI to reflect rising uncertainty.
 * `confidenceDays` widens roughly by sqrt(index) * stdDev — a random-walk
 * approximation of compounding cycle-length variance.
 */
export type FutureCycle = {
  index: number;
  /** Predicted first day of bleeding. */
  startDate: string;
  /** Predicted last day of bleeding (inclusive). Uses meanPeriodLength. */
  endDate: string;
  /** ±days uncertainty band on the start date. Grows with index. */
  confidenceDays: number;
};

const DEFAULT_CYCLE_LENGTH = 28;
const DEFAULT_PERIOD_LENGTH = 4;
const MAX_LOOKBACK = 6;
const MIN_PLAUSIBLE = 18;
const MAX_PLAUSIBLE = 60;
const MIN_PERIOD_LENGTH = 1;
const MAX_PERIOD_LENGTH = 14;
/** Hard cap so a tiny mean cycle doesn't generate hundreds of forecasts. */
const MAX_FUTURE_CYCLES = 24;

/** Drop forecast rows so they can't pollute the rolling-average input. */
export function realCycles<T extends { predicted?: boolean | null }>(cycles: T[]): T[] {
  return cycles.filter((c) => !c.predicted);
}

export function cycleLengths(cycles: CycleRecord[]): number[] {
  const sorted = realCycles(cycles).sort((a, b) => a.startDate.localeCompare(b.startDate));
  const lengths: number[] = [];
  for (let i = 1; i < sorted.length; i++) {
    const days = differenceInCalendarDays(parseISO(sorted[i].startDate), parseISO(sorted[i - 1].startDate));
    if (days >= MIN_PLAUSIBLE && days <= MAX_PLAUSIBLE) lengths.push(days);
  }
  return lengths.slice(-MAX_LOOKBACK);
}

function meanAndStd(xs: number[]): { mean: number; std: number } {
  if (xs.length === 0) return { mean: DEFAULT_CYCLE_LENGTH, std: 0 };
  const mean = xs.reduce((a, b) => a + b, 0) / xs.length;
  const variance = xs.reduce((a, b) => a + (b - mean) ** 2, 0) / Math.max(1, xs.length - 1);
  return { mean, std: Math.sqrt(variance) };
}

/**
 * Average bleed duration across observed cycles that have an `endDate`.
 * Falls back to a 4-day default when no period has been logged with both
 * a start and end. Clamped to [1, 14] to keep typos from skewing things.
 */
export function meanPeriodLength(cycles: CycleRecord[]): number {
  const lens: number[] = [];
  for (const c of realCycles(cycles)) {
    if (!c.endDate) continue;
    const len =
      differenceInCalendarDays(parseISO(c.endDate), parseISO(c.startDate)) + 1;
    if (len >= MIN_PERIOD_LENGTH && len <= MAX_PERIOD_LENGTH) lens.push(len);
  }
  if (lens.length === 0) return DEFAULT_PERIOD_LENGTH;
  return Math.max(1, Math.round(lens.reduce((a, b) => a + b, 0) / lens.length));
}

/**
 * Forecast a series of cycles forward from the most recent observed period
 * up to roughly `horizonMonths` ahead. The first item in the result is the
 * next cycle starting on or after `today`; subsequent items step forward by
 * the rolling mean cycle length. Confidence widens with each step.
 *
 * Used by the calendar to colour future months — solid for logged days,
 * progressively faded for the predicted bands further out.
 */
export function predictFutureCycles(
  cycles: CycleRecord[],
  horizonMonths = 12,
  today: Date = new Date(),
): FutureCycle[] {
  const sorted = realCycles(cycles).sort((a, b) =>
    a.startDate.localeCompare(b.startDate),
  );
  const last = sorted[sorted.length - 1];
  if (!last) return [];

  const lengths = cycleLengths(sorted);
  const { mean, std } = meanAndStd(lengths);
  const cycleLen = Math.round(mean);
  const periodLen = meanPeriodLength(cycles);
  const horizonDate = addDays(today, horizonMonths * 30);

  // Walk forward from the last observed period start by `cycleLen` until
  // we land on a date >= today — that's the first forecasted cycle.
  let cur = parseISO(last.startDate);
  while (cur < today) cur = addDays(cur, cycleLen);

  const out: FutureCycle[] = [];
  let idx = 1;
  while (cur <= horizonDate && idx <= MAX_FUTURE_CYCLES) {
    // Random-walk approximation: variance compounds with each step.
    const widthDays = Math.max(1, Math.round(std * Math.sqrt(idx)));
    out.push({
      index: idx,
      startDate: cur.toISOString().slice(0, 10),
      endDate: addDays(cur, periodLen - 1).toISOString().slice(0, 10),
      confidenceDays: widthDays,
    });
    cur = addDays(cur, cycleLen);
    idx += 1;
  }
  return out;
}

export function predictNextPeriod(cycles: CycleRecord[], today: Date = new Date()): CyclePrediction | null {
  // Anchor the next-period date off the most recent OBSERVED cycle. Anchoring on
  // a forecast row would mean we're predicting from our own prediction.
  const sorted = realCycles(cycles).sort((a, b) => a.startDate.localeCompare(b.startDate));
  const last = sorted[sorted.length - 1];
  if (!last) return null;
  const lengths = cycleLengths(sorted);
  const { mean, std } = meanAndStd(lengths);
  const cycleLen = Math.round(mean);
  const lastStart = parseISO(last.startDate);
  let nextStart = addDays(lastStart, cycleLen);
  while (nextStart < today) nextStart = addDays(nextStart, cycleLen);
  return {
    nextPeriodStart: nextStart.toISOString().slice(0, 10),
    cycleLengthMean: mean,
    cycleLengthStdDev: std,
    confidenceDays: Math.max(1, Math.round(std)),
    sampleSize: lengths.length,
  };
}
