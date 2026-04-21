import { addDays, parseISO } from 'date-fns';
import type { CyclePrediction } from './cycle';

export type FertileWindow = {
  ovulation: string;
  windowStart: string;
  windowEnd: string;
};

const LUTEAL_PHASE_DAYS = 14;

export function fertileWindow(prediction: CyclePrediction): FertileWindow | null {
  if (!prediction) return null;
  const ovulation = addDays(parseISO(prediction.nextPeriodStart), -LUTEAL_PHASE_DAYS);
  return {
    ovulation: ovulation.toISOString().slice(0, 10),
    windowStart: addDays(ovulation, -5).toISOString().slice(0, 10),
    windowEnd: addDays(ovulation, 1).toISOString().slice(0, 10),
  };
}
