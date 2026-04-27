// Five mouth pieces. Anchored to anchors.mouthY, biased to the right of
// centre so they don't fully obscure the rendered mood mouth.

import { Group, Skia } from '@shopify/react-native-skia';
import type { ArtComponent } from './types';
import { PencilStroke } from './pencil';

const Pencil: ArtComponent = ({ size, ink, ghostInk, jitterLen, jitterDev, anchors }) => {
  const { cx, mouthY } = anchors;
  const strokeW = Math.max(2, size * 0.028);
  // Eraser cap (left, just past the mouth corner).
  const eraser = Skia.Path.Make();
  eraser.addRRect({
    rect: { x: cx + size * 0.05, y: mouthY - size * 0.02, width: size * 0.04, height: size * 0.04 },
    rx: size * 0.008, ry: size * 0.008,
  });
  // Metal ferrule between eraser and body.
  const ferrule = Skia.Path.Make();
  ferrule.addRRect({
    rect: { x: cx + size * 0.09, y: mouthY - size * 0.02, width: size * 0.02, height: size * 0.04 },
    rx: 0, ry: 0,
  });
  // Yellow wood body.
  const body = Skia.Path.Make();
  body.addRRect({
    rect: { x: cx + size * 0.11, y: mouthY - size * 0.02, width: size * 0.18, height: size * 0.04 },
    rx: 0, ry: 0,
  });
  // Sharpened wood — small triangle stepping down to the graphite.
  const sharpen = Skia.Path.Make();
  sharpen.moveTo(cx + size * 0.29, mouthY - size * 0.02);
  sharpen.lineTo(cx + size * 0.33, mouthY);
  sharpen.lineTo(cx + size * 0.29, mouthY + size * 0.02);
  sharpen.close();
  // Graphite tip — black.
  const tip = Skia.Path.Make();
  tip.moveTo(cx + size * 0.33, mouthY - size * 0.005);
  tip.lineTo(cx + size * 0.36, mouthY);
  tip.lineTo(cx + size * 0.33, mouthY + size * 0.005);
  tip.close();
  return (
    <Group>
      <PencilStroke path={eraser} ink={ink} ghostInk={ghostInk} strokeWidth={strokeW}
        jitterLen={jitterLen} jitterDev={jitterDev} seedMain={801} seedGhost={803} fill="#e84a7a" />
      <PencilStroke path={ferrule} ink={ink} ghostInk={ghostInk} strokeWidth={strokeW * 0.7}
        jitterLen={jitterLen * 0.6} jitterDev={jitterDev * 0.5} seedMain={805} seedGhost={807} fill="#b6bcc4" />
      <PencilStroke path={body} ink={ink} ghostInk={ghostInk} strokeWidth={strokeW}
        jitterLen={jitterLen} jitterDev={jitterDev} seedMain={809} seedGhost={811} fill="#f3c93a" />
      <PencilStroke path={sharpen} ink={ink} ghostInk={ghostInk} strokeWidth={strokeW * 0.7}
        jitterLen={jitterLen * 0.6} jitterDev={jitterDev * 0.5} seedMain={813} seedGhost={815} fill="#d8a96a" />
      <PencilStroke path={tip} ink={ink} ghostInk={ghostInk} strokeWidth={strokeW * 0.6}
        jitterLen={jitterLen * 0.5} jitterDev={jitterDev * 0.4} seedMain={817} seedGhost={819} fill="#1a1410" />
    </Group>
  );
};

const Bubblegum: ArtComponent = ({ size, ink, ghostInk, jitterLen, jitterDev, anchors }) => {
  const { cx, mouthY } = anchors;
  const strokeW = Math.max(2, size * 0.028);
  // Big pink bubble in front of the mouth.
  const bubble = Skia.Path.Make();
  bubble.addCircle(cx + size * 0.24, mouthY + size * 0.01, size * 0.13);
  // Small glossy highlight on the upper left of the bubble.
  const shine = Skia.Path.Make();
  shine.addOval({
    x: cx + size * 0.16,
    y: mouthY - size * 0.06,
    width: size * 0.04,
    height: size * 0.025,
  });
  // Tiny "stretch" connector from mouth corner to bubble — a thin neck of gum.
  const neck = Skia.Path.Make();
  neck.moveTo(cx + size * 0.06, mouthY);
  neck.quadTo(cx + size * 0.1, mouthY + size * 0.01, cx + size * 0.13, mouthY + size * 0.005);
  return (
    <Group>
      <PencilStroke path={neck} ink={ink} ghostInk={ghostInk} strokeWidth={strokeW * 0.6}
        jitterLen={jitterLen * 0.6} jitterDev={jitterDev * 0.5} seedMain={821} seedGhost={823} fill="#f7a8c2" />
      <PencilStroke path={bubble} ink={ink} ghostInk={ghostInk} strokeWidth={strokeW}
        jitterLen={jitterLen} jitterDev={jitterDev} seedMain={825} seedGhost={827} fill="#f7a8c2" />
      <PencilStroke path={shine} ink={ink} ghostInk={ghostInk} strokeWidth={strokeW * 0.4}
        jitterLen={jitterLen * 0.4} jitterDev={jitterDev * 0.3} seedMain={829} seedGhost={831} fill="#fbfaf3" />
    </Group>
  );
};

