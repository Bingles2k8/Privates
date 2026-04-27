// Single source of truth for all cosmetic items and packs. Adding a new
// permanent item: append it here under the right slot with the right pack
// id, then implement its art component in `src/cosmetics/art/`. Adding a
// themed/timed drop: create a new Pack with `permanent: false`.

import {
  ALL_PACK_IDS,
  type CosmeticItem,
  type Pack,
  type PackId,
  type Slot,
} from './types';

/** IAP product ID prefix for cosmetic packs. */
const PACK_PRODUCT_PREFIX = 'com.bingles.privates.unlock.pack.';

function packProductId(id: PackId): string {
  return `${PACK_PRODUCT_PREFIX}${id}`;
}

export const PACKS: Record<PackId, Pack> = {
  characters: {
    id: 'characters',
    name: 'Characters pack',
    productId: packProductId('characters'),
    fallbackPrice: '$0.99',
    permanent: true,
    kicker: 'five extra faces',
  },
  hats: {
    id: 'hats',
    name: 'Hats pack',
    productId: packProductId('hats'),
    fallbackPrice: '$0.99',
    permanent: true,
    kicker: 'ten lids',
  },
  eyewear: {
    id: 'eyewear',
    name: 'Eyewear pack',
    productId: packProductId('eyewear'),
    fallbackPrice: '$0.99',
    permanent: true,
    kicker: 'five for the eyes',
  },
  facialhair: {
    id: 'facialhair',
    name: 'Facial hair pack',
    productId: packProductId('facialhair'),
    fallbackPrice: '$0.99',
    permanent: true,
    kicker: 'five fuzzy options',
  },
  neck: {
    id: 'neck',
    name: 'Neckwear pack',
    productId: packProductId('neck'),
    fallbackPrice: '$0.99',
    permanent: true,
    kicker: 'five for around the neck',
  },
  mouth: {
    id: 'mouth',
    name: 'Mouth pack',
    productId: packProductId('mouth'),
    fallbackPrice: '$0.99',
    permanent: true,
    kicker: 'five mouth pieces',
  },
  makeup: {
    id: 'makeup',
    name: 'Makeup pack',
    productId: packProductId('makeup'),
    fallbackPrice: '$0.99',
    permanent: true,
    kicker: 'five flourishes',
  },
  stickers: {
    id: 'stickers',
    name: 'Stickers pack',
    productId: packProductId('stickers'),
    fallbackPrice: '$0.99',
    permanent: true,
    kicker: 'ten little floaters',
  },
};

export const ALL_PACKS: Pack[] = ALL_PACK_IDS.map((id) => PACKS[id]);

function item(
  id: string,
  slot: Slot,
  name: string,
  opts: { pack?: PackId; freeByDefault?: boolean } = {},
): CosmeticItem {
  return {
    id,
    slot,
    name,
    pack: opts.pack,
    freeByDefault: opts.freeByDefault ?? false,
  };
}

// Characters: 11 total. The OG mascot + 5 new free + 5 paid (characters pack).
const CHARACTERS: CosmeticItem[] = [
  item('character.mascot', 'character', 'Mascot', { freeByDefault: true }),
  item('character.sunflower', 'character', 'Sunflower', { freeByDefault: true }),
  item('character.frog', 'character', 'Frog', { freeByDefault: true }),
  item('character.ghost', 'character', 'Ghost', { freeByDefault: true }),
  item('character.cat', 'character', 'Cat', { freeByDefault: true }),
  item('character.smiley', 'character', 'Smiley', { freeByDefault: true }),
  item('character.mushroom', 'character', 'Mushroom', { pack: 'characters' }),
  item('character.owl', 'character', 'Owl', { pack: 'characters' }),
  item('character.pumpkin', 'character', 'Pumpkin', { pack: 'characters' }),
  item('character.robot', 'character', 'Robot', { pack: 'characters' }),
  item('character.moon', 'character', 'Moon', { pack: 'characters' }),
];

// Hats: 10. All in hats pack.
const HATS: CosmeticItem[] = [
  item('hat.beanie', 'hat', 'Beanie', { pack: 'hats' }),
  item('hat.cap', 'hat', 'Baseball cap', { pack: 'hats' }),
  item('hat.bucket', 'hat', 'Bucket hat', { pack: 'hats' }),
  item('hat.headband', 'hat', 'Headband', { pack: 'hats' }),
  item('hat.beret', 'hat', 'Beret', { pack: 'hats' }),
  item('hat.bowler', 'hat', 'Bowler', { pack: 'hats' }),
  item('hat.fedora', 'hat', 'Fedora', { pack: 'hats' }),
  item('hat.top', 'hat', 'Top hat', { pack: 'hats' }),
  item('hat.cowboy', 'hat', 'Cowboy hat', { pack: 'hats' }),
  item('hat.bandana', 'hat', 'Bandana', { pack: 'hats' }),
];

