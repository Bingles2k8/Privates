import { create } from 'zustand';
import { closeDatabase } from '@/db';
import { DEFAULT_SETTINGS, loadSettings, saveSettings } from '@/data/settings';

export type SessionStatus = 'unknown' | 'needsOnboarding' | 'locked' | 'unlocked';

type SessionState = {
  status: SessionStatus;
  lastUnlockedAt: number | null;
  /**
   * Seconds the app may stay unlocked in the background before auto-locking.
   * Special values:
   *   0  — lock on any backgrounding (Immediate)
   *  -1  — never auto-lock
   */
  autoLockSeconds: number;
  setStatus: (s: SessionStatus) => void;
  markUnlocked: () => void;
  lock: () => void;
  setAutoLockSeconds: (s: number) => void;
  hydrateAutoLock: (s: number) => void;
};

export const useSession = create<SessionState>((set) => ({
  status: 'unknown',
  lastUnlockedAt: null,
  autoLockSeconds: DEFAULT_SETTINGS.privacy.autoLockSeconds,
  setStatus: (s) => set({ status: s }),
  markUnlocked: () => set({ status: 'unlocked', lastUnlockedAt: Date.now() }),
  lock: () => {
    closeDatabase();
    set({ status: 'locked', lastUnlockedAt: null });
  },
  setAutoLockSeconds: (s) => {
    set({ autoLockSeconds: s });
    void persistAutoLockSeconds(s);
  },
  hydrateAutoLock: (s) => set({ autoLockSeconds: s }),
}));

export async function hydrateSessionFromSettings(): Promise<void> {
  try {
    const s = await loadSettings();
    useSession.getState().hydrateAutoLock(s.privacy.autoLockSeconds);
  } catch {
    /* keep default */
  }
}

async function persistAutoLockSeconds(next: number): Promise<void> {
  const cur = await loadSettings();
  await saveSettings({
    ...cur,
    privacy: { ...cur.privacy, autoLockSeconds: next },
  });
}
