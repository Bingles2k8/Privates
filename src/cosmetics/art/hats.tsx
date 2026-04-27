// Ten hats. Each sits just above `anchors.headTop` and is centred on
// `anchors.cx`. Z-index puts them in front of glasses, in front of
// facial hair, and in front of neckwear.

import { Group, Skia } from '@shopify/react-native-skia';
import type { ArtComponent } from './types';
import { PencilStroke } from './pencil';

const Beanie: ArtComponent = ({ size, ink, ghostInk, jitterLen, jitterDev, anchors }) => {
  const { cx, headTop } = anchors;
  const w = size * 0.62;
  const h = size * 0.32;
  const top = headTop - h * 0.6;
  const strokeW = Math.max(2, size * 0.028);

  const cap = Skia.Path.Make();
  cap.moveTo(cx - w / 2, headTop + size * 0.05);
  cap.cubicTo(cx - w * 0.55, top, cx + w * 0.55, top, cx + w / 2, headTop + size * 0.05);
  cap.close();

  const cuff = Skia.Path.Make();
  cuff.addRRect({
    rect: { x: cx - w / 2, y: headTop, width: w, height: size * 0.08 },
    rx: size * 0.03,
    ry: size * 0.03,
  });

  const pom = Skia.Path.Make();
  pom.addCircle(cx, top + size * 0.01, size * 0.04);

  return (
    <Group>
      <PencilStroke path={cap} ink={ink} ghostInk={ghostInk} strokeWidth={strokeW}
        jitterLen={jitterLen} jitterDev={jitterDev} seedMain={301} seedGhost={303} fill="#7c98c7" />
      <PencilStroke path={cuff} ink={ink} ghostInk={ghostInk} strokeWidth={strokeW}
        jitterLen={jitterLen} jitterDev={jitterDev} seedMain={305} seedGhost={307} fill="#5a7aa8" />
      <PencilStroke path={pom} ink={ink} ghostInk={ghostInk} strokeWidth={strokeW * 0.7}
        jitterLen={jitterLen * 0.6} jitterDev={jitterDev * 0.5} seedMain={309} seedGhost={311} fill="#fbfaf3" />
    </Group>
  );
};

const Cap: ArtComponent = ({ size, ink, ghostInk, jitterLen, jitterDev, anchors }) => {
  const { cx, headTop } = anchors;
  const w = size * 0.6;
  const strokeW = Math.max(2, size * 0.028);

  const dome = Skia.Path.Make();
  dome.moveTo(cx - w / 2, headTop + size * 0.05);
  dome.cubicTo(cx - w * 0.5, headTop - size * 0.18, cx + w * 0.5, headTop - size * 0.18, cx + w / 2, headTop + size * 0.05);
  dome.close();

  const brim = Skia.Path.Make();
  brim.addRRect({
    rect: { x: cx - size * 0.1, y: headTop + size * 0.04, width: size * 0.4, height: size * 0.06 },
    rx: size * 0.03,
    ry: size * 0.03,
  });

  return (
    <Group>
      <PencilStroke path={dome} ink={ink} ghostInk={ghostInk} strokeWidth={strokeW}
        jitterLen={jitterLen} jitterDev={jitterDev} seedMain={321} seedGhost={323} fill="#d05858" />
      <PencilStroke path={brim} ink={ink} ghostInk={ghostInk} strokeWidth={strokeW}
        jitterLen={jitterLen} jitterDev={jitterDev} seedMain={325} seedGhost={327} fill="#b04545" />
    </Group>
  );
};

