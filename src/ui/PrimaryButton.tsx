import { Pressable, type PressableProps, Text, View } from 'react-native';
import { type ReactNode } from 'react';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { useTheme } from '@/theme/useTheme';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

type Props = Omit<PressableProps, 'children'> & {
  label: string;
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
  icon?: ReactNode;
};

const VARIANT = {
  primary: 'bg-accent',
  secondary: 'bg-bg-soft',
  ghost: 'bg-transparent',
  danger: 'bg-red-700',
};

const TEXT_VARIANT = {
  primary: 'text-white',
  secondary: 'text-ink',
  ghost: 'text-accent',
  danger: 'text-white',
};

export function PrimaryButton({ label, variant = 'primary', icon, disabled, ...rest }: Props) {
  const { isDark, palette } = useTheme();
  const scale = useSharedValue(1);
  const animStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));
  const isSolid = variant === 'primary' || variant === 'danger' || variant === 'secondary';
  const wantsHardShadow = !isDark && isSolid;
  return (
    <AnimatedPressable
      disabled={disabled}
      onPressIn={() => {
        if (!disabled) scale.value = withTiming(0.96, { duration: 90 });
      }}
      onPressOut={() => {
        scale.value = withTiming(1, { duration: 160 });
      }}
      className={`rounded-3xl px-5 py-4 items-center justify-center ${VARIANT[variant]} ${disabled ? 'opacity-50' : ''}`}
      style={[
        animStyle,
        isSolid
          ? {
              borderWidth: 1.5,
              borderColor: isDark ? palette.bgSoft : palette.ink + '33',
            }
          : undefined,
        wantsHardShadow
          ? {
              shadowColor: palette.ink,
              shadowOpacity: 0.95,
              shadowRadius: 0,
              shadowOffset: { width: 3, height: 4 },
              elevation: 3,
            }
          : undefined,
      ]}
      {...rest}
    >
      <View className="flex-row items-center gap-2">
        {icon}
        <Text className={`text-base font-bold ${TEXT_VARIANT[variant]}`}>{label}</Text>
      </View>
    </AnimatedPressable>
  );
}
