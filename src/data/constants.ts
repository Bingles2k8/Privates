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

export const LH_TEST = [
  { value: 'negative', label: 'Negative' },
  { value: 'low', label: 'Low' },
  { value: 'high', label: 'High' },
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

export const SEX_KINDS = [
  { value: 'protected', label: 'Protected' },
  { value: 'unprotected', label: 'Unprotected' },
  { value: 'solo', label: 'Solo' },
  { value: 'none', label: 'None' },
] as const;

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
