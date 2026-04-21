import { useMemo } from 'react';
import { Canvas, Path, Skia, Circle } from '@shopify/react-native-skia';

type Props = { value: 1 | 2 | 3 | 4 | 5; size?: number; color: string; strokeWidth?: number };

export function MoodFace({ value, size = 28, color, strokeWidth = 2.4 }: Props) {
  const path = useMemo(() => {
    const p = Skia.Path.Make();
    const cx = size / 2;
    const mouthY = size * 0.66;
    const halfW = size * 0.22;
    const left = cx - halfW;
    const right = cx + halfW;
    const curveAmounts = { 1: -size * 0.12, 2: -size * 0.06, 3: 0, 4: size * 0.08, 5: size * 0.16 };
    const curve = curveAmounts[value];
    const ctrlX = cx;
    const ctrlY = mouthY + curve * 2;
    p.moveTo(left, mouthY);
    p.quadTo(ctrlX, ctrlY, right, mouthY);
    return p;
  }, [value, size]);

  const eyeR = size * 0.06;
  const eyeY = size * 0.4;
  const eyeOffset = size * 0.18;
  const cx = size / 2;

  return (
    <Canvas style={{ width: size, height: size }} pointerEvents="none">
      <Circle cx={cx - eyeOffset} cy={eyeY} r={eyeR} color={color} />
      <Circle cx={cx + eyeOffset} cy={eyeY} r={eyeR} color={color} />
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
