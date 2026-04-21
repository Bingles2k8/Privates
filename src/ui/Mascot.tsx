import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Pressable, View } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
  withSpring,
  Easing,
} from 'react-native-reanimated';
import { Canvas, Path, Skia, Circle, Group, DiscretePathEffect } from '@shopify/react-native-skia';
import { useTheme } from '@/theme/useTheme';

export type MascotMood =
  | 'calm'
  | 'sleepy'
  | 'tired'
  | 'bright'
  | 'wink'
  | 'squish'
  | 'annoyed'
  | 'shocked'
  | 'tongue'
  | 'proud'
  | 'celebrate'
  | 'missed';

export type MascotReaction =
  | 'wiggle'
  | 'wink'
  | 'squish'
  | 'annoyed'
  | 'shocked'
  | 'tongue'
  | 'celebrate';

const TAP_REACTIONS: MascotReaction[] = [
  'wiggle',
  'wink',
  'squish',
  'annoyed',
  'shocked',
  'tongue',
  'celebrate',
];

const REACTION_TO_MOOD: Partial<Record<MascotReaction, MascotMood>> = {
  wink: 'wink',
  annoyed: 'annoyed',
  shocked: 'shocked',
  tongue: 'tongue',
  celebrate: 'celebrate',
  squish: 'squish',
};

type Props = {
  mood?: MascotMood;
  size?: number;
  bob?: boolean;
  rotate?: string;
  /** When this value changes, fire a random reaction. */
  reactionKey?: number | string;
  /** When this value changes, fire this specific reaction. */
  forcedReaction?: { key: number | string; reaction: MascotReaction };
  /** If true, tapping triggers a random reaction. Defaults to true. */
  interactive?: boolean;
  onPress?: () => void;
};

