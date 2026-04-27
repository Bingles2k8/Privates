// The customizable character — replaces the original Mascot component.
// Composes: animations + character body art + face features + accessories
// in z-order. Reads the equipped outfit from the wardrobe store unless
// an outfit is passed in via props (useful for previews).
//
// Animation behaviour is preserved from Mascot.tsx — same bob, blink,
// wobble, squish, and tap reactions — so swapping it into MascotHeader
// looks visually identical for the OG mascot with no accessories.

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
import { Canvas, Group, Skia } from '@shopify/react-native-skia';
import { PencilStroke } from './art/pencil';
import type { MascotMood, MascotReaction } from '@/ui/Mascot';
import { useTheme } from '@/theme/useTheme';
import { useWardrobe } from '@/state/wardrobe';
import { faceAnchors, type ArtProps } from './art/types';
import { getArt, getCharacterPalette } from './art/registry';
import { DEFAULT_CHARACTER_ID, SLOT_Z_ORDER, type Outfit } from './types';
import { EyeLayer, FaceFeatures } from './FaceFeatures';

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

// Items that occlude default face features. When equipped, the matching
// face element is suppressed so the accessory becomes the focal point.
const HIDES_EYES = new Set(['glasses.sunglasses', 'glasses.aviators', 'glasses.goggles']);
const HIDES_CHEEKS = new Set(['makeup.blush']);
const HIDES_MOUTH = new Set(['makeup.lipstick']);

type Props = {
  /** Override the equipped outfit (preview / wardrobe screen). Defaults to wardrobe state. */
  outfit?: Outfit;
  mood?: MascotMood;
  size?: number;
  bob?: boolean;
  rotate?: string;
  reactionKey?: number | string;
  forcedReaction?: { key: number | string; reaction: MascotReaction };
  interactive?: boolean;
  onPress?: () => void;
};

