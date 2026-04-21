import { differenceInCalendarDays, parseISO } from 'date-fns';

export type PhaseKey = 'menstrual' | 'follicular' | 'ovulatory' | 'luteal';

export type PhaseContent = {
  key: PhaseKey;
  name: string;
  short: string;
  whatHappens: string;
  whyItHappens: string;
  howYouMayFeel: string;
  commonSymptoms: string[];
};

export const PHASES: Record<PhaseKey, PhaseContent> = {
  menstrual: {
    key: 'menstrual',
    name: 'Menstrual',
    short:
      "Your uterus is shedding its lining because no pregnancy happened this cycle. Hormone levels are at their lowest, which can leave you feeling flat or tender.",
    whatHappens:
      "The inner lining of the uterus (the endometrium) breaks down and leaves the body as menstrual blood — a mix of blood, tissue, and mucus. A typical period lasts 3–7 days, with the heaviest flow in the first two.",
    whyItHappens:
      "Without a fertilized egg, the corpus luteum — the follicle left over after ovulation — stops producing progesterone. That sudden drop is the signal for the lining to break down and shed.",
    howYouMayFeel:
      "Cramps come from prostaglandins, chemicals that help the uterus contract. Iron loss can add to fatigue, and low estrogen dampens mood and energy for some people. Most of it lifts once bleeding winds down.",
    commonSymptoms: ['cramps', 'fatigue', 'headache', 'back_pain', 'nausea', 'bloating'],
  },
  follicular: {
    key: 'follicular',
    name: 'Follicular',
    short:
      "Your ovaries are preparing an egg and estrogen is climbing. Most people feel energy, focus, and mood rise across this stretch.",
    whatHappens:
      "FSH from the pituitary stimulates a handful of egg-containing follicles in your ovaries. One becomes dominant and pumps out rising amounts of estrogen, while the uterine lining starts rebuilding from scratch.",
    whyItHappens:
      "Rising estrogen thickens the endometrium, improves cervical mucus, and signals your body to get ready for possible fertilization. It's a build-up phase.",
    howYouMayFeel:
      "Higher estrogen tends to support better sleep, sharper thinking, lower appetite, clearer skin, and a slow build in libido. This is often the most 'on' phase of the cycle.",
    commonSymptoms: [],
  },
  ovulatory: {
    key: 'ovulatory',
    name: 'Ovulatory',
    short:
      "Estrogen peaks, triggering a surge of LH that releases a mature egg. This is when you're most fertile, and many people feel at their peak energy and drive.",
    whatHappens:
      "The dominant follicle ruptures and releases an egg into the fallopian tube. The egg is viable for about 24 hours; sperm can live up to 5 days, so the fertile window spans a few days before ovulation plus ovulation day itself.",
    whyItHappens:
      "A sharp LH (luteinizing hormone) spike from the pituitary is what actually triggers ovulation. Cervical mucus becomes slippery and egg-white-like to help sperm travel.",
    howYouMayFeel:
      "Peak libido, peak energy, sharper confidence. Some feel a one-sided twinge (mittelschmerz), light spotting, or mild breast tenderness as progesterone begins rising.",
    commonSymptoms: ['ovulation_pain', 'high_libido', 'spotting', 'breast_tenderness'],
  },
  luteal: {
    key: 'luteal',
    name: 'Luteal',
    short:
      "The empty follicle is now producing progesterone, which stabilizes your uterine lining. As that hormone falls near the end, PMS symptoms often show up.",
    whatHappens:
      "The follicle that released the egg becomes the corpus luteum, producing progesterone and some estrogen. If no pregnancy happens, it breaks down around day 24–26 and hormone levels drop sharply.",
    whyItHappens:
      "Progesterone's job is to keep the endometrium thick and receptive to a fertilized egg. When its source collapses, the lining loses support, which kicks off the next period.",
    howYouMayFeel:
      "Bloating, breast tenderness, acne flare-ups, food cravings, interrupted sleep, and mood shifts are all driven by the hormone swing. Basal body temperature stays slightly elevated until bleeding begins.",
    commonSymptoms: [
      'bloating',
      'breast_tenderness',
      'acne',
      'cravings',
      'insomnia',
      'fatigue',
      'low_libido',
    ],
  },
};

export type DetectPhaseInput = {
  cycleStartDate: string;
  cycleLength: number;
  periodLength?: number;
  today?: Date;
  fertileStart?: string;
  fertileEnd?: string;
  ovulation?: string;
};

/**
 * Detects which cycle phase the user is currently in.
 * Uses the predicted fertile window when available, otherwise falls back
 * to heuristic day-number splits.
 */
export function detectPhase(input: DetectPhaseInput): { phase: PhaseKey; cycleDay: number } {
  const today = input.today ?? new Date();
  const start = parseISO(input.cycleStartDate);
  const cycleDay = Math.max(1, differenceInCalendarDays(today, start) + 1);
  const periodLength = Math.max(1, input.periodLength ?? 5);
  const cycleLength = Math.max(14, input.cycleLength);

  // Menstrual: within the first `periodLength` days
  if (cycleDay <= periodLength) return { phase: 'menstrual', cycleDay };

  // Use the predicted fertile window if we have it — it's the most accurate signal.
  if (input.fertileStart && input.fertileEnd) {
    const fStart = differenceInCalendarDays(parseISO(input.fertileStart), start) + 1;
    const fEnd = differenceInCalendarDays(parseISO(input.fertileEnd), start) + 1;
    if (cycleDay < fStart) return { phase: 'follicular', cycleDay };
    if (cycleDay >= fStart && cycleDay <= fEnd) return { phase: 'ovulatory', cycleDay };
    return { phase: 'luteal', cycleDay };
  }

  // Heuristic fallback without prediction data.
  const midpoint = Math.round(cycleLength / 2);
  if (cycleDay < midpoint - 2) return { phase: 'follicular', cycleDay };
  if (cycleDay <= midpoint + 1) return { phase: 'ovulatory', cycleDay };
  return { phase: 'luteal', cycleDay };
}

/**
 * One-liner caption for the home-screen "where you're at" block.
 */
export function phaseOneLiner(phase: PhaseKey): string {
  switch (phase) {
    case 'menstrual':
      return "Hormones are at their lowest while your uterus sheds its lining — energy often dips here.";
    case 'follicular':
      return "Estrogen is rising as an egg matures — mood, focus, and energy tend to climb.";
    case 'ovulatory':
      return "An egg is being released — libido, energy, and confidence typically peak.";
    case 'luteal':
      return "Progesterone is steering the ship — expect a slower tempo, with PMS building near the end.";
  }
}
