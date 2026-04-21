import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { Alert, Text, TextInput, View } from 'react-native';
import { Card, CardTitle } from '@/ui/Card';
import { PrimaryButton } from '@/ui/PrimaryButton';
import { Screen } from '@/ui/Screen';
import { biometricKind, biometricLabel, setupAndUnlock } from '@/services/unlock';
import type { LockMode } from '@/crypto/keys';
import { useTheme } from '@/theme/useTheme';

const MIN_PASSPHRASE = 12;

export default function SetupLock() {
  const router = useRouter();
  const params = useLocalSearchParams<{ mode: string }>();
  const rawMode = (params.mode as LockMode) ?? 'passphrase';
  const mode: LockMode = rawMode === 'biometric+passphrase' ? 'biometric+passphrase' : 'passphrase';
  const willUseBiometric = mode === 'biometric+passphrase';
  const { palette } = useTheme();

  const [bioName, setBioName] = useState('Face ID');
  const [pass, setPass] = useState('');
  const [confirm, setConfirm] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    biometricKind().then((k) => setBioName(biometricLabel(k)));
  }, []);

  const validPass = pass.length >= MIN_PASSPHRASE && pass === confirm;
  const canSubmit = validPass && !submitting;

  async function doSetup() {
    try {
      setSubmitting(true);
      await setupAndUnlock(mode, pass);
      router.replace('/onboarding/cycle');
    } catch (e: any) {
      Alert.alert('Setup failed', String(e?.message ?? e));
    } finally {
      setSubmitting(false);
    }
  }

  function onSubmit() {
    Alert.alert(
      'Confirm one last time',
      'If you forget this passphrase, every period, symptom, and note in this app is permanently unrecoverable. Continue?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'I understand', style: 'destructive', onPress: doSetup },
      ],
    );
  }

  return (
    <Screen>
      <View>
        <Text className="text-ink-muted text-sm font-medium">Step 2 of 2</Text>
        <Text className="text-ink text-3xl font-display mt-0.5">Set your passphrase</Text>
      </View>
      <Text className="text-ink-muted">
        At least {MIN_PASSPHRASE} characters. A short sentence is fine and easier to remember than
        a random string.
        {willUseBiometric
          ? ` ${bioName} will handle day-to-day unlocks; you'll only need this passphrase occasionally.`
          : ''}
      </Text>
      <Card>
        <CardTitle>Passphrase</CardTitle>
        <TextInput
          value={pass}
          onChangeText={setPass}
          secureTextEntry
          autoCapitalize="none"
          autoCorrect={false}
          placeholder="••••••••••••"
          placeholderTextColor={palette.inkDim}
          className="text-ink text-lg py-2"
        />
      </Card>
      <Card>
        <CardTitle>Confirm</CardTitle>
        <TextInput
          value={confirm}
          onChangeText={setConfirm}
          secureTextEntry
          autoCapitalize="none"
          autoCorrect={false}
          placeholder="••••••••••••"
          placeholderTextColor={palette.inkDim}
          className="text-ink text-lg py-2"
        />
      </Card>
      {pass.length > 0 && pass.length < MIN_PASSPHRASE && (
        <Text className="text-ink-muted text-sm">
          Need {MIN_PASSPHRASE - pass.length} more characters.
        </Text>
      )}
      {pass.length >= MIN_PASSPHRASE && pass !== confirm && (
        <Text className="text-ink-muted text-sm">Passphrases don&apos;t match yet.</Text>
      )}
      {willUseBiometric && validPass && (
        <Card tone="soft">
          <Text className="text-ink-muted text-sm leading-5">
            After you continue, {bioName} will be used to quickly unlock this app on this device.
            You can turn it off from Settings any time — your passphrase will still work.
          </Text>
        </Card>
      )}
      <View className="pt-4">
        <PrimaryButton
          label={submitting ? 'Setting up…' : 'Lock it down'}
          onPress={onSubmit}
          disabled={!canSubmit}
        />
      </View>
    </Screen>
  );
}
