import { useEffect, useState } from 'react';
import { View, Text } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
} from 'react-native-reanimated';
import { differenceInCalendarDays, parseISO } from 'date-fns';
import { useTheme } from '@/theme/useTheme';
import { detectPhase, type PhaseKey } from '@/education/phases';

type Props = {
  cycleStart: string;
  cycleLength: number;
  periodLength?: number;
  fertileStart?: string;
  fertileEnd?: string;
  ovulation?: string;
  today?: Date;
};

// Geometry of the single stage line. The cycle is "unrolled" and centred on the
// bleed: ovulation sits at BOTH ends (it's the mid-point of the cycle, opposite
// the period), the luteal lead-up is on the left, and the follicular build-up is
// on the right. Each half is roughly a ~14-day span, so the layout reads as both
// symmetric and proportional.
const CAP_R = 10; // ovulation end-cap radius
const TRACK_H = 22; // height of the line layer (caps + pill + bands)
const LINE_CY = 11; // vertical centre within the track layer
const BAND_H = 8;
const PILL_H = 18;
const GEO_H = 78; // total height of the geometry block (labels + line + arrow)

/** Mix two #rrggbb hex colours. t=0 → a, t=1 → b. */
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
  const period = Math.max(1, periodLength);

  // Which stage are we in, and on which cycle day? (shared with the rest of the app)
  const { phase, cycleDay } = detectPhase({
    cycleStartDate: cycleStart,
    cycleLength: len,
    periodLength: period,
    today,
    fertileStart,
    fertileEnd,
    ovulation,
  });
  const day = Math.max(1, Math.min(len, cycleDay));
  const todayDay = Math.max(1, differenceInCalendarDays(today, start) + 1);

  // Ovulation day-number: use the prediction when we have it, else the midpoint.
  const ovDay = ovulation
    ? Math.max(period + 1, Math.min(len - 1, differenceInCalendarDays(parseISO(ovulation), start) + 1))
    : Math.round(len / 2);

  const draw = useSharedValue(0);
  useEffect(() => {
    draw.value = withTiming(1, { duration: 700 });
  }, [draw]);

  const arrowStyle = useAnimatedStyle(() => ({
    opacity: draw.value,
    transform: [{ translateY: (1 - draw.value) * -6 }],
  }));

  if (width === 0) {
    return <View style={{ height: GEO_H }} onLayout={(e) => setWidth(e.nativeEvent.layout.width)} />;
  }

  // Two meaningful colours; the rest of the track is neutral and theme-toned.
  const bleedColor = palette.accent;
  const ovColor = palette.ovulation;
  const trackL = mixHex(palette.inkDim, palette.bgSoft, 0.35); // luteal (slightly deeper)
  const trackR = mixHex(palette.inkDim, palette.bgSoft, 0.62); // follicular (slightly lighter)

  const x0 = CAP_R;
  const x1 = width - CAP_R;
  const cx = width / 2;
  const span = x1 - x0;
  const bleedW = Math.max(54, span * (period / len));
  const bL = cx - bleedW / 2;
  const bR = cx + bleedW / 2;

  // Map the current cycle day to a position on the line.
  // bleed days → across the pill; follicular/ovulatory → right side up to x1;
  // luteal → left side, approaching the upcoming bleed.
  let arrowX: number;
  if (day <= period) {
    arrowX = bL + ((day - 1) / Math.max(1, period - 1)) * (bR - bL);
  } else if (day <= ovDay) {
    arrowX = bR + ((day - period) / Math.max(1, ovDay - period)) * (x1 - bR);
  } else {
    arrowX = x0 + ((day - ovDay) / Math.max(1, len - ovDay)) * (bL - x0);
  }

  const stageLabel = (key: PhaseKey) =>
    key === 'menstrual' ? "you're here" : 'you are here';

  return (
    <View onLayout={(e) => setWidth(e.nativeEvent.layout.width)}>
      <View style={{ height: GEO_H, position: 'relative' }}>
        {/* stage labels above the two halves */}
        <EdgeLabel left={(x0 + bL) / 2 - 48} text="luteal" color={palette.inkMuted} />
        <EdgeLabel left={(bR + x1) / 2 - 48} text="follicular" color={palette.inkMuted} />

        {/* the line layer */}
        <View style={{ position: 'absolute', left: 0, right: 0, top: 18, height: TRACK_H }}>
          {/* luteal band (left, neutral) */}
          <View
            style={{
              position: 'absolute',
              left: x0,
              width: Math.max(0, bL - x0),
              top: LINE_CY - BAND_H / 2,
              height: BAND_H,
              borderRadius: BAND_H / 2,
              backgroundColor: trackL,
            }}
          />
          {/* follicular band (right, neutral) */}
          <View
            style={{
              position: 'absolute',
              left: bR,
              width: Math.max(0, x1 - bR),
              top: LINE_CY - BAND_H / 2,
              height: BAND_H,
              borderRadius: BAND_H / 2,
              backgroundColor: trackR,
            }}
          />
          {/* ovulation end-caps */}
          {[x0, x1].map((ex) => (
            <View
              key={ex}
              style={{
                position: 'absolute',
                left: ex - CAP_R,
                top: LINE_CY - CAP_R,
                width: CAP_R * 2,
                height: CAP_R * 2,
                borderRadius: CAP_R,
                backgroundColor: ovColor,
                borderWidth: 3,
                borderColor: palette.bgCard,
              }}
            />
          ))}
          {/* central bleed pill (the anchor) */}
          <View
            style={{
              position: 'absolute',
              left: bL,
              width: bR - bL,
              top: LINE_CY - PILL_H / 2,
              height: PILL_H,
              borderRadius: PILL_H / 2,
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
        </View>

        {/* ovulation labels at the ends, below the line */}
        <Text
          className="text-[10px] font-bold"
          style={{ position: 'absolute', left: x0, top: 42, width: 90, color: ovColor }}
        >
          ovulation
        </Text>
        <Text
          className="text-[10px] font-bold"
          style={{
            position: 'absolute',
            left: x1 - 90,
            top: 42,
            width: 90,
            textAlign: 'right',
            color: ovColor,
          }}
        >
          ovulation
        </Text>

        {/* you-are-here arrow + caption, pointing up at the current stage */}
        <Animated.View
          style={[
            { position: 'absolute', left: arrowX - 48, top: 41, width: 96, alignItems: 'center' },
            arrowStyle,
          ]}
          pointerEvents="none"
        >
          <View
            style={{
              width: 0,
              height: 0,
              borderLeftWidth: 7,
              borderRightWidth: 7,
              borderBottomWidth: 10,
              borderLeftColor: 'transparent',
              borderRightColor: 'transparent',
              borderBottomColor: palette.ink,
            }}
          />
          <Text
            className="font-handBold text-sm mt-0.5"
            style={{ color: palette.ink, transform: [{ rotate: '-2deg' }] }}
            numberOfLines={1}
          >
            {stageLabel(phase)}
          </Text>
        </Animated.View>
      </View>

      <View className="flex-row items-center gap-x-4 gap-y-1.5 mt-3 flex-wrap">
        <LegendDot color={bleedColor} label="the bleed" />
        <LegendDot color={ovColor} label="ovulation" />
        <LegendDot color={trackL} label="luteal" />
        <LegendDot color={trackR} label="follicular" />
        <LegendDot color={palette.accent} label={`today · day ${todayDay}`} ring />
      </View>
    </View>
  );
}

function EdgeLabel({ left, text, color }: { left: number; text: string; color: string }) {
  return (
    <Text
      className="text-[11px] font-bold"
      style={{ position: 'absolute', left, top: 0, width: 96, textAlign: 'center', color }}
      numberOfLines={1}
    >
      {text}
    </Text>
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
