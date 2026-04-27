// Five neckwear items. They sit at neck level (anchors.neckY) and wrap
// across the bottom of the face. Layered above facial hair.

import { Group, Skia } from '@shopify/react-native-skia';
import type { ArtComponent } from './types';
import { PencilStroke } from './pencil';

const Scarf: ArtComponent = ({ size, ink, ghostInk, jitterLen, jitterDev, anchors }) => {
  const { cx, neckY } = anchors;
  const strokeW = Math.max(2, size * 0.028);
  const wrap = Skia.Path.Make();
  wrap.moveTo(cx - size * 0.4, neckY - size * 0.04);
  wrap.cubicTo(
    cx - size * 0.4, neckY + size * 0.18,
    cx + size * 0.4, neckY + size * 0.18,
    cx + size * 0.4, neckY - size * 0.04,
  );
  wrap.lineTo(cx + size * 0.32, neckY - size * 0.02);
  wrap.cubicTo(
    cx + size * 0.32, neckY + size * 0.08,
    cx - size * 0.32, neckY + size * 0.08,
    cx - size * 0.32, neckY - size * 0.02,
  );
  wrap.close();
  // hanging tail
  const tail = Skia.Path.Make();
  tail.moveTo(cx - size * 0.16, neckY + size * 0.08);
  tail.lineTo(cx - size * 0.18, neckY + size * 0.34);
  tail.lineTo(cx + size * 0.02, neckY + size * 0.32);
  tail.lineTo(cx + size * 0.02, neckY + size * 0.06);
  tail.close();
  // fringe lines
  const fringe = Skia.Path.Make();
  fringe.moveTo(cx - size * 0.14, neckY + size * 0.34);
  fringe.lineTo(cx - size * 0.14, neckY + size * 0.4);
  fringe.moveTo(cx - size * 0.06, neckY + size * 0.34);
  fringe.lineTo(cx - size * 0.06, neckY + size * 0.4);
  fringe.moveTo(cx + size * 0.0, neckY + size * 0.34);
  fringe.lineTo(cx + size * 0.0, neckY + size * 0.4);
  return (
    <Group>
      <PencilStroke path={wrap} ink={ink} ghostInk={ghostInk} strokeWidth={strokeW}
        jitterLen={jitterLen} jitterDev={jitterDev} seedMain={701} seedGhost={703} fill="#c84a45" />
      <PencilStroke path={tail} ink={ink} ghostInk={ghostInk} strokeWidth={strokeW}
        jitterLen={jitterLen} jitterDev={jitterDev} seedMain={705} seedGhost={707} fill="#c84a45" />
      <PencilStroke path={fringe} ink={ink} ghostInk={ghostInk} strokeWidth={strokeW * 0.5}
        jitterLen={jitterLen * 0.6} jitterDev={jitterDev * 0.5} seedMain={709} seedGhost={711} />
    </Group>
  );
};

const Bowtie: ArtComponent = ({ size, ink, ghostInk, jitterLen, jitterDev, anchors }) => {
  const { cx, neckY } = anchors;
  const strokeW = Math.max(2, size * 0.028);
  const tie = Skia.Path.Make();
  // left wing
  tie.moveTo(cx - size * 0.04, neckY);
  tie.lineTo(cx - size * 0.18, neckY - size * 0.08);
  tie.lineTo(cx - size * 0.18, neckY + size * 0.08);
  tie.lineTo(cx - size * 0.04, neckY);
  // right wing
  tie.moveTo(cx + size * 0.04, neckY);
  tie.lineTo(cx + size * 0.18, neckY - size * 0.08);
  tie.lineTo(cx + size * 0.18, neckY + size * 0.08);
  tie.lineTo(cx + size * 0.04, neckY);
  // knot
  const knot = Skia.Path.Make();
  knot.addRRect({
    rect: { x: cx - size * 0.04, y: neckY - size * 0.05, width: size * 0.08, height: size * 0.1 },
    rx: size * 0.01, ry: size * 0.01,
  });
  return (
    <Group>
      <PencilStroke path={tie} ink={ink} ghostInk={ghostInk} strokeWidth={strokeW}
        jitterLen={jitterLen} jitterDev={jitterDev} seedMain={721} seedGhost={723} fill="#3a2a52" />
      <PencilStroke path={knot} ink={ink} ghostInk={ghostInk} strokeWidth={strokeW}
        jitterLen={jitterLen} jitterDev={jitterDev} seedMain={725} seedGhost={727} fill="#3a2a52" />
    </Group>
  );
};

