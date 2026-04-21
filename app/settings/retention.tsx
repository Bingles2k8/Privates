import { Pressable, Text, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { Card, CardTitle } from '@/ui/Card';
import { HandIcon } from '@/ui/HandIcon';
import { Screen } from '@/ui/Screen';
import { useRetention } from '@/state/retention';
import type { RetentionCategory } from '@/data/settings';
import { useTheme } from '@/theme/useTheme';

const RETENTION_CHOICES: { value: number; label: string }[] = [
  { value: 0, label: 'Never' },
  { value: 30, label: '30 days' },
  { value: 90, label: '90 days' },
  { value: 365, label: '1 year' },
  { value: 730, label: '2 years' },
];

const RETENTION_ROWS: { key: RetentionCategory; title: string; hint: string }[] = [
  { key: 'notes', title: 'Notes', hint: 'Free-text notes on each day.' },
  { key: 'symptoms', title: 'Symptom tags', hint: 'Cramps, headaches, etc. per day.' },
  { key: 'moods', title: 'Mood tags', hint: 'Custom mood tags per day.' },
  { key: 'bbt', title: 'BBT readings', hint: 'Basal body temperature history.' },
  { key: 'sex', title: 'Sex log', hint: 'Sexual activity entries.' },
  { key: 'lhTest', title: 'LH test results', hint: 'Ovulation test results.' },
];

export default function RetentionScreen() {
  const { palette } = useTheme();
  const values = useRetention((s) => s.values);
  const lastSweepAt = useRetention((s) => s.lastSweepAt);
  const setValue = useRetention((s) => s.set);

  return (
    <Screen topInset={false}>
      <View>
        <Text
          className="text-ink-muted text-base font-hand"
          style={{ transform: [{ rotate: '-1deg' }] }}
        >
          keep less, stay safer
        </Text>
        <Text className="text-ink text-4xl font-display mt-0.5">Auto-delete</Text>
        <Text className="text-ink-muted text-sm mt-2 leading-5">
          Anything older than this is erased next time you open the app. Cycle start/end dates are
          never auto-deleted.
        </Text>
      </View>

      <Animated.View entering={FadeInDown.delay(60).duration(400)}>
        <Card>
          <CardTitle icon={<HandIcon name="trash-2" size={14} color={palette.inkMuted} />}>
            Retention per category
          </CardTitle>
          <View className="gap-5">
            {RETENTION_ROWS.map((row) => (
              <View key={row.key}>
                <Text className="text-ink text-base font-bold">{row.title}</Text>
                <Text className="text-ink-muted text-xs mt-0.5 mb-2 leading-4">{row.hint}</Text>
                <View className="flex-row flex-wrap gap-2">
                  {RETENTION_CHOICES.map((c) => {
                    const selected = values[row.key] === c.value;
                    return (
                      <Pressable
                        key={c.value}
                        onPress={() => setValue(row.key, c.value)}
                        className={`px-3 py-1.5 rounded-full active:opacity-80 ${
                          selected ? 'bg-accent' : 'bg-bg-soft'
                        }`}
                        style={{
                          borderWidth: selected ? 1.5 : 1,
                          borderColor: selected ? palette.ink : palette.ink + '18',
                        }}
                      >
                        <Text
                          className={`text-xs ${selected ? 'text-white font-bold' : 'text-ink font-medium'}`}
                        >
                          {c.label}
                        </Text>
                      </Pressable>
                    );
                  })}
                </View>
              </View>
            ))}
          </View>
          {lastSweepAt && (
            <Text className="text-ink-dim text-[11px] mt-5">
              last swept {new Date(lastSweepAt).toLocaleString()}
            </Text>
          )}
        </Card>
      </Animated.View>
    </Screen>
  );
}
