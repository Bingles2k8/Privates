import { Text, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { Card } from '@/ui/Card';
import { HandIcon } from '@/ui/HandIcon';
import { Screen } from '@/ui/Screen';
import { PHASES, type PhaseKey } from '@/education';
import { useTheme } from '@/theme/useTheme';
import { HormoneCurves } from '@/ui/HormoneCurves';

const PHASE_ORDER: PhaseKey[] = ['menstrual', 'follicular', 'ovulatory', 'luteal'];

const PHASE_DAY_RANGE: Record<PhaseKey, string> = {
  menstrual: 'days 1–5',
  follicular: 'days 6–13',
  ovulatory: 'days 13–17',
  luteal: 'days 17–28',
};

export default function LearnScreen() {
  const { palette } = useTheme();

  return (
    <Screen topInset={false} modalHandle>
      <Animated.View entering={FadeInDown.duration(400)}>
        <Card>
          <View className="flex-row items-center gap-2 mb-3">
            <HandIcon name="trending-up" size={14} color={palette.inkMuted} />
            <Text
              className="text-ink-muted text-lg font-hand"
              style={{ transform: [{ rotate: '-0.5deg' }] }}
            >
              hormones across the cycle
            </Text>
          </View>
          <HormoneCurves />
          <View className="flex-row flex-wrap gap-3 mt-3">
            <CurveLegend color={palette.accent} label="estrogen" />
            <CurveLegend color={palette.ovulation} label="progesterone" />
            <CurveLegend color={palette.fertile} label="LH (peak)" />
          </View>
          <Text className="text-ink-muted text-xs mt-3 leading-5">
            Estrogen builds across the first half, peaks just before ovulation, then dips. LH spikes
            briefly to trigger ovulation. Progesterone climbs in the second half and falls just
            before the next period.
          </Text>
        </Card>
      </Animated.View>

      {PHASE_ORDER.map((key, i) => {
        const p = PHASES[key];
        return (
          <Animated.View key={key} entering={FadeInDown.delay(120 + i * 60).duration(400)}>
            <Card>
              <View className="flex-row items-baseline justify-between mb-2">
                <Text className="text-ink text-2xl font-display">{p.name}</Text>
                <Text className="text-ink-dim text-xs">{PHASE_DAY_RANGE[key]}</Text>
              </View>
              <Text className="text-ink-muted text-sm leading-5 italic mb-4">{p.short}</Text>

              <Section icon="droplet" label="What's happening" body={p.whatHappens} />
              <Section icon="zap" label="Why" body={p.whyItHappens} />
              <Section icon="user" label="How you may feel" body={p.howYouMayFeel} />

              {p.commonSymptoms.length > 0 && (
                <View className="mt-2">
                  <Text className="text-ink-dim text-[11px] uppercase tracking-wide font-bold mb-1.5">
                    common symptoms
                  </Text>
                  <View className="flex-row flex-wrap gap-1.5">
                    {p.commonSymptoms.map((s) => (
                      <View
                        key={s}
                        className="px-2.5 py-1 rounded-full"
                        style={{ backgroundColor: palette.bgSoft }}
                      >
                        <Text className="text-ink-muted text-xs">{s.replace(/_/g, ' ')}</Text>
                      </View>
                    ))}
                  </View>
                </View>
              )}
            </Card>
          </Animated.View>
        );
      })}

      <Animated.View entering={FadeInDown.delay(420).duration(400)}>
        <Card tone="soft">
          <View className="flex-row items-start gap-2">
            <HandIcon name="alert-circle" size={16} color={palette.accent} />
            <Text className="text-ink-muted text-sm leading-5 flex-1">
              Anything feels severely off — pain you can't push through, unusual bleeding, or
              symptoms outside your normal pattern? Trust yourself and check with a clinician. This
              app gives general information, not medical advice.
            </Text>
          </View>
        </Card>
      </Animated.View>
    </Screen>
  );
}

function Section({
  icon,
  label,
  body,
}: {
  icon: 'droplet' | 'zap' | 'user';
  label: string;
  body: string;
}) {
  const { palette } = useTheme();
  return (
    <View className="mb-3">
      <View className="flex-row items-center gap-2 mb-1">
        <HandIcon name={icon} size={12} color={palette.inkDim} />
        <Text className="text-ink-dim text-[11px] uppercase tracking-wide font-bold">{label}</Text>
      </View>
      <Text className="text-ink text-sm leading-5">{body}</Text>
    </View>
  );
}

function CurveLegend({ color, label }: { color: string; label: string }) {
  return (
    <View className="flex-row items-center gap-1.5">
      <View style={{ width: 14, height: 3, borderRadius: 2, backgroundColor: color }} />
      <Text className="text-ink-muted text-xs">{label}</Text>
    </View>
  );
}
