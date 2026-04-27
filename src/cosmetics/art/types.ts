// Shared types for cosmetic art components. Every item — character bodies,
// hats, glasses, etc. — receives the same `ArtProps` so the Character
// component can stack them uniformly. Items position themselves relative
// to the standard face anchors so they line up across characters.

import type { ReactNode } from 'react';

export type FaceAnchors = {
  /** Centre of the face (used for body, mouth, etc.). */
  cx: number;
  cy: number;
  /** Vertical y of the eye line. */
  eyeY: number;
  /** Horizontal offset from cx to each eye centre. */
  eyeOffset: number;
  /** y of the mouth (where mouth accessories pivot from). */
  mouthY: number;
  /** y of the top of the head (where hats sit on). */
  headTop: number;
  /** y of the neck/lower edge (where scarves wrap). */
  neckY: number;
};

export type ArtProps = {
  /** Canvas width/height in pixels. */
  size: number;
  /** Pencil-main stroke colour, ~80% alpha of palette.ink. */
  ink: string;
  /** Pencil-ghost stroke colour, ~33% alpha of palette.ink. */
  ghostInk: string;
  /** Length argument for `DiscretePathEffect` — shorter = wobblier. */
  jitterLen: number;
  /** Deviation argument for `DiscretePathEffect` — larger = more wiggle. */
  jitterDev: number;
  /** Standard face anchors. All accessory art positions itself with these. */
  anchors: FaceAnchors;
  /** Skin / fill colour for character bodies. Accessories may ignore this. */
  skin: string;
  /** Cheek colour for blush / makeup. */
  cheek: string;
};

/** Component signature for every art module. Returns Skia elements wrapped
 *  in a Group, suitable for nesting inside a single Skia <Canvas>. */
export type ArtComponent = (props: ArtProps) => ReactNode;

/**
 * Compute the standard face anchors for a given size. Matches the original
 * Mascot.tsx layout so the OG character preserves its appearance exactly.
 */
export function faceAnchors(size: number): FaceAnchors {
  const cx = size / 2;
  const cy = size / 2 + size * 0.04;
  return {
    cx,
    cy,
    eyeY: cy - size * 0.06,
    eyeOffset: size * 0.15,
    mouthY: cy + size * 0.12,
    headTop: cy - size * 0.42,
    // Neck is intentionally on the *lower face* (chin area) rather than below
    // it: most characters' bodies don't extend much past the chin (round
    // heads, cat, owl, etc.) so a strictly-below-head anchor leaves scarves
    // and ties floating in space. Items in src/cosmetics/art/neck.tsx are
    // tuned to wrap around this anchor.
    neckY: cy + size * 0.28,
  };
}