const Necktie: ArtComponent = ({ size, ink, ghostInk, jitterLen, jitterDev, anchors }) => {
  const { cx, neckY } = anchors;
  const strokeW = Math.max(2, size * 0.028);
  const knot = Skia.Path.Make();
  knot.moveTo(cx - size * 0.05, neckY);
  knot.lineTo(cx + size * 0.05, neckY);
  knot.lineTo(cx + size * 0.06, neckY + size * 0.05);
  knot.lineTo(cx - size * 0.06, neckY + size * 0.05);
  knot.close();
  const blade = Skia.Path.Make();
  blade.moveTo(cx - size * 0.05, neckY + size * 0.05);
  blade.lineTo(cx + size * 0.05, neckY + size * 0.05);
  blade.lineTo(cx + size * 0.08, neckY + size * 0.34);
  blade.lineTo(cx, neckY + size * 0.42);
  blade.lineTo(cx - size * 0.08, neckY + size * 0.34);
  blade.close();
  return (
    <Group>
      <PencilStroke path={knot} ink={ink} ghostInk={ghostInk} strokeWidth={strokeW}
        jitterLen={jitterLen} jitterDev={jitterDev} seedMain={731} seedGhost={733} fill="#5a3a52" />
      <PencilStroke path={blade} ink={ink} ghostInk={ghostInk} strokeWidth={strokeW}
        jitterLen={jitterLen} jitterDev={jitterDev} seedMain={735} seedGhost={737} fill="#7a5a72" />
    </Group>
  );
};

const Pearls: ArtComponent = ({ size, ink, ghostInk, jitterLen, jitterDev, anchors }) => {
  const { cx, neckY } = anchors;
  const strokeW = Math.max(2, size * 0.028);
  const pearls = Skia.Path.Make();
  // arc of small pearls across the neck
  const count = 11;
  for (let i = 0; i < count; i++) {
    const t = (i / (count - 1)) - 0.5; // -0.5 to 0.5
    const x = cx + t * size * 0.7;
    const y = neckY + Math.sin((i / (count - 1)) * Math.PI) * size * 0.04;
    pearls.addCircle(x, y, size * 0.025);
  }
  return (
    <Group>
      <PencilStroke path={pearls} ink={ink} ghostInk={ghostInk} strokeWidth={strokeW * 0.6}
        jitterLen={jitterLen * 0.6} jitterDev={jitterDev * 0.5} seedMain={741} seedGhost={743} fill="#fbfaf3" />
    </Group>
  );
};

const Choker: ArtComponent = ({ size, ink, ghostInk, jitterLen, jitterDev, anchors }) => {
  const { cx, neckY } = anchors;
  const strokeW = Math.max(2, size * 0.028);
  const band = Skia.Path.Make();
  band.addRRect({
    rect: { x: cx - size * 0.36, y: neckY, width: size * 0.72, height: size * 0.05 },
    rx: size * 0.015, ry: size * 0.015,
  });
  // small heart pendant
  const pend = Skia.Path.Make();
  const px = cx;
  const py = neckY + size * 0.08;
  pend.moveTo(px, py + size * 0.04);
  pend.cubicTo(px - size * 0.06, py - size * 0.02, px - size * 0.04, py - size * 0.06, px, py - size * 0.02);
  pend.cubicTo(px + size * 0.04, py - size * 0.06, px + size * 0.06, py - size * 0.02, px, py + size * 0.04);
  pend.close();
  return (
    <Group>
      <PencilStroke path={band} ink={ink} ghostInk={ghostInk} strokeWidth={strokeW}
        jitterLen={jitterLen} jitterDev={jitterDev} seedMain={751} seedGhost={753} fill="#1a1410" />
      <PencilStroke path={pend} ink={ink} ghostInk={ghostInk} strokeWidth={strokeW * 0.7}
        jitterLen={jitterLen * 0.6} jitterDev={jitterDev * 0.5} seedMain={755} seedGhost={757} fill="#e84a7a" />
    </Group>
  );
};

export const NECK_ART: Record<string, ArtComponent> = {
  'neck.scarf': Scarf,
  'neck.bowtie': Bowtie,
  'neck.necktie': Necktie,
  'neck.pearls': Pearls,
  'neck.choker': Choker,
};
