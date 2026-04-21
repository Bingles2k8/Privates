import { useMemo } from 'react';
import { Canvas, Path, Skia } from '@shopify/react-native-skia';

type Props = {
  width: number;
  height?: number;
  color: string;
  strokeWidth?: number;
  amplitude?: number;
  frequency?: number;
};

export function Squiggle({
  width,
  height = 10,
  color,
  strokeWidth = 2.5,
  amplitude = 3,
  frequency = 18,
}: Props) {
  const path = useMemo(() => {
    const p = Skia.Path.Make();
    const midY = height / 2;
    const steps = Math.max(20, Math.floor(width / 2));
    p.moveTo(2, midY);
    for (let i = 1; i <= steps; i++) {
      const x = 2 + (i / steps) * (width - 4);
      const y = midY + Math.sin((x / frequency) * Math.PI * 2) * amplitude;
      p.lineTo(x, y);
    }
    return p;
  }, [width, height, amplitude, frequency]);

  return (
    <Canvas style={{ width, height }} pointerEvents="none">
      <Path
        path={path}
        style="stroke"
        strokeWidth={strokeWidth}
        strokeCap="round"
        strokeJoin="round"
        color={color}
      />
    </Canvas>
  );
}
