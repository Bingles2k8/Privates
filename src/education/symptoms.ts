import type { PhaseKey } from './phases';

type SymptomEntry = {
  // text keyed by phase; 'default' is used when phase isn't covered
  byPhase: Partial<Record<PhaseKey, string>> & { default: string };
};

/**
 * Phase-aware "you're feeling X today because…" explainers.
 * Each text is intentionally 2 sentences — friendly teacher tone, no jargon
 * without a quick definition, neutral (no judgment, no medical advice).
 */
const SYMPTOM_LIBRARY: Record<string, SymptomEntry> = {
  cramps: {
    byPhase: {
      menstrual:
        "Your uterus is contracting to shed its lining, and prostaglandins (pain-signaling chemicals) are turning up the volume. Heat, gentle movement, and anti-inflammatories all help because they counter prostaglandin activity.",
      luteal:
        "Low-grade cramping in the days before your period is normal — the uterus is priming to contract and prostaglandin levels are climbing. Sharp or back-wrapping cramps that show up cycle after cycle are worth flagging to a clinician.",
      ovulatory:
        "Cramps mid-cycle are usually mittelschmerz — the twinge of the follicle rupturing as it releases the egg. They tend to be one-sided and short-lived.",
      default:
        "Cramps outside your usual pattern can come from ovulation, the gut, or other sources. If they're new or intense, log them so you can spot a pattern.",
    },
  },
  fatigue: {
    byPhase: {
      menstrual:
        "Blood and iron loss plus low estrogen both pull your energy down. Most people see it lift once bleeding eases and estrogen starts climbing again.",
      luteal:
        "Progesterone has a mildly sedating effect, and a late-luteal dip in serotonin adds to the heaviness. Sleep quality also tends to dip in the days right before your period.",
      follicular:
        "Hormones aren't usually the driver of fatigue in the follicular phase — sleep debt, stress, hydration, or iron levels are more likely culprits to look at.",
      ovulatory:
        "Fatigue around ovulation is less common, but the brief estrogen dip after the LH surge can cause a short slump for some people.",
      default:
        "Fatigue can have many drivers — hormones are one, but sleep, iron, thyroid, and stress all matter. Tracking when it hits across cycles helps pinpoint the cause.",
    },
  },
  headache: {
    byPhase: {
      menstrual:
        "Estrogen just dropped off a cliff, and that's a classic trigger for menstrual headaches and migraines. Hydration, consistent sleep, and (for some) magnesium can blunt the intensity.",
      luteal:
        "The pre-period hormone drop can kick off tension or migraine-style headaches. If they're severe or come with visual changes, mention them to a clinician.",
      default:
        "Cycle-related headaches are real, but headaches outside your usual pattern deserve attention. Track what else was happening — sleep, stress, hydration — to spot triggers.",
    },
  },
  migraine: {
    byPhase: {
      menstrual:
        "Estrogen withdrawal at the start of your period is one of the strongest known migraine triggers. If menstrual migraines are a regular thing, a clinician can help you plan around them.",
      luteal:
        "The hormone drop in the late luteal phase triggers migraines for some people. Track whether they cluster in the same window — that pattern is useful information for treatment.",
      default:
        "Migraine outside your usual cycle pattern is worth tracking carefully. Frequent or severe attacks deserve a clinician's attention.",
    },
  },
  bloating: {
    byPhase: {
      luteal:
        "Progesterone slows gut motility and causes water retention, which is why your midsection feels puffier. It usually resolves once your period starts and hormones reset.",
      menstrual:
        "Prostaglandins affect the gut as well as the uterus, so bloating, gas, or changes in bowel habits in the first days of your period are common.",
      default:
        "Bloating can come from hormones, food, or gut habits. If it's persistent and unrelated to your cycle, it's worth a closer look.",
    },
  },
  breast_tenderness: {
    byPhase: {
      luteal:
        "Rising progesterone makes breast tissue swell and retain fluid. It usually peaks a few days before your period and fades as bleeding starts.",
      ovulatory:
        "Estrogen peaking around ovulation can make breast tissue feel full or tender for a day or two before progesterone takes over.",
      default:
        "Breast tenderness is most often hormonal. If you notice a new lump, persistent pain, or anything that feels different, get it checked.",
    },
  },
  acne: {
    byPhase: {
      luteal:
        "Progesterone stimulates oil glands, and the shifting estrogen-to-progesterone ratio promotes breakouts. The jawline and chin are typical hotspots.",
      menstrual:
        "Acne that flares right before or during your period is hormone-driven, not hygiene-driven. It usually clears as estrogen climbs back up.",
      default:
        "Hormonal acne tracks with the cycle. If it's persistent and not cycle-linked, the cause is more likely diet, products, or stress.",
    },
  },
  cravings: {
    byPhase: {
      luteal:
        "Serotonin dips in the late luteal phase, and carbs or sugar are a fast way for your brain to nudge it back up. It's biology, not willpower.",
      menstrual:
        "Cravings during your period often track with iron loss and energy needs. Listening to them while staying hydrated tends to keep things in check.",
      default:
        "Cravings can be hormonal, but they also follow sleep loss and stress. Notice when they hit hardest to spot the real driver.",
    },
  },
  insomnia: {
    byPhase: {
      luteal:
        "Falling progesterone disrupts deep sleep, and rising core body temperature makes it harder to stay asleep. Sleep quality typically improves once your period starts.",
      menstrual:
        "Cramps and restlessness in the first night or two can fragment sleep. Heat or gentle stretching before bed often helps settle things.",
      default:
        "Cycle hormones affect sleep, but sleep also has its own ecosystem — caffeine, light, stress, and screens all play in.",
    },
  },
  nausea: {
    byPhase: {
      menstrual:
        "High prostaglandin levels don't just contract the uterus — they irritate the gut too. Nausea with your period usually fades after day 2 or 3.",
      luteal:
        "Pre-period nausea is less common but can show up alongside other PMS symptoms. If it's severe and persistent, mention it to a clinician.",
      default:
        "Nausea outside your usual pattern is worth paying attention to — track what else is going on around it.",
    },
  },
  back_pain: {
    byPhase: {
      menstrual:
        "Uterine contractions can refer pain into the low back, especially if your uterus tilts backward. Warmth and gentle movement are usually the fastest relief.",
      luteal:
        "Pre-period back ache often comes from the same prostaglandins driving cramps, just felt in a different spot. It typically eases once bleeding starts.",
      default:
        "Cycle-related back pain is real, but persistent back pain deserves its own look. Track when it hits to separate cycle from posture or strain.",
    },
  },
  spotting: {
    byPhase: {
      ovulatory:
        "Some people spot around ovulation — estrogen dips briefly before progesterone takes over, and the lining can release a few drops. It usually lasts a day or less.",
      luteal:
        "Light spotting in the late luteal phase can mean your period is starting or that progesterone is ebbing early. Persistent mid-cycle bleeding is worth checking with a clinician.",
      default:
        "Spotting outside the usual times is common and often benign, but persistent or heavy mid-cycle bleeding is worth a clinician's look.",
    },
  },
  high_libido: {
    byPhase: {
      ovulatory:
        "Estrogen and testosterone both peak around ovulation — your body's biological push toward reproduction. This is when many people feel the biggest drive.",
      follicular:
        "As estrogen climbs, libido often climbs with it. Many people notice the build a few days before ovulation.",
      default:
        "Libido has many inputs beyond hormones — sleep, mood, stress, connection. Cycle just nudges the dial.",
    },
  },
  low_libido: {
    byPhase: {
      luteal:
        "Progesterone is mildly sedating and dampens drive for many people. It usually picks back up once estrogen starts rising in the next follicular phase.",
      menstrual:
        "Low estrogen and the physical discomfort of bleeding often pull drive down. For some, it rebounds once the period eases.",
      default:
        "Low libido has many inputs — hormones are one. Sleep, stress, mood, and medications (including hormonal birth control) all play in.",
    },
  },
  cervical_pain: {
    byPhase: {
      ovulatory:
        "Mittelschmerz — German for 'middle pain' — is the one-sided twinge of a follicle rupturing as it releases the egg. It's usually short-lived and a reliable sign you've just ovulated.",
      default:
        "Pelvic or cervical pain outside ovulation is worth tracking. If it's persistent or sharp, mention it to a clinician.",
    },
  },
  ovulation_pain: {
    byPhase: {
      ovulatory:
        "Mittelschmerz — German for 'middle pain' — is the one-sided twinge of a follicle rupturing as it releases the egg. It's usually short-lived (minutes to a day) and a reliable sign you've just ovulated.",
      default: "Ovulation pain outside the fertile window is unusual — log when it happens to spot a pattern.",
    },
  },
  hot_flashes: {
    byPhase: {
      luteal:
        "Your core body temperature is running about half a degree higher in the luteal phase, which can make you flush. Frequent or intense hot flashes are worth discussing with a clinician.",
      default:
        "Occasional flushing can be cycle-related. Frequent or intense hot flashes deserve a closer look — they can have many causes.",
    },
  },
  cold_sweats: {
    byPhase: {
      luteal:
        "Higher luteal-phase body temperature plus hormone swings can cause temperature fluctuations and night sweats. If it's frequent or disrupting sleep, mention it to a clinician.",
      default:
        "Cold sweats outside your usual cycle pattern are worth tracking. Persistent ones deserve a clinician's attention.",
    },
  },
  dizziness: {
    byPhase: {
      menstrual:
        "Blood loss plus prostaglandin-driven dips in blood pressure can make you lightheaded, especially when standing up quickly. Hydration and iron-rich food help.",
      default:
        "Persistent dizziness outside your period deserves a closer look — it can have many causes beyond the cycle.",
    },
  },
  joint_pain: {
    byPhase: {
      luteal:
        "Estrogen has anti-inflammatory effects, so as it falls in the late luteal phase, joint and muscle aches can flare. They typically ease once estrogen starts climbing again.",
      menstrual:
        "Low estrogen at the start of your period can leave joints feeling stiffer or achier. Gentle movement and warmth help.",
      default:
        "Joint pain has many drivers beyond hormones — track when it shows up to spot the pattern.",
    },
  },
  constipation: {
    byPhase: {
      luteal:
        "Progesterone slows gut motility, which is why things back up in the second half of the cycle. Hydration, fiber, and movement help keep things moving.",
      default:
        "Constipation outside the luteal phase usually comes from diet, hydration, or stress rather than hormones.",
    },
  },
  diarrhea: {
    byPhase: {
      menstrual:
        "Prostaglandins affect the gut as well as the uterus, so loose stools in the first days of your period are common. It usually settles after day 2 or 3.",
      default:
        "Diarrhea outside your period deserves a look — track what else is going on (food, stress, illness) to find the cause.",
    },
  },
};

/**
 * Returns a 2-sentence explainer for a logged symptom in the given phase.
 * Falls back to a generic 'default' string per symptom, then to a final fallback
 * if the symptom isn't in our library at all.
 */
export function explainSymptom(tag: string, phase: PhaseKey): string | null {
  const entry = SYMPTOM_LIBRARY[tag];
  if (!entry) return null;
  return entry.byPhase[phase] ?? entry.byPhase.default;
}

/**
 * The set of symptom tags we have explainers for. Used to filter what to show
 * on the "Today's body" card.
 */
export function hasExplainer(tag: string): boolean {
  return tag in SYMPTOM_LIBRARY;
}
