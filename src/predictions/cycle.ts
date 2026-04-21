import { addDays, differenceInCalendarDays, parseISO } from 'date-fns';

export type CycleRecord = { startDate: string; endDate?: string | null };

export type CyclePrediction = {
  nextPeriodStart: string;
  cycleLengthMean: number;
  cycleLengthStdDev: number;
  confidenceDays: number;
  sampleSize: number;
};

const DEFAULT_CYCLE_LENGTH = 28;
const MAX_LOOKBACK = 6;
const MIN_PLAUSIBLE = 18;
const MAX_PLAUSIBLE = 60;

export function cycleLengths(cycles: CycleRecord[]): number[] {
  const sorted = [...cycles].sort((a, b) => a.startDate.localeCompare(b.startDate));
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

export function predictNextPeriod(cycles: CycleRecord[], today: Date = new Date()): CyclePrediction | null {
  const sorted = [...cycles].sort((a, b) => a.startDate.localeCompare(b.startDate));
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
