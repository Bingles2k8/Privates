import { useEffect, useState } from 'react';
import { Alert, Pressable, Text, TextInput, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { Card, CardTitle } from '@/ui/Card';
import { HandIcon } from '@/ui/HandIcon';
import { PrimaryButton } from '@/ui/PrimaryButton';
import { Screen } from '@/ui/Screen';
import {
  biometricAvailable,
  biometricKind,
  biometricLabel,
  disableBiometricUnlock,
  enableBiometricWithPassphrase,
  type BiometricKind,
} from '@/services/unlock';
import { getLockMode } from '@/crypto/keys';
import { useSession } from '@/state/session';
import { useTheme } from '@/theme/useTheme';

const AUTO_LOCK_CHOICES: { value: number; label: string }[] = [
  { value: 0, label: 'Immediate' },
  { value: 30, label: '30 sec' },
  { value: 60, label: '1 min' },
  { value: 300, label: '5 min' },
  { value: 900, label: '15 min' },
  { value: -1, label: 'Never' },
];

export default function SessionScreen() {
  const { palette } = useTheme();
  const lock = useSession((s) => s.lock);

  return (
    <Screen topInset={false}>
      <View>
        <Text
          className="text-ink-muted text-base font-hand"
          style={{ transform: [{ rotate: '-1deg' }] }}
        >
          who&apos;s holding the phone
        </Text>
        <Text className="text-ink text-4xl font-display mt-0.5">Session</Text>
        <Text className="text-ink-muted text-sm mt-2 leading-5">
          Choose how long the app stays unlocked, turn on biometric unlock, or lock it right now.
        </Text>
      </View>

      <Animated.View entering={FadeInDown.delay(60).duration(400)}>
        <Card>
          <CardTitle icon={<HandIcon name="clock" size={14} color={palette.inkMuted} />}>
            Auto-lock
          </CardTitle>
          <AutoLockPicker />
        </Card>
      </Animated.View>

      <Animated.View entering={FadeInDown.delay(120).duration(400)}>
        <Card>
          <CardTitle icon={<HandIcon name="user-check" size={14} color={palette.inkMuted} />}>
            Biometric unlock
          </CardTitle>
          <BiometricToggle />
        </Card>
      </Animated.View>

      <Animated.View entering={FadeInDown.delay(180).duration(400)}>
        <PrimaryButton
          label="Lock now"
          variant="secondary"
          icon={<HandIcon name="lock" size={16} color={palette.ink} />}
          onPress={lock}
        />
      </Animated.View>
    </Screen>
  );
}

function AutoLockPicker() {
  const { palette } = useTheme();
  const autoLockSeconds = useSession((s) => s.autoLockSeconds);
  const setAutoLockSeconds = useSession((s) => s.setAutoLockSeconds);

  return (
    <View>
      <Text className="text-ink-muted text-sm leading-5 mb-3">
        Lock after this long in the background. &quot;Never&quot; is convenient; &quot;Immediate&quot;
        is safest.
      </Text>
      <View className="flex-row flex-wrap gap-2">
        {AUTO_LOCK_CHOICES.map((c) => {
          const selected = autoLockSeconds === c.value;
          return (
            <Pressable
              key={c.value}
              onPress={() => setAutoLockSeconds(c.value)}
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
  );
}

function BiometricToggle() {
  const { palette } = useTheme();
  const [kind, setKind] = useState<BiometricKind>('none');
  const [hardwareOk, setHardwareOk] = useState(false);
  const [enabled, setEnabled] = useState(false);
  const [loading, setLoading] = useState(true);
  const [showPassphrasePrompt, setShowPassphrasePrompt] = useState(false);
  const [pass, setPass] = useState('');
  const [submitting, setSubmitting] = useState(false);

  async function refresh() {
    const ok = await biometricAvailable();
    setHardwareOk(ok);
    const k = await biometricKind();
    setKind(k);
    const m = await getLockMode();
    setEnabled(m === 'biometric+passphrase');
    setLoading(false);
  }

  useEffect(() => {
    refresh();
  }, []);

  const label = biometricLabel(kind === 'none' ? 'generic' : kind);

  async function doEnable() {
    if (!pass) return;
    try {
      setSubmitting(true);
      await enableBiometricWithPassphrase(pass);
      setPass('');
      setShowPassphrasePrompt(false);
      await refresh();
      Alert.alert(`${label} enabled`, `You can now unlock with ${label}. Passphrase still works anytime.`);
    } catch {
      Alert.alert('Wrong passphrase', 'That passphrase did not decrypt your key. Try again.');
      setPass('');
    } finally {
      setSubmitting(false);
    }
  }

  function onToggle() {
    if (enabled) {
      Alert.alert(
        `Turn off ${label}?`,
        `You'll need your passphrase to unlock from now on. No data is lost.`,
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Turn off',
            style: 'destructive',
            onPress: async () => {
              await disableBiometricUnlock();
              await refresh();
            },
          },
        ],
      );
    } else {
      setShowPassphrasePrompt(true);
    }
  }

  if (loading) return null;

  if (!hardwareOk) {
    return (
      <Text className="text-ink-muted text-sm leading-5">
        No biometric hardware or none enrolled on this device. Enable Face ID / Touch ID in iOS
        Settings to use this option.
      </Text>
    );
  }

  return (
    <View>
      <Pressable onPress={onToggle} className="flex-row items-center gap-3 active:opacity-70">
        <View
          className="w-10 h-10 rounded-2xl items-center justify-center"
          style={{ backgroundColor: palette.accent + '20' }}
        >
          <HandIcon name="user-check" size={18} color={palette.accent} />
        </View>
        <View className="flex-1">
          <Text className="text-ink text-base font-bold">
            {enabled ? `${label} is on` : `Turn on ${label}`}
          </Text>
          <Text className="text-ink-muted text-xs mt-0.5 leading-4">
            {enabled
              ? `Quick unlocks. Passphrase still works anytime.`
              : `Skip typing your passphrase on every open. You'll confirm it once to turn this on.`}
          </Text>
        </View>
        <View
          className="rounded-full"
          style={{
            width: 44,
            height: 26,
            backgroundColor: enabled ? palette.accent : palette.ink + '22',
            padding: 3,
            alignItems: enabled ? 'flex-end' : 'flex-start',
          }}
        >
          <View className="rounded-full bg-white" style={{ width: 20, height: 20 }} />
        </View>
      </Pressable>

      {showPassphrasePrompt && (
        <View className="mt-3 bg-bg-soft rounded-2xl p-3 gap-2">
          <Text className="text-ink-muted text-xs">
            Confirm your passphrase to enable {label}. It won&apos;t be stored — it just unwraps
            your key so we can cache it behind biometric auth.
          </Text>
          <TextInput
            value={pass}
            onChangeText={setPass}
            secureTextEntry
            autoCapitalize="none"
            autoCorrect={false}
            placeholder="••••••••••••"
            placeholderTextColor={palette.inkDim}
            className="text-ink text-base py-2 px-3 bg-bg-card rounded-xl"
            onSubmitEditing={doEnable}
          />
          <View className="flex-row gap-2">
            <View className="flex-1">
              <PrimaryButton
                label={submitting ? 'Checking…' : `Enable ${label}`}
                onPress={doEnable}
                disabled={!pass || submitting}
              />
            </View>
            <View className="flex-1">
              <PrimaryButton
                label="Cancel"
                variant="ghost"
                onPress={() => {
                  setPass('');
                  setShowPassphrasePrompt(false);
                }}
              />
            </View>
          </View>
        </View>
      )}
    </View>
  );
}
