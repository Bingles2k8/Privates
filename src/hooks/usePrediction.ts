import { useQuery } from '@tanstack/react-query';
import { listCycles } from '@/data/cycles';
import { fertileWindow, fertileWindowFromStart, type FertileWindow } from '@/predictions/fertility';
import { predictFutureCycles, predictNextPeriod, type FutureCycle } from '@/predictions/cycle';

export type ForecastedCycle = FutureCycle & {
  fertile: FertileWindow;
};

export function usePrediction() {
  return useQuery({
    queryKey: ['prediction'],
    queryFn: async () => {
      const cycles = await listCycles();
      const prediction = predictNextPeriod(cycles);
      const fertile = prediction ? fertileWindow(prediction) : null;
      // 12-month horizon of forecasted cycles, each with its own fertile
      // window. The calendar uses this to paint bands far into the future,
      // fading by `index` so distant predictions look less confident.
      const futureCycles: ForecastedCycle[] = predictFutureCycles(cycles, 12).map((c) => ({
        ...c,
        fertile: fertileWindowFromStart(c.startDate),
      }));
      return { cycles, prediction, fertile, futureCycles };
    },
  });
}
