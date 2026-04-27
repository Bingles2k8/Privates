export const FLOW_LEVELS = [
  { value: 0, label: 'None' },
  { value: 1, label: 'Spotting' },
  { value: 2, label: 'Light' },
  { value: 3, label: 'Medium' },
  { value: 4, label: 'Heavy' },
] as const;

export const CERVICAL_MUCUS = [
  { value: 'dry', label: 'Dry' },
  { value: 'sticky', label: 'Sticky' },
  { value: 'creamy', label: 'Creamy' },
  { value: 'watery', label: 'Watery' },
  { value: 'eggwhite', label: 'Egg white' },
] as const;

// Ovulation test (LH) result. Values are the canonical wire format and stay
// stable across UI revisions so existing rows keep loading; only the labels
// change. The 4-level scale spans both line tests ("negative" / "faint" /
// "positive") and digital tests like Clearblue ("low" / "high" / "peak").
export const LH_TEST = [
  { value: 'negative', label: 'No surge' },
  { value: 'low', label: 'Faint line' },
  { value: 'high', label: 'Positive' },
  { value: 'peak', label: 'Peak' },
] as const;

export const SYMPTOM_TAGS = [
  'cramps', 'headache', 'migraine', 'bloating', 'nausea', 'fatigue',
  'acne', 'breast_tenderness', 'back_pain', 'joint_pain', 'cravings',
  'insomnia', 'dizziness', 'constipation', 'diarrhea', 'gas',
  'spotting', 'discharge', 'tender_skin', 'hot_flashes', 'cold_sweats',
  'low_libido', 'high_libido', 'appetite_loss', 'increased_appetite',
  'sore_throat', 'congestion', 'swelling', 'cervical_pain', 'ovulation_pain',
] as const;

export const MOOD_TAGS = [
  'happy', 'calm', 'energetic', 'focused', 'motivated',
  'anxious', 'irritable', 'sad', 'angry', 'overwhelmed',
  'tearful', 'numb', 'sensitive', 'restless', 'apathetic',
] as const;

// Sex log activity. The previous version of this enum conflated "kind" with
// "protection" (protected/unprotected/solo/none); we split them so users can
// log e.g. "partnered + pulled_out" without overloading one chip. Existing
// rows with the old values are normalized for display in app/log/[date].tsx.
export const SEX_KINDS = [
  { value: 'partnered', label: 'Partnered' },
  { value: 'solo', label: 'Solo' },
  { value: 'none', label: 'None' },
] as const;

// Only meaningful when kind === 'partnered'. The form hides this when
// activity is 'solo' or 'none'.
export const SEX_PROTECTION = [
  { value: 'none', label: 'None' },
  { value: 'condom', label: 'Condom' },
  { value: 'birth_control', label: 'Birth control' },
  { value: 'pulled_out', label: 'Pulled out' },
  { value: 'multiple', label: 'Multiple' },
] as const;

// Sex drive / libido scale. 1 = very low, 5 = very high. Independent of
// whether any activity was logged — users can log a high-drive day with
// kind=none.
export const SEX_DRIVE_MIN = 1;
export const SEX_DRIVE_MAX = 5;

export const MEDICATION_KINDS = [
  { value: 'pill_combined', label: 'Combined pill' },
  { value: 'pill_progestin', label: 'Progestin-only pill' },
  { value: 'patch', label: 'Patch' },
  { value: 'ring', label: 'Vaginal ring' },
  { value: 'iud_hormonal', label: 'Hormonal IUD' },
  { value: 'iud_copper', label: 'Copper IUD' },
  { value: 'implant', label: 'Implant' },
  { value: 'shot', label: 'Shot' },
  { value: 'condom', label: 'Condom' },
  { value: 'diaphragm', label: 'Diaphragm' },
  { value: 'fam', label: 'Fertility awareness' },
  { value: 'none', label: 'None' },
  { value: 'other', label: 'Other' },
] as const;

// ─── Replacement-reminder catalog ────────────────────────────────────────
//
// Long-acting and recurring contraceptives have well-defined "replace by"
// schedules; we surface them so the user gets a nudge before they expire.
// All durations are FDA-approved use periods sourced from manufacturer
// labels (Mirena, Liletta, Kyleena, Skyla, Nexplanon, Paragard) and from
// Planned Parenthood / Bedsider patient guidance for the recurring methods.

/** Hormonal IUD brands available in the US, with their approved use period. */
export const HORMONAL_IUD_BRANDS = [
  { value: 'mirena', label: 'Mirena', years: 8 },
  { value: 'liletta', label: 'Liletta', years: 8 },
  { value: 'kyleena', label: 'Kyleena', years: 5 },
  { value: 'skyla', label: 'Skyla', years: 3 },
  { value: 'unknown', label: "I'm not sure", years: 5 },
] as const;

export type HormonalIudBrand = (typeof HORMONAL_IUD_BRANDS)[number]['value'];

/**
 * Default days-until-replacement per medication kind. Kinds not in this map
 * have no replacement reminder (pills handle their own daily reminder; condoms
 * and FAM have no schedule). Hormonal IUD is `null` here — the actual value
 * depends on the brand picker.
 */
export const REPLACEMENT_DAYS_BY_KIND: Record<string, number | null> = {
  iud_hormonal: null, // brand-dependent (see HORMONAL_IUD_BRANDS)
  iud_copper: 365 * 10, // Paragard: 10 years
  implant: 365 * 3, // Nexplanon: 3 years
  shot: 84, // Depo-Provera: every 12 weeks (recurring; we re-arm on each dose)
  patch: 7, // weekly patch swap
  ring: 28, // monthly ring change (NuvaRing/EluRyng)
  diaphragm: 365 * 2, // replace every 1–2 years; conservative default
};

/**
 * Human-friendly label for the replacement interval. Used in the "we'll
 * remind you on …" preview and the medication card.
 */
export function replacementIntervalLabel(days: number): string {
  if (days >= 365) {
    const years = Math.round((days / 365) * 10) / 10;
    return years === 1 ? '1 year' : `${years % 1 === 0 ? years.toFixed(0) : years} years`;
  }
  if (days >= 7) {
    const weeks = Math.round(days / 7);
    return weeks === 1 ? '1 week' : `${weeks} weeks`;
  }
  return days === 1 ? '1 day' : `${days} days`;
}
