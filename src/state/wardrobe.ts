// Wardrobe state — the user's currently-equipped outfit. Mirrors the
// pattern from src/state/iap.ts: Zustand store hydrated from settings
// once at unlock time, with a persistence helper that round-trips through
// the encrypted settings table.
//
// Strict lazy contract: nothing here imports from the network or
// StoreKit modules. Equipping is purely local.

import { create } from 'zustand';
import { DEFAULT_SETTINGS, loadSettings, saveSettings } from '@/data/settings';
import {
  DEFAULT_CHARACTER_ID,
  DEFAULT_OUTFIT,
  SLOT_Z_ORDER,
  type Outfit,
  type Slot,
} from '@/cosmetics/types';
import { getItem, itemsBySlot } from '@/cosmetics/catalog';
import { isItemUnlocked, type UnlocksMap } from '@/cosmetics/entitlements';

type WardrobeState = {
  outfit: Outfit;
  hydrated: boolean;
  hydrate: (next: Outfit) => void;
  /** Equip an item in its slot, or pass null to clear that slot. */
  setSlot: (slot: Slot, itemId: string | null) => void;
  /** Empty every slot except `character` (which falls back to the OG mascot). */
  resetOutfit: () => void;
  /**
   * Pick a random unlocked item for every slot (or null for non-character
   * slots). The character slot always picks a non-null character.
   */
  shuffleOutfit: (unlocks: UnlocksMap) => void;
};

export const useWardrobe = create<WardrobeState>((set, get) => ({
  outfit: DEFAULT_SETTINGS.wardrobe,
  hydrated: false,
  hydrate: (next) => set({ outfit: next, hydrated: true }),
  setSlot: (slot, itemId) => {
    const cur = get().outfit;
    // Character is required to be set. If a caller tries to clear it,
    // fall back to the OG mascot so renders never crash.
    const value: string | null =
      slot === 'character' ? (itemId ?? DEFAULT_CHARACTER_ID) : itemId;
    if (slot === 'character' && value === null) return;
    const next: Outfit = { ...cur, [slot]: value };
    set({ outfit: next });
    void persistOutfit(next);
  },
  resetOutfit: () => {
    const next: Outfit = { ...DEFAULT_OUTFIT };
    set({ outfit: next });
    void persistOutfit(next);
  },
  shuffleOutfit: (unlocks) => {
    const next: Outfit = { ...DEFAULT_OUTFIT };
    for (const slot of SLOT_Z_ORDER) {
      const candidates = itemsBySlot(slot).filter((i) => isItemUnlocked(i, unlocks));
      if (candidates.length === 0) continue;
      if (slot === 'character') {
        next.character = pickRandom(candidates).id;
      } else {
        // 50% chance any given slot is empty so shuffles aren't always maxed.
        const skip = Math.random() < 0.5;
        next[slot] = skip ? null : pickRandom(candidates).id;
      }
    }
    set({ outfit: next });
    void persistOutfit(next);
  },
}));

function pickRandom<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

export async function hydrateWardrobeFromSettings(): Promise<void> {
  try {
    const s = await loadSettings();
    const sanitized = sanitizeOutfit(s.wardrobe);
    useWardrobe.getState().hydrate(sanitized);
  } catch {
    /* keep defaults */
  }
}

/**
 * Drop any equipped item id that no longer exists in the catalog. Defends
 * against stale data after a future release removes a delisted themed
 * item. Character always falls back to the OG mascot.
 */
function sanitizeOutfit(o: Outfit): Outfit {
  const safe: Outfit = { ...DEFAULT_OUTFIT };
  if (getItem(o.character)) safe.character = o.character;
  for (const slot of SLOT_Z_ORDER) {
    if (slot === 'character') continue;
    const id = o[slot];
    if (id && getItem(id)) safe[slot] = id;
  }
  return safe;
}

async function persistOutfit(next: Outfit): Promise<void> {
  const cur = await loadSettings();
  await saveSettings({ ...cur, wardrobe: next });
}
