// Five eyewear pieces. Glasses sit on the eye line and span both eyes.

import { Group, Skia } from '@shopify/react-native-skia';
import type { ArtComponent } from './types';
import { PencilStroke } from './pencil';

function lensRect(cx: number, eyeY: number, offset: number, size: number, w: number, h: number) {
  return {
    leftX: cx - offset - w / 2,
    rightX: cx + offset - w / 2,
    y: eyeY - h / 2,
    w,
    h,
  };
}

const Round: ArtComponent = ({ size, ink, ghostInk, jitterLen, jitterDev, anchors }) => {
  const { cx, eyeY, eyeOffset } = anchors;
  const r = size * 0.085;
  const strokeW = Math.max(2, size * 0.028);
  const lenses = Skia.Path.Make();
  lenses.addCircle(cx - eyeOffset, eyeY, r);
  lenses.addCircle(cx + eyeOffset, eyeY, r);
  const bridge = Skia.Path.Make();
  bridge.moveTo(cx - eyeOffset + r, eyeY);
  bridge.lineTo(cx + eyeOffset - r, eyeY);
  return (
    <Group>
      <PencilStroke path={lenses} ink={ink} ghostInk={ghostInk} strokeWidth={strokeW}
        jitterLen={jitterLen} jitterDev={jitterDev} seedMain={501} seedGhost={503} />
      <PencilStroke path={bridge} ink={ink} ghostInk={ghostInk} strokeWidth={strokeW * 0.7}
        jitterLen={jitterLen * 0.6} jitterDev={jitterDev * 0.5} seedMain={505} seedGhost={507} />
    </Group>
  );
};

const Sunglasses: ArtComponent = ({ size, ink, ghostInk, jitterLen, jitterDev, anchors }) => {
  const { cx, eyeY, eyeOffset } = anchors;
  const w = size * 0.18;
  const h = size * 0.13;
  const strokeW = Math.max(2, size * 0.028);
  const r = lensRect(cx, eyeY, eyeOffset, size, w, h);
  const lensL = Skia.Path.Make();
  lensL.addRRect({ rect: { x: r.leftX, y: r.y, width: w, height: h }, rx: size * 0.02, ry: size * 0.02 });
  const lensR = Skia.Path.Make();
  lensR.addRRect({ rect: { x: r.rightX, y: r.y, width: w, height: h }, rx: size * 0.02, ry: size * 0.02 });
  const bridge = Skia.Path.Make();
  bridge.moveTo(cx - eyeOffset + w / 2, eyeY);
  bridge.lineTo(cx + eyeOffset - w / 2, eyeY);
  return (
    <Group>
      <PencilStroke path={lensL} ink={ink} ghostInk={ghostInk} strokeWidth={strokeW}
        jitterLen={jitterLen} jitterDev={jitterDev} seedMain={511} seedGhost={513} fill="#1a1410" />
      <PencilStroke path={lensR} ink={ink} ghostInk={ghostInk} strokeWidth={strokeW}
        jitterLen={jitterLen} jitterDev={jitterDev} seedMain={515} seedGhost={517} fill="#1a1410" />
      <PencilStroke path={bridge} ink={ink} ghostInk={ghostInk} strokeWidth={strokeW * 0.7}
        jitterLen={jitterLen * 0.6} jitterDev={jitterDev * 0.5} seedMain={519} seedGhost={521} />
    </Group>
  );
};

const Aviators: ArtComponent = ({ size, ink, ghostInk, jitterLen, jitterDev, anchors }) => {
  const { cx, eyeY, eyeOffset } = anchors;
  const strokeW = Math.max(2, size * 0.028);
  // teardrop-ish lenses: ovals tilted slightly
  const lensL = Skia.Path.Make();
  lensL.addOval({
    x: cx - eyeOffset - size * 0.1,
    y: eyeY - size * 0.06,
    width: size * 0.2,
    height: size * 0.14,
  });
  const lensR = Skia.Path.Make();
  lensR.addOval({
    x: cx + eyeOffset - size * 0.1,
    y: eyeY - size * 0.06,
    width: size * 0.2,
    height: size * 0.14,
  });
  const bridge = Skia.Path.Make();
  bridge.moveTo(cx - eyeOffset + size * 0.1, eyeY - size * 0.02);
  bridge.lineTo(cx + eyeOffset - size * 0.1, eyeY - size * 0.02);
  return (
    <Group>
      <PencilStroke path={lensL} ink={ink} ghostInk={ghostInk} strokeWidth={strokeW}
        jitterLen={jitterLen} jitterDev={jitterDev} seedMain={531} seedGhost={533} fill="#5a7aa8" />
      <PencilStroke path={lensR} ink={ink} ghostInk={ghostInk} strokeWidth={strokeW}
        jitterLen={jitterLen} jitterDev={jitterDev} seedMain={535} seedGhost={537} fill="#5a7aa8" />
      <PencilStroke path={bridge} ink={ink} ghostInk={ghostInk} strokeWidth={strokeW * 0.7}
        jitterLen={jitterLen * 0.6} jitterDev={jitterDev * 0.5} seedMain={539} seedGhost={541} />
    </Group>
  );
};

