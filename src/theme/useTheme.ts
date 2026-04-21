import { useColorScheme as useSystemColorScheme } from 'react-native';
import { useThemeStore } from './store';
import { DARK, LIGHT, findAccent, type Palette } from './palette';

export function useTheme(): { palette: Palette; isDark: boolean } {
  const mode = useThemeStore((s) => s.mode);
  const accentKey = useThemeStore((s) => s.accent);
  const systemScheme = useSystemColorScheme();
  const isDark = mode === 'dark' || (mode === 'system' && systemScheme === 'dark');
  const base = isDark ? DARK : LIGHT;
  const accent = findAccent(accentKey);
  return {
    isDark,
    palette: {
      ...base,
      accent: accent.hex,
      accentSoft: accent.softHex,
    },
  };
}
