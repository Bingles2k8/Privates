import { useRouter } from 'expo-router';
import { Alert, Text, View } from 'react-native';
import * as Application from 'expo-application';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { Card, CardTitle, PressableCard } from '@/ui/Card';
import { HandIcon } from '@/ui/HandIcon';
import { MascotHeader } from '@/ui/MascotHeader';
import { PrimaryButton } from '@/ui/PrimaryButton';
import { Screen } from '@/ui/Screen';
import { SettingsTile } from '@/ui/SettingsTile';
import { panicWipe } from '@/services/panicWipe';
import { LATEST_SCHEMA_VERSION } from '@/db';
import { useTheme } from '@/theme/useTheme';
import { useIap } from '@/state/iap';

export default function SettingsScreen() {
  const router = useRouter();
  const { palette } = useTheme();
  const isSupporter = useIap((s) => s.entitlements.supporter);

  function confirmWipe() {
    Alert.alert(
      'Erase everything?',
      'This deletes all logs, cycles, settings, and the encryption key from this device. There is no undo.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Erase everything',
          style: 'destructive',
          onPress: () =>
            Alert.alert('Are you absolutely sure?', 'Last warning.', [
              { text: 'Cancel', style: 'cancel' },
              { text: 'Yes, erase', style: 'destructive', onPress: () => panicWipe() },
            ]),
        },
      ],
    );
  }

  return (
    <Screen>
      <MascotHeader title="Settings" kicker="make it yours" context={{ screen: 'settings' }} />

      <Animated.View entering={FadeInDown.delay(80).duration(400)}>
        <Card>
          <CardTitle icon={<HandIcon name="lock" size={14} color={palette.inkMuted} />}>
            Privacy guarantees
          </CardTitle>
          <Bullet>Your data is encrypted on this device and unreadable without your key.</Bullet>
          <Bullet>The app makes zero outbound network calls. Verifiable in network logs.</Bullet>
          <Bullet>No account, no analytics, no crash reporting that leaves the device.</Bullet>
        </Card>
      </Animated.View>

      <Animated.View entering={FadeInDown.delay(110).duration(400)}>
        <PressableCard onPress={() => router.push('/settings/wardrobe')}>
          <View className="flex-row items-center gap-4">
            <View
              className="w-12 h-12 rounded-2xl items-center justify-center"
              style={{ backgroundColor: palette.accent + '20' }}
            >
              <HandIcon name="user" size={20} color={palette.accent} />
            </View>
            <View className="flex-1">
              <Text
                className="text-ink-muted text-xs font-hand"
                style={{ transform: [{ rotate: '-1deg' }] }}
              >
                dress &lsquo;em up
              </Text>
              <Text className="text-ink text-lg font-displayBold mt-0.5">Wardrobe</Text>
              <Text className="text-ink-muted text-xs mt-1 leading-4">
                Pick a character, equip hats, glasses, and more.
              </Text>
            </View>
            <HandIcon name="chevron-right" size={20} color={palette.inkMuted} />
          </View>
        </PressableCard>
      </Animated.View>

      <Animated.View entering={FadeInDown.delay(140).duration(400)}>
        {/*
          Tile order: most-touched on top (daily UX — reminders, what
          shows on each screen, your custom tags) → set-once
          preferences (units, theme, lock) → life-event toggles
          (pregnancy) → infrequently-revisited maintenance (backup,
          retention) → privacy power-user features (extra passphrases,
          stealth icon).
        */}
        <View className="flex-row flex-wrap gap-3">
          <SettingsTile
            icon="clock"
            title="Reminders"
            hint="Period, pill, and contraceptive nudges."
            onPress={() => router.push('/settings/reminders')}
          />
          <SettingsTile
            icon="smartphone"
            title="Customize screens"
            hint="Pick what shows on each screen."
            onPress={() => router.push('/settings/customize')}
          />
          <SettingsTile
            icon="edit-2"
            title="Symptom & mood tags"
            hint="Add your own or hide ones you don't use."
            onPress={() => router.push('/tags')}
          />
          <SettingsTile
            icon="thermometer"
            title="Wake-up temperature"
            hint="Choose °C or °F."
            onPress={() => router.push('/settings/bbt')}
          />
          <SettingsTile
            icon="droplet"
            title="Theme"
            hint="Light, dark, and accent color."
            onPress={() => router.push('/settings/theme')}
          />
          <SettingsTile
            icon="user"
            title="Session"
            hint="Lock timing and biometric unlock."
            onPress={() => router.push('/settings/session')}
          />
          <SettingsTile
            icon="heart"
            title="Pregnancy mode"
            hint="Track a pregnancy week-by-week."
            onPress={() => router.push('/pregnancy')}
          />
          <SettingsTile
            icon="download"
            title="Backup & restore"
            hint="Save or load an encrypted backup."
            onPress={() => router.push('/backup')}
          />
          <SettingsTile
            icon="trash-2"
            title="Auto-delete"
            hint="Erase old logs on a schedule."
            onPress={() => router.push('/settings/retention')}
          />
          <SettingsTile
            icon="key"
            title="Extra passphrases"
            hint="Decoy and instant-wipe slots."
            onPress={() => router.push('/settings/decoy')}
          />
          <SettingsTile
            icon="image"
            title="App icon"
            hint="Disguise the icon on your homescreen."
            onPress={() => router.push('/settings/appearance')}
          />
        </View>
      </Animated.View>

      <Animated.View entering={FadeInDown.delay(200).duration(400)}>
        <PressableCard onPress={() => router.push('/settings/supporter')}>
          <View className="flex-row items-center gap-4">
            <View
              className="w-12 h-12 rounded-2xl items-center justify-center"
              style={{ backgroundColor: palette.accent + '20' }}
            >
              <HandIcon name="heart" size={20} color={palette.accent} />
            </View>
            <View className="flex-1">
              <Text
                className="text-ink-muted text-xs font-hand"
                style={{ transform: [{ rotate: '-1deg' }] }}
              >
                {isSupporter ? 'thank you' : 'totally optional'}
              </Text>
              <Text className="text-ink text-lg font-displayBold mt-0.5">
                {isSupporter ? "You're a supporter" : 'Support development'}
              </Text>
              <Text className="text-ink-muted text-xs mt-1 leading-4">
                Tip jar and cosmetic packs — opens a network connection only when tapped.
              </Text>
            </View>
            <HandIcon name="chevron-right" size={20} color={palette.inkMuted} />
          </View>
        </PressableCard>
      </Animated.View>

      <Animated.View entering={FadeInDown.delay(220).duration(400)}>
        <Card>
          <CardTitle
            icon={<HandIcon name="alert-triangle" size={14} color="#ef4444" />}
          >
            Danger zone
          </CardTitle>
          <Text className="text-ink-muted text-sm mb-4 leading-5">
            Permanently erase the encrypted database and the encryption key from this device.
          </Text>
          <PrimaryButton
            label="Panic wipe"
            variant="danger"
            icon={<HandIcon name="trash-2" size={16} color="white" />}
            onPress={confirmWipe}
          />
        </Card>
      </Animated.View>

      <View className="items-center mt-2">
        <Text className="text-ink-dim text-xs">
          {Application.applicationName} v{Application.nativeApplicationVersion} · schema{' '}
          {LATEST_SCHEMA_VERSION}
        </Text>
      </View>
    </Screen>
  );
}

function Bullet({ children }: { children: string }) {
  const { palette } = useTheme();
  return (
    <View className="flex-row gap-2.5 mb-2.5 items-start">
      <View style={{ marginTop: 2 }}>
        <HandIcon name="check" size={14} color={palette.accent} />
      </View>
      <Text className="text-ink-muted flex-1 text-sm leading-5">{children}</Text>
    </View>
  );
}
