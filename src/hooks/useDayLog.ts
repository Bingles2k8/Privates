import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { getDayLog, upsertDayLog, type DayLogPatch } from '@/data/dayLogs';
import { deriveCyclesFromFlow } from '@/data/cycles';

export function useDayLog(date: string) {
  return useQuery({
    queryKey: ['dayLog', date],
    queryFn: () => getDayLog(date),
  });
}

export function useUpsertDayLog(date: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (patch: DayLogPatch) => {
      const id = await upsertDayLog(date, patch);
      if (patch.flow !== undefined) await deriveCyclesFromFlow();
      return id;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['dayLog', date] });
      qc.invalidateQueries({ queryKey: ['monthLogs'] });
      qc.invalidateQueries({ queryKey: ['prediction'] });
      qc.invalidateQueries({ queryKey: ['bbtSeries'] });
      qc.invalidateQueries({ queryKey: ['moodSeries'] });
      qc.invalidateQueries({ queryKey: ['lastCycle'] });
      qc.invalidateQueries({ queryKey: ['cycles'] });
      qc.invalidateQueries({ queryKey: ['streak'] });
    },
  });
}
