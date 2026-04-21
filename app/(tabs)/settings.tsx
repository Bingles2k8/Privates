import { useRouter } from 'expo-router';
import { Alert, Text, View } from 'react-native';
import * as Application from 'expo-application';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { Card, CardTitle } from '@/ui/Card';
import { HandIcon } from '@/ui/HandIcon';
import { MascotHeader } from '@/ui/MascotHeader';
import { PrimaryButton } from '@/ui/PrimaryButton';
import { Screen } from '@/ui/Screen';
import { SettingsTile } from '@/ui/SettingsTile';
import { panicWipe } from '@/services/panicWipe';
import { LATEST_SCHEMA_VERSION } from '@/db';
import { useTheme } from '@/theme/useTheme';

export default function SettingsScreen() {
  const router = useRouter();
  const { palette } = useTheme();

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

      <Animated.View entering={FadeInDown.delay(140).duration(400)}>
        <View className="flex-row flex-wrap gap-3">
          <SettingsTile
            icon="download"
            title="Backup & restore"
            hint="Encrypted .ptbk files."
            onPress={() => router.push('/backup')}
          />
          <SettingsTile
            icon="edit-2"
            title="Symptom & mood tags"
            hint="Custom tags, clean-up."
            onPress={() => router.push('/tags')}
          />
          <SettingsTile
            icon="smartphone"
            title="Customize screens"
            hint="Hide or reorder sections."
            onPress={() => router.push('/settings/customize')}
          />
          <SettingsTile
            icon="key"
            title="Extra passphrases"
            hint="Decoy & wipe slots."
            onPress={() => router.push('/settings/decoy')}
          />
          <SettingsTile
            icon="image"
            title="App icon"
            hint="Stealth homescreen."
            onPress={() => router.push('/settings/appearance')}
          />
          <SettingsTile
            icon="heart"
            title="Pregnancy mode"
            hint="Weeks, kicks, contractions."
            onPress={() => router.push('/pregnancy')}
          />
          <SettingsTile
            icon="droplet"
            title="Theme"
            hint="Light/dark & accent."
            onPress={() => router.push('/settings/theme')}
          />
          <SettingsTile
            icon="user"
            title="Session"
            hint="Auto-lock & biometrics."
            onPress={() => router.push('/settings/session')}
          />
          <SettingsTile
            icon="clock"
            title="Reminders"
            hint="Local-only notifications."
            onPress={() => router.push('/settings/reminders')}
          />
          <SettingsTile
            icon="trash-2"
            title="Auto-delete"
            hint="Retention per category."
            onPress={() => router.push('/settings/retention')}
          />
        </View>
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
