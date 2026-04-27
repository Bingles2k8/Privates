// Character body art. Each character renders an outer head shape plus any
// character-specific decorations (cat ears, mushroom dots, etc.). Eyes,
// mouth, cheeks are drawn separately by <FaceFeatures> so all characters
// share the same expressive moods.
//
// Each component receives the standard ArtProps. Skin / cheek overrides
// are exported via the CHARACTER_PALETTES map so Character.tsx can pick
// the right canonical colour for each character (the OG mascot keeps the
// user's accent colour; the rest have their own canonical hues).

import { Group, PathOp, Skia } from '@shopify/react-native-skia';
import type { ArtComponent } from './types';
import { PencilStroke } from './pencil';

type CharacterPalette = {
  /** If set, overrides palette.accent for the body fill. Undefined = use accent. */
  skin?: string;
  /** If set, overrides palette.ovulation for cheeks. */
  cheek?: string;
};

export const CHARACTER_PALETTES: Record<string, CharacterPalette> = {
  'character.mascot': {},
  'character.sunflower': { skin: '#f3c93a', cheek: '#e08043' },
  'character.frog': { skin: '#7fb56a', cheek: '#d97a8e' },
  'character.ghost': { skin: '#ebe6dc', cheek: '#c9a4c4' },
  'character.cat': { skin: '#e8a86b', cheek: '#d97a8e' },
  'character.smiley': { skin: '#f3c93a', cheek: '#e88a4a' },
  'character.mushroom': { skin: '#d75555', cheek: '#f4cfd0' },
  'character.owl': { skin: '#a87a4a', cheek: '#d99a4a' },
  'character.pumpkin': { skin: '#e0813a', cheek: '#d35a2a' },
  'character.robot': { skin: '#b6bcc4', cheek: '#7eb8da' },
  'character.moon': { skin: '#ecdfb8', cheek: '#c8a76a' },
};

// ---------- OG mascot — preserves the original Mascot.tsx body + ears ----

export const MascotBody: ArtComponent = ({ size, ink, ghostInk, jitterLen, jitterDev, skin }) => {
  const cx = size / 2;
  const cy = size / 2 + size * 0.04;
  const w = size * 0.78;
  const h = size * 0.72;
  const strokeW = Math.max(2, size * 0.03);

  const body = Skia.Path.Make();
  body.moveTo(cx - w * 0.05, cy - h * 0.52);
  body.cubicTo(cx + w * 0.48, cy - h * 0.56, cx + w * 0.56, cy + h * 0.1, cx + w * 0.34, cy + h * 0.48);
  body.cubicTo(cx + w * 0.15, cy + h * 0.58, cx - w * 0.2, cy + h * 0.6, cx - w * 0.38, cy + h * 0.42);
  body.cubicTo(cx - w * 0.58, cy + h * 0.15, cx - w * 0.52, cy - h * 0.5, cx - w * 0.05, cy - h * 0.52);
  body.close();

  const ears = Skia.Path.Make();
  ears.moveTo(cx - size * 0.24, cy - h * 0.46);
  ears.quadTo(cx - size * 0.3, cy - h * 0.72, cx - size * 0.16, cy - h * 0.58);
  ears.close();
  ears.moveTo(cx + size * 0.14, cy - h * 0.6);
  ears.quadTo(cx + size * 0.28, cy - h * 0.72, cx + size * 0.26, cy - h * 0.46);
  ears.close();

  return (
    <Group>
      <PencilStroke
        path={body}
        ink={ink}
        ghostInk={ghostInk}
        strokeWidth={strokeW}
        jitterLen={jitterLen}
        jitterDev={jitterDev}
        seedMain={11}
        seedGhost={27}
        fill={skin}
      />
      <PencilStroke
        path={ears}
        ink={ink}
        ghostInk={ghostInk}
        strokeWidth={strokeW}
        jitterLen={jitterLen}
        jitterDev={jitterDev}
        seedMain={13}
        seedGhost={29}
        fill={skin}
      />
    </Group>
  );
};

// ---------- helpers ----------

