import { Pressable, Text, View } from 'react-native';
import { useTheme } from '@/theme/useTheme';

const LABELS = ['', 'mild', 'mod', 'severe'] as const;

/**
 * Three-dot intensity selector. Value is 1 / 2 / 3; tapping the same dot
 * leaves it active (no zero). The chip that owns this component is the
 * "on/off" control — intensity only appears once the chip is selected.
 */
export function IntensityDots({
  value,
  onChange,
  showLabel = true,
}: {
  value: number;
  onChange: (v: number) => void;
  showLabel?: boolean;
}) {
  const { palette } = useTheme();
  return (
    <View className="flex-row items-center gap-3">
      <View className="flex-row gap-2">
        {[1, 2, 3].map((level) => {
          const active = level <= value;
          return (
            <Pressable
              key={level}
              onPress={() => onChange(level)}
              hitSlop={12}
              accessibilityLabel={`Intensity ${level}`}
              style={({ pressed }) => ({
                opacity: pressed ? 0.7 : 1,
                padding: 2,
              })}
            >
              <View
                style={{
                  width: 22,
                  height: 22,
                  borderRadius: 11,
                  backgroundColor: active ? palette.accent : 'transparent',
                  borderWidth: 2,
                  borderColor: active ? palette.accent : palette.ink + '40',
                }}
              />
            </Pressable>
          );
        })}
      </View>
      {showLabel && value >= 1 && value <= 3 && (
        <Text
          className="text-ink-muted text-sm font-hand"
          style={{ transform: [{ rotate: '-1deg' }], minWidth: 56 }}
        >
          {LABELS[value]}
        </Text>
      )}
    </View>
  );
}
