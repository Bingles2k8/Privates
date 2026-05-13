import { type ReactNode } from 'react';
import { Text, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { Character } from '@/cosmetics/Character';
import { type MascotReaction } from '@/ui/Mascot';
import { mascotContext, type MascotContextInput } from '@/ui/mascotContext';
import { useTheme } from '@/theme/useTheme';

type Props = {
  title: string;
  kicker?: string;
  titleNode?: ReactNode;
  context: MascotContextInput;
  size?: number;
  mascotRotate?: string;
  forcedReaction?: { key: number | string; reaction: MascotReaction };
};

export function MascotHeader({
  title,
  kicker,
  titleNode,
  context,
  size = 84,
  mascotRotate = '-3deg',
  forcedReaction,
}: Props) {
  const { mood, greeting } = mascotContext(context);
  const { palette } = useTheme();
  return (
    <Animated.View entering={FadeInDown.duration(400)} className="flex-row items-end gap-3">
      <View className="flex-1">
        {kicker && (
          <Text
            className="text-ink-muted text-base font-hand"
            // Caveat (font-hand) has tall descenders; without an explicit
            // lineHeight Android clips the g/y/j tails.
            style={{ transform: [{ rotate: '-1deg' }], lineHeight: 22 }}
          >
            {kicker}
          </Text>
        )}
        {titleNode ?? (
          <Text
            className="text-ink text-4xl font-display mt-0.5"
            // Fraunces has long descenders; without an explicit lineHeight
            // the default (= fontSize) clips the tails of g/y/j on Android.
            // Bumping to fontSize * 1.25 with a touch of bottom padding
            // gives the glyphs room without inflating the header.
            style={{ lineHeight: 44, paddingBottom: 4 }}
          >
            {title}
          </Text>
        )}
      </View>
      <View className="items-center" style={{ marginBottom: -4 }}>
        <Character
          key={palette.accent}
          mood={mood}
          size={size}
          rotate={mascotRotate}
          forcedReaction={forcedReaction}
        />
        {/*
          Wrapping View carries the z-stack and backdrop so the greeting
          stays on top of the character canvas — the canvas overflows its
          layout box (for hats, brims, etc.) and can otherwise spill onto
          this line and obscure the text. The pill hugs its text width
          (no fixed width, capped by maxWidth) and `items-center` on the
          parent keeps it horizontally centered under the character.
        */}
        <View
          style={{
            zIndex: 2,
            position: 'relative',
            marginTop: 4,
            backgroundColor: palette.bg,
            borderRadius: 8,
            paddingHorizontal: 6,
            paddingVertical: 1,
            transform: [{ rotate: '3deg' }],
            maxWidth: 140,
          }}
        >
          <Text
            className="text-ink-muted text-xs font-hand text-center"
            numberOfLines={3}
          >
            {greeting}
          </Text>
        </View>
      </View>
    </Animated.View>
  );
}
