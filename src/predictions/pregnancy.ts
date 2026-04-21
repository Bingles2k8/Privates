import { addDays, differenceInCalendarDays, parseISO } from 'date-fns';

export type PregnancyProgress = {
  weeks: number;
  days: number;
  trimester: 1 | 2 | 3;
  dayOfPregnancy: number;
  daysToDue: number;
  percent: number;
};

export function pregnancyProgress(
  lmpDate: string,
  dueDate: string,
  today: Date = new Date(),
): PregnancyProgress {
  const lmp = parseISO(lmpDate);
  const due = parseISO(dueDate);
  const dayOfPregnancy = Math.max(0, differenceInCalendarDays(today, lmp));
  const weeks = Math.floor(dayOfPregnancy / 7);
  const days = dayOfPregnancy % 7;
  const trimester: 1 | 2 | 3 = weeks < 13 ? 1 : weeks < 27 ? 2 : 3;
  const daysToDue = differenceInCalendarDays(due, today);
  const total = differenceInCalendarDays(due, lmp);
  const percent = Math.min(100, Math.max(0, (dayOfPregnancy / total) * 100));
  return { weeks, days, trimester, dayOfPregnancy, daysToDue, percent };
}

export const WEEK_MILESTONES: { week: number; note: string }[] = [
  { week: 4, note: 'embryo implants. hCG kicks in.' },
  { week: 6, note: 'heartbeat often detectable on ultrasound.' },
  { week: 8, note: 'all major organs forming.' },
  { week: 12, note: 'end of first trimester — risk of miscarriage drops.' },
  { week: 16, note: 'you may start feeling movement.' },
  { week: 20, note: 'halfway there. anatomy scan window.' },
  { week: 24, note: 'viability threshold.' },
  { week: 28, note: 'third trimester begins.' },
  { week: 32, note: 'baby practicing breathing.' },
  { week: 36, note: 'considered early term next week.' },
  { week: 37, note: 'early term.' },
  { week: 39, note: 'full term.' },
  { week: 40, note: 'due date week. baby can arrive anytime.' },
];

export function nextMilestone(weeks: number) {
  return WEEK_MILESTONES.find((m) => m.week > weeks) ?? null;
}

export function currentMilestone(weeks: number) {
  return [...WEEK_MILESTONES].reverse().find((m) => m.week <= weeks) ?? null;
}

export function estimatedDueFromLmp(lmpIso: string): string {
  return addDays(parseISO(lmpIso), 280).toISOString().slice(0, 10);
}

export type ContractionStats = {
  count: number;
  avgIntervalSeconds: number | null;
  avgDurationSeconds: number | null;
  lastIntervalSeconds: number | null;
};

export function contractionStats(
  rows: { startedAt: string; endedAt: string | null }[],
): ContractionStats {
  const completed = rows.filter((r) => r.endedAt != null);
  const durations = completed.map(
    (r) => (new Date(r.endedAt!).getTime() - new Date(r.startedAt).getTime()) / 1000,
  );
  const starts = rows.map((r) => new Date(r.startedAt).getTime()).sort((a, b) => a - b);
  const intervals: number[] = [];
  for (let i = 1; i < starts.length; i++) {
    intervals.push((starts[i] - starts[i - 1]) / 1000);
  }
  const avg = (xs: number[]) => (xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : null);
  return {
    count: rows.length,
    avgIntervalSeconds: avg(intervals.slice(-5)),
    avgDurationSeconds: avg(durations.slice(-5)),
    lastIntervalSeconds: intervals.length ? intervals[intervals.length - 1] : null,
  };
}
