import { View, Text, Pressable, type PressableProps } from 'react-native';
import { type ReactNode } from 'react';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { useTheme } from '@/theme/useTheme';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

type CardProps = { children: ReactNode; className?: string; tone?: 'default' | 'accent' | 'soft' };

function cardTone(tone: CardProps['tone']) {
  if (tone === 'accent') return 'bg-accent';
  if (tone === 'soft') return 'bg-bg-soft';
  return 'bg-bg-card';
}

export function Card({ children, className = '', tone = 'default' }: CardProps) {
  const { isDark, palette } = useTheme();
  return (
    <View
      className={`${cardTone(tone)} rounded-3xl p-5 ${className}`}
      style={{
        borderWidth: 1.5,
        borderColor: isDark ? palette.bgSoft : palette.ink + '22',
        shadowColor: isDark ? '#000000' : palette.ink,
        shadowOpacity: isDark ? 0.5 : 0.95,
        shadowRadius: isDark ? 10 : 0,
        shadowOffset: isDark ? { width: 0, height: 4 } : { width: 3, height: 5 },
        elevation: 4,
      }}
    >
      {children}
    </View>
  );
}

type PressableCardProps = Omit<PressableProps, 'children'> & {
  children: ReactNode;
  className?: string;
  tone?: CardProps['tone'];
};

export function PressableCard({
  children,
  className = '',
  tone = 'default',
  ...rest
}: PressableCardProps) {
  const { isDark, palette } = useTheme();
  const scale = useSharedValue(1);
  const animStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));
  return (
    <AnimatedPressable
      onPressIn={() => {
        scale.value = withTiming(0.97, { duration: 90 });
      }}
      onPressOut={() => {
        scale.value = withTiming(1, { duration: 160 });
      }}
      className={`${cardTone(tone)} rounded-3xl p-5 ${className}`}
      style={[
        animStyle,
        {
          borderWidth: 1.5,
          borderColor: isDark ? palette.bgSoft : palette.ink + '22',
          shadowColor: isDark ? '#000000' : palette.ink,
          shadowOpacity: isDark ? 0.5 : 0.95,
          shadowRadius: isDark ? 10 : 0,
          shadowOffset: isDark ? { width: 0, height: 4 } : { width: 3, height: 5 },
          elevation: 4,
        },
      ]}
      {...rest}
    >
      {children}
    </AnimatedPressable>
  );
}

export function CardTitle({ children, icon }: { children: ReactNode; icon?: ReactNode }) {
  return (
    <View className="flex-row items-center gap-2 mb-3">
      {icon}
      <Text
        className="text-ink-muted text-lg font-hand flex-1"
        style={{ transform: [{ rotate: '-0.5deg' }] }}
        numberOfLines={1}
        adjustsFontSizeToFit
        minimumFontScale={0.7}
      >
        {children}
      </Text>
    </View>
  );
}

export function SectionTitle({
  title,
  subtitle,
  right,
}: {
  title: string;
  subtitle?: string;
  right?: ReactNode;
}) {
  return (
    <View className="flex-row items-end justify-between mb-1">
      <View className="flex-1">
        <Text className="text-ink text-3xl font-display">{title}</Text>
        {subtitle && <Text className="text-ink-muted text-sm mt-0.5">{subtitle}</Text>}
      </View>
      {right}
    </View>
  );
}