// Eyewear: 5. All in eyewear pack.
const EYEWEAR: CosmeticItem[] = [
  item('glasses.round', 'glasses', 'Round glasses', { pack: 'eyewear' }),
  item('glasses.sunglasses', 'glasses', 'Sunglasses', { pack: 'eyewear' }),
  item('glasses.aviators', 'glasses', 'Aviators', { pack: 'eyewear' }),
  item('glasses.monocle', 'glasses', 'Monocle', { pack: 'eyewear' }),
  item('glasses.goggles', 'glasses', 'Ski goggles', { pack: 'eyewear' }),
];

// Facial hair: 5. All in facialhair pack.
const FACIALHAIR: CosmeticItem[] = [
  item('facialhair.handlebar', 'facialhair', 'Handlebar moustache', { pack: 'facialhair' }),
  item('facialhair.goatee', 'facialhair', 'Goatee', { pack: 'facialhair' }),
  item('facialhair.beard', 'facialhair', 'Full beard', { pack: 'facialhair' }),
  item('facialhair.soulpatch', 'facialhair', 'Soul patch', { pack: 'facialhair' }),
  item('facialhair.muttonchops', 'facialhair', 'Mutton chops', { pack: 'facialhair' }),
];

// Neck: 5. All in neck pack.
const NECK: CosmeticItem[] = [
  item('neck.scarf', 'neck', 'Scarf', { pack: 'neck' }),
  item('neck.bowtie', 'neck', 'Bowtie', { pack: 'neck' }),
  item('neck.necktie', 'neck', 'Necktie', { pack: 'neck' }),
  item('neck.pearls', 'neck', 'Pearl necklace', { pack: 'neck' }),
  item('neck.choker', 'neck', 'Choker', { pack: 'neck' }),
];

// Mouth: 5. All in mouth pack.
const MOUTH: CosmeticItem[] = [
  item('mouth.pencil', 'mouth', 'Pencil', { pack: 'mouth' }),
  item('mouth.bubblegum', 'mouth', 'Bubblegum', { pack: 'mouth' }),
  item('mouth.lollipop', 'mouth', 'Lollipop', { pack: 'mouth' }),
  item('mouth.rose', 'mouth', 'Rose', { pack: 'mouth' }),
  item('mouth.whistle', 'mouth', 'Whistle', { pack: 'mouth' }),
];

// Makeup: 5. All in makeup pack.
const MAKEUP: CosmeticItem[] = [
  item('makeup.blush', 'makeup', 'Blush', { pack: 'makeup' }),
  item('makeup.lipstick', 'makeup', 'Lipstick', { pack: 'makeup' }),
  item('makeup.eyeshadow', 'makeup', 'Eyeshadow', { pack: 'makeup' }),
  item('makeup.freckles', 'makeup', 'Freckles', { pack: 'makeup' }),
  item('makeup.beautymark', 'makeup', 'Beauty mark', { pack: 'makeup' }),
];

// Stickers: 10. All in stickers pack.
const STICKERS: CosmeticItem[] = [
  item('sticker.sparkles', 'sticker', 'Sparkles', { pack: 'stickers' }),
  item('sticker.hearts', 'sticker', 'Hearts', { pack: 'stickers' }),
  item('sticker.sweat', 'sticker', 'Sweat drop', { pack: 'stickers' }),
  item('sticker.anger', 'sticker', 'Anger steam', { pack: 'stickers' }),
  item('sticker.sleep', 'sticker', 'Sleep Z', { pack: 'stickers' }),
  item('sticker.bolt', 'sticker', 'Lightning bolt', { pack: 'stickers' }),
  item('sticker.halo', 'sticker', 'Halo', { pack: 'stickers' }),
  item('sticker.butterfly', 'sticker', 'Butterfly', { pack: 'stickers' }),
  item('sticker.tear', 'sticker', 'Tear', { pack: 'stickers' }),
  item('sticker.swirl', 'sticker', 'Swirl', { pack: 'stickers' }),
];

export const ALL_ITEMS: CosmeticItem[] = [
  ...CHARACTERS,
  ...HATS,
  ...EYEWEAR,
  ...FACIALHAIR,
  ...NECK,
  ...MOUTH,
  ...MAKEUP,
  ...STICKERS,
];

const ITEMS_BY_ID = new Map(ALL_ITEMS.map((i) => [i.id, i]));

export function getItem(id: string): CosmeticItem | undefined {
  return ITEMS_BY_ID.get(id);
}

export function itemsBySlot(slot: Slot): CosmeticItem[] {
  return ALL_ITEMS.filter((i) => i.slot === slot);
}

export function itemsByPack(pack: PackId): CosmeticItem[] {
  return ALL_ITEMS.filter((i) => i.pack === pack);
}

/** Map of pack id → IAP product id, for cross-referencing with IAP catalog. */
export const PACK_PRODUCT_IDS: string[] = ALL_PACKS.map((p) => p.productId);
