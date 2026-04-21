import { useMemo } from 'react';
import { format } from 'date-fns';
import { useQuery } from '@tanstack/react-query';
import { lastCycle } from '@/data/cycles';
import { useDayLog } from '@/hooks/useDayLog';
import { usePrediction } from '@/hooks/usePrediction';
import { detectPhase, explainSymptom, hasExplainer, PHASES, type PhaseKey } from '@/education';

export type TodaysBody = {
  phase: PhaseKey;
  phaseName: string;
  cycleDay: number;
  cycleLength: number;
  short: string;
  symptomBlurbs: { tag: string; text: string }[];
  hasData: boolean;
};

/**
 * Pulls the user's current cycle phase and any explainers for symptoms
 * they've logged today. Returns null if there isn't enough cycle data
 * yet to know what phase they're in.
 */
export function useTodaysBody(): TodaysBody | null {
  const today = format(new Date(), 'yyyy-MM-dd');
  const { data: pred } = usePrediction();
  const { data: last } = useQuery({ queryKey: ['lastCycle'], queryFn: lastCycle });
  const { data: log } = useDayLog(today);

  return useMemo(() => {
    if (!last) return null;

    const cycleLength = pred?.prediction?.cycleLengthMean
      ? Math.round(pred.prediction.cycleLengthMean)
      : 28;

    const { phase, cycleDay } = detectPhase({
      cycleStartDate: last.startDate,
      cycleLength,
      fertileStart: pred?.fertile?.windowStart,
      fertileEnd: pred?.fertile?.windowEnd,
      ovulation: pred?.fertile?.ovulation,
    });

    const content = PHASES[phase];

    const tagsToday = (log?.symptoms ?? [])
      .map((s) => s.tag)
      .filter((tag) => hasExplainer(tag));

    const symptomBlurbs = tagsToday
      .slice(0, 3) // cap at 3 to keep the card short
      .map((tag) => ({ tag, text: explainSymptom(tag, phase) ?? '' }))
      .filter((b) => b.text.length > 0);

    return {
      phase,
      phaseName: content.name,
      cycleDay,
      cycleLength,
      short: content.short,
      symptomBlurbs,
      hasData: true,
    };
  }, [last, pred, log]);
}
