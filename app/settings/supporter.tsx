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
} from '@/services/iap';

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

      <Animated.View entering={FadeInDown.delay(120).duration(400)}>
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

      <Animated.View entering={FadeInDown.delay(340).duration(400)}>
        <Card>
          <CardTitle icon={<HandIcon name="info" size={14} color={palette.inkMuted} />}>
            What&apos;s next
          </CardTitle>
          <Text className="text-ink-muted text-sm leading-5">
            More cosmetic options are planned — extra mascots, hats, moods, colour packs and
            app skins. None of it will gate features. The plumbing for it lives behind this
            screen, so future packs will appear here without a re-architecture.
          </Text>
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
