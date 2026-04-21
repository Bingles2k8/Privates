export type AccentKey = 'sky' | 'rose' | 'violet' | 'emerald' | 'amber' | 'red' | 'slate';

export type AccentDef = {
  key: AccentKey;
  label: string;
  hex: string;
  softHex: string;
  rgb: string;
  softRgb: string;
};

function rgbOf(hex: string): string {
  const h = hex.replace('#', '');
  const r = parseInt(h.slice(0, 2), 16);
  const g = parseInt(h.slice(2, 4), 16);
  const b = parseInt(h.slice(4, 6), 16);
  return `${r} ${g} ${b}`;
}

function def(key: AccentKey, label: string, hex: string, softHex: string): AccentDef {
  return { key, label, hex, softHex, rgb: rgbOf(hex), softRgb: rgbOf(softHex) };
}

export const ACCENTS: AccentDef[] = [
  def('sky', 'Sky', '#38bdf8', '#bae6fd'),
  def('rose', 'Rose', '#e84a7a', '#f9c0d2'),
  def('violet', 'Violet', '#9b6bd8', '#d8c0f7'),
  def('emerald', 'Emerald', '#10b981', '#a7f3d0'),
  def('amber', 'Amber', '#f59e0b', '#fde68a'),
  def('red', 'Red', '#ef4444', '#fecaca'),
  def('slate', 'Slate', '#64748b', '#cbd5e1'),
];

export const DEFAULT_ACCENT: AccentKey = 'sky';

export function findAccent(key: AccentKey | undefined | null): AccentDef {
  return ACCENTS.find((a) => a.key === key) ?? ACCENTS[0];
}

export type ThemeMode = 'system' | 'light' | 'dark';

export type Palette = {
  bg: string;
  bgCard: string;
  bgSoft: string;
  ink: string;
  inkMuted: string;
  inkDim: string;
  accent: string;
  accentSoft: string;
  fertile: string;
  ovulation: string;
};

export const LIGHT: Omit<Palette, 'accent' | 'accentSoft'> = {
  bg: '#faf6f1',
  bgCard: '#ffffff',
  bgSoft: '#f0e9e0',
  ink: '#2a241f',
  inkMuted: '#6b6259',
  inkDim: '#a39a90',
  fertile: '#7eb8da',
  ovulation: '#9b6bd8',
};

export const DARK: Omit<Palette, 'accent' | 'accentSoft'> = {
  bg: '#13110f',
  bgCard: '#1d1a17',
  bgSoft: '#26221e',
  ink: '#f5efe6',
  inkMuted: '#a89e92',
  inkDim: '#73695f',
  fertile: '#7eb8da',
  ovulation: '#9b6bd8',
};
