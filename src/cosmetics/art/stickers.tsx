// Ten floating "stickers". They sit at the very top z-index, free-floating
// above everything else. Generally placed in the upper-right corner of
// the canvas where the head doesn't reach.

import { Group, Skia } from '@shopify/react-native-skia';
import type { ArtComponent } from './types';
import { PencilStroke } from './pencil';

const Sparkles: ArtComponent = ({ size, ink, ghostInk, jitterLen, jitterDev }) => {
  const strokeW = Math.max(2, size * 0.028);
  const p = Skia.Path.Make();
  const make = (x: number, y: number, s: number) => {
    p.moveTo(x, y - s);
    p.lineTo(x, y + s);
    p.moveTo(x - s, y);
    p.lineTo(x + s, y);
  };
  make(size * 0.85, size * 0.18, size * 0.05);
  make(size * 0.12, size * 0.24, size * 0.035);
  make(size * 0.92, size * 0.42, size * 0.035);
  return (
    <Group>
      <PencilStroke path={p} ink={ink} ghostInk={ghostInk} strokeWidth={strokeW * 0.7}
        jitterLen={jitterLen * 0.6} jitterDev={jitterDev * 0.5} seedMain={1001} seedGhost={1003} />
    </Group>
  );
};

const Hearts: ArtComponent = ({ size, ink, ghostInk, jitterLen, jitterDev }) => {
  const strokeW = Math.max(2, size * 0.028);
  const make = (x: number, y: number, s: number) => {
    const p = Skia.Path.Make();
    p.moveTo(x, y + s * 0.6);
    p.cubicTo(x - s, y - s * 0.2, x - s * 0.6, y - s * 0.8, x, y - s * 0.4);
    p.cubicTo(x + s * 0.6, y - s * 0.8, x + s, y - s * 0.2, x, y + s * 0.6);
    p.close();
    return p;
  };
  return (
    <Group>
      <PencilStroke path={make(size * 0.86, size * 0.16, size * 0.06)}
        ink={ink} ghostInk={ghostInk} strokeWidth={strokeW * 0.8}
        jitterLen={jitterLen * 0.6} jitterDev={jitterDev * 0.5} seedMain={1011} seedGhost={1013} fill="#e84a7a" />
      <PencilStroke path={make(size * 0.14, size * 0.22, size * 0.04)}
        ink={ink} ghostInk={ghostInk} strokeWidth={strokeW * 0.7}
        jitterLen={jitterLen * 0.6} jitterDev={jitterDev * 0.5} seedMain={1015} seedGhost={1017} fill="#e84a7a" />
    </Group>
  );
};

const Sweat: ArtComponent = ({ size, ink, ghostInk, jitterLen, jitterDev, anchors }) => {
  const strokeW = Math.max(2, size * 0.028);
  const drop = Skia.Path.Make();
  const x = anchors.cx + size * 0.32;
  const y = size * 0.2;
  drop.moveTo(x, y - size * 0.04);
  drop.cubicTo(x - size * 0.05, y + size * 0.04, x + size * 0.05, y + size * 0.04, x, y - size * 0.04);
  drop.close();
  return (
    <Group>
      <PencilStroke path={drop} ink={ink} ghostInk={ghostInk} strokeWidth={strokeW * 0.8}
        jitterLen={jitterLen * 0.6} jitterDev={jitterDev * 0.5} seedMain={1021} seedGhost={1023} fill="#7eb8da" />
    </Group>
  );
};

const Anger: ArtComponent = ({ size, ink, ghostInk, jitterLen, jitterDev, anchors }) => {
  const strokeW = Math.max(2, size * 0.028);
  const x = anchors.cx + size * 0.34;
  const y = size * 0.18;
  // four-spoke "puff" symbol
  const p = Skia.Path.Make();
  const r = size * 0.05;
  for (let i = 0; i < 4; i++) {
    const a = (i / 4) * Math.PI * 2;
    p.moveTo(x, y);
    p.lineTo(x + Math.cos(a) * r, y + Math.sin(a) * r);
  }
  // ring
  const ring = Skia.Path.Make();
  ring.addCircle(x, y, r * 0.5);
  return (
    <Group>
      <PencilStroke path={ring} ink={ink} ghostInk={ghostInk} strokeWidth={strokeW * 0.7}
        jitterLen={jitterLen * 0.6} jitterDev={jitterDev * 0.5} seedMain={1031} seedGhost={1033} fill="#d04545" />
      <PencilStroke path={p} ink={ink} ghostInk={ghostInk} strokeWidth={strokeW * 0.7}
        jitterLen={jitterLen * 0.6} jitterDev={jitterDev * 0.5} seedMain={1035} seedGhost={1037} />
    </Group>
  );
};

const Sleep: ArtComponent = ({ size, ink, ghostInk, jitterLen, jitterDev, anchors }) => {
  const strokeW = Math.max(2, size * 0.028);
  const x = anchors.cx + size * 0.32;
  const y = size * 0.18;
  // a stylised "Z" shape
  const z = Skia.Path.Make();
  const s = size * 0.07;
  z.moveTo(x, y);
  z.lineTo(x + s, y);
  z.lineTo(x, y + s);
  z.lineTo(x + s, y + s);
  return (
    <Group>
      <PencilStroke path={z} ink={ink} ghostInk={ghostInk} strokeWidth={strokeW}
        jitterLen={jitterLen} jitterDev={jitterDev} seedMain={1041} seedGhost={1043} />
    </Group>
  );
};

