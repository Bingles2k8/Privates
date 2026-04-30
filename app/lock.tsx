import { useEffect, useRef, useState } from 'react';
import { Alert, KeyboardAvoidingView, Platform, Text, TextInput, View } from 'react-native';
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
import { getLockoutSnapshot, isLockedOutError } from '@/services/lockout';
import { useTheme } from '@/theme/useTheme';

export default function LockScreen() {
  const [mode, setMode] = useState<'unknown' | 'passphrase' | 'biometric+passphrase'>('unknown');
  const [bioKind, setBioKind] = useState<BiometricKind>('none');
  const [pass, setPass] = useState('');
  const [trying, setTrying] = useState(false);
  const [bioAttempted, setBioAttempted] = useState(false);
  const [lockoutMs, setLockoutMs] = useState(0);
  const [failedAttempts, setFailedAttempts] = useState(0);
  const tickRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const { palette } = useTheme();

  const bioName = biometricLabel(bioKind);
  const isLockedOut = lockoutMs > 0;

  useEffect(() => {
    (async () => {
      const m = await getLockMode();
      if (!m) return;
      setMode(m);
      // Pull any lockout state that survived the previous session (force-quit
      // doesn't bypass the backoff — that's the whole point of persisting it).
      const snap = await getLockoutSnapshot();
      setLockoutMs(snap.msRemaining);
      setFailedAttempts(snap.failedAttempts);
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

  // While locked out, tick the visible countdown every 250ms. We re-poll
  // SecureStore on each tick (cheap; it's a Keychain hit) so the countdown
  // stays correct even if the user backgrounds and returns.
  useEffect(() => {
    if (!isLockedOut) {
      if (tickRef.current) {
        clearInterval(tickRef.current);
        tickRef.current = null;
      }
      return;
    }
    if (tickRef.current) return; // already ticking
    tickRef.current = setInterval(async () => {
      const snap = await getLockoutSnapshot();
      setLockoutMs(snap.msRemaining);
      setFailedAttempts(snap.failedAttempts);
      if (snap.msRemaining <= 0 && tickRef.current) {
        clearInterval(tickRef.current);
        tickRef.current = null;
      }
    }, 250);
    return () => {
      if (tickRef.current) {
        clearInterval(tickRef.current);
        tickRef.current = null;
      }
    };
  }, [isLockedOut]);

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
    if (isLockedOut) return; // belt-and-suspenders: button is also disabled
    try {
      setTrying(true);
      await unlockPassphrase(pass);
      setPass('');
    } catch (e: unknown) {
      setPass('');
      if (isLockedOutError(e)) {
        // Pull fresh state so the countdown reflects the new lockout
        // immediately, not next tick.
        const snap = await getLockoutSnapshot();
        setLockoutMs(snap.msRemaining);
        setFailedAttempts(snap.failedAttempts);
        // No alert — the inline countdown card is the feedback channel.
      } else {
        Alert.alert(
          'Wrong passphrase',
          'Try again. The app cannot recover a forgotten passphrase.',
        );
      }
    } finally {
      setTrying(false);
    }
  }

  const showPassphrase = mode === 'passphrase' || mode === 'biometric+passphrase';
  const showBiometricButton = mode === 'biometric+passphrase' && bioKind !== 'none';

  return (
    <Screen scroll={false}>
      {/*
        Without KeyboardAvoidingView, the soft keyboard on Android (with
        adjustResize) shrinks the layout but `justify-center` still tries
        to center the full content stack in the new, smaller box — the
        passphrase field can end up partially or fully under the keyboard.
        On iOS the OS doesn't adjustResize for us at all, so the keyboard
        flat-out overlaps the field. `behavior="padding"` adds bottom
        padding equal to the keyboard height on both platforms; combined
        with `justify-center` the content shifts up smoothly as the
        keyboard rises and the input remains visible.
      */}
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
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

        {isLockedOut && (
          <Animated.View entering={FadeIn.duration(300)}>
            <LockoutCard msRemaining={lockoutMs} failedAttempts={failedAttempts} />
          </Animated.View>
        )}

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
                editable={!isLockedOut}
                autoFocus={!isLockedOut && (mode === 'passphrase' || bioAttempted)}
                autoCapitalize="none"
                autoCorrect={false}
                placeholder="••••••••••••"
                placeholderTextColor={palette.inkDim}
                className="text-ink text-lg py-3 px-4 bg-bg-soft rounded-xl"
                style={{ opacity: isLockedOut ? 0.5 : 1 }}
                onSubmitEditing={attemptPass}
              />
            </Card>
          </Animated.View>
        )}

        <Animated.View entering={FadeInDown.delay(180).duration(400)} className="gap-3">
          {showPassphrase && (
            <PrimaryButton
              label={trying ? 'Unlocking…' : isLockedOut ? 'Locked' : 'Unlock'}
              icon={<HandIcon name="unlock" size={16} color="white" />}
              onPress={attemptPass}
              disabled={!pass || trying || isLockedOut}
            />
          )}
          {showBiometricButton && (
            <PrimaryButton
              label={`Use ${bioName}`}
              variant="secondary"
              icon={<HandIcon name="user-check" size={16} color={palette.ink} />}
              onPress={attemptBio}
              disabled={trying || isLockedOut}
            />
          )}
        </Animated.View>
      </View>
      </KeyboardAvoidingView>
    </Screen>
  );
}

function LockoutCard({
  msRemaining,
  failedAttempts,
}: {
  msRemaining: number;
  failedAttempts: number;
}) {
  const { palette } = useTheme();
  return (
    <Card>
      <View className="flex-row items-center gap-2 mb-2">
        <HandIcon name="clock" size={14} color={palette.inkMuted} />
        <Text
          className="text-ink-muted text-lg font-hand"
          style={{ transform: [{ rotate: '-0.5deg' }] }}
        >
          slow down
        </Text>
      </View>
      <Text className="text-ink text-2xl font-displayBold mb-1">
        Try again in {formatRemaining(msRemaining)}
      </Text>
      <Text className="text-ink-muted text-sm leading-5">
        {`${failedAttempts} wrong passphrases in a row. The wait grows after each miss — closing and reopening won't shorten it.`}
      </Text>
    </Card>
  );
}

function formatRemaining(ms: number): string {
  const s = Math.ceil(ms / 1000);
  if (s < 60) return `${s} second${s === 1 ? '' : 's'}`;
  const m = Math.ceil(s / 60);
  if (m < 60) return `${m} minute${m === 1 ? '' : 's'}`;
  const h = Math.ceil(m / 60);
  if (h < 24) return `${h} hour${h === 1 ? '' : 's'}`;
  const d = Math.ceil(h / 24);
  return `${d} day${d === 1 ? '' : 's'}`;
}