export function Character({
  outfit: outfitOverride,
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
  const wardrobeOutfit = useWardrobe((s) => s.outfit);
  const outfit = outfitOverride ?? wardrobeOutfit;

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

  const ink = palette.ink + 'cc';
  const ghostInk = palette.ink + '55';
  const accentSkin = palette.accent;
  const defaultCheek = palette.ovulation;

  const charPalette = getCharacterPalette(outfit.character);
  const skin = charPalette.skin ?? accentSkin;
  const cheek = charPalette.cheek ?? defaultCheek;

  const anchors = useMemo(() => faceAnchors(size), [size]);

  const jitterLen = Math.max(1.8, size * 0.028);
  const jitterDev = Math.max(0.5, size * 0.008);

  const artProps: ArtProps = useMemo(
    () => ({ size, ink, ghostInk, jitterLen, jitterDev, anchors, skin, cheek }),
    [size, ink, ghostInk, jitterLen, jitterDev, anchors, skin, cheek],
  );

  // Pseudo-equip a small free party hat on the OG mascot's celebrate mood
  // when no hat is otherwise equipped. Pure flourish — never persisted.
  const showFreeMascotHat =
    outfit.character === DEFAULT_CHARACTER_ID &&
    effectiveMood === 'celebrate' &&
    !outfit.hat;

  const equippedHat = outfit.hat;
  const equippedGlasses = outfit.glasses;
  const equippedFacial = outfit.facialhair;
  const equippedMouth = outfit.mouth;
  const equippedNeck = outfit.neck;
  const equippedSticker = outfit.sticker;
  const equippedMakeup = outfit.makeup;

  const hidesEyes = equippedGlasses ? HIDES_EYES.has(equippedGlasses) : false;
  const hidesCheeks = equippedMakeup ? HIDES_CHEEKS.has(equippedMakeup) : false;
  const hidesMouth = equippedMakeup ? HIDES_MOUTH.has(equippedMakeup) : false;

  const characterArt = getArt(outfit.character) ?? getArt(DEFAULT_CHARACTER_ID);

  // Skia canvases clip strictly to their bounds, so tall hats / wide brims /
  // upper-corner stickers get cut off if drawn at a `size × size` canvas.
  // Render the body and accessory canvases on an enlarged surface and offset
  // them so the head still appears in the original `size × size` layout box.
  // FaceFeatures and EyeLayer don't need this — their content stays in box.
  const overdraw = Math.round(size * 0.22);
  const canvasSize = size + overdraw * 2;
  const overdrawTransform = [
    { translateX: overdraw },
    { translateY: overdraw },
  ];

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

  const characterCanvas = (
    <Animated.View
      style={[{ width: size, height: size, overflow: 'visible' }, floatStyle]}
    >
      {/* z=0 character body + z=1 makeup, both Skia. Canvas is enlarged and
          offset so character bodies that extend slightly past the layout
          box (e.g. sunflower petals) don't get clipped. */}
      <Canvas
        style={{
          width: canvasSize,
          height: canvasSize,
          position: 'absolute',
          left: -overdraw,
          top: -overdraw,
        }}
        pointerEvents="none"
      >
        <Group transform={overdrawTransform}>
          {characterArt ? characterArt(artProps) : null}
          {equippedMakeup ? renderArt(equippedMakeup, artProps) : null}
        </Group>
      </Canvas>

      {/* z=2 face features (cheeks, mouth — eyes drawn separately for blink) */}
      <View style={{ position: 'absolute', left: 0, top: 0 }} pointerEvents="none">
        <FaceFeatures
          size={size}
          mood={effectiveMood}
          anchors={anchors}
          ink={ink}
          ghostInk={ghostInk}
          cheek={cheek}
          jitterLen={jitterLen}
          jitterDev={jitterDev}
          hideCheeks={hidesCheeks}
          hideMouth={hidesMouth}
        />
      </View>

      {/* z=3 eye layer (separated so blink can transform it) */}
      <View style={{ position: 'absolute', left: 0, top: 0 }} pointerEvents="none">
        <EyeLayer
          size={size}
          mood={effectiveMood}
          anchors={anchors}
          ink={ink}
          jitterLen={jitterLen}
          jitterDev={jitterDev}
          blink={blink}
          hidden={hidesEyes}
        />
      </View>

      {/* z=4+ accessories layered over face. Same overdraw as the body
          canvas so tall hats, wide brims, and corner stickers can extend
          beyond the size × size layout box. */}
      <View
        style={{ position: 'absolute', left: -overdraw, top: -overdraw }}
        pointerEvents="none"
      >
        <Canvas style={{ width: canvasSize, height: canvasSize }} pointerEvents="none">
          <Group transform={overdrawTransform}>
            {equippedFacial ? renderArt(equippedFacial, artProps) : null}
            {equippedGlasses ? renderArt(equippedGlasses, artProps) : null}
            {equippedMouth ? renderArt(equippedMouth, artProps) : null}
            {equippedNeck ? renderArt(equippedNeck, artProps) : null}
            {equippedHat ? renderArt(equippedHat, artProps) : null}
            {showFreeMascotHat ? <FreeMascotPartyHat {...artProps} /> : null}
            {equippedSticker ? renderArt(equippedSticker, artProps) : null}
          </Group>
        </Canvas>
      </View>
    </Animated.View>
  );

  if (!interactive && !onPress) return characterCanvas;

  return (
    <Pressable
      onPress={handleTap}
      hitSlop={10}
      style={{ width: size, height: size }}
      accessibilityRole="button"
      accessibilityLabel="Tap the mascot"
    >
      {characterCanvas}
    </Pressable>
  );
}

// SLOT_Z_ORDER is the canonical render order; the manual sequencing above
// is identical so the constant just guards against drift in tests.
void SLOT_Z_ORDER;

function renderArt(itemId: string, props: ArtProps) {
  const Art = getArt(itemId);
  if (!Art) return null;
  return Art(props);
}

// Small celebratory party hat used only for the OG mascot in `celebrate`
// mood. Free, hardcoded, not in the wardrobe — a flourish on the
// animation rather than an owned item.
function FreeMascotPartyHat({ size, ink, ghostInk, jitterLen, jitterDev, anchors }: ArtProps) {
  const { cx, headTop } = anchors;
  const strokeW = Math.max(2, size * 0.028);
  const cone = Skia.Path.Make();
  cone.moveTo(cx - size * 0.12, headTop + size * 0.06);
  cone.lineTo(cx, headTop - size * 0.18);
  cone.lineTo(cx + size * 0.12, headTop + size * 0.06);
  cone.close();
  const pom = Skia.Path.Make();
  pom.addCircle(cx, headTop - size * 0.2, size * 0.025);
  return (
    <>
      <PencilStroke
        path={cone}
        ink={ink}
        ghostInk={ghostInk}
        strokeWidth={strokeW}
        jitterLen={jitterLen}
        jitterDev={jitterDev}
        seedMain={1101}
        seedGhost={1103}
        fill="#e84a7a"
      />
      <PencilStroke
        path={pom}
        ink={ink}
        ghostInk={ghostInk}
        strokeWidth={strokeW * 0.6}
        jitterLen={jitterLen * 0.5}
        jitterDev={jitterDev * 0.4}
        seedMain={1105}
        seedGhost={1107}
        fill="#fbfaf3"
      />
    </>
  );
}