const Lollipop: ArtComponent = ({ size, ink, ghostInk, jitterLen, jitterDev, anchors }) => {
  const { cx, mouthY } = anchors;
  const strokeW = Math.max(2, size * 0.028);
  const stick = Skia.Path.Make();
  stick.moveTo(cx + size * 0.06, mouthY + size * 0.005);
  stick.lineTo(cx + size * 0.22, mouthY + size * 0.005);
  const ball = Skia.Path.Make();
  ball.addCircle(cx + size * 0.3, mouthY, size * 0.08);
  // swirl
  const swirl = Skia.Path.Make();
  swirl.moveTo(cx + size * 0.3, mouthY);
  swirl.cubicTo(
    cx + size * 0.36, mouthY,
    cx + size * 0.36, mouthY + size * 0.06,
    cx + size * 0.3, mouthY + size * 0.06,
  );
  return (
    <Group>
      <PencilStroke path={stick} ink={ink} ghostInk={ghostInk} strokeWidth={strokeW * 0.8}
        jitterLen={jitterLen} jitterDev={jitterDev} seedMain={841} seedGhost={843} fill="#fbfaf3" />
      <PencilStroke path={ball} ink={ink} ghostInk={ghostInk} strokeWidth={strokeW}
        jitterLen={jitterLen} jitterDev={jitterDev} seedMain={845} seedGhost={847} fill="#e84a7a" />
      <PencilStroke path={swirl} ink={ink} ghostInk={ghostInk} strokeWidth={strokeW * 0.7}
        jitterLen={jitterLen * 0.6} jitterDev={jitterDev * 0.5} seedMain={849} seedGhost={851} />
    </Group>
  );
};

const Rose: ArtComponent = ({ size, ink, ghostInk, jitterLen, jitterDev, anchors }) => {
  const { cx, mouthY } = anchors;
  const strokeW = Math.max(2, size * 0.028);
  const stem = Skia.Path.Make();
  stem.moveTo(cx + size * 0.04, mouthY + size * 0.005);
  stem.lineTo(cx + size * 0.26, mouthY + size * 0.005);
  // leaves
  const leaf = Skia.Path.Make();
  leaf.moveTo(cx + size * 0.16, mouthY);
  leaf.quadTo(cx + size * 0.2, mouthY - size * 0.06, cx + size * 0.24, mouthY);
  leaf.quadTo(cx + size * 0.2, mouthY + size * 0.02, cx + size * 0.16, mouthY);
  leaf.close();
  // bud (rosette)
  const bud = Skia.Path.Make();
  bud.addCircle(cx + size * 0.32, mouthY, size * 0.07);
  const bud2 = Skia.Path.Make();
  bud2.addCircle(cx + size * 0.32, mouthY, size * 0.04);
  return (
    <Group>
      <PencilStroke path={stem} ink={ink} ghostInk={ghostInk} strokeWidth={strokeW * 0.8}
        jitterLen={jitterLen} jitterDev={jitterDev} seedMain={861} seedGhost={863} fill="#5e7a3a" />
      <PencilStroke path={leaf} ink={ink} ghostInk={ghostInk} strokeWidth={strokeW * 0.7}
        jitterLen={jitterLen * 0.6} jitterDev={jitterDev * 0.5} seedMain={865} seedGhost={867} fill="#5e7a3a" />
      <PencilStroke path={bud} ink={ink} ghostInk={ghostInk} strokeWidth={strokeW}
        jitterLen={jitterLen} jitterDev={jitterDev} seedMain={869} seedGhost={871} fill="#c84a45" />
      <PencilStroke path={bud2} ink={ink} ghostInk={ghostInk} strokeWidth={strokeW * 0.5}
        jitterLen={jitterLen * 0.5} jitterDev={jitterDev * 0.4} seedMain={873} seedGhost={875} />
    </Group>
  );
};

const Whistle: ArtComponent = ({ size, ink, ghostInk, jitterLen, jitterDev, anchors }) => {
  const { cx, mouthY } = anchors;
  const strokeW = Math.max(2, size * 0.028);
  const body = Skia.Path.Make();
  body.addRRect({
    rect: { x: cx + size * 0.06, y: mouthY - size * 0.04, width: size * 0.18, height: size * 0.08 },
    rx: size * 0.02, ry: size * 0.02,
  });
  const ring = Skia.Path.Make();
  ring.addCircle(cx + size * 0.26, mouthY, size * 0.025);
  const cord = Skia.Path.Make();
  cord.moveTo(cx + size * 0.28, mouthY);
  cord.quadTo(cx + size * 0.36, mouthY + size * 0.06, cx + size * 0.34, mouthY + size * 0.16);
  return (
    <Group>
      <PencilStroke path={body} ink={ink} ghostInk={ghostInk} strokeWidth={strokeW}
        jitterLen={jitterLen} jitterDev={jitterDev} seedMain={881} seedGhost={883} fill="#9a9a9a" />
      <PencilStroke path={ring} ink={ink} ghostInk={ghostInk} strokeWidth={strokeW * 0.6}
        jitterLen={jitterLen * 0.5} jitterDev={jitterDev * 0.4} seedMain={885} seedGhost={887} />
      <PencilStroke path={cord} ink={ink} ghostInk={ghostInk} strokeWidth={strokeW * 0.5}
        jitterLen={jitterLen * 0.6} jitterDev={jitterDev * 0.5} seedMain={889} seedGhost={891} />
    </Group>
  );
};

export const MOUTH_ART: Record<string, ArtComponent> = {
  'mouth.pencil': Pencil,
  'mouth.bubblegum': Bubblegum,
  'mouth.lollipop': Lollipop,
  'mouth.rose': Rose,
  'mouth.whistle': Whistle,
};
