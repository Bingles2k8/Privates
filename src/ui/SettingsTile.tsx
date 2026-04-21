import { Pressable, Text, View } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { HandIcon, type HandIconName } from './HandIcon';
import { useTheme } from '@/theme/useTheme';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

/**
 * Square tile used in the 2-col Settings grid. Designed to slot into a
 * `<View className="flex-row flex-wrap gap-3">` — each tile calculates its own
 * square-ish height via aspect ratio. Title stays on one or two lines, with a
 * short hint underneath.
 */
export function SettingsTile({
  icon,
  title,
  hint,
  onPress,
}: {
  icon: HandIconName;
  title: string;
  hint?: string;
  onPress: () => void;
}) {
  const { isDark, palette } = useTheme();
  const scale = useSharedValue(1);
  const animStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));

  return (
    <View style={{ width: '48%' }}>
      <AnimatedPressable
        onPress={onPress}
        onPressIn={() => {
          scale.value = withTiming(0.96, { duration: 90 });
        }}
        onPressOut={() => {
          scale.value = withTiming(1, { duration: 160 });
        }}
        className="bg-bg-card rounded-3xl p-4"
        style={[
          animStyle,
          {
            aspectRatio: 1,
            borderWidth: 1.5,
            borderColor: isDark ? palette.bgSoft : palette.ink + '22',
            shadowColor: isDark ? '#000000' : palette.ink,
            shadowOpacity: isDark ? 0.5 : 0.95,
            shadowRadius: isDark ? 10 : 0,
            shadowOffset: isDark ? { width: 0, height: 4 } : { width: 3, height: 5 },
            elevation: 4,
            justifyContent: 'space-between',
          },
        ]}
      >
        <View
          className="w-11 h-11 rounded-2xl items-center justify-center"
          style={{ backgroundColor: palette.accent + '20' }}
        >
          <HandIcon name={icon} size={20} color={palette.accent} />
        </View>
        <View>
          <Text
            className="text-ink text-base font-bold"
            numberOfLines={2}
            adjustsFontSizeToFit
            minimumFontScale={0.85}
          >
            {title}
          </Text>
          {hint && (
            <Text
              className="text-ink-muted text-xs mt-1 leading-4"
              numberOfLines={2}
            >
              {hint}
            </Text>
          )}
        </View>
      </AnimatedPressable>
    </View>
  );
}
