import { Pressable, Text, View } from 'react-native';
import Animated, { FadeInDown, FadeOut } from 'react-native-reanimated';
import { HandIcon } from './HandIcon';
import { useCustomize } from '@/state/customize';
import type { CustomizeScreen } from './customizeSections';
import { useTheme } from '@/theme/useTheme';

/**
 * Banner rendered at the top of Today / Insights while the user is in
 * reorder mode. Shows a short hint and a Done button that exits the mode.
 * Only renders when `reorderMode` matches the passed `screen`.
 */
export function ReorderBar({ screen }: { screen: CustomizeScreen }) {
  const active = useCustomize((s) => s.reorderMode === screen);
  const exit = useCustomize((s) => s.exitReorder);
  const { palette } = useTheme();
  if (!active) return null;
  return (
    <Animated.View
      entering={FadeInDown.duration(180)}
      exiting={FadeOut.duration(140)}
      className="rounded-2xl px-4 py-3 flex-row items-center gap-3"
      style={{
        backgroundColor: palette.accent + '1a',
        borderWidth: 1.5,
        borderColor: palette.accent,
        borderStyle: 'dashed',
      }}
    >
      <HandIcon name="move" size={16} color={palette.accent} />
      <View className="flex-1">
        <Text className="text-ink text-sm font-bold">Rearranging</Text>
        <Text className="text-ink-muted text-xs mt-0.5">
          Use the up / down arrows on each section.
        </Text>
      </View>
      <Pressable
        onPress={exit}
        hitSlop={10}
        className="rounded-full active:opacity-70"
        style={{
          backgroundColor: palette.accent,
          paddingHorizontal: 14,
          paddingVertical: 7,
        }}
      >
        <Text className="text-white text-sm font-bold">Done</Text>
      </Pressable>
    </Animated.View>
  );
}
