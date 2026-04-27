// Lookup tables: item id → render component, character id → palette overrides.
// Adding a new permanent item is: register an art component here, add a
// catalog entry in src/cosmetics/catalog.ts.

import { CHARACTER_ART, CHARACTER_PALETTES } from './characters';
import { HAT_ART } from './hats';
import { EYEWEAR_ART } from './eyewear';
import { FACIALHAIR_ART } from './facialhair';
import { NECK_ART } from './neck';
import { MOUTH_ART } from './mouth';
import { MAKEUP_ART } from './makeup';
import { STICKER_ART } from './stickers';
import type { ArtComponent } from './types';

const ART_BY_ID: Record<string, ArtComponent> = {
  ...CHARACTER_ART,
  ...HAT_ART,
  ...EYEWEAR_ART,
  ...FACIALHAIR_ART,
  ...NECK_ART,
  ...MOUTH_ART,
  ...MAKEUP_ART,
  ...STICKER_ART,
};

export function getArt(itemId: string): ArtComponent | undefined {
  return ART_BY_ID[itemId];
}

export function getCharacterPalette(characterId: string): { skin?: string; cheek?: string } {
  return CHARACTER_PALETTES[characterId] ?? {};
}