const Bucket: ArtComponent = ({ size, ink, ghostInk, jitterLen, jitterDev, anchors }) => {
  const { cx, headTop } = anchors;
  const w = size * 0.62;
  const strokeW = Math.max(2, size * 0.028);

  const crown = Skia.Path.Make();
  crown.addRRect({
    rect: { x: cx - w * 0.38, y: headTop - size * 0.18, width: w * 0.76, height: size * 0.22 },
    rx: size * 0.04,
    ry: size * 0.04,
  });

  const brim = Skia.Path.Make();
  brim.addOval({
    x: cx - w / 2,
    y: headTop - size * 0.02,
    width: w,
    height: size * 0.12,
  });

  return (
    <Group>
      <PencilStroke path={brim} ink={ink} ghostInk={ghostInk} strokeWidth={strokeW}
        jitterLen={jitterLen} jitterDev={jitterDev} seedMain={331} seedGhost={333} fill="#b8a86a" />
      <PencilStroke path={crown} ink={ink} ghostInk={ghostInk} strokeWidth={strokeW}
        jitterLen={jitterLen} jitterDev={jitterDev} seedMain={335} seedGhost={337} fill="#ccbc7e" />
    </Group>
  );
};

const Headband: ArtComponent = ({ size, ink, ghostInk, jitterLen, jitterDev, anchors }) => {
  const { cx, headTop } = anchors;
  const w = size * 0.6;
  const strokeW = Math.max(2, size * 0.028);
  const band = Skia.Path.Make();
  band.addRRect({
    rect: { x: cx - w / 2, y: headTop + size * 0.06, width: w, height: size * 0.06 },
    rx: size * 0.02,
    ry: size * 0.02,
  });
  // little knot blob on the side
  const knot = Skia.Path.Make();
  knot.addCircle(cx + w / 2 - size * 0.02, headTop + size * 0.09, size * 0.04);
  return (
    <Group>
      <PencilStroke path={band} ink={ink} ghostInk={ghostInk} strokeWidth={strokeW}
        jitterLen={jitterLen} jitterDev={jitterDev} seedMain={341} seedGhost={343} fill="#e84a7a" />
      <PencilStroke path={knot} ink={ink} ghostInk={ghostInk} strokeWidth={strokeW * 0.8}
        jitterLen={jitterLen} jitterDev={jitterDev} seedMain={345} seedGhost={347} fill="#e84a7a" />
    </Group>
  );
};

const Beret: ArtComponent = ({ size, ink, ghostInk, jitterLen, jitterDev, anchors }) => {
  const { cx, headTop } = anchors;
  const strokeW = Math.max(2, size * 0.028);
  // tilted oval to the side
  const cap = Skia.Path.Make();
  cap.addOval({
    x: cx - size * 0.32,
    y: headTop - size * 0.16,
    width: size * 0.6,
    height: size * 0.22,
  });
  const stem = Skia.Path.Make();
  stem.addCircle(cx + size * 0.22, headTop - size * 0.16, size * 0.025);
  return (
    <Group>
      <PencilStroke path={cap} ink={ink} ghostInk={ghostInk} strokeWidth={strokeW}
        jitterLen={jitterLen} jitterDev={jitterDev} seedMain={351} seedGhost={353} fill="#5a3a52" />
      <PencilStroke path={stem} ink={ink} ghostInk={ghostInk} strokeWidth={strokeW * 0.7}
        jitterLen={jitterLen * 0.6} jitterDev={jitterDev * 0.5} seedMain={355} seedGhost={357} fill="#5a3a52" />
    </Group>
  );
};

const Bowler: ArtComponent = ({ size, ink, ghostInk, jitterLen, jitterDev, anchors }) => {
  const { cx, headTop } = anchors;
  const w = size * 0.46;
  const strokeW = Math.max(2, size * 0.028);
  const dome = Skia.Path.Make();
  dome.moveTo(cx - w / 2, headTop + size * 0.04);
  dome.cubicTo(
    cx - w * 0.55, headTop - size * 0.2,
    cx + w * 0.55, headTop - size * 0.2,
    cx + w / 2, headTop + size * 0.04,
  );
  dome.close();
  const brim = Skia.Path.Make();
  brim.addRRect({
    rect: { x: cx - w * 0.7, y: headTop + size * 0.03, width: w * 1.4, height: size * 0.05 },
    rx: size * 0.025, ry: size * 0.025,
  });
  return (
    <Group>
      <PencilStroke path={brim} ink={ink} ghostInk={ghostInk} strokeWidth={strokeW}
        jitterLen={jitterLen} jitterDev={jitterDev} seedMain={361} seedGhost={363} fill="#3a2a22" />
      <PencilStroke path={dome} ink={ink} ghostInk={ghostInk} strokeWidth={strokeW}
        jitterLen={jitterLen} jitterDev={jitterDev} seedMain={365} seedGhost={367} fill="#3a2a22" />
    </Group>
  );
};