export function Mascot({
  mood = 'calm',
  size = 120,
  bob = false,
  rotate = '-3deg',
  reactionKey,
  forcedReaction,
  interactive = true,
  onPress,
}: Props) {
  const { palette } = useTheme();
  const y = useSharedValue(0);
  const blink = useSharedValue(1);
  const wobble = useSharedValue(0);
  const squish = useSharedValue(1);
  const press = useSharedValue(1);

  const [activeReaction, setActiveReaction] = useState<MascotReaction | null>(null);
  const clearRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const runReaction = useCallback(
    (reaction: MascotReaction) => {
      if (clearRef.current) clearTimeout(clearRef.current);
      setActiveReaction(reaction);
      const snap = Easing.steps(1);
      if (reaction === 'wiggle') {
        wobble.value = withSequence(
          withTiming(-0.12, { duration: 120, easing: snap }),
          withTiming(0.14, { duration: 120, easing: snap }),
          withTiming(-0.1, { duration: 120, easing: snap }),
          withTiming(0.08, { duration: 120, easing: snap }),
          withTiming(0, { duration: 120, easing: snap }),
        );
      } else if (reaction === 'squish') {
        squish.value = withSequence(
          withTiming(0.85, { duration: 120, easing: snap }),
          withTiming(0.78, { duration: 120, easing: snap }),
          withTiming(0.9, { duration: 120, easing: snap }),
          withTiming(1, { duration: 120, easing: snap }),
        );
      } else if (reaction === 'celebrate') {
        y.value = withSequence(
          withTiming(-6, { duration: 120, easing: snap }),
          withTiming(-12, { duration: 120, easing: snap }),
          withTiming(-14, { duration: 160, easing: snap }),
          withTiming(-8, { duration: 120, easing: snap }),
          withTiming(-2, { duration: 120, easing: snap }),
          withTiming(0, { duration: 120, easing: snap }),
        );
      } else if (reaction === 'shocked') {
        squish.value = withSequence(
          withTiming(1.08, { duration: 140, easing: snap }),
          withTiming(1.08, { duration: 220, easing: snap }),
          withTiming(1, { duration: 140, easing: snap }),
        );
      }
      clearRef.current = setTimeout(() => {
        setActiveReaction(null);
        clearRef.current = null;
      }, 1200);
    },
    [wobble, squish, y],
  );

  useEffect(() => {
    if (reactionKey === undefined) return;
    const r = TAP_REACTIONS[Math.floor(Math.random() * TAP_REACTIONS.length)];
    runReaction(r);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reactionKey]);

  useEffect(() => {
    if (!forcedReaction) return;
    runReaction(forcedReaction.reaction);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [forcedReaction?.key]);

  useEffect(() => {
    return () => {
      if (clearRef.current) clearTimeout(clearRef.current);
    };
  }, []);

  useEffect(() => {
    const snap = Easing.steps(1);
    if (bob) {
      // Stop-motion "on 2s": ~100ms per frame.
      y.value = withRepeat(
        withSequence(
          withTiming(-1, { duration: 110, easing: snap }),
          withTiming(-3, { duration: 110, easing: snap }),
          withTiming(-4, { duration: 140, easing: snap }),
          withTiming(-3, { duration: 110, easing: snap }),
          withTiming(-1, { duration: 110, easing: snap }),
          withTiming(0, { duration: 140, easing: snap }),
        ),
        -1,
        false,
      );
    }
    blink.value = withRepeat(
      withSequence(
        withTiming(1, { duration: 2800, easing: snap }),
        withTiming(0.08, { duration: 90, easing: snap }),
        withTiming(1, { duration: 100, easing: snap }),
      ),
      -1,
      false,
    );
  }, [bob, y, blink]);

  const effectiveMood: MascotMood =
    activeReaction && REACTION_TO_MOOD[activeReaction]
      ? (REACTION_TO_MOOD[activeReaction] as MascotMood)
      : mood;

  const floatStyle = useAnimatedStyle(() => {
    const baseRotateMatch = rotate.match(/(-?\d+(?:\.\d+)?)/);
    const baseRotateDeg = baseRotateMatch ? parseFloat(baseRotateMatch[1]) : 0;
    const rotateRad = (baseRotateDeg * Math.PI) / 180 + wobble.value;
    return {
      transform: [
        { translateY: y.value },
        { rotate: `${rotateRad}rad` },
        { scale: press.value },
        { scaleY: squish.value },
        { scaleX: 1 + (1 - squish.value) * 0.5 },
      ],
    };
  });

  // Pencil-style outline: warm grey-brown at ~80% alpha instead of pure ink.
  const pencilMain = palette.ink + 'cc';
  const pencilGhost = palette.ink + '55';
  const ink = pencilMain;
  const skin = palette.accent;
  const cheek = palette.ovulation;

  const bodyPath = useMemo(() => {
    const p = Skia.Path.Make();
    const cx = size / 2;
    const cy = size / 2 + size * 0.04;
    const w = size * 0.78;
    const h = size * 0.72;
    p.moveTo(cx - w * 0.05, cy - h * 0.52);
    p.cubicTo(
      cx + w * 0.48,
      cy - h * 0.56,
      cx + w * 0.56,
      cy + h * 0.1,
      cx + w * 0.34,
      cy + h * 0.48,
    );
    p.cubicTo(
      cx + w * 0.15,
      cy + h * 0.58,
      cx - w * 0.2,
      cy + h * 0.6,
      cx - w * 0.38,
      cy + h * 0.42,
    );
    p.cubicTo(
      cx - w * 0.58,
      cy + h * 0.15,
      cx - w * 0.52,
      cy - h * 0.5,
      cx - w * 0.05,
      cy - h * 0.52,
    );
    p.close();
    return p;
  }, [size]);

  const earsPath = useMemo(() => {
    const p = Skia.Path.Make();
    const cx = size / 2;
    const cy = size / 2 + size * 0.04;
    const h = size * 0.72;
    p.moveTo(cx - size * 0.24, cy - h * 0.46);
    p.quadTo(cx - size * 0.3, cy - h * 0.72, cx - size * 0.16, cy - h * 0.58);
    p.close();
    p.moveTo(cx + size * 0.14, cy - h * 0.6);
    p.quadTo(cx + size * 0.28, cy - h * 0.72, cx + size * 0.26, cy - h * 0.46);
    p.close();
    return p;
  }, [size]);

  const mouthPath = useMemo(() => {
    const p = Skia.Path.Make();
    const cx = size / 2;
    const cy = size / 2 + size * 0.04;
    const mouthY = cy + size * 0.12;

    if (effectiveMood === 'shocked') {
      // small 'o' mouth
      const r = size * 0.045;
      p.addCircle(cx, mouthY + size * 0.01, r);
      return p;
    }
    if (effectiveMood === 'tongue') {
      // small smile with tongue hanging out
      const halfW = size * 0.08;
      p.moveTo(cx - halfW, mouthY);
      p.quadTo(cx, mouthY + size * 0.08, cx + halfW, mouthY);
      return p;
    }
    if (effectiveMood === 'proud' || effectiveMood === 'celebrate') {
      const halfW = size * 0.11;
      p.moveTo(cx - halfW, mouthY - size * 0.01);
      p.quadTo(cx, mouthY + size * 0.16, cx + halfW, mouthY - size * 0.01);
      return p;
    }
    if (effectiveMood === 'annoyed') {
      // flat line, tilted slightly
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
    const curve = curveMap[effectiveMood] ?? size * 0.04;
    p.moveTo(cx - halfW, mouthY);
    p.quadTo(cx, mouthY + curve * 2, cx + halfW, mouthY);
    return p;
  }, [effectiveMood, size]);

  const tonguePath = useMemo(() => {
    if (effectiveMood !== 'tongue') return null;
    const p = Skia.Path.Make();
    const cx = size / 2;
    const cy = size / 2 + size * 0.04;
    const mouthY = cy + size * 0.12;
    const w = size * 0.055;
    p.addOval({
      x: cx - w / 2,
      y: mouthY + size * 0.02,
      width: w,
      height: size * 0.07,
    });
    return p;
  }, [effectiveMood, size]);

  const cheeksData = useMemo(() => {
    const cx = size / 2;
    const cy = size / 2 + size * 0.04;
    const base = size * 0.055;
    const r =
      effectiveMood === 'celebrate' || effectiveMood === 'bright' || effectiveMood === 'proud'
        ? base * 1.25
        : base;
    return [
      { x: cx - size * 0.24, y: cy + size * 0.06, r },
      { x: cx + size * 0.22, y: cy + size * 0.06, r },
    ];
  }, [effectiveMood, size]);

  const eyesData = useMemo(() => {
    const cx = size / 2;
    const cy = size / 2 + size * 0.04;
    const eyeY = cy - size * 0.06;
    const offset = size * 0.15;
    return { cx, cy, eyeY, offset };
  }, [size]);

  const lidStyle = useAnimatedStyle(() => ({
    transform: [{ scaleY: blink.value }],
  }));

  const sparklePath = useMemo(() => {
    if (effectiveMood !== 'bright' && effectiveMood !== 'celebrate') return null;
    const p = Skia.Path.Make();
    const cx = size / 2;
    const cy = size / 2 + size * 0.04;
    const makeSparkle = (x: number, y: number, s: number) => {
      p.moveTo(x, y - s);
      p.lineTo(x, y + s);
      p.moveTo(x - s, y);
      p.lineTo(x + s, y);
    };
    makeSparkle(cx + size * 0.36, cy - size * 0.38, size * 0.05);
    makeSparkle(cx - size * 0.38, cy - size * 0.28, size * 0.035);
    if (effectiveMood === 'celebrate') {
      makeSparkle(cx + size * 0.42, cy - size * 0.1, size * 0.04);
      makeSparkle(cx - size * 0.44, cy + size * 0.08, size * 0.04);
      makeSparkle(cx - size * 0.12, cy - size * 0.52, size * 0.045);
    }
    return p;
  }, [effectiveMood, size]);

  const missedMark = useMemo(() => {
    if (effectiveMood !== 'missed') return null;
    const p = Skia.Path.Make();
    const cx = size / 2;
    const cy = size / 2 + size * 0.04;
    const mx = cx + size * 0.4;
    const my = cy - size * 0.4;
    p.moveTo(mx - size * 0.04, my - size * 0.02);
    p.quadTo(mx, my - size * 0.08, mx + size * 0.04, my - size * 0.02);
    p.quadTo(mx + size * 0.04, my + size * 0.02, mx, my + size * 0.03);
    p.moveTo(mx, my + size * 0.055);
    p.lineTo(mx, my + size * 0.065);
    return p;
  }, [effectiveMood, size]);

  const strokeW = Math.max(2, size * 0.03);
  const eyeR = size * 0.055;
  const pupilR = size * 0.024;
  // Pencil jitter: shorter segments = more wobble, deviation = perpendicular wiggle.
  const jitterLen = Math.max(1.8, size * 0.028);
  const jitterDev = Math.max(0.5, size * 0.008);

  const isSleepy = effectiveMood === 'sleepy' || effectiveMood === 'proud';
  const isTired = effectiveMood === 'tired';
  const isAnnoyed = effectiveMood === 'annoyed';
  const isShocked = effectiveMood === 'shocked';
  const isWink = effectiveMood === 'wink';

  const handleTap = useCallback(() => {
    if (onPress) onPress();
    if (!interactive) return;
    const r = TAP_REACTIONS[Math.floor(Math.random() * TAP_REACTIONS.length)];
    runReaction(r);
    press.value = withSequence(
      withTiming(0.92, { duration: 80 }),
      withSpring(1, { damping: 5, stiffness: 220 }),
    );
  }, [interactive, onPress, press, runReaction]);

  const mascotCanvas = (
    <Animated.View style={[{ width: size, height: size }, floatStyle]}>
      <Canvas style={{ width: size, height: size }} pointerEvents="none">
        <Group>
          <Path path={bodyPath} color={skin} opacity={0.9} />
          <Path path={earsPath} color={skin} opacity={0.9} />
          {/* Scratchy pencil — two jittered passes with different seeds. */}
          <Path
            path={bodyPath}
            style="stroke"
            strokeWidth={strokeW}
            color={ink}
            strokeJoin="round"
            strokeCap="round"
          >
            <DiscretePathEffect length={jitterLen} deviation={jitterDev} seed={11} />
          </Path>
          <Path
            path={bodyPath}
            style="stroke"
            strokeWidth={strokeW * 0.7}
            color={pencilGhost}
            strokeJoin="round"
            strokeCap="round"
          >
            <DiscretePathEffect length={jitterLen * 0.8} deviation={jitterDev * 1.3} seed={27} />
          </Path>
          <Path
            path={earsPath}
            style="stroke"
            strokeWidth={strokeW}
            color={ink}
            strokeJoin="round"
            strokeCap="round"
          >
            <DiscretePathEffect length={jitterLen} deviation={jitterDev} seed={13} />
          </Path>
          <Path
            path={earsPath}
            style="stroke"
            strokeWidth={strokeW * 0.7}
            color={pencilGhost}
            strokeJoin="round"
            strokeCap="round"
          >
            <DiscretePathEffect length={jitterLen * 0.8} deviation={jitterDev * 1.3} seed={29} />
          </Path>
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
          <Path
            path={mouthPath}
            style={effectiveMood === 'shocked' ? 'fill' : 'stroke'}
            strokeWidth={strokeW * 0.85}
            color={ink}
            strokeCap="round"
            strokeJoin="round"
          >
            {effectiveMood !== 'shocked' && (
              <DiscretePathEffect length={jitterLen * 0.7} deviation={jitterDev * 0.8} seed={31} />
            )}
          </Path>
          {tonguePath && <Path path={tonguePath} color="#e76f8a" opacity={0.95} />}
          {tonguePath && (
            <Path path={tonguePath} style="stroke" strokeWidth={strokeW * 0.7} color={ink}>
              <DiscretePathEffect length={jitterLen * 0.7} deviation={jitterDev * 0.8} seed={37} />
            </Path>
          )}
          {sparklePath && (
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
          )}
          {missedMark && (
            <Path
              path={missedMark}
              style="stroke"
              strokeWidth={strokeW * 0.75}
              color={ink}
              strokeCap="round"
            >
              <DiscretePathEffect length={jitterLen * 0.6} deviation={jitterDev * 0.6} seed={43} />
            </Path>
          )}
        </Group>
      </Canvas>

      {!isSleepy && (
        <Animated.View
          pointerEvents="none"
          style={[
            {
              position: 'absolute',
              left: 0,
              top: 0,
              width: size,
              height: size,
            },
            lidStyle,
          ]}
        >
          <Canvas style={{ width: size, height: size }} pointerEvents="none">
            {/* left eye */}
            {!(isWink) && (
              <>
                <Circle
                  cx={eyesData.cx - eyesData.offset}
                  cy={eyesData.eyeY}
                  r={isShocked ? eyeR * 1.25 : eyeR}
                  color="#ffffff"
                />
                <Circle
                  cx={eyesData.cx - eyesData.offset}
                  cy={eyesData.eyeY}
                  r={isShocked ? eyeR * 1.25 : eyeR}
                  style="stroke"
                  strokeWidth={strokeW * 0.7}
                  color={ink}
                >
                  <DiscretePathEffect length={jitterLen * 0.55} deviation={jitterDev * 0.6} seed={51} />
                </Circle>
                <Circle
                  cx={
                    eyesData.cx -
                    eyesData.offset +
                    (isTired ? -pupilR * 0.3 : isAnnoyed ? pupilR * 0.4 : 0)
                  }
                  cy={
                    eyesData.eyeY +
                    (isTired ? pupilR * 0.4 : isAnnoyed ? -pupilR * 0.6 : 0)
                  }
                  r={isShocked ? pupilR * 1.1 : pupilR}
                  color={ink}
                />
              </>
            )}
            {/* right eye */}
            <Circle
              cx={eyesData.cx + eyesData.offset}
              cy={eyesData.eyeY}
              r={isShocked ? eyeR * 1.25 : eyeR}
              color="#ffffff"
            />
            <Circle
              cx={eyesData.cx + eyesData.offset}
              cy={eyesData.eyeY}
              r={isShocked ? eyeR * 1.25 : eyeR}
              style="stroke"
              strokeWidth={strokeW * 0.7}
              color={ink}
            >
              <DiscretePathEffect length={jitterLen * 0.55} deviation={jitterDev * 0.6} seed={53} />
            </Circle>
            <Circle
              cx={
                eyesData.cx +
                eyesData.offset +
                (isTired ? -pupilR * 0.3 : isAnnoyed ? -pupilR * 0.4 : 0)
              }
              cy={
                eyesData.eyeY +
                (isTired ? pupilR * 0.4 : isAnnoyed ? -pupilR * 0.6 : 0)
              }
              r={isShocked ? pupilR * 1.1 : pupilR}
              color={ink}
            />
          </Canvas>
        </Animated.View>
      )}

      {/* winking left eye curve */}
      {isWink && (
        <View pointerEvents="none" style={{ position: 'absolute', left: 0, top: 0 }}>
          <Canvas style={{ width: size, height: size }} pointerEvents="none">
            <Path
              path={(() => {
                const p = Skia.Path.Make();
                p.moveTo(eyesData.cx - eyesData.offset - eyeR * 0.9, eyesData.eyeY);
                p.quadTo(
                  eyesData.cx - eyesData.offset,
                  eyesData.eyeY - eyeR * 0.6,
                  eyesData.cx - eyesData.offset + eyeR * 0.9,
                  eyesData.eyeY,
                );
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

      {/* sleepy / proud closed-eye curves */}
      {isSleepy && (
        <View pointerEvents="none" style={{ position: 'absolute', left: 0, top: 0 }}>
          <Canvas style={{ width: size, height: size }} pointerEvents="none">
            <Path
              path={(() => {
                const p = Skia.Path.Make();
                const proud = effectiveMood === 'proud';
                const yOff = proud ? -eyeR * 0.6 : eyeR * 0.6;
                p.moveTo(eyesData.cx - eyesData.offset - eyeR * 0.8, eyesData.eyeY);
                p.quadTo(
                  eyesData.cx - eyesData.offset,
                  eyesData.eyeY + yOff,
                  eyesData.cx - eyesData.offset + eyeR * 0.8,
                  eyesData.eyeY,
                );
                p.moveTo(eyesData.cx + eyesData.offset - eyeR * 0.8, eyesData.eyeY);
                p.quadTo(
                  eyesData.cx + eyesData.offset,
                  eyesData.eyeY + yOff,
                  eyesData.cx + eyesData.offset + eyeR * 0.8,
                  eyesData.eyeY,
                );
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
    </Animated.View>
  );

  if (!interactive && !onPress) return mascotCanvas;

  return (
    <Pressable
      onPress={handleTap}
      hitSlop={10}
      style={{ width: size, height: size }}
      accessibilityRole="button"
      accessibilityLabel="Tap the mascot"
    >
      {mascotCanvas}
    </Pressable>
  );
}
