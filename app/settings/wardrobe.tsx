import { useMemo, useState } from 'react';
import { Alert, Pressable, ScrollView, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { Card, CardTitle } from '@/ui/Card';
import { HandIcon } from '@/ui/HandIcon';
import { PrimaryButton } from '@/ui/PrimaryButton';
import { Screen } from '@/ui/Screen';
import { Character } from '@/cosmetics/Character';
import { ALL_ITEMS, getItem, itemsBySlot, PACKS } from '@/cosmetics/catalog';
import { isItemUnlocked } from '@/cosmetics/entitlements';
import {
  DEFAULT_CHARACTER_ID,
  DEFAULT_OUTFIT,
  type Outfit,
  type Slot,
} from '@/cosmetics/types';
import { useWardrobe } from '@/state/wardrobe';
import { useIap } from '@/state/iap';
import { useTheme } from '@/theme/useTheme';

const SLOT_LABELS: Record<Slot, { label: string }> = {
  character: { label: 'Character' },
  hat: { label: 'Hat' },
  glasses: { label: 'Glasses' },
  facialhair: { label: 'Facial hair' },
  mouth: { label: 'Mouth' },
  neck: { label: 'Neck' },
  makeup: { label: 'Makeup' },
  sticker: { label: 'Sticker' },
};

const SLOT_ORDER: Slot[] = [
  'character',
  'hat',
  'glasses',
  'facialhair',
  'mouth',
  'neck',
  'makeup',
  'sticker',
];

export default function WardrobeScreen() {
  const router = useRouter();
  const { palette } = useTheme();
  const outfit = useWardrobe((s) => s.outfit);
  const setSlot = useWardrobe((s) => s.setSlot);
  const resetOutfit = useWardrobe((s) => s.resetOutfit);
  const shuffleOutfit = useWardrobe((s) => s.shuffleOutfit);
  const unlocks = useIap((s) => s.entitlements.unlocks);

  const [activeSlot, setActiveSlot] = useState<Slot>('character');

  const slotItems = useMemo(() => itemsBySlot(activeSlot), [activeSlot]);
  const totalUnlocked = useMemo(
    () => ALL_ITEMS.filter((i) => isItemUnlocked(i, unlocks)).length,
    [unlocks],
  );
  // Each slot's items belong to a single pack (with a free subset for the
  // character slot). Look up the pack metadata so the slot grid can show
  // a single banner instead of repeating the price under every tile.
  const slotPack = useMemo(() => {
    const firstPaid = slotItems.find((i) => i.pack);
    return firstPaid?.pack ? PACKS[firstPaid.pack] : null;
  }, [slotItems]);
  const slotPackOwned = useMemo(() => {
    if (!slotPack) return false;
    return slotItems.every((i) => isItemUnlocked(i, unlocks));
  }, [slotItems, slotPack, unlocks]);

  function onPickItem(itemId: string) {
    const item = getItem(itemId);
    if (!item) return;
    if (!isItemUnlocked(item, unlocks)) {
      const pack = item.pack ? PACKS[item.pack] : null;
      const packName = pack?.name ?? 'a pack';
      const price = pack?.fallbackPrice ?? '$0.99';
      Alert.alert(
        'Locked',
        `${item.name} is part of ${packName} (${price}).`,
        [
          { text: 'Maybe later', style: 'cancel' },
          {
            text: 'View packs',
            onPress: () => router.push('/settings/supporter'),
          },
        ],
      );
      return;
    }
    setSlot(activeSlot, itemId);
  }

  function onClearSlot() {
    if (activeSlot === 'character') return; // can't clear character
    setSlot(activeSlot, null);
  }

  function onShuffle() {
    shuffleOutfit(unlocks);
  }

  function onReset() {
    Alert.alert('Reset outfit?', 'Removes every accessory and resets to the default character.', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Reset', style: 'destructive', onPress: () => resetOutfit() },
    ]);
  }

  return (
    <Screen topInset={false} modalHandle>
      <View>
        <Text
          className="text-ink-muted text-base font-hand"
          style={{ transform: [{ rotate: '-1deg' }] }}
        >
          dress &lsquo;em up
        </Text>
        <Text className="text-ink text-4xl font-display mt-0.5">Wardrobe</Text>
        <Text className="text-ink-muted text-sm mt-2 leading-5">
          Tap any item to equip it. Locked items are in a pack — tap to see how to unlock.
        </Text>
      </View>

      {/* Big preview */}
      <Animated.View entering={FadeInDown.duration(400)}>
        <Card>
          <View className="items-center py-2">
            <Character
              outfit={outfit}
              size={160}
              mood="calm"
              bob
              interactive={false}
              rotate="0deg"
            />
          </View>
          <View className="flex-row gap-2 mt-2">
            <PrimaryButton label="Shuffle" variant="secondary" onPress={onShuffle} />
            <PrimaryButton label="Reset" variant="secondary" onPress={onReset} />
          </View>
        </Card>
      </Animated.View>

      {/* Slot tabs */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: 4, gap: 8 }}
        style={{ marginHorizontal: -4 }}
      >
        {SLOT_ORDER.map((slot) => {
          const active = slot === activeSlot;
          return (
            <Pressable
              key={slot}
              onPress={() => setActiveSlot(slot)}
              className="rounded-2xl px-3 py-2"
              style={{
                backgroundColor: active ? palette.accent : palette.bgCard,
                borderWidth: 1.5,
                borderColor: active ? palette.accent : palette.ink + '22',
              }}
            >
              <Text
                className="text-sm"
                style={{ color: active ? '#ffffff' : palette.ink, fontWeight: '600' }}
              >
                {SLOT_LABELS[slot].label}
              </Text>
            </Pressable>
          );
        })}
      </ScrollView>

      {/* Item grid */}
      <Animated.View entering={FadeInDown.delay(80).duration(400)}>
        <Card>
          <CardTitle icon={<HandIcon name="edit-2" size={14} color={palette.inkMuted} />}>
            {SLOT_LABELS[activeSlot].label}
          </CardTitle>

          {slotPack && !slotPackOwned ? (
            <Pressable
              onPress={() => router.push('/settings/supporter')}
              className="rounded-2xl py-2.5 px-3 mb-3 flex-row items-center gap-2"
              style={{
                backgroundColor: palette.accent + '14',
                borderWidth: 1.5,
                borderColor: palette.accent + '55',
              }}
            >
              <HandIcon name="lock" size={14} color={palette.accent} />
              <Text className="text-ink-muted text-xs leading-4 flex-1">
                {activeSlot === 'character'
                  ? `5 free, 5 in the ${slotPack.name} (${slotPack.fallbackPrice}) — tap to unlock.`
                  : `Sold as a pack — ${slotPack.fallbackPrice} unlocks all ${slotItems.length}.`}
              </Text>
            </Pressable>
          ) : null}

          {activeSlot !== 'character' ? (
            <Pressable
              onPress={onClearSlot}
              className="rounded-2xl py-2 px-3 mb-3 flex-row items-center gap-2"
              style={{
                borderWidth: 1.5,
                borderColor: outfit[activeSlot] ? palette.ink + '40' : palette.accent,
                backgroundColor:
                  outfit[activeSlot] === null ? palette.accent + '20' : 'transparent',
              }}
            >
              <HandIcon name="x-circle" size={14} color={palette.inkMuted} />
              <Text className="text-ink-muted text-sm">
                {outfit[activeSlot] ? 'Tap to remove this item' : 'Nothing equipped'}
              </Text>
            </Pressable>
          ) : null}

          <View className="flex-row flex-wrap" style={{ marginHorizontal: -4 }}>
            {slotItems.map((it) => {
              const unlocked = isItemUnlocked(it, unlocks);
              const equipped = outfit[activeSlot] === it.id;
              const previewOutfit: Outfit =
                activeSlot === 'character'
                  ? { ...DEFAULT_OUTFIT, character: it.id }
                  : { ...DEFAULT_OUTFIT, character: outfit.character, [activeSlot]: it.id };
              return (
                <Pressable
                  key={it.id}
                  onPress={() => onPickItem(it.id)}
                  className="rounded-2xl items-center"
                  style={{
                    width: '33.3333%',
                    paddingHorizontal: 4,
                    marginBottom: 8,
                  }}
                >
                  <View
                    className="rounded-2xl items-center justify-center w-full"
                    style={{
                      paddingVertical: 8,
                      backgroundColor: equipped ? palette.accent + '22' : palette.bgSoft,
                      borderWidth: 1.5,
                      borderColor: equipped ? palette.accent : 'transparent',
                      opacity: unlocked ? 1 : 0.55,
                    }}
                  >
                    <Character
                      outfit={previewOutfit}
                      size={80}
                      mood="calm"
                      interactive={false}
                      rotate="0deg"
                    />
                    {!unlocked ? (
                      <View
                        style={{
                          position: 'absolute',
                          top: 6,
                          right: 6,
                          backgroundColor: palette.bgCard,
                          borderRadius: 12,
                          width: 22,
                          height: 22,
                          alignItems: 'center',
                          justifyContent: 'center',
                          borderWidth: 1,
                          borderColor: palette.ink + '40',
                        }}
                      >
                        <HandIcon name="lock" size={11} color={palette.inkMuted} />
                      </View>
                    ) : null}
                  </View>
                  <Text
                    className="text-ink text-xs mt-1 text-center"
                    numberOfLines={1}
                    style={{ width: '100%' }}
                  >
                    {it.name}
                  </Text>
                  <Text className="text-ink-dim text-[10px]">{equipped ? 'equipped' : ' '}</Text>
                </Pressable>
              );
            })}
          </View>
        </Card>
      </Animated.View>

      <View className="items-center mt-1">
        <Text className="text-ink-dim text-xs">
          {totalUnlocked} of {ALL_ITEMS.length} items unlocked
        </Text>
      </View>

      {/* Default character note */}
      {outfit.character !== DEFAULT_CHARACTER_ID ? (
        <Pressable onPress={() => setSlot('character', DEFAULT_CHARACTER_ID)}>
          <Text
            className="text-ink-muted text-xs text-center mt-1 underline"
            style={{ opacity: 0.7 }}
          >
            Restore default character
          </Text>
        </Pressable>
      ) : null}
    </Screen>
  );
}
