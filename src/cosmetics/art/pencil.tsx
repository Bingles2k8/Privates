// Shared "pencil" stroke helper. The signature look of the mascot is two
// jittered stroke passes per path — a main stroke at ~80% alpha and a
// ghost stroke at ~33% alpha with a larger deviation and different seed.
// Wrap any Skia path in <PencilStroke> to get the look for free.

import { DiscretePathEffect, Path, type SkPath } from '@shopify/react-native-skia';

type Props = {
  path: SkPath;
  ink: string;
  ghostInk: string;
  strokeWidth: number;
  jitterLen: number;
  jitterDev: number;
  /** Two ints. Each pass uses one. Pick distinct values across components
   *  so adjacent paths don't get correlated wobble. */
  seedMain: number;
  seedGhost: number;
  /** Optional fill colour for filled shapes (e.g. body skin). */
  fill?: string;
  /** Override the ghost stroke width multiplier. Default 0.7. */
  ghostScale?: number;
};

export function PencilStroke({
  path,
  ink,
  ghostInk,
  strokeWidth,
  jitterLen,
  jitterDev,
  seedMain,
  seedGhost,
  fill,
  ghostScale = 0.7,
}: Props) {
  return (
    <>
      {fill ? <Path path={path} color={fill} opacity={0.9} /> : null}
      <Path
        path={path}
        style="stroke"
        strokeWidth={strokeWidth}
        color={ink}
        strokeJoin="round"
        strokeCap="round"
      >
        <DiscretePathEffect length={jitterLen} deviation={jitterDev} seed={seedMain} />
      </Path>
      <Path
        path={path}
        style="stroke"
        strokeWidth={strokeWidth * ghostScale}
        color={ghostInk}
        strokeJoin="round"
        strokeCap="round"
      >
        <DiscretePathEffect
          length={jitterLen * 0.8}
          deviation={jitterDev * 1.3}
          seed={seedGhost}
        />
      </Path>
    </>
  );
}