const Bolt: ArtComponent = ({ size, ink, ghostInk, jitterLen, jitterDev, anchors }) => {
  const strokeW = Math.max(2, size * 0.028);
  const x = anchors.cx + size * 0.34;
  const y = size * 0.16;
  const b = Skia.Path.Make();
  b.moveTo(x, y);
  b.lineTo(x - size * 0.04, y + size * 0.06);
  b.lineTo(x - size * 0.005, y + size * 0.06);
  b.lineTo(x - size * 0.03, y + size * 0.13);
  b.lineTo(x + size * 0.04, y + size * 0.05);
  b.lineTo(x + size * 0.005, y + size * 0.05);
  b.lineTo(x + size * 0.03, y);
  b.close();
  return (
    <Group>
      <PencilStroke path={b} ink={ink} ghostInk={ghostInk} strokeWidth={strokeW}
        jitterLen={jitterLen} jitterDev={jitterDev} seedMain={1051} seedGhost={1053} fill="#f3c93a" />
    </Group>
  );
};

const Halo: ArtComponent = ({ size, ink, ghostInk, jitterLen, jitterDev, anchors }) => {
  const { cx, headTop } = anchors;
  const strokeW = Math.max(2, size * 0.028);
  const halo = Skia.Path.Make();
  halo.addOval({
    x: cx - size * 0.18,
    y: headTop - size * 0.12,
    width: size * 0.36,
    height: size * 0.08,
  });
  return (
    <Group>
      <PencilStroke path={halo} ink={ink} ghostInk={ghostInk} strokeWidth={strokeW * 0.8}
        jitterLen={jitterLen} jitterDev={jitterDev} seedMain={1061} seedGhost={1063} fill="#f3c93a" />
    </Group>
  );
};

const Butterfly: ArtComponent = ({ size, ink, ghostInk, jitterLen, jitterDev, anchors }) => {
  const strokeW = Math.max(2, size * 0.028);
  const x = anchors.cx - size * 0.34;
  const y = size * 0.22;
  const w = Skia.Path.Make();
  w.addOval({ x: x - size * 0.05, y: y - size * 0.04, width: size * 0.05, height: size * 0.07 });
  w.addOval({ x, y: y - size * 0.04, width: size * 0.05, height: size * 0.07 });
  w.addOval({ x: x - size * 0.045, y: y + size * 0.005, width: size * 0.045, height: size * 0.05 });
  w.addOval({ x, y: y + size * 0.005, width: size * 0.045, height: size * 0.05 });
  return (
    <Group>
      <PencilStroke path={w} ink={ink} ghostInk={ghostInk} strokeWidth={strokeW * 0.6}
        jitterLen={jitterLen * 0.6} jitterDev={jitterDev * 0.5} seedMain={1071} seedGhost={1073} fill="#9b6bd8" />
    </Group>
  );
};

const Tear: ArtComponent = ({ size, ink, ghostInk, jitterLen, jitterDev, anchors }) => {
  const strokeW = Math.max(2, size * 0.028);
  const drop = Skia.Path.Make();
  const x = anchors.cx - anchors.eyeOffset;
  const y = anchors.eyeY + size * 0.08;
  drop.moveTo(x, y - size * 0.025);
  drop.cubicTo(x - size * 0.04, y + size * 0.03, x + size * 0.04, y + size * 0.03, x, y - size * 0.025);
  drop.close();
  return (
    <Group>
      <PencilStroke path={drop} ink={ink} ghostInk={ghostInk} strokeWidth={strokeW * 0.6}
        jitterLen={jitterLen * 0.5} jitterDev={jitterDev * 0.4} seedMain={1081} seedGhost={1083} fill="#7eb8da" />
    </Group>
  );
};

const Swirl: ArtComponent = ({ size, ink, ghostInk, jitterLen, jitterDev, anchors }) => {
  const strokeW = Math.max(2, size * 0.028);
  const x = anchors.cx + size * 0.34;
  const y = size * 0.18;
  const s = size * 0.06;
  const p = Skia.Path.Make();
  p.moveTo(x, y);
  p.cubicTo(x + s, y, x + s, y + s, x, y + s);
  p.cubicTo(x - s * 0.6, y + s, x - s * 0.6, y + s * 0.4, x, y + s * 0.4);
  p.cubicTo(x + s * 0.3, y + s * 0.4, x + s * 0.3, y + s * 0.65, x, y + s * 0.65);
  return (
    <Group>
      <PencilStroke path={p} ink={ink} ghostInk={ghostInk} strokeWidth={strokeW * 0.7}
        jitterLen={jitterLen * 0.6} jitterDev={jitterDev * 0.5} seedMain={1091} seedGhost={1093} />
    </Group>
  );
};

export const STICKER_ART: Record<string, ArtComponent> = {
  'sticker.sparkles': Sparkles,
  'sticker.hearts': Hearts,
  'sticker.sweat': Sweat,
  'sticker.anger': Anger,
  'sticker.sleep': Sleep,
  'sticker.bolt': Bolt,
  'sticker.halo': Halo,
  'sticker.butterfly': Butterfly,
  'sticker.tear': Tear,
  'sticker.swirl': Swirl,
};
