import { useEffect } from 'react';
import { Pressable, Text, View } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { MoodFace } from './MoodFace';
import { useTheme } from '@/theme/useTheme';

export const MOOD_LEVELS: { value: 1 | 2 | 3 | 4 | 5; label: string }[] = [
  { value: 1, label: 'Awful' },
  { value: 2, label: 'Bad' },
  { value: 3, label: 'Okay' },
  { value: 4, label: 'Good' },
  { value: 5, label: 'Great' },
];

const ROTATIONS = ['-3deg', '2deg', '-1deg', '3deg', '-2deg'];

function MoodDot({
  level,
  selected,
  onPress,
  rotate,
}: {
  level: (typeof MOOD_LEVELS)[number];
  selected: boolean;
  onPress: () => void;
  rotate: string;
}) {
  const { palette } = useTheme();
  const sel = useSharedValue(selected ? 1.15 : 1);
  const press = useSharedValue(1);

  useEffect(() => {
    sel.value = withTiming(selected ? 1.15 : 1, { duration: 200 });
  }, [selected, sel]);

  const animStyle = useAnimatedStyle(() => ({
    transform: [{ scale: sel.value * press.value }, { rotate }],
  }));

  const faceColor = selected ? '#fff' : palette.ink;

  return (
    <Pressable
      onPress={onPress}
      onPressIn={() => {
        press.value = withTiming(0.94, { duration: 90 });
      }}
      onPressOut={() => {
        press.value = withTiming(1, { duration: 160 });
      }}
      hitSlop={8}
      style={{ flex: 1, alignItems: 'center', paddingVertical: 4 }}
    >
      <Animated.View style={animStyle}>
        <View
          className={`w-12 h-12 rounded-full items-center justify-center border-2 ${
            selected ? 'bg-accent border-accent' : 'bg-bg-soft border-transparent'
          }`}
          style={
            selected
              ? {
                  shadowColor: palette.accent,
                  shadowOpacity: 0.4,
                  shadowRadius: 8,
                  shadowOffset: { width: 0, height: 3 },
                  elevation: 3,
                }
              : undefined
          }
        >
          <MoodFace value={level.value} size={28} color={faceColor} />
        </View>
      </Animated.View>
    </Pressable>
  );
}

export function MoodScale({
  value,
  onChange,
}: {
  value: number | null;
  onChange: (next: number | null) => void;
}) {
  return (
    <View>
      <View className="flex-row items-center justify-between">
        {MOOD_LEVELS.map((m, i) => (
          <MoodDot
            key={m.value}
            level={m}
            selected={value === m.value}
            onPress={() => onChange(value === m.value ? null : m.value)}
            rotate={ROTATIONS[i]}
          />
        ))}
      </View>
      {value != null && (
        <Text className="text-ink text-center mt-3 text-2xl font-hand">
          feeling {MOOD_LEVELS[value - 1].label.toLowerCase()}
        </Text>
      )}
    </View>
  );
}
