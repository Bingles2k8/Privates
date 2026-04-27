// Cosmetics type system. The character (the mascot's face) plus a stack of
// accessories ("slots"). One item per slot at a time. Render order is fixed
// by SLOT_Z_ORDER so e.g. the scarf always sits in front of the beard and
// the hat always sits in front of the glasses.

export type Slot =
  | 'character'
  | 'makeup'
  | 'facialhair'
  | 'glasses'
  | 'mouth'
  | 'neck'
  | 'hat'
  | 'sticker';

/**
 * Render order, back to front. Index in this array is the z-index for the
 * item rendered in that slot. The Character component iterates this array
 * in order and stacks each slot's item on top of the previous.
 */
export const SLOT_Z_ORDER: readonly Slot[] = [
  'character',
  'makeup',
  'facialhair',
  'glasses',
  'mouth',
  'neck',
  'hat',
  'sticker',
] as const;

export type PackId =
  | 'characters'
  | 'hats'
  | 'eyewear'
  | 'facialhair'
  | 'neck'
  | 'mouth'
  | 'makeup'
  | 'stickers';

export const ALL_PACK_IDS: readonly PackId[] = [
  'characters',
  'hats',
  'eyewear',
  'facialhair',
  'neck',
  'mouth',
  'makeup',
  'stickers',
] as const;

export type CosmeticItem = {
  /** Stable id, e.g. "character.frog" or "hat.beanie". Used in IAP unlocks
   *  records, persisted outfit, and the art registry lookup. Don't rename. */
  id: string;
  slot: Slot;
  /** Display name shown in the wardrobe. */
  name: string;
  /** Pack the item belongs to. Undefined for items that are free by default. */
  pack?: PackId;
  /** True when this item is available without any purchase. The OG mascot
   *  and the 5 free new characters are the only items where this is true. */
  freeByDefault: boolean;
};

export type Pack = {
  id: PackId;
  /** Display name in the supporter screen and unlock CTAs. */
  name: string;
  /** IAP product ID matching App Store Connect. */
  productId: string;
  /** Display price string fallback if StoreKit can't be reached. */
  fallbackPrice: string;
  /**
   * `permanent: true` packs are covered by the everything-pack meta-unlock.
   * Themed or timed drops (Halloween pack, an event-tied hat, etc.) should
   * be added with `permanent: false` so the everything-pack stays scoped to
   * the always-on roster — themed packs are sold separately and remain
   * owned forever once bought, even if the pack is delisted from the store.
   */
  permanent: boolean;
  /** Short pitch line shown alongside the price. */
  kicker: string;
};

/** The everything-pack product. Standalone — not in ALL_PACK_IDS because it
 *  isn't a category, it's a meta-unlock that grants any item whose pack is
 *  marked `permanent: true`. */
export const EVERYTHING_PRODUCT_ID = 'com.bingles.privates.unlock.everything';
export const EVERYTHING_FALLBACK_PRICE = '$4.99';

/**
 * The user's currently-equipped outfit. `character` is always set; every
 * other slot can be `null` (= nothing equipped in that slot). Persisted to
 * the encrypted settings table via `src/data/wardrobe.ts`.
 */
export type Outfit = {
  character: string;
  hat: string | null;
  glasses: string | null;
  facialhair: string | null;
  mouth: string | null;
  neck: string | null;
  makeup: string | null;
  sticker: string | null;
};

/** ID of the original mascot — always free, always the default character. */
export const DEFAULT_CHARACTER_ID = 'character.mascot';

export const DEFAULT_OUTFIT: Outfit = {
  character: DEFAULT_CHARACTER_ID,
  hat: null,
  glasses: null,
  facialhair: null,
  mouth: null,
  neck: null,
  makeup: null,
  sticker: null,
};