function roundedFace(size: number): { path: ReturnType<typeof Skia.Path.Make>; cx: number; cy: number } {
  const cx = size / 2;
  const cy = size / 2 + size * 0.04;
  const r = size * 0.4;
  const p = Skia.Path.Make();
  p.addCircle(cx, cy, r);
  return { path: p, cx, cy };
}

// ---------- Sunflower ----------

export const SunflowerBody: ArtComponent = ({ size, ink, ghostInk, jitterLen, jitterDev, skin }) => {
  const cx = size / 2;
  const cy = size / 2 + size * 0.04;
  const r = size * 0.3;
  const strokeW = Math.max(2, size * 0.03);

  const petals = Skia.Path.Make();
  const petalCount = 10;
  const petalR = size * 0.12;
  for (let i = 0; i < petalCount; i++) {
    const a = (i / petalCount) * Math.PI * 2 - Math.PI / 2;
    const px = cx + Math.cos(a) * (r + petalR * 0.4);
    const py = cy + Math.sin(a) * (r + petalR * 0.4);
    petals.addCircle(px, py, petalR * 0.7);
  }

  const face = Skia.Path.Make();
  face.addCircle(cx, cy, r);

  return (
    <Group>
      <PencilStroke
        path={petals}
        ink={ink}
        ghostInk={ghostInk}
        strokeWidth={strokeW * 0.8}
        jitterLen={jitterLen}
        jitterDev={jitterDev}
        seedMain={71}
        seedGhost={73}
        fill="#f3c93a"
      />
      <PencilStroke
        path={face}
        ink={ink}
        ghostInk={ghostInk}
        strokeWidth={strokeW}
        jitterLen={jitterLen}
        jitterDev={jitterDev}
        seedMain={75}
        seedGhost={77}
        fill={skin}
      />
    </Group>
  );
};

// ---------- Frog ----------

export const FrogBody: ArtComponent = ({ size, ink, ghostInk, jitterLen, jitterDev, skin }) => {
  const cx = size / 2;
  const cy = size / 2 + size * 0.06;
  const w = size * 0.84;
  const h = size * 0.66;
  const strokeW = Math.max(2, size * 0.03);

  const body = Skia.Path.Make();
  body.moveTo(cx - w * 0.42, cy - h * 0.1);
  body.cubicTo(cx - w * 0.5, cy + h * 0.5, cx + w * 0.5, cy + h * 0.5, cx + w * 0.42, cy - h * 0.1);
  body.cubicTo(cx + w * 0.4, cy - h * 0.55, cx - w * 0.4, cy - h * 0.55, cx - w * 0.42, cy - h * 0.1);
  body.close();

  const eyeBumpL = Skia.Path.Make();
  eyeBumpL.addCircle(cx - size * 0.18, cy - size * 0.32, size * 0.13);
  const eyeBumpR = Skia.Path.Make();
  eyeBumpR.addCircle(cx + size * 0.18, cy - size * 0.32, size * 0.13);

  return (
    <Group>
      <PencilStroke
        path={body}
        ink={ink}
        ghostInk={ghostInk}
        strokeWidth={strokeW}
        jitterLen={jitterLen}
        jitterDev={jitterDev}
        seedMain={81}
        seedGhost={83}
        fill={skin}
      />
      <PencilStroke
        path={eyeBumpL}
        ink={ink}
        ghostInk={ghostInk}
        strokeWidth={strokeW * 0.85}
        jitterLen={jitterLen}
        jitterDev={jitterDev}
        seedMain={85}
        seedGhost={87}
        fill={skin}
      />
      <PencilStroke
        path={eyeBumpR}
        ink={ink}
        ghostInk={ghostInk}
        strokeWidth={strokeW * 0.85}
        jitterLen={jitterLen}
        jitterDev={jitterDev}
        seedMain={89}
        seedGhost={91}
        fill={skin}
      />
    </Group>
  );
};

// ---------- Ghost ----------

