import { Alert, Pressable, Text, View } from 'react-native';
import { type ReactNode } from 'react';
import { HandIcon } from './HandIcon';
import { useCustomize } from '@/state/customize';
import { catalogFor, type CustomizeScreen } from './customizeSections';
import { useTheme } from '@/theme/useTheme';

/**
 * Wraps a Today/Insights section so the user can long-press to hide it, and
 * the `customize` settings screen knows to offer it as an item. If the user
 * has hidden this id, renders `null`.
 *
 * Normal taps bubble through to children (nested Pressables keep working) —
 * only long-press is intercepted. Long-press shows a menu: Reorder this
 * screen, Hide this section, Cancel. When the screen is in reorder mode,
 * the section shows up/down arrows and swallows all interactions.
 */
export function HideableSection({
  screen,
  id,
  label,
  children,
}: {
  screen: CustomizeScreen;
  id: string;
  label: string;
  children: ReactNode;
}) {
  const hidden = useCustomize((s) => s[screen].includes(id));
  const hide = useCustomize((s) => s.hide);
  const reorderMode = useCustomize((s) => s.reorderMode);
  const enterReorder = useCustomize((s) => s.enterReorder);
  const moveUp = useCustomize((s) => s.moveUp);
  const moveDown = useCustomize((s) => s.moveDown);
  const { palette } = useTheme();

  if (hidden) return null;

  const isReordering = reorderMode === screen;

  function onLongPress() {
    Alert.alert(label, 'What would you like to do?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Rearrange this screen', onPress: () => enterReorder(screen) },
      { text: 'Hide this section', style: 'destructive', onPress: () => hide(screen, id) },
    ]);
  }

  if (isReordering) {
    const catalog = catalogFor(screen).map((s) => s.id);
    return (
      <View
        style={{
          borderWidth: 2,
          borderColor: palette.accent,
          borderStyle: 'dashed',
          borderRadius: 24,
          padding: 6,
          gap: 8,
        }}
      >
        <View className="opacity-80">{children}</View>
        <View className="flex-row items-center gap-2 px-2 pb-1">
          <Text
            className="text-ink-muted text-xs font-hand flex-1"
            style={{ transform: [{ rotate: '-0.5deg' }] }}
            numberOfLines={1}
          >
            {label}
          </Text>
          <Pressable
            onPress={() => moveUp(screen, id, catalog)}
            hitSlop={10}
            className="rounded-full active:opacity-60"
            style={{
              backgroundColor: palette.bgSoft,
              width: 36,
              height: 36,
              alignItems: 'center',
              justifyContent: 'center',
            }}
            accessibilityLabel={`Move ${label} up`}
          >
            <HandIcon name="chevron-up" size={18} color={palette.ink} />
          </Pressable>
          <Pressable
            onPress={() => moveDown(screen, id, catalog)}
            hitSlop={10}
            className="rounded-full active:opacity-60"
            style={{
              backgroundColor: palette.bgSoft,
              width: 36,
              height: 36,
              alignItems: 'center',
              justifyContent: 'center',
            }}
            accessibilityLabel={`Move ${label} down`}
          >
            <HandIcon name="chevron-down" size={18} color={palette.ink} />
          </Pressable>
        </View>
      </View>
    );
  }

  return (
    <Pressable
      onLongPress={onLongPress}
      delayLongPress={500}
      android_ripple={null}
      unstable_pressDelay={0}
    >
      {children}
    </Pressable>
  );
}
