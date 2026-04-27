import { create } from 'zustand';
import { DEFAULT_SETTINGS, loadSettings, saveSettings } from '@/data/settings';
import type { TempUnit } from '@/predictions/bbt';

/**
 * Tiny store for the user's BBT display unit. Same shape and persistence
 * pattern as `useReminderPrefs` \u2014 hydrated once at app boot from the
 * encrypted settings row, then mirrored back on every change.
 *
 * Storage in the DB is always \u00b0C; this store only governs how raw values are
 * parsed from input and formatted for display. Helpers in `@/predictions/bbt`
 * do the actual conversion.
 */

export type BbtPrefs = {
  unit: TempUnit;
};

type BbtPrefsState = BbtPrefs & {
  hydrated: boolean;
  hydrate: (next: BbtPrefs) => void;
  setUnit: (unit: TempUnit) => void;
};

export const useBbtPrefs = create<BbtPrefsState>((set, get) => ({
  ...DEFAULT_SETTINGS.bbt,
  hydrated: false,
  hydrate: (next) => set({ ...next, hydrated: true }),
  setUnit: (unit) => {
    set({ unit });
    void persistBbt(get());
  },
}));

export async function hydrateBbtFromSettings(): Promise<void> {
  try {
    const s = await loadSettings();
    useBbtPrefs.getState().hydrate(s.bbt);
  } catch {
    useBbtPrefs.setState({ hydrated: true });
  }
}

async function persistBbt(next: BbtPrefsState): Promise<void> {
  const cur = await loadSettings();
  await saveSettings({
    ...cur,
    bbt: { unit: next.unit },
  });
}