export const GhostBody: ArtComponent = ({ size, ink, ghostInk, jitterLen, jitterDev, skin }) => {
  const cx = size / 2;
  const cy = size / 2 + size * 0.04;
  const w = size * 0.7;
  const h = size * 0.78;
  const strokeW = Math.max(2, size * 0.03);
  const top = cy - h * 0.5;
  const bottom = cy + h * 0.42;

  const body = Skia.Path.Make();
  body.moveTo(cx - w * 0.5, cy - h * 0.05);
  body.cubicTo(cx - w * 0.55, top, cx + w * 0.55, top, cx + w * 0.5, cy - h * 0.05);
  body.lineTo(cx + w * 0.5, bottom);
  // wavy bottom (3 bumps)
  body.quadTo(cx + w * 0.36, bottom + size * 0.06, cx + w * 0.22, bottom);
  body.quadTo(cx + w * 0.08, bottom + size * 0.06, cx - w * 0.06, bottom);
  body.quadTo(cx - w * 0.2, bottom + size * 0.06, cx - w * 0.34, bottom);
  body.quadTo(cx - w * 0.46, bottom + size * 0.06, cx - w * 0.5, bottom);
  body.close();

  return (
    <Group>
      <PencilStroke
        path={body}
        ink={ink}
        ghostInk={ghostInk}
        strokeWidth={strokeW}
        jitterLen={jitterLen}
        jitterDev={jitterDev}
        seedMain={101}
        seedGhost={103}
        fill={skin}
      />
    </Group>
  );
};

// ---------- Cat ----------

export const CatBody: ArtComponent = ({ size, ink, ghostInk, jitterLen, jitterDev, skin }) => {
  const cx = size / 2;
  const cy = size / 2 + size * 0.04;
  const r = size * 0.36;
  const strokeW = Math.max(2, size * 0.03);

  const body = Skia.Path.Make();
  body.addCircle(cx, cy, r);

  const ears = Skia.Path.Make();
  // sharper triangular ears than the OG mascot
  ears.moveTo(cx - size * 0.32, cy - size * 0.16);
  ears.lineTo(cx - size * 0.36, cy - size * 0.4);
  ears.lineTo(cx - size * 0.16, cy - size * 0.32);
  ears.close();
  ears.moveTo(cx + size * 0.32, cy - size * 0.16);
  ears.lineTo(cx + size * 0.36, cy - size * 0.4);
  ears.lineTo(cx + size * 0.16, cy - size * 0.32);
  ears.close();

  // whiskers
  const whiskers = Skia.Path.Make();
  const wy = cy + size * 0.14;
  whiskers.moveTo(cx - size * 0.32, wy - size * 0.02);
  whiskers.lineTo(cx - size * 0.18, wy);
  whiskers.moveTo(cx - size * 0.32, wy + size * 0.04);
  whiskers.lineTo(cx - size * 0.18, wy + size * 0.02);
  whiskers.moveTo(cx + size * 0.32, wy - size * 0.02);
  whiskers.lineTo(cx + size * 0.18, wy);
  whiskers.moveTo(cx + size * 0.32, wy + size * 0.04);
  whiskers.lineTo(cx + size * 0.18, wy + size * 0.02);

  return (
    <Group>
      <PencilStroke
        path={body}
        ink={ink}
        ghostInk={ghostInk}
        strokeWidth={strokeW}
        jitterLen={jitterLen}
        jitterDev={jitterDev}
        seedMain={111}
        seedGhost={113}
        fill={skin}
      />
      <PencilStroke
        path={ears}
        ink={ink}
        ghostInk={ghostInk}
        strokeWidth={strokeW}
        jitterLen={jitterLen}
        jitterDev={jitterDev}
        seedMain={115}
        seedGhost={117}
        fill={skin}
      />
      <PencilStroke
        path={whiskers}
        ink={ink}
        ghostInk={ghostInk}
        strokeWidth={strokeW * 0.5}
        jitterLen={jitterLen * 0.7}
        jitterDev={jitterDev * 0.6}
        seedMain={119}
        seedGhost={121}
      />
    </Group>
  );
};

// ---------- Smiley ----------

