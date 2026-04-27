// In-app purchases via expo-iap. The whole module is designed to be a no-op
// until something explicitly calls `initIap()` from the supporter screen —
// imports here must not perform network or StoreKit work at evaluation time.
//
// Architecture:
//   - PRODUCT_CATALOG is the single source of truth for what we sell.
//     Adding a cosmetic pack later = one entry in this list + a renderer
//     hook that reads `useIap().entitlements.unlocks[productId]`.
//   - initIap() is idempotent. It opens the StoreKit connection, attaches
//     transaction listeners, and stays open for the lifetime of the
//     supporter screen mount. teardownIap() reverses it.
//   - Purchase events flow through `purchaseUpdatedListener` — we never read
//     the return value of `requestPurchase` for entitlement state. This is
//     the StoreKit 2 single-source-of-truth pattern: the listener catches
//     everything (initial purchase, restored purchase, Ask-to-Buy resolution,
//     refund / family revocation) and is the only place we mutate state.

import { Platform } from 'react-native';
import {
  endConnection,
  fetchProducts,
  finishTransaction,
  getAvailablePurchases,
  initConnection,
  purchaseErrorListener,
  purchaseUpdatedListener,
  requestPurchase,
  restorePurchases,
  type Product,
  type ProductOrSubscription,
  type Purchase,
} from 'expo-iap';
import { useIap } from '@/state/iap';

export type ProductKind = 'tip' | 'unlock';

export type CatalogEntry = {
  id: string;
  kind: ProductKind;
  consumable: boolean;
  /** Tip amount in cents — used to update the lifetime tip counter. */
  amountCents?: number;
  /** Display label (fallback if StoreKit doesn't return a localized one). */
  label: string;
  /** Short hand-written kicker that pairs with the label in the UI. */
  kicker: string;
};

/**
 * Adding a cosmetic pack later: append a new entry here with `kind: 'unlock'`,
 * `consumable: false`, and a stable product ID matching App Store Connect.
 * The supporter screen will pick it up automatically.
 */
export const PRODUCT_CATALOG: CatalogEntry[] = [
  {
    id: 'com.bingles.privates.tip.small',
    kind: 'tip',
    consumable: true,
    amountCents: 99,
    label: 'Small tip',
    kicker: 'a coffee',
  },
  {
    id: 'com.bingles.privates.tip.medium',
    kind: 'tip',
    consumable: true,
    amountCents: 299,
    label: 'Medium tip',
    kicker: 'a sandwich',
  },
  {
    id: 'com.bingles.privates.tip.large',
    kind: 'tip',
    consumable: true,
    amountCents: 499,
    label: 'Large tip',
    kicker: 'lunch on you',
  },
  // Future cosmetic packs go here as { kind: 'unlock', consumable: false }.
];

const CATALOG_BY_ID = new Map(PRODUCT_CATALOG.map((p) => [p.id, p]));

export const TIP_PRODUCT_IDS = PRODUCT_CATALOG.filter((p) => p.kind === 'tip').map((p) => p.id);

let started = false;
let purchaseSub: { remove: () => void } | null = null;
let errorSub: { remove: () => void } | null = null;
let lastError: string | null = null;
const errorListeners = new Set<(message: string) => void>();

export function getLastIapError(): string | null {
  return lastError;
}

export function onIapError(cb: (message: string) => void): () => void {
  errorListeners.add(cb);
  return () => errorListeners.delete(cb);
}

function emitError(message: string) {
  lastError = message;
  for (const cb of errorListeners) cb(message);
}

/**
 * Open the StoreKit connection and start listening for transactions.
 * Idempotent — safe to call multiple times.
 */
export async function initIap(): Promise<void> {
  if (started) return;
  started = true;
  try {
    await initConnection();
  } catch (e) {
    started = false;
    throw e;
  }

  purchaseSub = purchaseUpdatedListener((purchase) => {
    void handlePurchase(purchase);
  });
  errorSub = purchaseErrorListener((err) => {
    // User cancellation is silent — only surface real failures.
    const code = (err as { code?: string }).code;
    if (code === 'E_USER_CANCELLED' || code === 'user-cancelled') return;
    const msg = (err as { message?: string }).message ?? 'Purchase failed.';
    emitError(msg);
  });
}

