import { addDays, parseISO } from 'date-fns';
import type { CyclePrediction } from './cycle';

export type FertileWindow = {
  ovulation: string;
  windowStart: string;
  windowEnd: string;
};

const LUTEAL_PHASE_DAYS = 14;

/**
 * Derive a fertile window from any predicted period start, not just the
 * next one. Lets the calendar paint windows for every cycle in the
 * 12-month horizon, not only the immediate next ovulation.
 */
export function fertileWindowFromStart(nextPeriodStart: string): FertileWindow {
  const ovulation = addDays(parseISO(nextPeriodStart), -LUTEAL_PHASE_DAYS);
  return {
    ovulation: ovulation.toISOString().slice(0, 10),
    windowStart: addDays(ovulation, -5).toISOString().slice(0, 10),
    windowEnd: addDays(ovulation, 1).toISOString().slice(0, 10),
  };
}

export function fertileWindow(prediction: CyclePrediction): FertileWindow | null {
  if (!prediction) return null;
  return fertileWindowFromStart(prediction.nextPeriodStart);
}
