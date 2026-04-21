import { useMemo } from 'react';
import { Canvas, Path, Skia, Group } from '@shopify/react-native-skia';
import { Feather } from '@expo/vector-icons';

export type HandIconName =
  | 'droplet'
  | 'smile'
  | 'activity'
  | 'shield'
  | 'calendar'
  | 'sun'
  | 'moon'
  | 'trending-up'
  | 'settings'
  | 'heart'
  | 'thermometer'
  | 'repeat'
  | 'clock'
  | 'star'
  | 'check'
  | 'x'
  | 'plus'
  | 'minus'
  | 'lock'
  | 'unlock'
  | 'key'
  | 'user'
  | 'user-check'
  | 'alert-triangle'
  | 'alert-circle'
  | 'trash-2'
  | 'chevron-left'
  | 'chevron-right'
  | 'chevron-up'
  | 'chevron-down'
  | 'zap'
  | 'circle'
  | 'check-square'
  | 'square'
  | 'edit-2'
  | 'edit-3'
  | 'save'
  | 'book-open'
  | 'download'
  | 'upload'
  | 'move'
  | 'smartphone'
  | 'info'
  | 'plus-circle'
  | 'x-circle'
  | 'check-circle'
  | 'arrow-right'
  | 'arrow-left'
  | 'image';

type Props = {
  name: HandIconName;
  size?: number;
  color: string;
  strokeWidth?: number;
};

const VB = 24;

type Stroke = { d: string; close?: boolean };
type IconDef = { strokes: Stroke[]; fills?: string[] };

