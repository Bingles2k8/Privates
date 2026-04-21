import { useMemo } from 'react';
import { useWindowDimensions, View, Text } from 'react-native';
import { Canvas, Path, Skia, Line, vec } from '@shopify/react-native-skia';
import { useTheme } from '@/theme/useTheme';

const HEIGHT = 140;
const PADDING_X = 8;
const PADDING_TOP = 12;
const PADDING_BOTTOM = 24;

/**
 * Stylized hormone curve diagram across a 28-day cycle.
 * Shapes are illustrative (not real-data) — they show the typical pattern:
 *  - Estrogen: rises through follicular, peaks just before ovulation (day 13),
 *    dips at ovulation, smaller secondary rise in luteal, falls before period.
 *  - Progesterone: low until ovulation, rises through luteal, falls before period.
 *  - LH: flat baseline with sharp peak right at ovulation.
 */
export function HormoneCurves() {
  const { palette } = useTheme();
  const { width: winWidth } = useWindowDimensions();
  // Card padding is ~p-4 (16) on each side, plus the screen padding.
  // We don't know the exact host width here, so derive from window minus margins.
  const width = Math.max(220, winWidth - 80);

  const drawArea = {
    left: PADDING_X,
    right: width - PADDING_X,
    top: PADDING_TOP,
    bottom: HEIGHT - PADDING_BOTTOM,
  };
  const drawWidth = drawArea.right - drawArea.left;
  const drawHeight = drawArea.bottom - drawArea.top;

  const xForDay = (day: number) => drawArea.left + (day / 28) * drawWidth;
  // y: 0 = top of band (high), 1 = bottom (low)
  const yForLevel = (level: number) => drawArea.bottom - level * drawHeight;

  // Estrogen curve: builds 0→0.85 by day 13, dips to 0.45 at day 14, bumps to 0.6 around 21, falls to 0.15 by 28
  const estrogen = useMemo(() => {
    const p = Skia.Path.Make();
    const pts: [number, number][] = [
      [0, 0.1],
      [4, 0.18],
      [8, 0.45],
      [11, 0.7],
      [13, 0.9],
      [14, 0.55],
      [16, 0.5],
      [18, 0.55],
      [21, 0.62],
      [24, 0.45],
      [27, 0.2],
      [28, 0.12],
    ];
    pts.forEach(([d, l], i) => {
      const x = xForDay(d);
      const y = yForLevel(l);
      if (i === 0) p.moveTo(x, y);
      else p.lineTo(x, y);
    });
    return p;
  }, [width]);

  // Progesterone: ~0 until ovulation, rises to 0.75 around day 22, falls to 0.05 by day 28
  const progesterone = useMemo(() => {
    const p = Skia.Path.Make();
    const pts: [number, number][] = [
      [0, 0.05],
      [10, 0.05],
      [13, 0.07],
      [15, 0.18],
      [18, 0.45],
      [21, 0.7],
      [22, 0.78],
      [24, 0.65],
      [26, 0.35],
      [28, 0.08],
    ];
    pts.forEach(([d, l], i) => {
      const x = xForDay(d);
      const y = yForLevel(l);
      if (i === 0) p.moveTo(x, y);
      else p.lineTo(x, y);
    });
    return p;
  }, [width]);

  // LH: baseline ~0.08, sharp peak to 0.95 at day 14, back down by 15.5
  const lh = useMemo(() => {
    const p = Skia.Path.Make();
    const pts: [number, number][] = [
      [0, 0.08],
      [10, 0.08],
      [12, 0.1],
      [13, 0.25],
      [14, 0.95],
      [15, 0.25],
      [16, 0.1],
      [28, 0.08],
    ];
    pts.forEach(([d, l], i) => {
      const x = xForDay(d);
      const y = yForLevel(l);
      if (i === 0) p.moveTo(x, y);
      else p.lineTo(x, y);
    });
    return p;
  }, [width]);

  const ovulationX = xForDay(14);

  return (
    <View>
      <Canvas style={{ width, height: HEIGHT }} pointerEvents="none">
        {/* faint baseline */}
        <Line
          p1={vec(drawArea.left, drawArea.bottom)}
          p2={vec(drawArea.right, drawArea.bottom)}
          color={palette.ink + '22'}
          strokeWidth={1}
        />
        {/* dashed ovulation marker */}
        <Path
          path={(() => {
            const p = Skia.Path.Make();
            const segments = 8;
            for (let i = 0; i < segments; i++) {
              const t = i / segments;
              const t2 = (i + 0.5) / segments;
              p.moveTo(ovulationX, drawArea.top + t * drawHeight);
              p.lineTo(ovulationX, drawArea.top + t2 * drawHeight);
            }
            return p;
          })()}
          style="stroke"
          strokeWidth={1}
          color={palette.inkDim + '88'}
        />
        <Path
          path={estrogen}
          style="stroke"
          strokeWidth={2.5}
          strokeCap="round"
          strokeJoin="round"
          color={palette.accent}
        />
        <Path
          path={progesterone}
          style="stroke"
          strokeWidth={2.5}
          strokeCap="round"
          strokeJoin="round"
          color={palette.ovulation}
        />
        <Path
          path={lh}
          style="stroke"
          strokeWidth={2}
          strokeCap="round"
          strokeJoin="round"
          color={palette.fertile}
        />
      </Canvas>
      <View style={{ width, position: 'relative', height: 16, marginTop: -8 }}>
        <AxisLabel x={xForDay(1)} text="day 1" align="left" />
        <AxisLabel x={ovulationX} text="ovulation" align="center" />
        <AxisLabel x={xForDay(28)} text="day 28" align="right" />
      </View>
    </View>
  );
}

function AxisLabel({
  x,
  text,
  align,
}: {
  x: number;
  text: string;
  align: 'left' | 'center' | 'right';
}) {
  const { palette } = useTheme();
  const offset = align === 'left' ? 0 : align === 'center' ? -32 : -56;
  return (
    <Text
      style={{
        position: 'absolute',
        left: x + offset,
        top: 0,
        width: align === 'center' ? 64 : 56,
        textAlign: align === 'center' ? 'center' : align,
        fontSize: 10,
        color: palette.inkDim,
      }}
    >
      {text}
    </Text>
  );
}