const Fedora: ArtComponent = ({ size, ink, ghostInk, jitterLen, jitterDev, anchors }) => {
  const { cx, headTop } = anchors;
  const w = size * 0.54;
  const strokeW = Math.max(2, size * 0.028);
  const crown = Skia.Path.Make();
  // pinched crown (slight indent at top)
  crown.moveTo(cx - w * 0.35, headTop + size * 0.04);
  crown.lineTo(cx - w * 0.32, headTop - size * 0.18);
  crown.quadTo(cx - w * 0.05, headTop - size * 0.22, cx, headTop - size * 0.16);
  crown.quadTo(cx + w * 0.05, headTop - size * 0.22, cx + w * 0.32, headTop - size * 0.18);
  crown.lineTo(cx + w * 0.35, headTop + size * 0.04);
  crown.close();
  const brim = Skia.Path.Make();
  brim.addRRect({
    rect: { x: cx - w * 0.7, y: headTop + size * 0.03, width: w * 1.4, height: size * 0.05 },
    rx: size * 0.025, ry: size * 0.025,
  });
  const band = Skia.Path.Make();
  band.addRRect({
    rect: { x: cx - w * 0.35, y: headTop, width: w * 0.7, height: size * 0.025 },
    rx: 1, ry: 1,
  });
  return (
    <Group>
      <PencilStroke path={brim} ink={ink} ghostInk={ghostInk} strokeWidth={strokeW}
        jitterLen={jitterLen} jitterDev={jitterDev} seedMain={371} seedGhost={373} fill="#5a4030" />
      <PencilStroke path={crown} ink={ink} ghostInk={ghostInk} strokeWidth={strokeW}
        jitterLen={jitterLen} jitterDev={jitterDev} seedMain={375} seedGhost={377} fill="#5a4030" />
      <PencilStroke path={band} ink={ink} ghostInk={ghostInk} strokeWidth={strokeW * 0.6}
        jitterLen={jitterLen} jitterDev={jitterDev} seedMain={379} seedGhost={381} fill="#1a1410" />
    </Group>
  );
};

const TopHat: ArtComponent = ({ size, ink, ghostInk, jitterLen, jitterDev, anchors }) => {
  const { cx, headTop } = anchors;
  const w = size * 0.4;
  const strokeW = Math.max(2, size * 0.028);
  const crown = Skia.Path.Make();
  crown.addRRect({
    rect: { x: cx - w / 2, y: headTop - size * 0.32, width: w, height: size * 0.36 },
    rx: size * 0.02, ry: size * 0.02,
  });
  const brim = Skia.Path.Make();
  brim.addRRect({
    rect: { x: cx - w * 0.85, y: headTop + size * 0.02, width: w * 1.7, height: size * 0.05 },
    rx: size * 0.025, ry: size * 0.025,
  });
  const band = Skia.Path.Make();
  band.addRRect({
    rect: { x: cx - w / 2, y: headTop - size * 0.04, width: w, height: size * 0.04 },
    rx: 1, ry: 1,
  });
  return (
    <Group>
      <PencilStroke path={brim} ink={ink} ghostInk={ghostInk} strokeWidth={strokeW}
        jitterLen={jitterLen} jitterDev={jitterDev} seedMain={391} seedGhost={393} fill="#1a1612" />
      <PencilStroke path={crown} ink={ink} ghostInk={ghostInk} strokeWidth={strokeW}
        jitterLen={jitterLen} jitterDev={jitterDev} seedMain={395} seedGhost={397} fill="#1a1612" />
      <PencilStroke path={band} ink={ink} ghostInk={ghostInk} strokeWidth={strokeW * 0.6}
        jitterLen={jitterLen} jitterDev={jitterDev} seedMain={399} seedGhost={401} fill="#9b6bd8" />
    </Group>
  );
};

