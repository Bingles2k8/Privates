import { useEffect, useState } from 'react';
import { Alert, Text, TextInput, View } from 'react-native';
import { HandIcon } from '@/ui/HandIcon';
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';
import { Card } from '@/ui/Card';
import { PrimaryButton } from '@/ui/PrimaryButton';
import { Screen } from '@/ui/Screen';
import {
  biometricAvailable,
  biometricKind,
  biometricLabel,
  unlockBiometric,
  unlockPassphrase,
  type BiometricKind,
} from '@/services/unlock';
import { getLockMode } from '@/crypto/keys';
import { useTheme } from '@/theme/useTheme';

export default function LockScreen() {
  const [mode, setMode] = useState<'unknown' | 'passphrase' | 'biometric+passphrase'>('unknown');
  const [bioKind, setBioKind] = useState<BiometricKind>('none');
  const [pass, setPass] = useState('');
  const [trying, setTrying] = useState(false);
  const [bioAttempted, setBioAttempted] = useState(false);
  const { palette } = useTheme();

  const bioName = biometricLabel(bioKind);

  useEffect(() => {
    (async () => {
      const m = await getLockMode();
      if (!m) return;
      setMode(m);
      if (m === 'biometric+passphrase') {
        const k = await biometricKind();
        setBioKind(k);
        if (await biometricAvailable()) {
          attemptBio();
        } else {
          setBioAttempted(true);
        }
      }
    })();
  }, []);

  async function attemptBio() {
    try {
      setTrying(true);
      await unlockBiometric();
    } catch {
      // cancelled, failed, or biometry invalidated — stay on screen, user will use passphrase
    } finally {
      setTrying(false);
      setBioAttempted(true);
    }
  }

  async function attemptPass() {
    if (!pass) return;
    try {
      setTrying(true);
      await unlockPassphrase(pass);
      setPass('');
    } catch {
      Alert.alert(
        'Wrong passphrase',
        'Try again. The app cannot recover a forgotten passphrase.',
      );
      setPass('');
    } finally {
      setTrying(false);
    }
  }

  const showPassphrase = mode === 'passphrase' || mode === 'biometric+passphrase';
  const showBiometricButton = mode === 'biometric+passphrase' && bioKind !== 'none';

  return (
    <Screen scroll={false}>
      <View className="flex-1 justify-center gap-6">
        <Animated.View entering={FadeIn.duration(500)} className="items-center gap-3">
          <View
            className="w-20 h-20 rounded-full bg-bg-card items-center justify-center"
            style={{
              shadowColor: '#2a241f',
              shadowOpacity: 0.08,
              shadowRadius: 16,
              shadowOffset: { width: 0, height: 6 },
              elevation: 4,
            }}
          >
            <HandIcon name="lock" size={32} color={palette.accent} />
          </View>
          <Text className="text-ink text-3xl font-display">Welcome back</Text>
          <Text className="text-ink-muted text-sm text-center">
            Your data stays private on this device.
          </Text>
        </Animated.View>

        {showPassphrase && (
          <Animated.View entering={FadeInDown.delay(120).duration(400)}>
            <Card>
              <View className="flex-row items-center gap-2 mb-3">
                <HandIcon name="key" size={14} color={palette.inkMuted} />
                <Text
                  className="text-ink-muted text-lg font-hand"
                  style={{ transform: [{ rotate: '-0.5deg' }] }}
                >
                  passphrase
                </Text>
              </View>
              <TextInput
                value={pass}
                onChangeText={setPass}
                secureTextEntry
                autoFocus={mode === 'passphrase' || bioAttempted}
                autoCapitalize="none"
                autoCorrect={false}
                placeholder="••••••••••••"
                placeholderTextColor={palette.inkDim}
                className="text-ink text-lg py-3 px-4 bg-bg-soft rounded-xl"
                onSubmitEditing={attemptPass}
              />
            </Card>
          </Animated.View>
        )}

        <Animated.View entering={FadeInDown.delay(180).duration(400)} className="gap-3">
          {showPassphrase && (
            <PrimaryButton
              label={trying ? 'Unlocking…' : 'Unlock'}
              icon={<HandIcon name="unlock" size={16} color="white" />}
              onPress={attemptPass}
              disabled={!pass || trying}
            />
          )}
          {showBiometricButton && (
            <PrimaryButton
              label={`Use ${bioName}`}
              variant="secondary"
              icon={<HandIcon name="user-check" size={16} color={palette.ink} />}
              onPress={attemptBio}
              disabled={trying}
            />
          )}
        </Animated.View>
      </View>
    </Screen>
  );
}
