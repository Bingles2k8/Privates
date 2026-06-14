import { useEffect, useState } from 'react';
import { View, Text } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
} from 'react-native-reanimated';
import { differenceInCalendarDays, parseISO } from 'date-fns';
import { useTheme } from '@/theme/useTheme';

type Props = {
  cycleStart: string;
  cycleLength: number;
  periodLength?: number;
  fertileStart?: string;
  fertileEnd?: string;
  ovulation?: string;
  today?: Date;
};

// A single chronological line, read left -> right from day 1. The bleed week sits
// at the START (full accent), the rest of the cycle is one flat track in a muted
// tint of the same accent, ovulation is a violet landmark near the middle, and a
// "today" pin marks where the user is. Week ticks run along the bottom.
const EDGE = 12; // horizontal inset so end-caps/labels never touch the card edge
const LINE_TOP = 28; // y of the line layer within the geometry block
const LINE_CY = 11; // vertical centre inside the line layer
const TRACK_H = 12;
const BLEED_H = 20;
const OV_R = 11;
const GEO_H = 84; // total height: caret + line + ticks below

/** Mix two #rrggbb hex colours. t=0 -> a, t=1 -> b. */
function mixHex(a: string, b: string, t: number): string {
  const pa = parseInt(a.slice(1), 16);
  const pb = parseInt(b.slice(1), 16);
  const r = Math.round(((pa >> 16) & 255) + (((pb >> 16) & 255) - ((pa >> 16) & 255)) * t);
  const g = Math.round(((pa >> 8) & 255) + (((pb >> 8) & 255) - ((pa >> 8) & 255)) * t);
  const bl = Math.round((pa & 255) + ((pb & 255) - (pa & 255)) * t);
  return `#${((1 << 24) + (r << 16) + (g << 8) + bl).toString(16).slice(1)}`;
}

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

  const len = Math.max(14, cycleLength);
  const period = Math.max(1, Math.min(len - 1, periodLength));

  // Where is "today" in the cycle (1..len)?
  const rawDay = differenceInCalendarDays(today, start) + 1;
  const todayDay = Math.max(1, Math.min(len, rawDay));

  // Ovulation day-number: use the prediction when we have it, else the midpoint.
  const ovDay = ovulation
    ? Math.max(period + 1, Math.min(len - 1, differenceInCalendarDays(parseISO(ovulation), start) + 1))
    : Math.round(len / 2);

  const draw = useSharedValue(0);
  useEffect(() => {
    draw.value = withTiming(1, { duration: 700 });
  }, [draw]);

  const pinStyle = useAnimatedStyle(() => ({
    opacity: draw.value,
    transform: [{ translateY: (1 - draw.value) * -6 }],
  }));

  if (width === 0) {
    return <View style={{ height: GEO_H }} onLayout={(e) => setWidth(e.nativeEvent.layout.width)} />;
  }

  const x0 = EDGE;
  const x1 = width - EDGE;
  const span = x1 - x0;
  // Map a cycle day (1..len) to an x position along the line.
  const dx = (d: number) => x0 + (span * (Math.max(1, Math.min(len, d)) - 1)) / (len - 1);
  const clampX = (x: number, halfW: number) =>
    Math.max(halfW, Math.min(width - halfW, x));

  // Colours: bleed = full accent, rest of cycle = a muted tint of the same accent,
  // ovulation = the one distinct landmark.
  const bleedColor = palette.accent;
  const trackColor = mixHex(palette.accent, palette.bgSoft, 0.72);
  const ovColor = palette.ovulation;

  // Bleed block covers days 1..period; extend to the midpoint of the day after.
  const bleedEnd = Math.max(x0 + 44, dx(period + 0.5));
  const ovX = dx(ovDay);
  const todayX = dx(todayDay);

  // Week ticks: day 1, every 7 days, then the final day.
  const ticks: number[] = [1];
  for (let w = 7; w < len - 2; w += 7) ticks.push(w);
  ticks.push(len);

  return (
    <View onLayout={(e) => setWidth(e.nativeEvent.layout.width)}>
      <View style={{ height: GEO_H, position: 'relative' }}>
        {/* phase labels just above the line */}
        <Text
          className="text-[10px] font-bold"
          style={{ position: 'absolute', left: x0, top: LINE_TOP - 18, color: bleedColor }}
        >
          period
        </Text>
        <Text
          className="text-[10px] font-bold"
          style={{
            position: 'absolute',
            left: clampX(ovX, 32) - 32,
            top: LINE_TOP - 18,
            width: 64,
            textAlign: 'center',
            color: ovColor,
          }}
        >
          ovulation
        </Text>

        {/* the line layer */}
        <View style={{ position: 'absolute', left: 0, right: 0, top: LINE_TOP, height: 24 }}>
          {/* flat muted-accent track for the whole cycle */}
          <View
            style={{
              position: 'absolute',
              left: x0,
              width: span,
              top: LINE_CY - TRACK_H / 2,
              height: TRACK_H,
              borderRadius: TRACK_H / 2,
              backgroundColor: trackColor,
            }}
          />
          {/* bleed block at the start (full accent) */}
          <View
            style={{
              position: 'absolute',
              left: x0,
              width: bleedEnd - x0,
              top: LINE_CY - BLEED_H / 2,
              height: BLEED_H,
              borderRadius: BLEED_H / 2,
              backgroundColor: bleedColor,
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Text
              className="text-[10px] font-bold"
              style={{ color: palette.bgCard, letterSpacing: 0.3 }}
              numberOfLines={1}
            >
              bleed
            </Text>
          </View>
          {/* ovulation landmark */}
          <View
            style={{
              position: 'absolute',
              left: ovX - OV_R,
              top: LINE_CY - OV_R,
              width: OV_R * 2,
              height: OV_R * 2,
              borderRadius: OV_R,
              backgroundColor: ovColor,
              borderWidth: 3,
              borderColor: palette.bgCard,
            }}
          />
        </View>

        {/* week ticks + day numbers below the line */}
        {ticks.map((dn, i) => {
          const tx = dx(dn);
          const isFirst = i === 0;
          const isLast = i === ticks.length - 1;
          return (
            <View key={dn} pointerEvents="none">
              <View
                style={{
                  position: 'absolute',
                  left: tx - 1,
                  top: LINE_TOP + 24,
                  width: 2,
                  height: 8,
                  backgroundColor: palette.inkDim,
                  opacity: 0.6,
                }}
              />
              <Text
                className="text-[10px]"
                style={{
                  position: 'absolute',
                  top: LINE_TOP + 34,
                  color: palette.inkDim,
                  ...(isFirst
                    ? { left: x0 }
                    : isLast
                      ? { left: x1 - 44, width: 44, textAlign: 'right' }
                      : { left: tx - 22, width: 44, textAlign: 'center' }),
                }}
              >
                {isFirst ? 'day 1' : isLast ? `day ${dn}` : String(dn)}
              </Text>
            </View>
          );
        })}

        {/* "today" marker: a text-free caret hovering just above the line,
            pointing down at a dot on the track at today's position. No caption —
            the cycle-progress card header already states the cycle day, so the
            timeline doesn't repeat it. Inked (not accent) so it stays legible
            everywhere the marker travels, including on the accent bleed block. */}
        <Animated.View
          style={[
            {
              position: 'absolute',
              left: todayX - 6,
              top: LINE_TOP + LINE_CY - 17,
              width: 0,
              height: 0,
              borderLeftWidth: 6,
              borderRightWidth: 6,
              borderTopWidth: 9,
              borderLeftColor: 'transparent',
              borderRightColor: 'transparent',
              borderTopColor: palette.ink,
            },
            pinStyle,
          ]}
          pointerEvents="none"
        />
        <Animated.View
          style={[
            {
              position: 'absolute',
              left: todayX - 6,
              top: LINE_TOP + LINE_CY - 6,
              width: 12,
              height: 12,
              borderRadius: 6,
              backgroundColor: palette.ink,
              borderWidth: 2,
              borderColor: palette.bgCard,
            },
            pinStyle,
          ]}
          pointerEvents="none"
        />
      </View>

      <View className="flex-row items-center gap-x-4 gap-y-1.5 mt-2 flex-wrap">
        <LegendDot color={bleedColor} label="the bleed (period)" />
        <LegendDot color={ovColor} label="ovulation" />
        <LegendDot color={trackColor} label="rest of cycle" />
        <LegendDot color={palette.ink} label={`today · day ${todayDay}`} ring />
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