const Cowboy: ArtComponent = ({ size, ink, ghostInk, jitterLen, jitterDev, anchors }) => {
  const { cx, headTop } = anchors;
  const w = size * 0.5;
  const strokeW = Math.max(2, size * 0.028);
  const crown = Skia.Path.Make();
  // creased crown
  crown.moveTo(cx - w * 0.35, headTop + size * 0.04);
  crown.cubicTo(
    cx - w * 0.35, headTop - size * 0.22,
    cx - w * 0.05, headTop - size * 0.24,
    cx, headTop - size * 0.16,
  );
  crown.cubicTo(
    cx + w * 0.05, headTop - size * 0.24,
    cx + w * 0.35, headTop - size * 0.22,
    cx + w * 0.35, headTop + size * 0.04,
  );
  crown.close();
  // wide curled brim
  const brim = Skia.Path.Make();
  brim.moveTo(cx - w * 0.95, headTop + size * 0.06);
  brim.quadTo(cx - w * 0.7, headTop + size * 0, cx, headTop + size * 0.04);
  brim.quadTo(cx + w * 0.7, headTop + size * 0, cx + w * 0.95, headTop + size * 0.06);
  brim.quadTo(cx + w * 0.7, headTop + size * 0.1, cx, headTop + size * 0.08);
  brim.quadTo(cx - w * 0.7, headTop + size * 0.1, cx - w * 0.95, headTop + size * 0.06);
  brim.close();
  return (
    <Group>
      <PencilStroke path={brim} ink={ink} ghostInk={ghostInk} strokeWidth={strokeW}
        jitterLen={jitterLen} jitterDev={jitterDev} seedMain={411} seedGhost={413} fill="#7a5a3a" />
      <PencilStroke path={crown} ink={ink} ghostInk={ghostInk} strokeWidth={strokeW}
        jitterLen={jitterLen} jitterDev={jitterDev} seedMain={415} seedGhost={417} fill="#7a5a3a" />
    </Group>
  );
};

const Bandana: ArtComponent = ({ size, ink, ghostInk, jitterLen, jitterDev, anchors }) => {
  const { cx, headTop } = anchors;
  const w = size * 0.6;
  const strokeW = Math.max(2, size * 0.028);
  // forehead band
  const band = Skia.Path.Make();
  band.moveTo(cx - w / 2, headTop + size * 0.1);
  band.lineTo(cx - w * 0.55, headTop + size * 0.04);
  band.cubicTo(
    cx - w * 0.45, headTop - size * 0.04,
    cx + w * 0.45, headTop - size * 0.04,
    cx + w * 0.55, headTop + size * 0.04,
  );
  band.lineTo(cx + w / 2, headTop + size * 0.1);
  band.close();
  // tied tails on the side
  const tails = Skia.Path.Make();
  tails.moveTo(cx + w * 0.55, headTop + size * 0.04);
  tails.lineTo(cx + w * 0.78, headTop + size * 0.0);
  tails.lineTo(cx + w * 0.66, headTop + size * 0.12);
  tails.close();
  return (
    <Group>
      <PencilStroke path={band} ink={ink} ghostInk={ghostInk} strokeWidth={strokeW}
        jitterLen={jitterLen} jitterDev={jitterDev} seedMain={421} seedGhost={423} fill="#c84545" />
      <PencilStroke path={tails} ink={ink} ghostInk={ghostInk} strokeWidth={strokeW * 0.85}
        jitterLen={jitterLen} jitterDev={jitterDev} seedMain={425} seedGhost={427} fill="#c84545" />
    </Group>
  );
};

export const HAT_ART: Record<string, ArtComponent> = {
  'hat.beanie': Beanie,
  'hat.cap': Cap,
  'hat.bucket': Bucket,
  'hat.headband': Headband,
  'hat.beret': Beret,
  'hat.bowler': Bowler,
  'hat.fedora': Fedora,
  'hat.top': TopHat,
  'hat.cowboy': Cowboy,
  'hat.bandana': Bandana,
};
