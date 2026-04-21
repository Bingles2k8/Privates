import { eq } from 'drizzle-orm';
import { getDb } from '@/db';
import { settings } from '@/db/schema';
import { DEFAULT_ACCENT, type AccentKey, type ThemeMode } from '@/theme/palette';

export type RetentionCategory =
  | 'notes'
  | 'symptoms'
  | 'moods'
  | 'bbt'
  | 'sex'
  | 'lhTest';

export type AppSettings = {
  conceptionMode: boolean;
  reminders: {
    upcomingPeriod: boolean;
    fertileWindow: boolean;
    dailyLog: boolean;
    dailyLogTime: string;
  };
  privacy: {
    autoLockSeconds: number;
    stealthIcon: boolean;
    decoyPinEnabled: boolean;
  };
  theme: {
    mode: ThemeMode;
    accent: AccentKey;
  };
  customize: {
    today: string[];
    insights: string[];
    /** User-defined section order; empty array = use catalog default. */
    todayOrder: string[];
    insightsOrder: string[];
  };
  /**
   * Per-category data retention. Each value is a count of days; 0 means
   * "never auto-delete". Cycle starts/ends are never auto-deleted — they're
   * the backbone of the whole app and the user can wipe them explicitly.
   */
  retention: Record<RetentionCategory, number> & {
    /** ISO timestamp of the last successful sweep, or null. */
    lastSweepAt: string | null;
  };
};

export const DEFAULT_SETTINGS: AppSettings = {
  conceptionMode: false,
  reminders: {
    upcomingPeriod: true,
    fertileWindow: false,
    dailyLog: false,
    dailyLogTime: '20:00',
  },
  privacy: {
    autoLockSeconds: 30,
    stealthIcon: false,
    decoyPinEnabled: false,
  },
  theme: {
    mode: 'system',
    accent: DEFAULT_ACCENT,
  },
  customize: {
    today: [],
    insights: [],
    todayOrder: [],
    insightsOrder: [],
  },
  retention: {
    notes: 0,
    symptoms: 0,
    moods: 0,
    bbt: 0,
    sex: 0,
    lhTest: 0,
    lastSweepAt: null,
  },
};

export async function loadSettings(): Promise<AppSettings> {
  const db = getDb();
  const row = await db.query.settings.findFirst({ where: eq(settings.id, 1) });
  if (!row) return DEFAULT_SETTINGS;
  try {
    const parsed = JSON.parse(row.json) as Partial<AppSettings>;
    // Deep-merge nested sub-objects so older stored settings pick up any new
    // default fields we've added (e.g. customize.todayOrder).
    return {
      ...DEFAULT_SETTINGS,
      ...parsed,
      reminders: { ...DEFAULT_SETTINGS.reminders, ...(parsed.reminders ?? {}) },
      privacy: { ...DEFAULT_SETTINGS.privacy, ...(parsed.privacy ?? {}) },
      theme: { ...DEFAULT_SETTINGS.theme, ...(parsed.theme ?? {}) },
      customize: { ...DEFAULT_SETTINGS.customize, ...(parsed.customize ?? {}) },
      retention: { ...DEFAULT_SETTINGS.retention, ...(parsed.retention ?? {}) },
    };
  } catch {
    return DEFAULT_SETTINGS;
  }
}

export async function saveSettings(next: AppSettings): Promise<void> {
  const db = getDb();
  const now = new Date().toISOString();
  const existing = await db.query.settings.findFirst({ where: eq(settings.id, 1) });
  if (existing) {
    await db.update(settings).set({ json: JSON.stringify(next), updatedAt: now }).where(eq(settings.id, 1));
  } else {
    await db.insert(settings).values({ id: 1, json: JSON.stringify(next), updatedAt: now });
  }
}