const Monocle: ArtComponent = ({ size, ink, ghostInk, jitterLen, jitterDev, anchors }) => {
  const { cx, eyeY, eyeOffset } = anchors;
  const r = size * 0.09;
  const strokeW = Math.max(2, size * 0.028);
  const ring = Skia.Path.Make();
  ring.addCircle(cx + eyeOffset, eyeY, r);
  // chain dangling from the side
  const chain = Skia.Path.Make();
  chain.moveTo(cx + eyeOffset + r, eyeY + r * 0.2);
  chain.quadTo(cx + eyeOffset + r * 1.6, eyeY + r * 1.2, cx + eyeOffset + r * 1.4, eyeY + r * 2.4);
  return (
    <Group>
      <PencilStroke path={ring} ink={ink} ghostInk={ghostInk} strokeWidth={strokeW}
        jitterLen={jitterLen} jitterDev={jitterDev} seedMain={551} seedGhost={553} />
      <PencilStroke path={chain} ink={ink} ghostInk={ghostInk} strokeWidth={strokeW * 0.5}
        jitterLen={jitterLen * 0.6} jitterDev={jitterDev * 0.5} seedMain={555} seedGhost={557} />
    </Group>
  );
};

const Goggles: ArtComponent = ({ size, ink, ghostInk, jitterLen, jitterDev, anchors }) => {
  const { cx, eyeY, eyeOffset } = anchors;
  const w = size * 0.22;
  const h = size * 0.16;
  const strokeW = Math.max(2, size * 0.028);
  // wide combined goggle (one big rounded rect with a divider)
  const body = Skia.Path.Make();
  const totalW = w * 2 + eyeOffset * 0.6;
  body.addRRect({
    rect: { x: cx - totalW / 2, y: eyeY - h / 2, width: totalW, height: h },
    rx: size * 0.04, ry: size * 0.04,
  });
  const divider = Skia.Path.Make();
  divider.moveTo(cx, eyeY - h / 2 + size * 0.02);
  divider.lineTo(cx, eyeY + h / 2 - size * 0.02);
  // strap
  const strap = Skia.Path.Make();
  strap.moveTo(cx - totalW / 2 - size * 0.08, eyeY - h / 4);
  strap.lineTo(cx - totalW / 2, eyeY - h / 4);
  strap.moveTo(cx + totalW / 2, eyeY - h / 4);
  strap.lineTo(cx + totalW / 2 + size * 0.08, eyeY - h / 4);
  return (
    <Group>
      <PencilStroke path={body} ink={ink} ghostInk={ghostInk} strokeWidth={strokeW}
        jitterLen={jitterLen} jitterDev={jitterDev} seedMain={561} seedGhost={563} fill="#bfd4d8" />
      <PencilStroke path={divider} ink={ink} ghostInk={ghostInk} strokeWidth={strokeW * 0.8}
        jitterLen={jitterLen * 0.7} jitterDev={jitterDev * 0.5} seedMain={565} seedGhost={567} />
      <PencilStroke path={strap} ink={ink} ghostInk={ghostInk} strokeWidth={strokeW * 0.7}
        jitterLen={jitterLen * 0.7} jitterDev={jitterDev * 0.5} seedMain={569} seedGhost={571} />
    </Group>
  );
};

export const EYEWEAR_ART: Record<string, ArtComponent> = {
  'glasses.round': Round,
  'glasses.sunglasses': Sunglasses,
  'glasses.aviators': Aviators,
  'glasses.monocle': Monocle,
  'glasses.goggles': Goggles,
};
