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
            style={{ transform: [{ rotate: '-1deg' }] }}
          >
            {kicker}
          </Text>
        )}
        {titleNode ?? <Text className="text-ink text-4xl font-display mt-0.5">{title}</Text>}
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
          this line and obscure the text.
        */}
        <View
          style={{
            zIndex: 2,
            position: 'relative',
            marginTop: 4,
            backgroundColor: palette.bg,
            borderRadius: 8,
            paddingHorizontal: 4,
            paddingVertical: 1,
            transform: [{ rotate: '3deg' }],
            maxWidth: 130,
          }}
        >
          <Text
            className="text-ink-muted text-xs font-hand text-right"
            numberOfLines={2}
          >
            {greeting}
          </Text>
        </View>
      </View>
    </Animated.View>
  );
}
