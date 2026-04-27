import { Pressable, Text, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { Card, CardTitle } from '@/ui/Card';
import { HandIcon } from '@/ui/HandIcon';
import { Screen } from '@/ui/Screen';
import { useBbtPrefs } from '@/state/bbtPrefs';
import { useTheme } from '@/theme/useTheme';
import type { TempUnit } from '@/predictions/bbt';

const UNIT_CHOICES: { value: TempUnit; label: string; sample: string }[] = [
  { value: 'C', label: 'Celsius (\u00b0C)', sample: 'around 36.5\u00b0C waking, 36.8\u00b0C after ovulation' },
  { value: 'F', label: 'Fahrenheit (\u00b0F)', sample: 'around 97.7\u00b0F waking, 98.2\u00b0F after ovulation' },
];

export default function BbtSettingsScreen() {
  const { palette } = useTheme();
  const unit = useBbtPrefs((s) => s.unit);
  const setUnit = useBbtPrefs((s) => s.setUnit);

  return (
    <Screen topInset={false} modalHandle>
      <View>
        <Text
          className="text-ink-muted text-base font-hand"
          style={{ transform: [{ rotate: '-1deg' }] }}
        >
          how you measure
        </Text>
        <Text className="text-ink text-4xl font-display mt-0.5">Wake-up temperature</Text>
        <Text className="text-ink-muted text-sm mt-2 leading-5">
          Pick the unit you actually own a thermometer in. The app stores everything in one
          format internally and just displays it however you prefer &mdash; switching back and
          forth never loses precision.
        </Text>
      </View>

      <Animated.View entering={FadeInDown.delay(60).duration(400)}>
        <Card>
          <CardTitle icon={<HandIcon name="thermometer" size={14} color={palette.inkMuted} />}>
            Unit
          </CardTitle>
          <View className="gap-2">
            {UNIT_CHOICES.map((c) => {
              const selected = unit === c.value;
              return (
                <Pressable
                  key={c.value}
                  onPress={() => setUnit(c.value)}
                  className="flex-row items-start gap-3 py-3 active:opacity-70"
                >
                  <View
                    className="w-6 h-6 rounded-full items-center justify-center mt-0.5"
                    style={{
                      borderWidth: 2,
                      borderColor: selected ? palette.accent : palette.ink + '33',
                      backgroundColor: selected ? palette.accent : 'transparent',
                    }}
                  >
                    {selected && <HandIcon name="check" size={14} color="white" />}
                  </View>
                  <View className="flex-1">
                    <Text className="text-ink text-base font-bold">{c.label}</Text>
                    <Text className="text-ink-muted text-xs mt-0.5 leading-4">{c.sample}</Text>
                  </View>
                </Pressable>
              );
            })}
          </View>
        </Card>
      </Animated.View>

      <Animated.View entering={FadeInDown.delay(120).duration(400)}>
        <Card>
          <CardTitle icon={<HandIcon name="info" size={14} color={palette.inkMuted} />}>
            Why log this?
          </CardTitle>
          <Text className="text-ink-muted text-sm leading-5">
            Your body temperature is a tiny bit higher in the days after ovulation. Logging
            it first thing in the morning &mdash; before sitting up, drinking, or talking
            &mdash; makes that pattern visible. After a few weeks the chart shows two
            plateaus with a step between them; the step is a rough confirmation that
            ovulation happened.
          </Text>
          <Text className="text-ink-muted text-sm leading-5 mt-3">
            None of this is medical advice and the app never sends your readings anywhere.
          </Text>
        </Card>
      </Animated.View>
    </Screen>
  );
}
