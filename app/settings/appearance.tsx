import { useEffect, useState } from 'react';
import { Alert, Image, Pressable, Text, View, type ImageSourcePropType } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { Card, CardTitle } from '@/ui/Card';
import { HandIcon } from '@/ui/HandIcon';
import { Screen } from '@/ui/Screen';
import {
  appIconModuleAvailable,
  appIconLoadError,
  getAppIconSafe,
  setAppIconSafe,
} from '@/services/appIcon';
import { useTheme } from '@/theme/useTheme';

type IconKey = 'DEFAULT' | 'calculator' | 'weather' | 'notes' | 'paper';

type IconChoice = {
  key: IconKey;
  label: string;
  kicker: string;
  preview: ImageSourcePropType;
};

const CHOICES: IconChoice[] = [
  {
    key: 'DEFAULT',
    label: 'Default',
    kicker: 'the real one',
    preview: require('../../assets/images/icon.png'),
  },
  {
    key: 'calculator',
    label: 'Calculator',
    kicker: 'blends in on any homescreen',
    preview: require('../../assets/icons/calculator.png'),
  },
  {
    key: 'weather',
    label: 'Weather',
    kicker: 'no-one opens it twice',
    preview: require('../../assets/icons/weather.png'),
  },
  {
    key: 'notes',
    label: 'Notes',
    kicker: 'boring, deliberate',
    preview: require('../../assets/icons/notes.png'),
  },
  {
    key: 'paper',
    label: 'Paper',
    kicker: 'no affordance at all',
    preview: require('../../assets/icons/paper.png'),
  },
];

export default function AppearanceScreen() {
  const { palette } = useTheme();
  const [current, setCurrent] = useState<IconKey>('DEFAULT');
  const [busy, setBusy] = useState(false);
  const [available, setAvailable] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    const ok = appIconModuleAvailable();
    setAvailable(ok);
    setLoadError(appIconLoadError());
    if (ok) {
      const name = getAppIconSafe();
      if (name === 'DEFAULT' || name === 'calculator' || name === 'weather' || name === 'notes' || name === 'paper') {
        setCurrent(name);
      }
    }
  }, []);

  async function onPick(key: IconKey) {
    if (busy || key === current) return;
    if (!available) {
      Alert.alert(
        'Native rebuild needed',
        'The app icon switcher is a native feature. Rebuild the app (prebuild + dev client / store build) for it to take effect.',
      );
      return;
    }
    try {
      setBusy(true);
      const arg = key === 'DEFAULT' ? '' : key;
      const result = setAppIconSafe(arg);
      if (!result.ok) {
        Alert.alert('Could not change icon', result.reason ?? 'Unknown error');
        return;
      }
      setCurrent(key);
    } finally {
      setBusy(false);
    }
  }

  return (
    <Screen topInset={false}>
      <View>
        <Text
          className="text-ink-muted text-base font-hand"
          style={{ transform: [{ rotate: '-1deg' }] }}
        >
          camouflage
        </Text>
        <Text className="text-ink text-4xl font-display mt-0.5">App icon</Text>
        <Text className="text-ink-muted text-sm mt-2 leading-5">
          Pick what the app looks like on your homescreen. The switch happens instantly — no reinstall.
        </Text>
      </View>

      {!available && (
        <Animated.View entering={FadeInDown.duration(400)}>
          <Card>
            <CardTitle icon={<HandIcon name="alert-triangle" size={14} color="#b45309" />}>
              Needs a native rebuild
            </CardTitle>
            <Text className="text-ink-muted text-sm leading-5">
              The icon switcher is a native module — it isn&apos;t in your current dev client yet.
              Run{' '}
              <Text className="text-ink font-bold">npx expo prebuild</Text> and rebuild the app to
              enable it. Picking an icon here won&apos;t do anything until then.
            </Text>
            {loadError && (
              <Text className="text-ink-dim text-xs mt-2" selectable>
                ({loadError})
              </Text>
            )}
          </Card>
        </Animated.View>
      )}

      <Animated.View entering={FadeInDown.delay(60).duration(400)}>
        <Card>
          <CardTitle icon={<HandIcon name="alert-triangle" size={14} color={palette.inkMuted} />}>
            Heads up about the name
          </CardTitle>
          <Text className="text-ink-muted text-sm leading-5">
            Apps can only change their icon, not the label under it. If you pick &ldquo;Calculator&rdquo;,
            the label will still say &ldquo;Privates&rdquo;. To really hide the name on iOS, put the app
            inside a folder or on a secondary homescreen page. On Android, most launchers let you rename
            icons long-press → &ldquo;Edit&rdquo;.
          </Text>
        </Card>
      </Animated.View>

      {CHOICES.map((c, i) => {
        const selected = current === c.key;
        return (
          <Animated.View key={c.key} entering={FadeInDown.delay(100 + i * 40).duration(400)}>
            <Pressable
              onPress={() => onPick(c.key)}
              disabled={busy}
              className="rounded-3xl p-4 flex-row items-center gap-4 active:opacity-80"
              style={{
                backgroundColor: palette.bgCard,
                borderWidth: selected ? 2 : 1,
                borderColor: selected ? palette.accent : palette.ink + '18',
                shadowColor: palette.ink,
                shadowOpacity: selected ? 0.9 : 0.4,
                shadowRadius: 0,
                shadowOffset: { width: 1.5, height: 1.5 },
                opacity: available ? 1 : 0.6,
              }}
            >
              <Image
                source={c.preview}
                style={{ width: 56, height: 56, borderRadius: 14 }}
              />
              <View className="flex-1">
                <Text
                  className="text-ink-muted text-xs font-hand"
                  style={{ transform: [{ rotate: '-1deg' }] }}
                >
                  {c.kicker}
                </Text>
                <Text className="text-ink text-lg font-displayBold mt-0.5">{c.label}</Text>
              </View>
              {selected ? (
                <HandIcon name="check-circle" size={22} color={palette.accent} />
              ) : (
                <View
                  style={{
                    width: 22,
                    height: 22,
                    borderRadius: 11,
                    borderWidth: 1.5,
                    borderColor: palette.ink + '40',
                  }}
                />
              )}
            </Pressable>
          </Animated.View>
        );
      })}
    </Screen>
  );
}
