import { Pressable, Text, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { Card, CardTitle } from '@/ui/Card';
import { HandIcon, type HandIconName } from '@/ui/HandIcon';
import { Screen } from '@/ui/Screen';
import { useReminderPrefs } from '@/state/reminders';
import { useTheme } from '@/theme/useTheme';

const LOG_TIME_CHOICES: { value: string; label: string }[] = [
  { value: '08:00', label: '8 am' },
  { value: '12:00', label: 'noon' },
  { value: '18:00', label: '6 pm' },
  { value: '20:00', label: '8 pm' },
  { value: '22:00', label: '10 pm' },
];

export default function RemindersScreen() {
  const { palette } = useTheme();
  return (
    <Screen topInset={false} modalHandle>
      <View>
        <Text
          className="text-ink-muted text-base font-hand"
          style={{ transform: [{ rotate: '-1deg' }] }}
        >
          gentle nudges, on-device only
        </Text>
        <Text className="text-ink text-4xl font-display mt-0.5">Reminders</Text>
        <Text className="text-ink-muted text-sm mt-2 leading-5">
          Local-only notifications. Nothing is sent anywhere. Until you&apos;ve logged a couple of
          full cycles, these fire as a rough estimate.
        </Text>
      </View>

      <Animated.View entering={FadeInDown.delay(60).duration(400)}>
        <Card>
          <CardTitle icon={<HandIcon name="clock" size={14} color={palette.inkMuted} />}>
            What to remind me about
          </CardTitle>
          <RemindersPicker />
        </Card>
      </Animated.View>
    </Screen>
  );
}

function RemindersPicker() {
  const { palette } = useTheme();
  const {
    upcomingPeriod,
    fertileWindow,
    dailyLog,
    dailyLogTime,
    setUpcomingPeriod,
    setFertileWindow,
    setDailyLog,
    setDailyLogTime,
  } = useReminderPrefs();

  return (
    <View>
      <ReminderRow
        icon="droplet"
        title="Upcoming period"
        hint="Evening before your predicted start day."
        value={upcomingPeriod}
        onChange={setUpcomingPeriod}
      />
      <ReminderRow
        icon="star"
        title="Fertile window"
        hint="Morning of the first fertile day."
        value={fertileWindow}
        onChange={setFertileWindow}
      />
      <ReminderRow
        icon="check-circle"
        title="Daily log reminder"
        hint="A nudge to open the app."
        value={dailyLog}
        onChange={setDailyLog}
      />
      {dailyLog && (
        <View className="mt-2 mb-1">
          <Text
            className="text-ink-muted text-xs font-hand mb-2"
            style={{ transform: [{ rotate: '-1deg' }] }}
          >
            at
          </Text>
          <View className="flex-row flex-wrap gap-2">
            {LOG_TIME_CHOICES.map((c) => {
              const selected = dailyLogTime === c.value;
              return (
                <Pressable
                  key={c.value}
                  onPress={() => setDailyLogTime(c.value)}
                  className={`px-3 py-1.5 rounded-full active:opacity-80 ${
                    selected ? 'bg-accent' : 'bg-bg-soft'
                  }`}
                  style={{
                    borderWidth: selected ? 1.5 : 1,
                    borderColor: selected ? palette.ink : palette.ink + '18',
                  }}
                >
                  <Text
                    className={`text-sm ${selected ? 'text-white font-bold' : 'text-ink font-medium'}`}
                  >
                    {c.label}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </View>
      )}
    </View>
  );
}

function ReminderRow({
  icon,
  title,
  hint,
  value,
  onChange,
}: {
  icon: HandIconName;
  title: string;
  hint: string;
  value: boolean;
  onChange: (v: boolean) => void;
}) {
  const { palette } = useTheme();
  return (
    <Pressable
      onPress={() => onChange(!value)}
      accessibilityRole="switch"
      accessibilityState={{ checked: value }}
      accessibilityLabel={title}
      accessibilityHint={hint}
      className="flex-row items-center gap-3 py-2.5 active:opacity-70"
    >
      <View
        className="w-10 h-10 rounded-2xl items-center justify-center"
        style={{ backgroundColor: palette.accent + '20' }}
      >
        <HandIcon name={icon} size={18} color={palette.accent} />
      </View>
      <View className="flex-1">
        <Text className="text-ink text-base font-bold">{title}</Text>
        <Text className="text-ink-muted text-xs mt-0.5 leading-4">{hint}</Text>
      </View>
      <View
        className="rounded-full"
        style={{
          width: 44,
          height: 26,
          backgroundColor: value ? palette.accent : palette.ink + '22',
          padding: 3,
          alignItems: value ? 'flex-end' : 'flex-start',
        }}
      >
        <View className="rounded-full bg-white" style={{ width: 20, height: 20 }} />
      </View>
    </Pressable>
  );
}
