import { create } from 'zustand';
import { DEFAULT_SETTINGS, loadSettings, saveSettings } from '@/data/settings';

export type ReminderPrefs = {
  upcomingPeriod: boolean;
  fertileWindow: boolean;
  dailyLog: boolean;
  /** "HH:MM" 24h */
  dailyLogTime: string;
};

type ReminderState = ReminderPrefs & {
  hydrated: boolean;
  hydrate: (next: ReminderPrefs) => void;
  setUpcomingPeriod: (v: boolean) => void;
  setFertileWindow: (v: boolean) => void;
  setDailyLog: (v: boolean) => void;
  setDailyLogTime: (time: string) => void;
};

export const useReminderPrefs = create<ReminderState>((set, get) => ({
  ...DEFAULT_SETTINGS.reminders,
  hydrated: false,
  hydrate: (next) => set({ ...next, hydrated: true }),
  setUpcomingPeriod: (v) => {
    set({ upcomingPeriod: v });
    void persistReminders(get());
  },
  setFertileWindow: (v) => {
    set({ fertileWindow: v });
    void persistReminders(get());
  },
  setDailyLog: (v) => {
    set({ dailyLog: v });
    void persistReminders(get());
  },
  setDailyLogTime: (time) => {
    set({ dailyLogTime: time });
    void persistReminders(get());
  },
}));

export async function hydrateRemindersFromSettings(): Promise<void> {
  try {
    const s = await loadSettings();
    useReminderPrefs.getState().hydrate(s.reminders);
  } catch {
    useReminderPrefs.setState({ hydrated: true });
  }
}

async function persistReminders(next: ReminderState): Promise<void> {
  const cur = await loadSettings();
  await saveSettings({
    ...cur,
    reminders: {
      upcomingPeriod: next.upcomingPeriod,
      fertileWindow: next.fertileWindow,
      dailyLog: next.dailyLog,
      dailyLogTime: next.dailyLogTime,
    },
  });
}
