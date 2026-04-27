// In-app purchase state. Mirrors session.ts: zustand store hydrated from
// settings on demand, with persistence helpers that round-trip through the
// existing settings table.
//
// Strict lazy contract: nothing in this file (or anything it imports) may
// touch the network or the StoreKit SDK at module-load time. The supporter
// screen is the single entry point; everything below only fires from there.

import { create } from 'zustand';
import { DEFAULT_SETTINGS, loadSettings, saveSettings } from '@/data/settings';

export type IapEntitlements = {
  supporter: boolean;
  tipsTotalCents: number;
  unlocks: Record<string, boolean>;
};

type IapState = {
  entitlements: IapEntitlements;
  hydrated: boolean;
  setEntitlements: (next: IapEntitlements) => void;
  hydrate: (next: IapEntitlements) => void;
  recordTip: (cents: number) => void;
  setUnlock: (productId: string, owned: boolean) => void;
};

export const useIap = create<IapState>((set, get) => ({
  entitlements: DEFAULT_SETTINGS.iap,
  hydrated: false,
  setEntitlements: (next) => {
    set({ entitlements: next });
    void persistEntitlements(next);
  },
  hydrate: (next) => set({ entitlements: next, hydrated: true }),
  recordTip: (cents) => {
    const cur = get().entitlements;
    const next: IapEntitlements = {
      ...cur,
      supporter: true,
      tipsTotalCents: cur.tipsTotalCents + Math.max(0, Math.round(cents)),
    };
    set({ entitlements: next });
    void persistEntitlements(next);
  },
  setUnlock: (productId, owned) => {
    const cur = get().entitlements;
    const next: IapEntitlements = {
      ...cur,
      unlocks: { ...cur.unlocks, [productId]: owned },
    };
    set({ entitlements: next });
    void persistEntitlements(next);
  },
}));

export async function hydrateIapFromSettings(): Promise<void> {
  try {
    const s = await loadSettings();
    useIap.getState().hydrate(s.iap);
  } catch {
    /* keep defaults */
  }
}

async function persistEntitlements(next: IapEntitlements): Promise<void> {
  const cur = await loadSettings();
  await saveSettings({ ...cur, iap: next });
}
