import { useEffect, useState } from 'react';
import { Alert, Pressable, Text, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import type { Product } from 'expo-iap';
import { Card, CardTitle } from '@/ui/Card';
import { HandIcon } from '@/ui/HandIcon';
import { PrimaryButton } from '@/ui/PrimaryButton';
import { Screen } from '@/ui/Screen';
import { useTheme } from '@/theme/useTheme';
import { useIap } from '@/state/iap';
import {
  catalogEntry,
  initIap,
  loadProducts,
  onIapError,
  PRODUCT_CATALOG,
  purchase,
  restore,
  teardownIap,
  TIP_PRODUCT_IDS,
  UNLOCK_PRODUCT_IDS,
} from '@/services/iap';
import { ALL_PACKS } from '@/cosmetics/catalog';
import { DEFAULT_OUTFIT, EVERYTHING_PRODUCT_ID, type Outfit, type PackId } from '@/cosmetics/types';
import { Character } from '@/cosmetics/Character';

// One representative item per pack — shown as a small mascot-wearing-it
// preview next to each pack tile so the user can see at a glance what
// the pack contains. Characters pack shows the character itself; the
// everything pack stacks a hat + glasses + sticker on the OG mascot.
const PACK_PREVIEWS: Record<PackId, Partial<Outfit>> = {
  characters: { character: 'character.owl' },
  hats: { character: 'character.cat', hat: 'hat.top' },
  eyewear: { character: 'character.frog', glasses: 'glasses.sunglasses' },
  facialhair: { character: 'character.mascot', facialhair: 'facialhair.handlebar' },
  neck: { character: 'character.ghost', neck: 'neck.bowtie' },
  mouth: { character: 'character.sunflower', mouth: 'mouth.lollipop' },
  makeup: { character: 'character.smiley', makeup: 'makeup.lipstick' },
  stickers: { character: 'character.moon', sticker: 'sticker.hearts' },
};

const EVERYTHING_PREVIEW: Partial<Outfit> = {
  character: 'character.pumpkin',
  hat: 'hat.top',
  glasses: 'glasses.round',
  sticker: 'sticker.sparkles',
};

const PACK_PREVIEW_SIZE = 44;

type LoadState = 'idle' | 'loading' | 'ready' | 'error';

export default function SupporterScreen() {
  const { palette } = useTheme();
  const entitlements = useIap((s) => s.entitlements);

  const [products, setProducts] = useState<Product[]>([]);
  const [loadState, setLoadState] = useState<LoadState>('idle');
  const [loadError, setLoadError] = useState<string | null>(null);
  const [busyProductId, setBusyProductId] = useState<string | null>(null);
  const [restoring, setRestoring] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setLoadState('loading');
    (async () => {
      try {
        await initIap();
        const list = await loadProducts();
        if (cancelled) return;
        setProducts(list);
        setLoadState('ready');
      } catch (e) {
        if (cancelled) return;
        setLoadError(e instanceof Error ? e.message : String(e));
        setLoadState('error');
      }
    })();

    const off = onIapError((msg) => {
      if (cancelled) return;
      setBusyProductId(null);
      setRestoring(false);
      Alert.alert('Purchase failed', msg);
    });

    return () => {
      cancelled = true;
      off();
      void teardownIap();
    };
  }, []);

  async function onTip(productId: string) {
    if (busyProductId) return;
    try {
      setBusyProductId(productId);
      await purchase(productId);
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      Alert.alert('Purchase failed', msg);
    } finally {
      setBusyProductId(null);
    }
  }

  async function onRestore() {
    if (restoring) return;
    try {
      setRestoring(true);
      await restore();
      Alert.alert('Done', 'Past purchases have been re-checked.');
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      Alert.alert('Restore failed', msg);
    } finally {
      setRestoring(false);
    }
  }

  const tipProducts = TIP_PRODUCT_IDS.map((id) => products.find((p) => p.id === id)).filter(
    (p): p is Product => Boolean(p),
  );
  const unlockProducts = UNLOCK_PRODUCT_IDS.map((id) => products.find((p) => p.id === id)).filter(
    (p): p is Product => Boolean(p),
  );
  const everythingProduct = unlockProducts.find((p) => p.id === EVERYTHING_PRODUCT_ID);
  const packProducts = unlockProducts.filter((p) => p.id !== EVERYTHING_PRODUCT_ID);
  const ownsEverything = Boolean(entitlements.unlocks[EVERYTHING_PRODUCT_ID]);

  return (
    <Screen topInset={false} modalHandle>
      <View>
        <Text
          className="text-ink-muted text-base font-hand"
          style={{ transform: [{ rotate: '-1deg' }] }}
        >
          totally optional
        </Text>
        <Text className="text-ink text-4xl font-display mt-0.5">Support development</Text>
        <Text className="text-ink-muted text-sm mt-2 leading-5">
          Privates is free and stays free. If you&apos;d like to chip in, a tip helps cover the time
          and the developer-account fee. Nothing here changes the app — it&apos;s just a thank-you.
        </Text>
      </View>

      <Animated.View entering={FadeInDown.duration(400)}>
        <Card>
          <CardTitle icon={<HandIcon name="alert-circle" size={14} color={palette.inkMuted} />}>
            Heads up about the network
          </CardTitle>
          <Text className="text-ink-muted text-sm leading-5">
            Opening this page is the only time Privates talks to the internet. We connect to
            Apple&apos;s servers to load tip prices and process payments.
          </Text>
        </Card>
      </Animated.View>

      {entitlements.supporter && (
        <Animated.View entering={FadeInDown.delay(60).duration(400)}>
          <Card tone="soft">
            <CardTitle icon={<HandIcon name="heart" size={14} color={palette.accent} />}>
              You&apos;re a supporter
            </CardTitle>
            <Text className="text-ink-muted text-sm leading-5">
              {entitlements.tipsTotalCents > 0
                ? `Lifetime tips on this device: ${formatCents(entitlements.tipsTotalCents)}. Thank you, genuinely.`
                : 'Thanks for the support.'}
            </Text>
          </Card>
        </Animated.View>
      )}

      {loadState === 'ready' && everythingProduct ? (
        <Animated.View entering={FadeInDown.delay(160).duration(400)}>
          <Card tone={ownsEverything ? 'soft' : 'default'}>
            <CardTitle icon={<HandIcon name="star" size={14} color={palette.accent} />}>
              {ownsEverything ? 'You own the everything pack' : 'Everything pack'}
            </CardTitle>
            <Text className="text-ink-muted text-sm leading-5 mb-3">
              Unlocks every cosmetic pack — characters, hats, glasses, the lot. Also covers any
              future permanent additions automatically. Themed or seasonal drops are sold
              separately.
            </Text>
            <Pressable
              disabled={busyProductId !== null || ownsEverything}
              onPress={() => onTip(everythingProduct.id)}
              className="flex-row items-center gap-3 py-3 active:opacity-70"
              style={{ opacity: ownsEverything ? 0.6 : 1 }}
            >
              <Character
                outfit={{ ...DEFAULT_OUTFIT, ...EVERYTHING_PREVIEW }}
                size={PACK_PREVIEW_SIZE}
                mood="calm"
                interactive={false}
                rotate="0deg"
              />
              <View className="flex-1">
                <Text
                  className="text-ink-muted text-xs font-hand"
                  style={{ transform: [{ rotate: '-1deg' }] }}
                >
                  one and done
                </Text>
                <Text className="text-ink text-lg font-displayBold mt-0.5">Everything pack</Text>
              </View>
              <Text className="text-ink text-base font-bold">
                {ownsEverything
                  ? 'Owned'
                  : busyProductId === everythingProduct.id
                    ? '…'
                    : everythingProduct.displayPrice}
              </Text>
            </Pressable>
          </Card>
        </Animated.View>
      ) : null}

      {loadState === 'ready' && packProducts.length > 0 ? (
        <Animated.View entering={FadeInDown.delay(200).duration(400)}>
          <Card>
            <CardTitle icon={<HandIcon name="check-square" size={14} color={palette.accent} />}>
              Cosmetic packs
            </CardTitle>
            <Text className="text-ink-muted text-xs mb-3">
              Each pack unlocks a category of items in the wardrobe. None of this gates app
              features — it&apos;s pure dress-up.
            </Text>
            {ALL_PACKS.map((pack, i) => {
              const product = packProducts.find((p) => p.id === pack.productId);
              if (!product) return null;
              const owned =
                Boolean(entitlements.unlocks[pack.productId]) ||
                (pack.permanent && ownsEverything);
              const busy = busyProductId === pack.productId;
              const otherBusy = busyProductId !== null && busyProductId !== pack.productId;
              const isLast = i === packProducts.length - 1;
              return (
                <Pressable
                  key={pack.productId}
                  onPress={() => onTip(pack.productId)}
                  disabled={busyProductId !== null || owned}
                  className="flex-row items-center gap-3 py-3 active:opacity-70"
                  style={{
                    borderBottomWidth: isLast ? 0 : 1,
                    borderBottomColor: palette.ink + '14',
                    opacity: otherBusy ? 0.5 : owned ? 0.6 : 1,
                  }}
                >
                  <Character
                    outfit={{ ...DEFAULT_OUTFIT, ...PACK_PREVIEWS[pack.id] }}
                    size={PACK_PREVIEW_SIZE}
                    mood="calm"
                    interactive={false}
                    rotate="0deg"
                  />
                  <View className="flex-1">
                    <Text
                      className="text-ink-muted text-xs font-hand"
                      style={{ transform: [{ rotate: '-1deg' }] }}
                    >
                      {pack.kicker}
                    </Text>
                    <Text className="text-ink text-lg font-displayBold mt-0.5">{pack.name}</Text>
                  </View>
                  <Text className="text-ink text-base font-bold">
                    {owned ? 'Owned' : busy ? '…' : product.displayPrice}
                  </Text>
                </Pressable>
              );
            })}
          </Card>
        </Animated.View>
      ) : null}

      <Animated.View entering={FadeInDown.delay(240).duration(400)}>
        {loadState === 'loading' ? (
          <Card>
            <CardTitle icon={<HandIcon name="heart" size={14} color={palette.accent} />}>
              Tip jar
            </CardTitle>
            <Text className="text-ink-muted text-sm">Loading prices…</Text>
          </Card>
        ) : null}

        {loadState === 'error' ? (
          <Card>
            <CardTitle icon={<HandIcon name="alert-triangle" size={14} color="#b45309" />}>
              Couldn&apos;t reach the App Store
            </CardTitle>
            <Text className="text-ink-muted text-sm leading-5 mb-3">
              {loadError ?? 'Something went wrong loading prices.'}
            </Text>
            <PrimaryButton
              label="Try again"
              variant="secondary"
              onPress={() => {
                setLoadState('loading');
                setLoadError(null);
                loadProducts()
                  .then((list) => {
                    setProducts(list);
                    setLoadState('ready');
                  })
                  .catch((e) => {
                    setLoadError(e instanceof Error ? e.message : String(e));
                    setLoadState('error');
                  });
              }}
            />
          </Card>
        ) : null}

        {loadState === 'ready' && tipProducts.length === 0 ? (
          <Card>
            <CardTitle icon={<HandIcon name="heart" size={14} color={palette.accent} />}>
              Tip jar
            </CardTitle>
            <Text className="text-ink-muted text-sm leading-5">
              No products available right now. This usually means the App Store is reachable but
              the products haven&apos;t been approved yet.
            </Text>
          </Card>
        ) : null}

        {loadState === 'ready' && tipProducts.length > 0 ? (
          <Card>
            <CardTitle icon={<HandIcon name="heart" size={14} color={palette.accent} />}>
              Tip jar
            </CardTitle>
            <Text className="text-ink-muted text-xs mb-3">
              One-off, no subscription. Choose any amount.
            </Text>
            {tipProducts.map((product, i) => {
              const entry = catalogEntry(product.id);
              const busy = busyProductId === product.id;
              const otherBusy = busyProductId !== null && busyProductId !== product.id;
              const isLast = i === tipProducts.length - 1;
              return (
                <Pressable
                  key={product.id}
                  onPress={() => onTip(product.id)}
                  disabled={busyProductId !== null}
                  className="flex-row items-center gap-4 py-3 active:opacity-70"
                  style={{
                    borderBottomWidth: isLast ? 0 : 1,
                    borderBottomColor: palette.ink + '14',
                    opacity: otherBusy ? 0.5 : 1,
                  }}
                >
                  <View className="flex-1">
                    <Text
                      className="text-ink-muted text-xs font-hand"
                      style={{ transform: [{ rotate: '-1deg' }] }}
                    >
                      {entry?.kicker ?? ''}
                    </Text>
                    <Text className="text-ink text-lg font-displayBold mt-0.5">
                      {entry?.label ?? product.title}
                    </Text>
                  </View>
                  <Text className="text-ink text-base font-bold">
                    {busy ? '…' : product.displayPrice}
                  </Text>
                </Pressable>
              );
            })}
          </Card>
        ) : null}
      </Animated.View>

      <Animated.View entering={FadeInDown.delay(280).duration(400)}>
        <Card>
          <CardTitle icon={<HandIcon name="repeat" size={14} color={palette.inkMuted} />}>
            Reinstalled the app?
          </CardTitle>
          <Text className="text-ink-muted text-sm leading-5 mb-4">
            Past unlocks like the supporter badge live in your Apple ID. Restore re-checks
            them with the App Store and turns them back on. Tips don&apos;t restore — they
            were one-offs.
          </Text>
          <PrimaryButton
            label={restoring ? 'Restoring…' : 'Restore purchases'}
            variant="secondary"
            disabled={restoring || loadState === 'loading'}
            onPress={onRestore}
          />
        </Card>
      </Animated.View>

      {__DEV__ && PRODUCT_CATALOG.length > 0 ? (
        <View className="items-center mt-2">
          <Text className="text-ink-dim text-xs">
            {PRODUCT_CATALOG.length} products in catalog · {products.length} loaded
          </Text>
        </View>
      ) : null}
    </Screen>
  );
}

function formatCents(cents: number): string {
  return `$${(cents / 100).toFixed(2)}`;
}