export const SmileyBody: ArtComponent = ({ size, ink, ghostInk, jitterLen, jitterDev, skin }) => {
  const { path } = roundedFace(size);
  const strokeW = Math.max(2, size * 0.03);
  return (
    <Group>
      <PencilStroke
        path={path}
        ink={ink}
        ghostInk={ghostInk}
        strokeWidth={strokeW}
        jitterLen={jitterLen}
        jitterDev={jitterDev}
        seedMain={131}
        seedGhost={133}
        fill={skin}
      />
    </Group>
  );
};

// ---------- Mushroom ----------

export const MushroomBody: ArtComponent = ({ size, ink, ghostInk, jitterLen, jitterDev, skin }) => {
  const cx = size / 2;
  const cy = size / 2 + size * 0.06;
  const strokeW = Math.max(2, size * 0.03);

  // stem (lower part) — light beige
  const stem = Skia.Path.Make();
  stem.moveTo(cx - size * 0.2, cy + size * 0.12);
  stem.cubicTo(
    cx - size * 0.2,
    cy + size * 0.4,
    cx + size * 0.2,
    cy + size * 0.4,
    cx + size * 0.2,
    cy + size * 0.12,
  );
  stem.close();

  // cap (upper dome)
  const cap = Skia.Path.Make();
  cap.moveTo(cx - size * 0.42, cy + size * 0.12);
  cap.cubicTo(
    cx - size * 0.5,
    cy - size * 0.5,
    cx + size * 0.5,
    cy - size * 0.5,
    cx + size * 0.42,
    cy + size * 0.12,
  );
  cap.close();

  // dots on the cap
  const dots = Skia.Path.Make();
  dots.addCircle(cx - size * 0.2, cy - size * 0.2, size * 0.05);
  dots.addCircle(cx + size * 0.18, cy - size * 0.16, size * 0.06);
  dots.addCircle(cx, cy - size * 0.32, size * 0.045);

  return (
    <Group>
      <PencilStroke
        path={stem}
        ink={ink}
        ghostInk={ghostInk}
        strokeWidth={strokeW}
        jitterLen={jitterLen}
        jitterDev={jitterDev}
        seedMain={141}
        seedGhost={143}
        fill="#ebe1c6"
      />
      <PencilStroke
        path={cap}
        ink={ink}
        ghostInk={ghostInk}
        strokeWidth={strokeW}
        jitterLen={jitterLen}
        jitterDev={jitterDev}
        seedMain={145}
        seedGhost={147}
        fill={skin}
      />
      <PencilStroke
        path={dots}
        ink={ink}
        ghostInk={ghostInk}
        strokeWidth={strokeW * 0.6}
        jitterLen={jitterLen * 0.7}
        jitterDev={jitterDev * 0.6}
        seedMain={149}
        seedGhost={151}
        fill="#fbfaf3"
      />
    </Group>
  );
};

// ---------- Owl ----------

export const OwlBody: ArtComponent = ({ size, ink, ghostInk, jitterLen, jitterDev, skin }) => {
  const cx = size / 2;
  const cy = size / 2 + size * 0.04;
  const r = size * 0.38;
  const strokeW = Math.max(2, size * 0.03);

  const body = Skia.Path.Make();
  body.addCircle(cx, cy, r);

  // ear tufts
  const tufts = Skia.Path.Make();
  tufts.moveTo(cx - size * 0.28, cy - size * 0.28);
  tufts.lineTo(cx - size * 0.36, cy - size * 0.46);
  tufts.lineTo(cx - size * 0.18, cy - size * 0.32);
  tufts.close();
  tufts.moveTo(cx + size * 0.28, cy - size * 0.28);
  tufts.lineTo(cx + size * 0.36, cy - size * 0.46);
  tufts.lineTo(cx + size * 0.18, cy - size * 0.32);
  tufts.close();

  // chest feather indication — gentle V at the bottom
  const chest = Skia.Path.Make();
  chest.moveTo(cx - size * 0.18, cy + size * 0.18);
  chest.lineTo(cx, cy + size * 0.32);
  chest.lineTo(cx + size * 0.18, cy + size * 0.18);

  return (
    <Group>
      <PencilStroke
        path={tufts}
        ink={ink}
        ghostInk={ghostInk}
        strokeWidth={strokeW}
        jitterLen={jitterLen}
        jitterDev={jitterDev}
        seedMain={161}
        seedGhost={163}
        fill={skin}
      />
      <PencilStroke
        path={body}
        ink={ink}
        ghostInk={ghostInk}
        strokeWidth={strokeW}
        jitterLen={jitterLen}
        jitterDev={jitterDev}
        seedMain={165}
        seedGhost={167}
        fill={skin}
      />
      <PencilStroke
        path={chest}
        ink={ink}
        ghostInk={ghostInk}
        strokeWidth={strokeW * 0.7}
        jitterLen={jitterLen * 0.7}
        jitterDev={jitterDev * 0.6}
        seedMain={169}
        seedGhost={171}
      />
    </Group>
  );
};

