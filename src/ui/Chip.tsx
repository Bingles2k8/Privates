import { Pressable, Text } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { useTheme } from '@/theme/useTheme';

export function Chip({
  label,
  selected = false,
  onPress,
  tone = 'neutral',
}: {
  label: string;
  selected?: boolean;
  onPress?: () => void;
  tone?: 'neutral' | 'period' | 'fertile';
}) {
  const { palette, isDark } = useTheme();
  const scale = useSharedValue(1);
  const animStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));
  const base = selected
    ? tone === 'period'
      ? 'bg-period'
      : tone === 'fertile'
        ? 'bg-fertile'
        : 'bg-accent'
    : 'bg-bg-soft';
  const text = selected ? 'text-white font-bold' : 'text-ink font-medium';
  const borderColor = selected
    ? palette.ink
    : isDark
      ? palette.bgSoft
      : palette.ink + '18';
  return (
    <Pressable
      onPress={onPress}
      onPressIn={() => {
        scale.value = withTiming(0.94, { duration: 80 });
      }}
      onPressOut={() => {
        scale.value = withTiming(1, { duration: 140 });
      }}
    >
      <Animated.View
        className={`px-4 py-2 rounded-full ${base}`}
        style={[
          animStyle,
          {
            borderWidth: selected ? 1.5 : 1,
            borderColor,
            shadowColor: selected && !isDark ? palette.ink : 'transparent',
            shadowOpacity: selected && !isDark ? 0.9 : 0,
            shadowRadius: 0,
            shadowOffset: { width: 2, height: 2 },
            elevation: selected ? 2 : 0,
          },
        ]}
      >
        <Text className={`text-sm ${text}`}>{label}</Text>
      </Animated.View>
    </Pressable>
  );
}
