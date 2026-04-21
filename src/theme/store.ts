import { create } from 'zustand';
import { DEFAULT_ACCENT, type AccentKey, type ThemeMode } from './palette';

type ThemeState = {
  mode: ThemeMode;
  accent: AccentKey;
  hydrated: boolean;
  setMode: (m: ThemeMode) => void;
  setAccent: (a: AccentKey) => void;
  hydrate: (next: { mode: ThemeMode; accent: AccentKey }) => void;
};

export const useThemeStore = create<ThemeState>((set) => ({
  mode: 'system',
  accent: DEFAULT_ACCENT,
  hydrated: false,
  setMode: (mode) => set({ mode }),
  setAccent: (accent) => set({ accent }),
  hydrate: (next) => set({ ...next, hydrated: true }),
}));
