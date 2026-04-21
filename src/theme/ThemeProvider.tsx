import { useEffect, type ReactNode } from 'react';
import { View, useColorScheme as useSystemColorScheme } from 'react-native';
import { colorScheme as nwColorScheme, vars } from 'nativewind';
import { useThemeStore } from './store';
import { DARK, LIGHT, findAccent } from './palette';
import { loadSettings, saveSettings } from '@/data/settings';

function rgbOf(hex: string): string {
  const h = hex.replace('#', '');
  return `${parseInt(h.slice(0, 2), 16)} ${parseInt(h.slice(2, 4), 16)} ${parseInt(h.slice(4, 6), 16)}`;
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const mode = useThemeStore((s) => s.mode);
  const accentKey = useThemeStore((s) => s.accent);
  const systemScheme = useSystemColorScheme();
  const isDark = mode === 'dark' || (mode === 'system' && systemScheme === 'dark');

  useEffect(() => {
    // keep nativewind's dark: classes in sync with the resolved scheme
    nwColorScheme.set(isDark ? 'dark' : 'light');
  }, [isDark]);

  const accent = findAccent(accentKey);
  const base = isDark ? DARK : LIGHT;
  const themeVars = vars({
    '--color-bg': rgbOf(base.bg),
    '--color-bg-card': rgbOf(base.bgCard),
    '--color-bg-soft': rgbOf(base.bgSoft),
    '--color-ink': rgbOf(base.ink),
    '--color-ink-muted': rgbOf(base.inkMuted),
    '--color-ink-dim': rgbOf(base.inkDim),
    '--color-accent': accent.rgb,
    '--color-accent-soft': accent.softRgb,
  });

  return (
    <View style={[{ flex: 1 }, themeVars]} className="bg-bg">
      {children}
    </View>
  );
}

export async function hydrateThemeFromSettings(): Promise<void> {
  try {
    const s = await loadSettings();
    useThemeStore.getState().hydrate({ mode: s.theme.mode, accent: s.theme.accent });
  } catch {
    useThemeStore.setState({ hydrated: true });
  }
}

export async function persistTheme(next: { mode?: string; accent?: string }): Promise<void> {
  const cur = await loadSettings();
  await saveSettings({
    ...cur,
    theme: {
      mode: (next.mode as any) ?? cur.theme.mode,
      accent: (next.accent as any) ?? cur.theme.accent,
    },
  });
}
