import { useEffect, useState } from 'react';
import { Alert, Text, TextInput, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { Card, CardTitle } from '@/ui/Card';
import { HandIcon } from '@/ui/HandIcon';
import { PrimaryButton } from '@/ui/PrimaryButton';
import { Screen } from '@/ui/Screen';
import {
  hasDecoySlot,
  hasWipeSlot,
  removeDecoySlot,
  removeWipeSlot,
  setupDecoySlot,
  setupWipeSlot,
  unwrapFromAnySlot,
} from '@/crypto/keys';
import { useTheme } from '@/theme/useTheme';

const MIN = 8;

type SlotKind = 'decoy' | 'wipe';

export default function DecoyScreen() {
  const { palette } = useTheme();
  const [decoyOn, setDecoyOn] = useState(false);
  const [wipeOn, setWipeOn] = useState(false);
  const [loading, setLoading] = useState(true);

  async function refresh() {
    const [d, w] = await Promise.all([hasDecoySlot(), hasWipeSlot()]);
    setDecoyOn(d);
    setWipeOn(w);
    setLoading(false);
  }

  useEffect(() => {
    refresh();
  }, []);

  return (
    <Screen topInset={false} modalHandle>
      <View>
        <Text
          className="text-ink-muted text-base font-hand"
          style={{ transform: [{ rotate: '-1deg' }] }}
        >
          the secret handshake
        </Text>
        <Text className="text-ink text-4xl font-display mt-0.5">Extra passphrases</Text>
        <Text className="text-ink-muted text-sm mt-2 leading-5">
          Set up two optional extra passphrases on top of your real one. Nothing here is required —
          everything works without them.
        </Text>
      </View>

      <Animated.View entering={FadeInDown.delay(60).duration(400)}>
        <Card>
          <CardTitle icon={<HandIcon name="info" size={14} color={palette.inkMuted} />}>
            How it works
          </CardTitle>
          <Bullet color={palette.ink}>
            <Text className="font-bold">Real</Text> passphrase: opens your actual data. This is the
            one you already have.
          </Bullet>
          <Bullet color={palette.ink}>
            <Text className="font-bold">Decoy</Text> passphrase: opens a second, completely separate
            database with plausible-looking fake data. Someone forcing you to &ldquo;prove the app is
            empty&rdquo; sees an innocent-looking tracker.
          </Bullet>
          <Bullet color={palette.ink}>
            <Text className="font-bold">Wipe</Text> passphrase: silently deletes everything the
            moment it&apos;s typed. The lock screen shows &ldquo;wrong passphrase&rdquo; so the
            person pressuring you thinks you fumbled the password.
          </Bullet>
        </Card>
      </Animated.View>

      {loading ? null : (
        <>
          <Animated.View entering={FadeInDown.delay(120).duration(400)}>
            <SlotCard
              kind="decoy"
              on={decoyOn}
              onChanged={refresh}
            />
          </Animated.View>
          <Animated.View entering={FadeInDown.delay(160).duration(400)}>
            <SlotCard
              kind="wipe"
              on={wipeOn}
              onChanged={refresh}
            />
          </Animated.View>
        </>
      )}

      <Animated.View entering={FadeInDown.delay(200).duration(400)}>
        <Card>
          <CardTitle icon={<HandIcon name="alert-triangle" size={14} color="#b45309" />}>
            Collisions matter
          </CardTitle>
          <Text className="text-ink-muted text-sm leading-5">
            Don&apos;t pick a decoy passphrase that&apos;s similar to your real one, or a wipe
            passphrase similar to your decoy. The unlock screen checks every slot you&apos;ve set up
            — if you typo and accidentally match a different slot, the app does that slot&apos;s
            action.
          </Text>
        </Card>
      </Animated.View>
    </Screen>
  );
}

function SlotCard({
  kind,
  on,
  onChanged,
}: {
  kind: SlotKind;
  on: boolean;
  onChanged: () => void | Promise<void>;
}) {
  const { palette } = useTheme();
  const [pass, setPass] = useState('');
  const [confirm, setConfirm] = useState('');
  const [realPass, setRealPass] = useState('');
  const [busy, setBusy] = useState(false);
  const [editing, setEditing] = useState(false);

  const ok = pass.length >= MIN && pass === confirm && realPass.length > 0;
  const title = kind === 'decoy' ? 'Decoy passphrase' : 'Wipe passphrase';
  const actionLabel = kind === 'decoy' ? 'Set decoy passphrase' : 'Set wipe passphrase';

  async function onSave() {
    if (!ok) return;
    try {
      setBusy(true);
      // Verify the real passphrase before writing a new slot. This guards
      // against someone who briefly has the unlocked phone from installing a
      // decoy/wipe without knowing the real password.
      const verify = await unwrapFromAnySlot(realPass, { requireRealSlot: true });
      if (!verify || verify.slot !== 'real') {
        Alert.alert('Wrong real passphrase', 'Enter your real passphrase to confirm this change.');
        return;
      }
      verify.key.fill(0);

      // Also check that the new slot passphrase isn't the same as the real
      // one — that would be ambiguous at unlock time.
      const collision = await unwrapFromAnySlot(pass, { requireRealSlot: true });
      if (collision && collision.slot === 'real') {
        collision.key.fill(0);
        Alert.alert(
          'That matches your real passphrase',
          'Pick a different passphrase for this slot.',
        );
        return;
      }

      if (kind === 'decoy') {
        await setupDecoySlot(pass);
      } else {
        await setupWipeSlot(pass);
      }
      setPass('');
      setConfirm('');
      setRealPass('');
      setEditing(false);
      await onChanged();
      Alert.alert(
        kind === 'decoy' ? 'Decoy set up' : 'Wipe passphrase set up',
        kind === 'decoy'
          ? 'Lock the app and unlock with this passphrase any time to see the decoy tracker.'
          : 'If you ever type this passphrase on the lock screen, everything gets wiped immediately.',
      );
    } catch (e: any) {
      Alert.alert('Could not save', String(e?.message ?? e));
    } finally {
      setBusy(false);
    }
  }

  async function onRemove() {
    Alert.alert(
      kind === 'decoy' ? 'Remove decoy?' : 'Remove wipe slot?',
      kind === 'decoy'
        ? 'The decoy database file stays on disk but unlocked via this slot is no longer possible. Use panic wipe if you want to delete the decoy data too.'
        : 'Your real passphrase continues to work. Only the wipe trigger is removed.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: async () => {
            try {
              setBusy(true);
              if (kind === 'decoy') await removeDecoySlot();
              else await removeWipeSlot();
              await onChanged();
            } finally {
              setBusy(false);
            }
          },
        },
      ],
    );
  }

  return (
    <Card>
      <CardTitle
        icon={
          <HandIcon
            name={kind === 'decoy' ? 'user' : 'trash-2'}
            size={14}
            color={palette.inkMuted}
          />
        }
      >
        {title}
      </CardTitle>

      {on ? (
        <View className="gap-3">
          <View className="flex-row items-center gap-2">
            <HandIcon name="check-circle" size={14} color={palette.accent} />
            <Text className="text-ink text-sm">Configured</Text>
          </View>
          <PrimaryButton
            label="Remove"
            variant="ghost"
            icon={<HandIcon name="x" size={16} color={palette.inkMuted} />}
            onPress={onRemove}
            disabled={busy}
          />
        </View>
      ) : editing ? (
        <View className="gap-3">
          <View>
            <Text className="text-ink-muted text-xs mb-1">New {kind} passphrase (min {MIN} chars)</Text>
            <TextInput
              value={pass}
              onChangeText={setPass}
              secureTextEntry
              autoCapitalize="none"
              autoCorrect={false}
              placeholder="••••••••"
              placeholderTextColor={palette.inkDim}
              className="text-ink text-base py-3 px-4 bg-bg-soft rounded-xl"
            />
          </View>
          <View>
            <Text className="text-ink-muted text-xs mb-1">Confirm</Text>
            <TextInput
              value={confirm}
              onChangeText={setConfirm}
              secureTextEntry
              autoCapitalize="none"
              autoCorrect={false}
              placeholder="••••••••"
              placeholderTextColor={palette.inkDim}
              className="text-ink text-base py-3 px-4 bg-bg-soft rounded-xl"
            />
          </View>
          <View>
            <Text className="text-ink-muted text-xs mb-1">Your real passphrase (to confirm)</Text>
            <TextInput
              value={realPass}
              onChangeText={setRealPass}
              secureTextEntry
              autoCapitalize="none"
              autoCorrect={false}
              placeholder="••••••••"
              placeholderTextColor={palette.inkDim}
              className="text-ink text-base py-3 px-4 bg-bg-soft rounded-xl"
            />
          </View>
          <View className="flex-row gap-3">
            <View className="flex-1">
              <PrimaryButton
                label="Cancel"
                variant="ghost"
                onPress={() => {
                  setEditing(false);
                  setPass('');
                  setConfirm('');
                  setRealPass('');
                }}
              />
            </View>
            <View className="flex-1">
              <PrimaryButton
                label={busy ? 'Saving…' : 'Save'}
                onPress={onSave}
                disabled={!ok || busy}
              />
            </View>
          </View>
        </View>
      ) : (
        <PrimaryButton
          label={actionLabel}
          icon={<HandIcon name="plus" size={16} color="white" />}
          onPress={() => setEditing(true)}
        />
      )}
    </Card>
  );
}

function Bullet({ children, color }: { children: React.ReactNode; color: string }) {
  return (
    <View className="flex-row gap-2 mb-2">
      <Text style={{ color, lineHeight: 20 }}>•</Text>
      <Text className="text-ink-muted text-sm leading-5 flex-1">{children}</Text>
    </View>
  );
}
