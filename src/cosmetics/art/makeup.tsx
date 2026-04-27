// Five makeup items. Drawn on the skin under everything else (z-index 1).
// Lipstick recolours the existing mouth area, blush adds extra cheek
// pinkness, freckles speckle across the cheeks/nose.

import { Group, Skia } from '@shopify/react-native-skia';
import type { ArtComponent } from './types';
import { PencilStroke } from './pencil';

const Blush: ArtComponent = ({ size, ink, ghostInk, jitterLen, jitterDev, anchors }) => {
  const { cx, cy } = anchors;
  const strokeW = Math.max(2, size * 0.028);
  // Two extra-pink ovals on the cheek area, more saturated than the
  // default mood-driven cheeks.
  const left = Skia.Path.Make();
  left.addOval({
    x: cx - size * 0.32,
    y: cy + size * 0.04,
    width: size * 0.16,
    height: size * 0.09,
  });
  const right = Skia.Path.Make();
  right.addOval({
    x: cx + size * 0.16,
    y: cy + size * 0.04,
    width: size * 0.16,
    height: size * 0.09,
  });
  return (
    <Group>
      <PencilStroke path={left} ink={ink} ghostInk={ghostInk} strokeWidth={strokeW * 0.6}
        jitterLen={jitterLen * 0.7} jitterDev={jitterDev * 0.6} seedMain={901} seedGhost={903} fill="#ff8aa8" />
      <PencilStroke path={right} ink={ink} ghostInk={ghostInk} strokeWidth={strokeW * 0.6}
        jitterLen={jitterLen * 0.7} jitterDev={jitterDev * 0.6} seedMain={905} seedGhost={907} fill="#ff8aa8" />
    </Group>
  );
};

const Lipstick: ArtComponent = ({ size, ink, ghostInk, jitterLen, jitterDev, anchors }) => {
  const { cx, mouthY } = anchors;
  const strokeW = Math.max(2, size * 0.028);
  // Two-cusp lip shape sitting over the existing mouth.
  const lips = Skia.Path.Make();
  lips.moveTo(cx - size * 0.1, mouthY);
  lips.quadTo(cx - size * 0.05, mouthY - size * 0.03, cx, mouthY - size * 0.005);
  lips.quadTo(cx + size * 0.05, mouthY - size * 0.03, cx + size * 0.1, mouthY);
  lips.quadTo(cx, mouthY + size * 0.04, cx - size * 0.1, mouthY);
  lips.close();
  return (
    <Group>
      <PencilStroke path={lips} ink={ink} ghostInk={ghostInk} strokeWidth={strokeW * 0.7}
        jitterLen={jitterLen * 0.6} jitterDev={jitterDev * 0.5} seedMain={911} seedGhost={913} fill="#c92054" />
    </Group>
  );
};

const Eyeshadow: ArtComponent = ({ size, ink, ghostInk, jitterLen, jitterDev, anchors }) => {
  const { cx, eyeY, eyeOffset } = anchors;
  const strokeW = Math.max(2, size * 0.028);
  const left = Skia.Path.Make();
  left.addOval({
    x: cx - eyeOffset - size * 0.08,
    y: eyeY - size * 0.07,
    width: size * 0.16,
    height: size * 0.04,
  });
  const right = Skia.Path.Make();
  right.addOval({
    x: cx + eyeOffset - size * 0.08,
    y: eyeY - size * 0.07,
    width: size * 0.16,
    height: size * 0.04,
  });
  return (
    <Group>
      <PencilStroke path={left} ink={ink} ghostInk={ghostInk} strokeWidth={strokeW * 0.5}
        jitterLen={jitterLen * 0.6} jitterDev={jitterDev * 0.5} seedMain={921} seedGhost={923} fill="#9b6bd8" />
      <PencilStroke path={right} ink={ink} ghostInk={ghostInk} strokeWidth={strokeW * 0.5}
        jitterLen={jitterLen * 0.6} jitterDev={jitterDev * 0.5} seedMain={925} seedGhost={927} fill="#9b6bd8" />
    </Group>
  );
};

const Freckles: ArtComponent = ({ size, ink, ghostInk, jitterLen, jitterDev, anchors }) => {
  const { cx, cy } = anchors;
  const strokeW = Math.max(2, size * 0.028);
  // Scatter ~10 little dots across the bridge / cheeks area.
  const dots = Skia.Path.Make();
  const pts: [number, number][] = [
    [-0.18, 0.04], [-0.13, 0.07], [-0.08, 0.04], [-0.04, 0.06],
    [0.04, 0.05], [0.08, 0.07], [0.13, 0.04], [0.18, 0.07],
    [-0.05, 0.02], [0.05, 0.02],
  ];
  for (const [dx, dy] of pts) {
    dots.addCircle(cx + dx * size, cy + dy * size, size * 0.011);
  }
  return (
    <Group>
      <PencilStroke path={dots} ink={ink} ghostInk={ghostInk} strokeWidth={strokeW * 0.4}
        jitterLen={jitterLen * 0.4} jitterDev={jitterDev * 0.3} seedMain={931} seedGhost={933} fill="#7a4030" />
    </Group>
  );
};

const BeautyMark: ArtComponent = ({ size, ink, ghostInk, jitterLen, jitterDev, anchors }) => {
  const { cx, mouthY } = anchors;
  const strokeW = Math.max(2, size * 0.028);
  const mark = Skia.Path.Make();
  mark.addCircle(cx + size * 0.13, mouthY - size * 0.08, size * 0.018);
  return (
    <Group>
      <PencilStroke path={mark} ink={ink} ghostInk={ghostInk} strokeWidth={strokeW * 0.4}
        jitterLen={jitterLen * 0.3} jitterDev={jitterDev * 0.3} seedMain={941} seedGhost={943} fill="#3a2a22" />
    </Group>
  );
};

export const MAKEUP_ART: Record<string, ArtComponent> = {
  'makeup.blush': Blush,
  'makeup.lipstick': Lipstick,
  'makeup.eyeshadow': Eyeshadow,
  'makeup.freckles': Freckles,
  'makeup.beautymark': BeautyMark,
};
