// Pure unlock logic. Given an item and the user's IAP unlock map, decide
// whether the item is currently available to equip. No I/O, no side
// effects — easy to test and easy to call from anywhere (wardrobe screen,
// Character component, supporter screen).

import { getItem, PACKS } from './catalog';
import {
  EVERYTHING_PRODUCT_ID,
  type CosmeticItem,
  type PackId,
} from './types';

/** The shape of `useIap().entitlements.unlocks` — IAP product ID → owned. */
export type UnlocksMap = Record<string, boolean>;

/**
 * Returns true if the item is unlocked for the given purchase state.
 * Three ways an item can be unlocked:
 *   1. It's free by default (the OG mascot + 5 free new characters).
 *   2. The user owns the everything-pack AND the item's pack is permanent.
 *   3. The user owns the item's pack directly.
 */
export function isItemUnlocked(item: CosmeticItem, unlocks: UnlocksMap): boolean {
  if (item.freeByDefault) return true;
  if (!item.pack) return true; // Free items without a pack assignment.

  const pack = PACKS[item.pack];
  if (unlocks[pack.productId]) return true;

  if (pack.permanent && unlocks[EVERYTHING_PRODUCT_ID]) return true;

  return false;
}

/** Convenience overload that takes an item id and looks it up in the catalog. */
export function isItemIdUnlocked(itemId: string, unlocks: UnlocksMap): boolean {
  const item = getItem(itemId);
  if (!item) return false;
  return isItemUnlocked(item, unlocks);
}

/**
 * Returns true if the pack is owned outright OR via the everything-pack
 * (when the pack is permanent). Used by the supporter screen to show
 * "Owned" badges and disable the buy button on already-owned packs.
 */
export function isPackUnlocked(packId: PackId, unlocks: UnlocksMap): boolean {
  const pack = PACKS[packId];
  if (unlocks[pack.productId]) return true;
  if (pack.permanent && unlocks[EVERYTHING_PRODUCT_ID]) return true;
  return false;
}

/** True when the user owns the everything-pack meta-unlock. */
export function ownsEverythingPack(unlocks: UnlocksMap): boolean {
  return Boolean(unlocks[EVERYTHING_PRODUCT_ID]);
}
