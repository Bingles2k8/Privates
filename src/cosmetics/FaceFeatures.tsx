// Eyes, mouth, cheeks, and mood-driven flair (sparkles, missed mark).
// Extracted from the original Mascot.tsx so all characters share the same
// expressive face. Drawn on top of the character body and below most
// accessories, so an equipped beard, scarf, or sunglasses overrides /
// covers parts of it where appropriate.
//
// This module exposes two pieces:
//   - <FaceFeatures> renders the static (per-mood) elements as Skia
//   - <BlinkOverlay> renders the eyes (separate so the parent can animate
//     a `scaleY` transform on the whole eye layer for blinking)

import { useMemo } from 'react';
import { View } from 'react-native';
import Animated, { type SharedValue, useAnimatedStyle } from 'react-native-reanimated';
import {
  Canvas,
  Circle,
  DiscretePathEffect,
  Group,
  Path,
  Skia,
} from '@shopify/react-native-skia';
import type { MascotMood } from '@/ui/Mascot';
import type { FaceAnchors } from './art/types';

type Props = {
  size: number;
  mood: MascotMood;
  anchors: FaceAnchors;
  ink: string;
  ghostInk: string;
  cheek: string;
  jitterLen: number;
  jitterDev: number;
  /** Set true to suppress cheeks (e.g. when blush makeup is equipped — it
   *  draws its own brighter cheek shapes). */
  hideCheeks?: boolean;
  /** Set true to suppress the mouth path (e.g. when a mouth accessory or
   *  lipstick will be drawn instead). The lipstick item still wants the
   *  cheeks visible, so this is a separate flag from `hideCheeks`. */
  hideMouth?: boolean;
};