/** Close the connection and stop listening. Safe to call when not started. */
export async function teardownIap(): Promise<void> {
  if (!started) return;
  started = false;
  purchaseSub?.remove();
  errorSub?.remove();
  purchaseSub = null;
  errorSub = null;
  try {
    await endConnection();
  } catch {
    /* ignore */
  }
}

/** Fetch product metadata from the App Store for everything in the catalog. */
export async function loadProducts(): Promise<Product[]> {
  if (!started) await initIap();
  const skus = PRODUCT_CATALOG.map((p) => p.id);
  const result = (await fetchProducts({ skus, type: 'in-app' })) as
    | ProductOrSubscription[]
    | null;
  if (!result) return [];
  return result.filter((p): p is Product => p.type === 'in-app');
}

/**
 * Kick off a purchase. Resolution flows through the transaction listener —
 * don't rely on the resolved value of this promise for entitlement state.
 */
export async function purchase(productId: string): Promise<void> {
  if (!started) await initIap();
  if (!CATALOG_BY_ID.has(productId)) {
    throw new Error(`Unknown product id: ${productId}`);
  }
  await requestPurchase({
    request: Platform.OS === 'ios' ? { ios: { sku: productId } } : { android: { skus: [productId] } },
    type: 'in-app',
  });
}

/**
 * Re-check non-consumable entitlements with the App Store. Tips don't
 * restore (they're consumables) but the supporter badge and any future
 * unlocks do. Updates state via the transaction listener.
 */
export async function restore(): Promise<void> {
  if (!started) await initIap();
  await restorePurchases();
  const owned = await getAvailablePurchases();
  for (const p of owned) {
    await applyEntitlement(p, { fromRestore: true });
  }
}

async function handlePurchase(purchase: Purchase): Promise<void> {
  try {
    await applyEntitlement(purchase, { fromRestore: false });
  } catch (e) {
    emitError(stringifyError(e));
  }
}

async function applyEntitlement(
  purchase: Purchase,
  opts: { fromRestore: boolean },
): Promise<void> {
  const productId = purchase.productId;
  const entry = CATALOG_BY_ID.get(productId);
  if (!entry) {
    // Unknown product — finish it so it doesn't hang in the queue.
    await safeFinish(purchase, true);
    return;
  }

  const store = useIap.getState();

  if (entry.kind === 'tip' && entry.consumable) {
    // Restored consumables are ignored on iOS; this branch only fires for
    // fresh tip purchases. Tips grant the supporter badge as a side effect.
    if (!opts.fromRestore && entry.amountCents) {
      store.recordTip(entry.amountCents);
    }
    await safeFinish(purchase, true);
    return;
  }

  if (entry.kind === 'unlock' && !entry.consumable) {
    store.setUnlock(entry.id, true);
    // Any non-consumable purchase also lights up the supporter badge —
    // owning a cosmetic pack means you've supported development too.
    const cur = store.entitlements;
    if (!cur.supporter) {
      store.setEntitlements({ ...cur, supporter: true });
    }
    await safeFinish(purchase, false);
    return;
  }

  await safeFinish(purchase, entry.consumable);
}

async function safeFinish(purchase: Purchase, isConsumable: boolean): Promise<void> {
  try {
    await finishTransaction({ purchase, isConsumable });
  } catch {
    /* ignore — already-finished transactions throw harmlessly */
  }
}

function stringifyError(e: unknown): string {
  if (e instanceof Error) return e.message;
  if (typeof e === 'string') return e;
  return 'Unexpected error.';
}

export function isInCatalog(productId: string): boolean {
  return CATALOG_BY_ID.has(productId);
}

export function catalogEntry(productId: string): CatalogEntry | undefined {
  return CATALOG_BY_ID.get(productId);
}
