import { create } from 'zustand';
import {
  DEFAULT_SETTINGS,
  loadSettings,
  saveSettings,
  type RetentionCategory,
} from '@/data/settings';

type RetentionState = {
  values: Record<RetentionCategory, number>;
  lastSweepAt: string | null;
  hydrated: boolean;
  hydrate: (next: {
    values: Record<RetentionCategory, number>;
    lastSweepAt: string | null;
  }) => void;
  set: (cat: RetentionCategory, days: number) => void;
  markSwept: (at: string) => void;
};

export const useRetention = create<RetentionState>((set, get) => ({
  values: {
    notes: DEFAULT_SETTINGS.retention.notes,
    symptoms: DEFAULT_SETTINGS.retention.symptoms,
    moods: DEFAULT_SETTINGS.retention.moods,
    bbt: DEFAULT_SETTINGS.retention.bbt,
    sex: DEFAULT_SETTINGS.retention.sex,
    lhTest: DEFAULT_SETTINGS.retention.lhTest,
  },
  lastSweepAt: DEFAULT_SETTINGS.retention.lastSweepAt,
  hydrated: false,
  hydrate: (next) => set({ ...next, hydrated: true }),
  set: (cat, days) => {
    const values = { ...get().values, [cat]: days };
    set({ values });
    void persistRetention(values);
  },
  markSwept: (at) => set({ lastSweepAt: at }),
}));

export async function hydrateRetentionFromSettings(): Promise<void> {
  try {
    const s = await loadSettings();
    useRetention.getState().hydrate({
      values: {
        notes: s.retention.notes,
        symptoms: s.retention.symptoms,
        moods: s.retention.moods,
        bbt: s.retention.bbt,
        sex: s.retention.sex,
        lhTest: s.retention.lhTest,
      },
      lastSweepAt: s.retention.lastSweepAt,
    });
  } catch {
    useRetention.setState({ hydrated: true });
  }
}

async function persistRetention(values: Record<RetentionCategory, number>): Promise<void> {
  const cur = await loadSettings();
  await saveSettings({
    ...cur,
    retention: { ...cur.retention, ...values },
  });
}
