// Five facial-hair items. They sit between the mouth and chin, drawn under
// glasses (no overlap) and under neckwear (scarf goes in front).

import { Group, Skia } from '@shopify/react-native-skia';
import type { ArtComponent } from './types';
import { PencilStroke } from './pencil';

const Handlebar: ArtComponent = ({ size, ink, ghostInk, jitterLen, jitterDev, anchors }) => {
  const { cx, mouthY } = anchors;
  const strokeW = Math.max(2, size * 0.028);
  const m = Skia.Path.Make();
  // central clump
  m.moveTo(cx - size * 0.04, mouthY - size * 0.04);
  m.quadTo(cx, mouthY - size * 0.08, cx + size * 0.04, mouthY - size * 0.04);
  // curls outward + up
  m.quadTo(cx + size * 0.16, mouthY - size * 0.08, cx + size * 0.22, mouthY - size * 0.14);
  m.quadTo(cx + size * 0.18, mouthY - size * 0.06, cx + size * 0.06, mouthY - size * 0.02);
  m.lineTo(cx, mouthY - size * 0.01);
  m.lineTo(cx - size * 0.06, mouthY - size * 0.02);
  m.quadTo(cx - size * 0.18, mouthY - size * 0.06, cx - size * 0.22, mouthY - size * 0.14);
  m.quadTo(cx - size * 0.16, mouthY - size * 0.08, cx - size * 0.04, mouthY - size * 0.04);
  m.close();
  return (
    <Group>
      <PencilStroke path={m} ink={ink} ghostInk={ghostInk} strokeWidth={strokeW}
        jitterLen={jitterLen} jitterDev={jitterDev} seedMain={601} seedGhost={603} fill="#3a2a22" />
    </Group>
  );
};

const Goatee: ArtComponent = ({ size, ink, ghostInk, jitterLen, jitterDev, anchors }) => {
  const { cx, mouthY } = anchors;
  const strokeW = Math.max(2, size * 0.028);
  const g = Skia.Path.Make();
  g.moveTo(cx - size * 0.06, mouthY + size * 0.04);
  g.cubicTo(
    cx - size * 0.08, mouthY + size * 0.18,
    cx + size * 0.08, mouthY + size * 0.18,
    cx + size * 0.06, mouthY + size * 0.04,
  );
  g.close();
  return (
    <Group>
      <PencilStroke path={g} ink={ink} ghostInk={ghostInk} strokeWidth={strokeW}
        jitterLen={jitterLen} jitterDev={jitterDev} seedMain={611} seedGhost={613} fill="#3a2a22" />
    </Group>
  );
};

const Beard: ArtComponent = ({ size, ink, ghostInk, jitterLen, jitterDev, anchors }) => {
  const { cx, mouthY, neckY } = anchors;
  const strokeW = Math.max(2, size * 0.028);
  const b = Skia.Path.Make();
  // wraps from cheek to cheek under the mouth
  b.moveTo(cx - size * 0.28, mouthY - size * 0.04);
  b.cubicTo(
    cx - size * 0.32, mouthY + size * 0.16,
    cx - size * 0.16, neckY - size * 0.04,
    cx, neckY - size * 0.02,
  );
  b.cubicTo(
    cx + size * 0.16, neckY - size * 0.04,
    cx + size * 0.32, mouthY + size * 0.16,
    cx + size * 0.28, mouthY - size * 0.04,
  );
  // wavy underside
  b.quadTo(cx + size * 0.18, mouthY + size * 0.02, cx + size * 0.06, mouthY + size * 0.02);
  b.quadTo(cx - size * 0.06, mouthY + size * 0.02, cx - size * 0.18, mouthY + size * 0.02);
  b.close();
  return (
    <Group>
      <PencilStroke path={b} ink={ink} ghostInk={ghostInk} strokeWidth={strokeW}
        jitterLen={jitterLen} jitterDev={jitterDev} seedMain={621} seedGhost={623} fill="#5a4030" />
    </Group>
  );
};

const SoulPatch: ArtComponent = ({ size, ink, ghostInk, jitterLen, jitterDev, anchors }) => {
  const { cx, mouthY } = anchors;
  const strokeW = Math.max(2, size * 0.028);
  const p = Skia.Path.Make();
  p.moveTo(cx - size * 0.025, mouthY + size * 0.05);
  p.lineTo(cx + size * 0.025, mouthY + size * 0.05);
  p.lineTo(cx + size * 0.015, mouthY + size * 0.13);
  p.lineTo(cx - size * 0.015, mouthY + size * 0.13);
  p.close();
  return (
    <Group>
      <PencilStroke path={p} ink={ink} ghostInk={ghostInk} strokeWidth={strokeW * 0.85}
        jitterLen={jitterLen} jitterDev={jitterDev} seedMain={631} seedGhost={633} fill="#3a2a22" />
    </Group>
  );
};

const MuttonChops: ArtComponent = ({ size, ink, ghostInk, jitterLen, jitterDev, anchors }) => {
  const { cx, mouthY } = anchors;
  const strokeW = Math.max(2, size * 0.028);
  const left = Skia.Path.Make();
  left.moveTo(cx - size * 0.32, mouthY - size * 0.18);
  left.lineTo(cx - size * 0.36, mouthY + size * 0.16);
  left.lineTo(cx - size * 0.16, mouthY + size * 0.06);
  left.lineTo(cx - size * 0.18, mouthY - size * 0.1);
  left.close();
  const right = Skia.Path.Make();
  right.moveTo(cx + size * 0.32, mouthY - size * 0.18);
  right.lineTo(cx + size * 0.36, mouthY + size * 0.16);
  right.lineTo(cx + size * 0.16, mouthY + size * 0.06);
  right.lineTo(cx + size * 0.18, mouthY - size * 0.1);
  right.close();
  return (
    <Group>
      <PencilStroke path={left} ink={ink} ghostInk={ghostInk} strokeWidth={strokeW}
        jitterLen={jitterLen} jitterDev={jitterDev} seedMain={641} seedGhost={643} fill="#5a4030" />
      <PencilStroke path={right} ink={ink} ghostInk={ghostInk} strokeWidth={strokeW}
        jitterLen={jitterLen} jitterDev={jitterDev} seedMain={645} seedGhost={647} fill="#5a4030" />
    </Group>
  );
};

export const FACIALHAIR_ART: Record<string, ArtComponent> = {
  'facialhair.handlebar': Handlebar,
  'facialhair.goatee': Goatee,
  'facialhair.beard': Beard,
  'facialhair.soulpatch': SoulPatch,
  'facialhair.muttonchops': MuttonChops,
};