export function FaceFeatures({
  size,
  mood,
  anchors,
  ink,
  ghostInk,
  cheek,
  jitterLen,
  jitterDev,
  hideCheeks = false,
  hideMouth = false,
}: Props) {
  const strokeW = Math.max(2, size * 0.03);

  const mouthPath = useMemo(() => {
    if (hideMouth) return null;
    const p = Skia.Path.Make();
    const { cx, mouthY } = anchors;

    if (mood === 'shocked') {
      p.addCircle(cx, mouthY + size * 0.01, size * 0.045);
      return p;
    }
    if (mood === 'tongue') {
      const halfW = size * 0.08;
      p.moveTo(cx - halfW, mouthY);
      p.quadTo(cx, mouthY + size * 0.08, cx + halfW, mouthY);
      return p;
    }
    if (mood === 'proud' || mood === 'celebrate') {
      const halfW = size * 0.11;
      p.moveTo(cx - halfW, mouthY - size * 0.01);
      p.quadTo(cx, mouthY + size * 0.16, cx + halfW, mouthY - size * 0.01);
      return p;
    }
    if (mood === 'annoyed') {
      const halfW = size * 0.08;
      p.moveTo(cx - halfW, mouthY + size * 0.015);
      p.lineTo(cx + halfW, mouthY - size * 0.015);
      return p;
    }
    const halfW = size * 0.09;
    const curveMap: Partial<Record<MascotMood, number>> = {
      calm: size * 0.04,
      sleepy: size * 0.02,
      tired: -size * 0.04,
      bright: size * 0.1,
      wink: size * 0.07,
      squish: size * 0.05,
      missed: -size * 0.01,
    };
    const curve = curveMap[mood] ?? size * 0.04;
    p.moveTo(cx - halfW, mouthY);
    p.quadTo(cx, mouthY + curve * 2, cx + halfW, mouthY);
    return p;
  }, [mood, size, anchors, hideMouth]);

  const tonguePath = useMemo(() => {
    if (mood !== 'tongue' || hideMouth) return null;
    const p = Skia.Path.Make();
    const { cx, mouthY } = anchors;
    const w = size * 0.055;
    p.addOval({
      x: cx - w / 2,
      y: mouthY + size * 0.02,
      width: w,
      height: size * 0.07,
    });
    return p;
  }, [mood, size, anchors, hideMouth]);

  const sparklePath = useMemo(() => {
    if (mood !== 'bright' && mood !== 'celebrate') return null;
    const p = Skia.Path.Make();
    const { cx, cy } = anchors;
    const make = (x: number, y: number, s: number) => {
      p.moveTo(x, y - s);
      p.lineTo(x, y + s);
      p.moveTo(x - s, y);
      p.lineTo(x + s, y);
    };
    make(cx + size * 0.36, cy - size * 0.38, size * 0.05);
    make(cx - size * 0.38, cy - size * 0.28, size * 0.035);
    if (mood === 'celebrate') {
      make(cx + size * 0.42, cy - size * 0.1, size * 0.04);
      make(cx - size * 0.44, cy + size * 0.08, size * 0.04);
      make(cx - size * 0.12, cy - size * 0.52, size * 0.045);
    }
    return p;
  }, [mood, size, anchors]);

  const missedMark = useMemo(() => {
    if (mood !== 'missed') return null;
    const p = Skia.Path.Make();
    const { cx, cy } = anchors;
    const mx = cx + size * 0.4;
    const my = cy - size * 0.4;
    p.moveTo(mx - size * 0.04, my - size * 0.02);
    p.quadTo(mx, my - size * 0.08, mx + size * 0.04, my - size * 0.02);
    p.quadTo(mx + size * 0.04, my + size * 0.02, mx, my + size * 0.03);
    p.moveTo(mx, my + size * 0.055);
    p.lineTo(mx, my + size * 0.065);
    return p;
  }, [mood, size, anchors]);

  const cheeksData = useMemo(() => {
    const { cx, cy } = anchors;
    const base = size * 0.055;
    const r = mood === 'celebrate' || mood === 'bright' || mood === 'proud' ? base * 1.25 : base;
    return [
      { x: cx - size * 0.24, y: cy + size * 0.06, r },
      { x: cx + size * 0.22, y: cy + size * 0.06, r },
    ];
  }, [mood, size, anchors]);

  return (
    <Canvas style={{ width: size, height: size }} pointerEvents="none">
      <Group>
        {!hideCheeks ? (
          <>
            <Circle
              cx={cheeksData[0].x}
              cy={cheeksData[0].y}
              r={cheeksData[0].r}
              color={cheek}
              opacity={0.55}
            />
            <Circle
              cx={cheeksData[1].x}
              cy={cheeksData[1].y}
              r={cheeksData[1].r}
              color={cheek}
              opacity={0.55}
            />
          </>
        ) : null}
        {mouthPath ? (
          <Path
            path={mouthPath}
            style={mood === 'shocked' ? 'fill' : 'stroke'}
            strokeWidth={strokeW * 0.85}
            color={ink}
            strokeCap="round"
            strokeJoin="round"
          >
            {mood !== 'shocked' && (
              <DiscretePathEffect length={jitterLen * 0.7} deviation={jitterDev * 0.8} seed={31} />
            )}
          </Path>
        ) : null}
        {tonguePath ? <Path path={tonguePath} color="#e76f8a" opacity={0.95} /> : null}
        {tonguePath ? (
          <Path path={tonguePath} style="stroke" strokeWidth={strokeW * 0.7} color={ink}>
            <DiscretePathEffect length={jitterLen * 0.7} deviation={jitterDev * 0.8} seed={37} />
          </Path>
        ) : null}
        {sparklePath ? (
          <Path
            path={sparklePath}
            style="stroke"
            strokeWidth={strokeW * 0.75}
            color={ink}
            strokeCap="round"
            strokeJoin="round"
          >
            <DiscretePathEffect length={jitterLen * 0.6} deviation={jitterDev * 0.6} seed={41} />
          </Path>
        ) : null}
        {missedMark ? (
          <Path
            path={missedMark}
            style="stroke"
            strokeWidth={strokeW * 0.75}
            color={ink}
            strokeCap="round"
          >
            <DiscretePathEffect length={jitterLen * 0.6} deviation={jitterDev * 0.6} seed={43} />
          </Path>
        ) : null}
      </Group>
    </Canvas>
  );
}

type EyeProps = {
  size: number;
  mood: MascotMood;
  anchors: FaceAnchors;
  ink: string;
  jitterLen: number;
  jitterDev: number;
  /** scaleY shared value (1 = open, 0 = closed). Drives the blink. */
  blink: SharedValue<number>;
  /** Set true to hide the eye layer entirely (e.g. when sunglasses cover them). */
  hidden?: boolean;
};