// ---------- Pumpkin ----------

export const PumpkinBody: ArtComponent = ({ size, ink, ghostInk, jitterLen, jitterDev, skin }) => {
  const cx = size / 2;
  const cy = size / 2 + size * 0.06;
  const r = size * 0.4;
  const strokeW = Math.max(2, size * 0.03);

  const body = Skia.Path.Make();
  body.addOval({ x: cx - r * 1.05, y: cy - r * 0.95, width: r * 2.1, height: r * 1.9 });

  // ribs
  const ribs = Skia.Path.Make();
  ribs.moveTo(cx - size * 0.22, cy - size * 0.32);
  ribs.quadTo(cx - size * 0.28, cy, cx - size * 0.22, cy + size * 0.32);
  ribs.moveTo(cx + size * 0.22, cy - size * 0.32);
  ribs.quadTo(cx + size * 0.28, cy, cx + size * 0.22, cy + size * 0.32);
  ribs.moveTo(cx, cy - size * 0.36);
  ribs.lineTo(cx, cy + size * 0.36);

  // stem
  const stem = Skia.Path.Make();
  stem.moveTo(cx - size * 0.06, cy - size * 0.36);
  stem.lineTo(cx - size * 0.04, cy - size * 0.46);
  stem.lineTo(cx + size * 0.05, cy - size * 0.46);
  stem.lineTo(cx + size * 0.06, cy - size * 0.36);
  stem.close();

  return (
    <Group>
      <PencilStroke
        path={body}
        ink={ink}
        ghostInk={ghostInk}
        strokeWidth={strokeW}
        jitterLen={jitterLen}
        jitterDev={jitterDev}
        seedMain={181}
        seedGhost={183}
        fill={skin}
      />
      <PencilStroke
        path={ribs}
        ink={ink}
        ghostInk={ghostInk}
        strokeWidth={strokeW * 0.6}
        jitterLen={jitterLen * 0.7}
        jitterDev={jitterDev * 0.6}
        seedMain={185}
        seedGhost={187}
      />
      <PencilStroke
        path={stem}
        ink={ink}
        ghostInk={ghostInk}
        strokeWidth={strokeW}
        jitterLen={jitterLen}
        jitterDev={jitterDev}
        seedMain={189}
        seedGhost={191}
        fill="#5e7a3a"
      />
    </Group>
  );
};

// ---------- Robot ----------

