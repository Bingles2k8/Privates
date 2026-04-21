import { useEffect, useState } from 'react';
import { View, Text } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
} from 'react-native-reanimated';
import { addDays, differenceInCalendarDays, format, parseISO } from 'date-fns';
import { useTheme } from '@/theme/useTheme';
import { Squiggle } from './Squiggle';

type Props = {
  cycleStart: string;
  cycleLength: number;
  periodLength?: number;
  fertileStart?: string;
  fertileEnd?: string;
  ovulation?: string;
  today?: Date;
};

const DOT = 28;
const LINE_Y = 30;

export function CycleTimeline({
  cycleStart,
  cycleLength,
  periodLength = 5,
  fertileStart,
  fertileEnd,
  ovulation,
  today = new Date(),
}: Props) {
  const { palette } = useTheme();
  const [width, setWidth] = useState(0);
  const start = parseISO(cycleStart);

  const totalSpan = Math.max(1, cycleLength - 1);
  const dayToFrac = (day: number) => Math.max(0, Math.min(1, (day - 1) / totalSpan));
  const dateToFrac = (d: Date) => dayToFrac(differenceInCalendarDays(d, start) + 1);

  const todayDay = differenceInCalendarDays(today, start) + 1;
  const todayFrac = dateToFrac(today);
  const periodFrac = dayToFrac(periodLength);
  const fStart = fertileStart ? dateToFrac(parseISO(fertileStart)) : null;
  const fEnd = fertileEnd ? dateToFrac(parseISO(fertileEnd)) : null;
  const ovFrac = ovulation ? dateToFrac(parseISO(ovulation)) : null;

  const draw = useSharedValue(0);

  useEffect(() => {
    draw.value = withTiming(1, { duration: 800 });
  }, [draw]);

  const periodWidthStyle = useAnimatedStyle(() => ({
    width: draw.value * periodFrac * width,
  }));
  const fertileWidthStyle = useAnimatedStyle(() => {
    if (fStart == null || fEnd == null) return { width: 0, left: 0 };
    const span = (fEnd - fStart) * width;
    return { width: draw.value * span, left: fStart * width };
  });
  if (width === 0) {
    return <View className="h-32" onLayout={(e) => setWidth(e.nativeEvent.layout.width)} />;
  }

  const todayLeft = todayFrac * width;
  const ovLeft = ovFrac != null ? ovFrac * width : null;

  return (
    <View onLayout={(e) => setWidth(e.nativeEvent.layout.width)}>
      <View style={{ height: LINE_Y * 2, position: 'relative' }}>
        <View
          className="absolute h-2 rounded-full bg-bg-soft"
          style={{ left: 0, right: 0, top: LINE_Y - 4 }}
        />
        <Animated.View
          className="absolute h-2 rounded-full"
          style={[
            fertileWidthStyle,
            { top: LINE_Y - 4, backgroundColor: palette.fertile + '70' },
          ]}
        />
        <Animated.View
          className="absolute h-2 rounded-full bg-period"
          style={[periodWidthStyle, { left: 0, top: LINE_Y - 4 }]}
        />
        {ovLeft != null && (
          <View
            style={{
              position: 'absolute',
              left: ovLeft - 7,
              top: LINE_Y - 7,
              width: 14,
              height: 14,
            }}
          >
            <View
              style={{
                width: 14,
                height: 14,
                borderRadius: 7,
                backgroundColor: palette.ovulation,
                borderWidth: 2,
                borderColor: palette.bgCard,
              }}
            />
          </View>
        )}
        <View
          style={{
            position: 'absolute',
            left: todayLeft - DOT / 2,
            top: LINE_Y - DOT / 2,
            width: DOT,
            height: DOT,
            alignItems: 'center',
            justifyContent: 'center',
          }}
          pointerEvents="none"
        >
          <View
            style={{
              width: DOT,
              height: DOT,
              borderRadius: DOT / 2,
              backgroundColor: palette.accent,
              borderWidth: 3,
              borderColor: palette.bgCard,
              alignItems: 'center',
              justifyContent: 'center',
              shadowColor: palette.accent,
              shadowOpacity: 0.5,
              shadowRadius: 6,
              shadowOffset: { width: 0, height: 2 },
            }}
          >
            <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: '#fff' }} />
          </View>
        </View>
      </View>

      <View className="mt-2" style={{ marginLeft: -4 }}>
        <Squiggle width={width + 8} color={palette.inkDim + '50'} amplitude={2} frequency={26} />
      </View>

      <View className="flex-row justify-between mt-1">
        <View>
          <Text className="text-ink-dim text-xs font-medium">day 1</Text>
          <Text className="text-ink-dim text-[10px]">{format(start, 'MMM d')}</Text>
        </View>
        <View className="items-center">
          <Text className="text-ink-dim text-xs font-medium">day {Math.round(cycleLength / 2)}</Text>
          <Text className="text-ink-dim text-[10px]">
            {format(addDays(start, Math.round(cycleLength / 2) - 1), 'MMM d')}
          </Text>
        </View>
        <View className="items-end">
          <Text className="text-ink-dim text-xs font-medium">day {cycleLength}</Text>
          <Text className="text-ink-dim text-[10px]">
            {format(addDays(start, cycleLength - 1), 'MMM d')}
          </Text>
        </View>
      </View>

      <View className="flex-row items-center gap-4 mt-4 flex-wrap">
        <LegendDot color={palette.accent} label="period" />
        {fertileStart && (
          <LegendDot color={palette.fertile + '90'} label="fertile" />
        )}
        {ovulation && <LegendDot color={palette.ovulation} label="ovulation" />}
        <LegendDot color={palette.accent} label={`today · day ${Math.max(1, todayDay)}`} ring />
      </View>
    </View>
  );
}

function LegendDot({ color, label, ring }: { color: string; label: string; ring?: boolean }) {
  const { palette } = useTheme();
  return (
    <View className="flex-row items-center gap-1.5">
      <View
        style={{
          width: 11,
          height: 11,
          borderRadius: 6,
          backgroundColor: color,
          borderWidth: ring ? 2 : 0,
          borderColor: palette.bgCard,
        }}
      />
      <Text className="text-ink-muted text-xs">{label}</Text>
    </View>
  );
}