const ICONS: Record<HandIconName, IconDef> = {
  droplet: {
    strokes: [{ d: 'M12 3 C12 3 5 11 5 15.5 C5 19.5 8.2 22 12 22 C15.8 22 19 19.5 19 15.5 C19 11 12 3 12 3 Z', close: true }],
  },
  smile: {
    strokes: [
      { d: 'M12 21 C16.97 21 21 16.97 21 12 C21 7.03 16.97 3 12 3 C7.03 3 3 7.03 3 12 C3 16.97 7.03 21 12 21 Z', close: true },
      { d: 'M8 14 Q12 18 16 14' },
      { d: 'M9 9.5 L9 10' },
      { d: 'M15 9.5 L15 10' },
    ],
  },
  activity: {
    strokes: [{ d: 'M3 12 L7 12 L10 5 L14 19 L17 12 L21 12' }],
  },
  shield: {
    strokes: [{ d: 'M12 3 L20 6 L20 12 C20 16.5 16.5 20 12 22 C7.5 20 4 16.5 4 12 L4 6 Z', close: true }],
  },
  calendar: {
    strokes: [
      { d: 'M5 5 L19 5 Q21 5 21 7 L21 19 Q21 21 19 21 L5 21 Q3 21 3 19 L3 7 Q3 5 5 5 Z', close: true },
      { d: 'M3 10 L21 10' },
      { d: 'M8 3 L8 7' },
      { d: 'M16 3 L16 7' },
    ],
  },
  sun: {
    strokes: [
      { d: 'M12 17 C14.76 17 17 14.76 17 12 C17 9.24 14.76 7 12 7 C9.24 7 7 9.24 7 12 C7 14.76 9.24 17 12 17 Z', close: true },
      { d: 'M12 2 L12 4' },
      { d: 'M12 20 L12 22' },
      { d: 'M2 12 L4 12' },
      { d: 'M20 12 L22 12' },
      { d: 'M5 5 L6.5 6.5' },
      { d: 'M17.5 17.5 L19 19' },
      { d: 'M5 19 L6.5 17.5' },
      { d: 'M17.5 6.5 L19 5' },
    ],
  },
  moon: {
    strokes: [{ d: 'M21 12.8 A9 9 0 1 1 11.2 3 A7 7 0 0 0 21 12.8 Z', close: true }],
  },
  'trending-up': {
    strokes: [
      { d: 'M3 17 L9 11 L13 15 L21 7' },
      { d: 'M15 7 L21 7 L21 13' },
    ],
  },
  settings: {
    strokes: [
      { d: 'M12 15 C13.66 15 15 13.66 15 12 C15 10.34 13.66 9 12 9 C10.34 9 9 10.34 9 12 C9 13.66 10.34 15 12 15 Z', close: true },
      { d: 'M19 12 A7 7 0 0 0 18.8 10.5 L20.7 9 L18.7 5.6 L16.4 6.3 A7 7 0 0 0 14 5 L13.5 2.6 L10.5 2.6 L10 5 A7 7 0 0 0 7.6 6.3 L5.3 5.6 L3.3 9 L5.2 10.5 A7 7 0 0 0 5 12 A7 7 0 0 0 5.2 13.5 L3.3 15 L5.3 18.4 L7.6 17.7 A7 7 0 0 0 10 19 L10.5 21.4 L13.5 21.4 L14 19 A7 7 0 0 0 16.4 17.7 L18.7 18.4 L20.7 15 L18.8 13.5 A7 7 0 0 0 19 12 Z', close: true },
    ],
  },
  heart: {
    strokes: [{ d: 'M12 21 C12 21 3 14.5 3 8.5 C3 5.5 5.5 3 8.5 3 C10.5 3 12 4.5 12 4.5 C12 4.5 13.5 3 15.5 3 C18.5 3 21 5.5 21 8.5 C21 14.5 12 21 12 21 Z', close: true }],
  },
  thermometer: {
    strokes: [
      { d: 'M14 14.76 L14 5 A2 2 0 0 0 10 5 L10 14.76 A4 4 0 1 0 14 14.76 Z', close: true },
    ],
  },
  repeat: {
    strokes: [
      { d: 'M3 12 A9 9 0 0 1 18 5.5' },
      { d: 'M21 12 A9 9 0 0 1 6 18.5' },
      { d: 'M14 5.5 L18 5.5 L18 1.5' },
      { d: 'M10 18.5 L6 18.5 L6 22.5' },
    ],
  },
  clock: {
    strokes: [
      { d: 'M12 21 C16.97 21 21 16.97 21 12 C21 7.03 16.97 3 12 3 C7.03 3 3 7.03 3 12 C3 16.97 7.03 21 12 21 Z', close: true },
      { d: 'M12 7 L12 12 L15.5 14' },
    ],
  },
  star: {
    strokes: [{ d: 'M12 2.5 L14.9 8.7 L21.5 9.6 L16.7 14.2 L18 21 L12 17.7 L6 21 L7.3 14.2 L2.5 9.6 L9.1 8.7 Z', close: true }],
  },
  check: {
    strokes: [{ d: 'M5 12.5 L10 17.5 L19.5 6' }],
  },
  x: {
    strokes: [
      { d: 'M6 6 L18 18' },
      { d: 'M18 6 L6 18' },
    ],
  },
  plus: {
    strokes: [
      { d: 'M12 5 L12 19' },
      { d: 'M5 12 L19 12' },
    ],
  },
  minus: {
    strokes: [{ d: 'M5 12 L19 12' }],
  },
  lock: {
    strokes: [
      { d: 'M5 11 L19 11 Q21 11 21 13 L21 19 Q21 21 19 21 L5 21 Q3 21 3 19 L3 13 Q3 11 5 11 Z', close: true },
      { d: 'M7 11 L7 7 A5 5 0 0 1 17 7 L17 11' },
    ],
  },
  unlock: {
    strokes: [
      { d: 'M5 11 L19 11 Q21 11 21 13 L21 19 Q21 21 19 21 L5 21 Q3 21 3 19 L3 13 Q3 11 5 11 Z', close: true },
      { d: 'M7 11 L7 7 A5 5 0 0 1 17 7' },
    ],
  },
  key: {
    strokes: [
      { d: 'M14 8 A4 4 0 1 1 9.5 11.9 L3 18.4 L3 21 L6 21 L6 18.4 L8 16.4 L10 18.4 L12.5 15.9' },
      { d: 'M16 8.5 L16 8.6' },
    ],
  },
  user: {
    strokes: [
      { d: 'M12 13 C14.76 13 17 10.76 17 8 C17 5.24 14.76 3 12 3 C9.24 3 7 5.24 7 8 C7 10.76 9.24 13 12 13 Z', close: true },
      { d: 'M4 21 C4 16.58 7.58 13 12 13 C16.42 13 20 16.58 20 21' },
    ],
  },
  'user-check': {
    strokes: [
      { d: 'M10 13 C12.76 13 15 10.76 15 8 C15 5.24 12.76 3 10 3 C7.24 3 5 5.24 5 8 C5 10.76 7.24 13 10 13 Z', close: true },
      { d: 'M2 21 C2 16.58 5.58 13 10 13 C12.5 13 14.76 14.16 16.2 16' },
      { d: 'M16 18 L18 20 L22 16' },
    ],
  },
  'alert-triangle': {
    strokes: [
      { d: 'M10.3 3.86 L1.82 18 A2 2 0 0 0 3.55 21 L20.45 21 A2 2 0 0 0 22.18 18 L13.71 3.86 A2 2 0 0 0 10.29 3.86 Z', close: true },
      { d: 'M12 9 L12 13' },
      { d: 'M12 17 L12 17.01' },
    ],
  },
  'alert-circle': {
    strokes: [
      { d: 'M12 21 C16.97 21 21 16.97 21 12 C21 7.03 16.97 3 12 3 C7.03 3 3 7.03 3 12 C3 16.97 7.03 21 12 21 Z', close: true },
      { d: 'M12 8 L12 12' },
      { d: 'M12 16 L12 16.01' },
    ],
  },
  'trash-2': {
    strokes: [
      { d: 'M3 6 L21 6' },
      { d: 'M5 6 L6 20 Q6 22 8 22 L16 22 Q18 22 18 20 L19 6' },
      { d: 'M9 6 L9 4 Q9 2 11 2 L13 2 Q15 2 15 4 L15 6' },
      { d: 'M10 11 L10 17' },
      { d: 'M14 11 L14 17' },
    ],
  },
  'chevron-left': {
    strokes: [{ d: 'M15 5 L8 12 L15 19' }],
  },
  'chevron-right': {
    strokes: [{ d: 'M9 5 L16 12 L9 19' }],
  },
  'chevron-up': {
    strokes: [{ d: 'M5 15 L12 8 L19 15' }],
  },
  'chevron-down': {
    strokes: [{ d: 'M5 9 L12 16 L19 9' }],
  },
  zap: {
    strokes: [{ d: 'M13 2 L4 14 L11 14 L11 22 L20 10 L13 10 Z', close: true }],
  },
  circle: {
    strokes: [{ d: 'M12 21 C16.97 21 21 16.97 21 12 C21 7.03 16.97 3 12 3 C7.03 3 3 7.03 3 12 C3 16.97 7.03 21 12 21 Z', close: true }],
  },
  square: {
    strokes: [{ d: 'M5 4 L19 4 Q21 4 21 6 L21 18 Q21 20 19 20 L5 20 Q3 20 3 18 L3 6 Q3 4 5 4 Z', close: true }],
  },
  'check-square': {
    strokes: [
      { d: 'M5 4 L19 4 Q21 4 21 6 L21 18 Q21 20 19 20 L5 20 Q3 20 3 18 L3 6 Q3 4 5 4 Z', close: true },
      { d: 'M7 12.5 L11 16.5 L17.5 9' },
    ],
  },
  'edit-2': {
    strokes: [
      { d: 'M16.5 3 L21 7.5 L8 20.5 L3 21 L3.5 16 Z', close: true },
    ],
  },
  'edit-3': {
    strokes: [
      { d: 'M14 4 L20 10 L9 21 L3 21 L3 15 Z', close: true },
      { d: 'M12 6 L18 12' },
    ],
  },
  save: {
    strokes: [
      { d: 'M5 3 L17 3 L21 7 L21 19 Q21 21 19 21 L5 21 Q3 21 3 19 L3 5 Q3 3 5 3 Z', close: true },
      { d: 'M7 3 L7 9 L15 9 L15 3' },
      { d: 'M7 21 L7 14 L17 14 L17 21' },
    ],
  },
  'book-open': {
    strokes: [
      { d: 'M2 4 Q7 4 12 6 Q17 4 22 4 L22 20 Q17 20 12 22 Q7 20 2 20 Z', close: true },
      { d: 'M12 6 L12 22' },
    ],
  },
  download: {
    strokes: [
      { d: 'M3 17 L3 19 Q3 21 5 21 L19 21 Q21 21 21 19 L21 17' },
      { d: 'M7 11 L12 16 L17 11' },
      { d: 'M12 3 L12 16' },
    ],
  },
  upload: {
    strokes: [
      { d: 'M3 17 L3 19 Q3 21 5 21 L19 21 Q21 21 21 19 L21 17' },
      { d: 'M7 8 L12 3 L17 8' },
      { d: 'M12 3 L12 16' },
    ],
  },
  move: {
    strokes: [
      { d: 'M5 9 L2 12 L5 15' },
      { d: 'M9 5 L12 2 L15 5' },
      { d: 'M15 19 L12 22 L9 19' },
      { d: 'M19 9 L22 12 L19 15' },
      { d: 'M2 12 L22 12' },
      { d: 'M12 2 L12 22' },
    ],
  },
  smartphone: {
    strokes: [
      { d: 'M7 2 L17 2 Q19 2 19 4 L19 20 Q19 22 17 22 L7 22 Q5 22 5 20 L5 4 Q5 2 7 2 Z', close: true },
      { d: 'M12 18 L12 18.01' },
    ],
  },
  info: {
    strokes: [
      { d: 'M12 21 C16.97 21 21 16.97 21 12 C21 7.03 16.97 3 12 3 C7.03 3 3 7.03 3 12 C3 16.97 7.03 21 12 21 Z', close: true },
      { d: 'M12 11 L12 17' },
      { d: 'M12 7 L12 7.01' },
    ],
  },
  'plus-circle': {
    strokes: [
      { d: 'M12 21 C16.97 21 21 16.97 21 12 C21 7.03 16.97 3 12 3 C7.03 3 3 7.03 3 12 C3 16.97 7.03 21 12 21 Z', close: true },
      { d: 'M12 8 L12 16' },
      { d: 'M8 12 L16 12' },
    ],
  },
  'x-circle': {
    strokes: [
      { d: 'M12 21 C16.97 21 21 16.97 21 12 C21 7.03 16.97 3 12 3 C7.03 3 3 7.03 3 12 C3 16.97 7.03 21 12 21 Z', close: true },
      { d: 'M9 9 L15 15' },
      { d: 'M15 9 L9 15' },
    ],
  },
  'check-circle': {
    strokes: [
      { d: 'M21 11.08 L21 12 A9 9 0 1 1 15.66 3.78' },
      { d: 'M22 4 L12 14 L9 11' },
    ],
  },
  'arrow-right': {
    strokes: [
      { d: 'M5 12 L19 12' },
      { d: 'M13 6 L19 12 L13 18' },
    ],
  },
  'arrow-left': {
    strokes: [
      { d: 'M19 12 L5 12' },
      { d: 'M11 6 L5 12 L11 18' },
    ],
  },
  image: {
    strokes: [
      { d: 'M5 3 L19 3 Q21 3 21 5 L21 19 Q21 21 19 21 L5 21 Q3 21 3 19 L3 5 Q3 3 5 3 Z', close: true },
      { d: 'M8.5 10 A1.5 1.5 0 1 0 8.5 7 A1.5 1.5 0 0 0 8.5 10 Z', close: true },
      { d: 'M3 17 L8 12 L13 17 L16 14 L21 19' },
    ],
  },
};

export function HandIcon({ name, size = 20, color, strokeWidth }: Props) {
  const def = ICONS[name];
  const scale = size / VB;
  const sw = strokeWidth ?? Math.max(2.2, size * 0.12);

  const paths = useMemo(() => {
    if (!def) return [];
    return def.strokes.map((s) => Skia.Path.MakeFromSVGString(s.d) ?? Skia.Path.Make());
  }, [def, name]);

  if (!def) {
    // Fallback to Feather for any icon we haven't drawn yet.
    const FeatherAny = Feather as unknown as React.ComponentType<{ name: string; size: number; color: string }>;
    return <FeatherAny name={name} size={size} color={color} />;
  }

  return (
    <Canvas style={{ width: size, height: size }} pointerEvents="none">
      <Group transform={[{ scale }]}>
        {paths.map((p, i) => (
          <Path
            key={i}
            path={p}
            style="stroke"
            strokeWidth={sw / scale}
            strokeCap="round"
            strokeJoin="round"
            color={color}
          />
        ))}
      </Group>
    </Canvas>
  );
}
