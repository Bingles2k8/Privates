import { useQuery } from '@tanstack/react-query';
import { differenceInCalendarDays, format, subDays } from 'date-fns';
import { listDayLogsBetween } from '@/data/dayLogs';

export type StreakInfo = {
  current: number;
  loggedToday: boolean;
  loggedYesterday: boolean;
  last7: number;
};

function isLogMeaningful(log: {
  flow: number | null;
  mood: number | null;
  bbt: number | null;
  notes: string | null;
  cervicalMucus: string | null;
  sexJson: string | null;
  lhTest: string | null;
}) {
  return (
    log.flow != null ||
    log.mood != null ||
    log.bbt != null ||
    (log.notes && log.notes.length > 0) ||
    log.cervicalMucus != null ||
    log.sexJson != null ||
    log.lhTest != null
  );
}

export function useStreak() {
  return useQuery<StreakInfo>({
    queryKey: ['streak'],
    queryFn: async () => {
      const today = new Date();
      const start = format(subDays(today, 29), 'yyyy-MM-dd');
      const end = format(today, 'yyyy-MM-dd');
      const rows = await listDayLogsBetween(start, end);
      const byDate = new Map<string, boolean>();
      for (const r of rows) {
        byDate.set(r.date, isLogMeaningful(r));
      }
      const todayStr = format(today, 'yyyy-MM-dd');
      const yesterdayStr = format(subDays(today, 1), 'yyyy-MM-dd');
      const loggedToday = byDate.get(todayStr) === true;
      const loggedYesterday = byDate.get(yesterdayStr) === true;

      let cursor = loggedToday ? today : subDays(today, 1);
      let current = 0;
      while (true) {
        const key = format(cursor, 'yyyy-MM-dd');
        if (byDate.get(key) === true) {
          current += 1;
          cursor = subDays(cursor, 1);
          if (differenceInCalendarDays(today, cursor) > 30) break;
        } else {
          break;
        }
      }

      let last7 = 0;
      for (let i = 0; i < 7; i++) {
        const key = format(subDays(today, i), 'yyyy-MM-dd');
        if (byDate.get(key) === true) last7 += 1;
      }

      return { current, loggedToday, loggedYesterday, last7 };
    },
    staleTime: 60_000,
  });
}
