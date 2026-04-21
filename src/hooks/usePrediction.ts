import { useQuery } from '@tanstack/react-query';
import { listCycles } from '@/data/cycles';
import { fertileWindow } from '@/predictions/fertility';
import { predictNextPeriod } from '@/predictions/cycle';

export function usePrediction() {
  return useQuery({
    queryKey: ['prediction'],
    queryFn: async () => {
      const cycles = await listCycles();
      const prediction = predictNextPeriod(cycles);
      const fertile = prediction ? fertileWindow(prediction) : null;
      return { cycles, prediction, fertile };
    },
  });
}
