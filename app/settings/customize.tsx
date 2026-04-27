import { Pressable, Text, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { Card, CardTitle } from '@/ui/Card';
import { HandIcon } from '@/ui/HandIcon';
import { PrimaryButton } from '@/ui/PrimaryButton';
import { Screen } from '@/ui/Screen';
import { useCustomize } from '@/state/customize';
import {
  HIDEABLE_INSIGHTS,
  HIDEABLE_TODAY,
  type CustomizeScreen,
  type HideableSectionDef,
} from '@/ui/customizeSections';
import { useTheme } from '@/theme/useTheme';

export default function CustomizeScreensScreen() {
  const { palette } = useTheme();
  const todayHidden = useCustomize((s) => s.today);
  const insightsHidden = useCustomize((s) => s.insights);
  const resetScreen = useCustomize((s) => s.resetScreen);

  const anyHidden = todayHidden.length > 0 || insightsHidden.length > 0;

  return (
    <Screen topInset={false} modalHandle>
      <View>
        <Text
          className="text-ink-muted text-base font-hand"
          style={{ transform: [{ rotate: '-1deg' }] }}
        >
          shape the app
        </Text>
        <Text className="text-ink text-4xl font-display mt-0.5">Customize screens</Text>
        <Text className="text-ink-muted text-sm mt-2 leading-5">
          Turn off anything you don&apos;t use. You can also long-press a section on Today or Insights to
          hide it — it&apos;ll show up here to turn back on.
        </Text>
      </View>

      <Animated.View entering={FadeInDown.delay(80).duration(400)}>
        <Card>
          <CardTitle icon={<HandIcon name="smartphone" size={14} color={palette.inkMuted} />}>
            Today
          </CardTitle>
          <View className="gap-1">
            {HIDEABLE_TODAY.map((s) => (
              <SectionToggle
                key={s.id}
                screen="today"
                def={s}
                hidden={todayHidden.includes(s.id)}
              />
            ))}
          </View>
        </Card>
      </Animated.View>

      <Animated.View entering={FadeInDown.delay(140).duration(400)}>
        <Card>
          <CardTitle icon={<HandIcon name="trending-up" size={14} color={palette.inkMuted} />}>
            Insights
          </CardTitle>
          <View className="gap-1">
            {HIDEABLE_INSIGHTS.map((s) => (
              <SectionToggle
                key={s.id}
                screen="insights"
                def={s}
                hidden={insightsHidden.includes(s.id)}
              />
            ))}
          </View>
        </Card>
      </Animated.View>

      {anyHidden && (
        <Animated.View entering={FadeInDown.delay(200).duration(400)}>
          <View className="flex-row gap-3">
            {todayHidden.length > 0 && (
              <View className="flex-1">
                <PrimaryButton
                  label="Reset Today"
                  variant="ghost"
                  onPress={() => resetScreen('today')}
                />
              </View>
            )}
            {insightsHidden.length > 0 && (
              <View className="flex-1">
                <PrimaryButton
                  label="Reset Insights"
                  variant="ghost"
                  onPress={() => resetScreen('insights')}
                />
              </View>
            )}
          </View>
        </Animated.View>
      )}
    </Screen>
  );
}

function SectionToggle({
  screen,
  def,
  hidden,
}: {
  screen: CustomizeScreen;
  def: HideableSectionDef;
  hidden: boolean;
}) {
  const { palette } = useTheme();
  const toggle = useCustomize((s) => s.toggle);
  const visible = !hidden;
  return (
    <Pressable
      onPress={() => toggle(screen, def.id)}
      accessibilityRole="switch"
      accessibilityState={{ checked: visible }}
      accessibilityLabel={def.label}
      accessibilityHint={visible ? 'Double tap to hide' : 'Double tap to show'}
      className="flex-row items-center gap-3 py-2.5 active:opacity-70"
    >
      <View className="flex-1">
        <Text className="text-ink text-base font-medium">{def.label}</Text>
        {def.hint && (
          <Text className="text-ink-muted text-xs mt-0.5 leading-4">{def.hint}</Text>
        )}
      </View>
      <View
        className="rounded-full"
        style={{
          width: 44,
          height: 26,
          backgroundColor: visible ? palette.accent : palette.ink + '22',
          padding: 3,
          alignItems: visible ? 'flex-end' : 'flex-start',
        }}
      >
        <View className="rounded-full bg-white" style={{ width: 20, height: 20 }} />
      </View>
    </Pressable>
  );
}