export function EyeLayer({ size, mood, anchors, ink, jitterLen, jitterDev, blink, hidden }: EyeProps) {
  const strokeW = Math.max(2, size * 0.03);
  const eyeR = size * 0.055;
  const pupilR = size * 0.024;
  const { cx, eyeY, eyeOffset } = anchors;

  const isSleepy = mood === 'sleepy' || mood === 'proud';
  const isTired = mood === 'tired';
  const isAnnoyed = mood === 'annoyed';
  const isShocked = mood === 'shocked';
  const isWink = mood === 'wink';

  const lidStyle = useAnimatedStyle(() => ({
    transform: [{ scaleY: blink.value }],
  }));

  if (hidden) return null;

  return (
    <>
      {!isSleepy && (
        <Animated.View
          pointerEvents="none"
          style={[{ position: 'absolute', left: 0, top: 0, width: size, height: size }, lidStyle]}
        >
          <Canvas style={{ width: size, height: size }} pointerEvents="none">
            {!isWink && (
              <>
                <Circle cx={cx - eyeOffset} cy={eyeY} r={isShocked ? eyeR * 1.25 : eyeR} color="#ffffff" />
                <Circle
                  cx={cx - eyeOffset}
                  cy={eyeY}
                  r={isShocked ? eyeR * 1.25 : eyeR}
                  style="stroke"
                  strokeWidth={strokeW * 0.7}
                  color={ink}
                >
                  <DiscretePathEffect length={jitterLen * 0.55} deviation={jitterDev * 0.6} seed={51} />
                </Circle>
                <Circle
                  cx={cx - eyeOffset + (isTired ? -pupilR * 0.3 : isAnnoyed ? pupilR * 0.4 : 0)}
                  cy={eyeY + (isTired ? pupilR * 0.4 : isAnnoyed ? -pupilR * 0.6 : 0)}
                  r={isShocked ? pupilR * 1.1 : pupilR}
                  color={ink}
                />
              </>
            )}
            <Circle cx={cx + eyeOffset} cy={eyeY} r={isShocked ? eyeR * 1.25 : eyeR} color="#ffffff" />
            <Circle
              cx={cx + eyeOffset}
              cy={eyeY}
              r={isShocked ? eyeR * 1.25 : eyeR}
              style="stroke"
              strokeWidth={strokeW * 0.7}
              color={ink}
            >
              <DiscretePathEffect length={jitterLen * 0.55} deviation={jitterDev * 0.6} seed={53} />
            </Circle>
            <Circle
              cx={cx + eyeOffset + (isTired ? -pupilR * 0.3 : isAnnoyed ? -pupilR * 0.4 : 0)}
              cy={eyeY + (isTired ? pupilR * 0.4 : isAnnoyed ? -pupilR * 0.6 : 0)}
              r={isShocked ? pupilR * 1.1 : pupilR}
              color={ink}
            />
          </Canvas>
        </Animated.View>
      )}
      {isWink && (
        <View pointerEvents="none" style={{ position: 'absolute', left: 0, top: 0 }}>
          <Canvas style={{ width: size, height: size }} pointerEvents="none">
            <Path
              path={(() => {
                const p = Skia.Path.Make();
                p.moveTo(cx - eyeOffset - eyeR * 0.9, eyeY);
                p.quadTo(cx - eyeOffset, eyeY - eyeR * 0.6, cx - eyeOffset + eyeR * 0.9, eyeY);
                return p;
              })()}
              style="stroke"
              strokeWidth={strokeW * 0.85}
              color={ink}
              strokeCap="round"
            >
              <DiscretePathEffect length={jitterLen * 0.5} deviation={jitterDev * 0.5} seed={59} />
            </Path>
          </Canvas>
        </View>
      )}
      {isSleepy && (
        <View pointerEvents="none" style={{ position: 'absolute', left: 0, top: 0 }}>
          <Canvas style={{ width: size, height: size }} pointerEvents="none">
            <Path
              path={(() => {
                const p = Skia.Path.Make();
                const proud = mood === 'proud';
                const yOff = proud ? -eyeR * 0.6 : eyeR * 0.6;
                p.moveTo(cx - eyeOffset - eyeR * 0.8, eyeY);
                p.quadTo(cx - eyeOffset, eyeY + yOff, cx - eyeOffset + eyeR * 0.8, eyeY);
                p.moveTo(cx + eyeOffset - eyeR * 0.8, eyeY);
                p.quadTo(cx + eyeOffset, eyeY + yOff, cx + eyeOffset + eyeR * 0.8, eyeY);
                return p;
              })()}
              style="stroke"
              strokeWidth={strokeW * 0.85}
              color={ink}
              strokeCap="round"
            >
              <DiscretePathEffect length={jitterLen * 0.5} deviation={jitterDev * 0.5} seed={61} />
            </Path>
          </Canvas>
        </View>
      )}
    </>
  );
}