export const RobotBody: ArtComponent = ({ size, ink, ghostInk, jitterLen, jitterDev, skin }) => {
  const cx = size / 2;
  const cy = size / 2 + size * 0.04;
  const w = size * 0.7;
  const h = size * 0.7;
  const strokeW = Math.max(2, size * 0.03);

  const body = Skia.Path.Make();
  body.addRRect({
    rect: { x: cx - w / 2, y: cy - h / 2, width: w, height: h },
    rx: size * 0.08,
    ry: size * 0.08,
  });

  // antenna
  const ant = Skia.Path.Make();
  ant.moveTo(cx, cy - h / 2);
  ant.lineTo(cx, cy - h / 2 - size * 0.1);
  const antBall = Skia.Path.Make();
  antBall.addCircle(cx, cy - h / 2 - size * 0.13, size * 0.035);

  // bolts on the side
  const bolts = Skia.Path.Make();
  bolts.addCircle(cx - w / 2, cy - size * 0.1, size * 0.025);
  bolts.addCircle(cx - w / 2, cy + size * 0.1, size * 0.025);
  bolts.addCircle(cx + w / 2, cy - size * 0.1, size * 0.025);
  bolts.addCircle(cx + w / 2, cy + size * 0.1, size * 0.025);

  return (
    <Group>
      <PencilStroke
        path={ant}
        ink={ink}
        ghostInk={ghostInk}
        strokeWidth={strokeW * 0.8}
        jitterLen={jitterLen * 0.7}
        jitterDev={jitterDev * 0.6}
        seedMain={201}
        seedGhost={203}
      />
      <PencilStroke
        path={antBall}
        ink={ink}
        ghostInk={ghostInk}
        strokeWidth={strokeW * 0.7}
        jitterLen={jitterLen * 0.6}
        jitterDev={jitterDev * 0.5}
        seedMain={205}
        seedGhost={207}
        fill="#e84a7a"
      />
      <PencilStroke
        path={body}
        ink={ink}
        ghostInk={ghostInk}
        strokeWidth={strokeW}
        jitterLen={jitterLen}
        jitterDev={jitterDev}
        seedMain={209}
        seedGhost={211}
        fill={skin}
      />
      <PencilStroke
        path={bolts}
        ink={ink}
        ghostInk={ghostInk}
        strokeWidth={strokeW * 0.5}
        jitterLen={jitterLen * 0.6}
        jitterDev={jitterDev * 0.5}
        seedMain={213}
        seedGhost={215}
        fill="#7a6f63"
      />
    </Group>
  );
};

// ---------- Moon (crescent) ----------

export const MoonBody: ArtComponent = ({ size, ink, ghostInk, jitterLen, jitterDev, skin }) => {
  const cx = size / 2;
  const cy = size / 2 + size * 0.04;
  const r = size * 0.4;
  const strokeW = Math.max(2, size * 0.03);

  // crescent: a circle with another circle subtracted to its right.
  const moon = Skia.Path.Make();
  moon.addCircle(cx, cy, r);
  const cutter = Skia.Path.Make();
  cutter.addCircle(cx + size * 0.18, cy - size * 0.04, r);
  // Subtract the cutter from moon to get a crescent shape.
  const crescent = Skia.Path.MakeFromOp(moon, cutter, PathOp.Difference);

  // small star on the empty side
  const star = Skia.Path.Make();
  const sx = cx + size * 0.3;
  const sy = cy - size * 0.18;
  const sr = size * 0.04;
  star.moveTo(sx, sy - sr);
  star.lineTo(sx, sy + sr);
  star.moveTo(sx - sr, sy);
  star.lineTo(sx + sr, sy);

  return (
    <Group>
      <PencilStroke
        path={crescent ?? moon}
        ink={ink}
        ghostInk={ghostInk}
        strokeWidth={strokeW}
        jitterLen={jitterLen}
        jitterDev={jitterDev}
        seedMain={221}
        seedGhost={223}
        fill={skin}
      />
      <PencilStroke
        path={star}
        ink={ink}
        ghostInk={ghostInk}
        strokeWidth={strokeW * 0.6}
        jitterLen={jitterLen * 0.6}
        jitterDev={jitterDev * 0.5}
        seedMain={225}
        seedGhost={227}
      />
    </Group>
  );
};

// ---------- Registry ----------

export const CHARACTER_ART: Record<string, ArtComponent> = {
  'character.mascot': MascotBody,
  'character.sunflower': SunflowerBody,
  'character.frog': FrogBody,
  'character.ghost': GhostBody,
  'character.cat': CatBody,
  'character.smiley': SmileyBody,
  'character.mushroom': MushroomBody,
  'character.owl': OwlBody,
  'character.pumpkin': PumpkinBody,
  'character.robot': RobotBody,
  'character.moon': MoonBody,
};

