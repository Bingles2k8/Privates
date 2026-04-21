import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { Text, View } from 'react-native';
import { Card, CardTitle } from '@/ui/Card';
import { PrimaryButton } from '@/ui/PrimaryButton';
import { Screen } from '@/ui/Screen';
import { biometricAvailable, biometricKind, biometricLabel } from '@/services/unlock';

type Mode = 'passphrase' | 'biometric+passphrase';

export default function ChoosePrivacyMode() {
  const router = useRouter();
  const [bioOk, setBioOk] = useState(false);
  const [bioName, setBioName] = useState('Face ID');
  const [mode, setMode] = useState<Mode>('passphrase');

  useEffect(() => {
    (async () => {
      const ok = await biometricAvailable();
      setBioOk(ok);
      if (ok) {
        const k = await biometricKind();
        setBioName(biometricLabel(k));
        setMode('biometric+passphrase');
      }
    })();
  }, []);

  return (
    <Screen>
      <View>
        <Text className="text-ink-muted text-sm font-medium">Step 1 of 2</Text>
        <Text className="text-ink text-3xl font-display mt-0.5">How should we lock the app?</Text>
      </View>
      <Text className="text-ink-muted">
        Every option requires a passphrase — that&apos;s what actually encrypts your data. If you
        forget it, there is no recovery.
      </Text>

      {bioOk && (
        <Option
          title={`${bioName} + passphrase`}
          subtitle={`Use ${bioName} for quick day-to-day unlocks. Your passphrase is always the real key, kept as the backup.`}
          selected={mode === 'biometric+passphrase'}
          onPress={() => setMode('biometric+passphrase')}
          pill="recommended"
        />
      )}

      <Option
        title="Passphrase only"
        subtitle="You type your passphrase every time. Strongest setup — nothing to bypass if someone else picks up your phone."
        selected={mode === 'passphrase'}
        onPress={() => setMode('passphrase')}
      />

      {!bioOk && (
        <Card tone="soft">
          <Text className="text-ink-muted text-sm leading-5">
            No biometric hardware detected or none enrolled. Passphrase-only is the option
            available on this device.
          </Text>
        </Card>
      )}

      <Card tone="soft">
        <CardTitle>Heads up</CardTitle>
        <Text className="text-ink-muted text-sm leading-5">
          There is no &quot;forgot passphrase&quot; flow. We cannot reset it for you. That is the
          price of zero-knowledge — and it&apos;s the whole point.
        </Text>
      </Card>

      <PrimaryButton
        label="Continue"
        onPress={() => router.push({ pathname: '/onboarding/setup', params: { mode } })}
      />
    </Screen>
  );
}

function Option({
  title,
  subtitle,
  selected,
  pill,
  onPress,
}: {
  title: string;
  subtitle: string;
  selected: boolean;
  pill?: string;
  onPress: () => void;
}) {
  return (
    <Card className={selected ? 'border-2 border-accent' : 'border-2 border-transparent'}>
      <View className="flex-row items-start gap-3">
        <Text className="text-accent text-2xl" onPress={onPress}>
          {selected ? '◉' : '○'}
        </Text>
        <View className="flex-1" onTouchEnd={onPress}>
          <View className="flex-row items-center gap-2">
            <Text className="text-ink text-base font-semibold">{title}</Text>
            {pill && (
              <View className="px-2 py-0.5 rounded-full bg-accent">
                <Text className="text-white text-[10px] font-bold uppercase">{pill}</Text>
              </View>
            )}
          </View>
          <Text className="text-ink-muted mt-1 leading-5">{subtitle}</Text>
        </View>
      </View>
    </Card>
  );
}
