import { useMemo } from 'react';
import { StyleSheet, useWindowDimensions } from 'react-native';
import { Canvas, Circle, Group, Blur, Path, Skia } from '@shopify/react-native-skia';
import { useTheme } from '@/theme/useTheme';

const BLOB_OPACITY_LIGHT = 0.55;
const BLOB_OPACITY_DARK = 0.35;
const DOT_OPACITY_LIGHT = 0.07;
const DOT_OPACITY_DARK = 0.04;

function hexToRgb(hex: string): { r: number; g: number; b: number } {
  const h = hex.replace('#', '');
  return {
    r: parseInt(h.slice(0, 2), 16),
    g: parseInt(h.slice(2, 4), 16),
    b: parseInt(h.slice(4, 6), 16),
  };
}

function rgbToHex(r: number, g: number, b: number): string {
  const to = (n: number) => Math.max(0, Math.min(255, Math.round(n))).toString(16).padStart(2, '0');
  return `#${to(r)}${to(g)}${to(b)}`;
}

function mix(hex: string, target: string, ratio: number): string {
  const a = hexToRgb(hex);
  const b = hexToRgb(target);
  return rgbToHex(
    a.r + (b.r - a.r) * ratio,
    a.g + (b.g - a.g) * ratio,
    a.b + (b.b - a.b) * ratio,
  );
}

export function PaperBackground() {
  const { width, height } = useWindowDimensions();
  const { palette, isDark } = useTheme();

  const blobs = useMemo(() => {
    const accent = palette.accent;
    const soft = palette.accentSoft;
    // Derive five shades from the accent so the whole backdrop shifts with the user's pick.
    // In dark mode, lean toward deeper shades; in light mode, lean toward soft tints.
    const toWhite = (a: number) => mix(accent, '#ffffff', a);
    const toBlack = (a: number) => mix(accent, '#000000', a);
    const shades = isDark
      ? [accent, toBlack(0.25), toBlack(0.45), mix(accent, soft, 0.5), toBlack(0.15)]
      : [accent, toWhite(0.35), soft, toWhite(0.55), mix(accent, soft, 0.5)];
    return [
      { cx: width * 0.15, cy: height * 0.08, r: 180, color: shades[0] },
      { cx: width * 0.95, cy: height * 0.22, r: 160, color: shades[1] },
      { cx: width * 0.05, cy: height * 0.55, r: 200, color: shades[2] },
      { cx: width * 1.05, cy: height * 0.78, r: 220, color: shades[3] },
      { cx: width * 0.4, cy: height * 1.02, r: 200, color: shades[4] },
    ];
  }, [width, height, palette.accent, palette.accentSoft, isDark]);

  const dotsPath = useMemo(() => {
    const p = Skia.Path.Make();
    const cols = 12;
    const rows = Math.ceil((height / width) * cols) + 4;
    const stepX = width / cols;
    const stepY = stepX;
    let seed = 1;
    const rand = () => {
      seed = (seed * 16807) % 2147483647;
      return (seed % 1000) / 1000;
    };
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const jitterX = (rand() - 0.5) * stepX * 0.7;
        const jitterY = (rand() - 0.5) * stepY * 0.7;
        const radius = 0.6 + rand() * 1.1;
        const x = c * stepX + stepX / 2 + jitterX;
        const y = r * stepY + stepY / 2 + jitterY;
        p.addCircle(x, y, radius);
      }
    }
    return p;
  }, [width, height]);

  const blobOpacity = isDark ? BLOB_OPACITY_DARK : BLOB_OPACITY_LIGHT;
  const dotColor = isDark ? '#f5efe6' : '#2a241f';
  const dotOpacity = isDark ? DOT_OPACITY_DARK : DOT_OPACITY_LIGHT;

  return (
    <Canvas style={[StyleSheet.absoluteFillObject, { backgroundColor: palette.bg }]} pointerEvents="none">
      <Group opacity={blobOpacity}>
        <Blur blur={70} />
        {blobs.map((b, i) => (
          <Circle key={i} cx={b.cx} cy={b.cy} r={b.r} color={b.color} />
        ))}
      </Group>
      <Path path={dotsPath} color={dotColor} opacity={dotOpacity} />
    </Canvas>
  );
}
