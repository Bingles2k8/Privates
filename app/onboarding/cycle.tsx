import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Alert, Text, TextInput, View } from 'react-native';
import { format, isValid, parseISO, subDays } from 'date-fns';
import { Card, CardTitle } from '@/ui/Card';
import { PrimaryButton } from '@/ui/PrimaryButton';
import { Screen } from '@/ui/Screen';
import { createCycle } from '@/data/cycles';
import { useSession } from '@/state/session';
import { useTheme } from '@/theme/useTheme';

export default function FirstCycle() {
  const router = useRouter();
  const { palette } = useTheme();
  const todayIso = format(new Date(), 'yyyy-MM-dd');
  const guess = format(subDays(new Date(), 14), 'yyyy-MM-dd');
  const [start, setStart] = useState(guess);
  const [submitting, setSubmitting] = useState(false);

  const valid = (() => {
    const d = parseISO(start);
    return isValid(d) && start <= todayIso;
  })();

  async function onSubmit() {
    try {
      setSubmitting(true);
      await createCycle(start);
      useSession.getState().markUnlocked();
      router.replace('/(tabs)');
    } catch (e: any) {
      Alert.alert('Could not save', String(e?.message ?? e));
    } finally {
      setSubmitting(false);
    }
  }

  async function onSkip() {
    useSession.getState().markUnlocked();
    router.replace('/(tabs)');
  }

  return (
    <Screen>
      <View>
        <Text className="text-ink-muted text-sm font-medium">Almost there</Text>
        <Text className="text-ink text-3xl font-display mt-0.5">
          When did your last period start?
        </Text>
      </View>
      <Text className="text-ink-muted">
        Just an estimate is fine — you can correct it later. We use it to seed predictions; everything updates as
        you log more.
      </Text>
      <Card>
        <CardTitle>Start date (YYYY-MM-DD)</CardTitle>
        <TextInput
          value={start}
          onChangeText={setStart}
          autoCapitalize="none"
          autoCorrect={false}
          inputMode="numeric"
          placeholder="2026-04-05"
          placeholderTextColor={palette.inkDim}
          className="text-ink text-lg py-2"
        />
      </Card>
      <View className="gap-3 pt-2">
        <PrimaryButton label="Save and continue" onPress={onSubmit} disabled={!valid || submitting} />
        <PrimaryButton label="Skip for now" variant="ghost" onPress={onSkip} />
      </View>
    </Screen>
  );
}
