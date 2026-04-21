import { Pressable, Text, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { Card, CardTitle } from '@/ui/Card';
import { HandIcon, type HandIconName } from '@/ui/HandIcon';
import { Screen } from '@/ui/Screen';
import { useThemeStore } from '@/theme/store';
import { persistTheme } from '@/theme/ThemeProvider';
import { useTheme } from '@/theme/useTheme';
import { ACCENTS, type AccentKey, type ThemeMode } from '@/theme/palette';

const MODES: { value: ThemeMode; label: string; icon: HandIconName }[] = [
  { value: 'system', label: 'System', icon: 'smartphone' },
  { value: 'light', label: 'Light', icon: 'sun' },
  { value: 'dark', label: 'Dark', icon: 'moon' },
];

export default function ThemeScreen() {
  const { palette } = useTheme();
  const mode = useThemeStore((s) => s.mode);
  const accent = useThemeStore((s) => s.accent);
  const setMode = useThemeStore((s) => s.setMode);
  const setAccent = useThemeStore((s) => s.setAccent);

  function pickMode(next: ThemeMode) {
    setMode(next);
    persistTheme({ mode: next });
  }

  function pickAccent(next: AccentKey) {
    setAccent(next);
    persistTheme({ accent: next });
  }

  return (
    <Screen topInset={false} modalHandle>
      <View>
        <Text
          className="text-ink-muted text-base font-hand"
          style={{ transform: [{ rotate: '-1deg' }] }}
        >
          make it look like yours
        </Text>
        <Text className="text-ink text-4xl font-display mt-0.5">Theme</Text>
        <Text className="text-ink-muted text-sm mt-2 leading-5">
          Pick a light/dark mode and an accent colour. Applied instantly and stored on-device.
        </Text>
      </View>

      <Animated.View entering={FadeInDown.delay(60).duration(400)}>
        <Card>
          <CardTitle icon={<HandIcon name="droplet" size={14} color={palette.inkMuted} />}>
            Appearance
          </CardTitle>
          <Text
            className="text-ink-muted text-base font-hand mb-2"
            style={{ transform: [{ rotate: '-1deg' }] }}
          >
            theme
          </Text>
          <View className="flex-row flex-wrap gap-2 mb-5">
            {MODES.map((m) => {
              const selected = mode === m.value;
              return (
                <Pressable
                  key={m.value}
                  onPress={() => pickMode(m.value)}
                  className={`flex-row items-center gap-2 px-4 py-2 rounded-full active:opacity-80 ${
                    selected ? 'bg-accent' : 'bg-bg-soft'
                  }`}
                  style={{
                    borderWidth: selected ? 1.5 : 1,
                    borderColor: selected ? palette.ink : palette.ink + '18',
                    shadowColor: selected ? palette.ink : 'transparent',
                    shadowOpacity: selected ? 0.9 : 0,
                    shadowRadius: 0,
                    shadowOffset: { width: 2, height: 2 },
                    elevation: selected ? 2 : 0,
                  }}
                >
                  <HandIcon name={m.icon} size={13} color={selected ? '#fff' : palette.ink} />
                  <Text
                    className={`text-sm ${selected ? 'text-white font-bold' : 'text-ink font-medium'}`}
                  >
                    {m.label}
                  </Text>
                </Pressable>
              );
            })}
          </View>
          <Text
            className="text-ink-muted text-base font-hand mb-3"
            style={{ transform: [{ rotate: '1deg' }] }}
          >
            accent
          </Text>
          <View className="flex-row flex-wrap gap-3">
            {ACCENTS.map((a) => {
              const selected = accent === a.key;
              return (
                <Pressable
                  key={a.key}
                  onPress={() => pickAccent(a.key)}
                  accessibilityLabel={a.label}
                  className="items-center active:opacity-70"
                  hitSlop={6}
                >
                  <View
                    className="w-11 h-11 rounded-full items-center justify-center"
                    style={{
                      backgroundColor: a.hex,
                      borderWidth: 3,
                      borderColor: selected ? palette.bgCard : 'transparent',
                      shadowColor: selected ? a.hex : 'transparent',
                      shadowOpacity: selected ? 0.5 : 0,
                      shadowRadius: 8,
                      shadowOffset: { width: 0, height: 2 },
                    }}
                  >
                    {selected && <HandIcon name="check" size={18} color="white" />}
                  </View>
                  <Text
                    className={`text-xs mt-1.5 ${selected ? 'text-ink font-bold' : 'text-ink-muted'}`}
                  >
                    {a.label}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </Card>
      </Animated.View>
    </Screen>
  );
}
