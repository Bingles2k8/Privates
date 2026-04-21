/**
 * Catalog of sections on Today / Insights that the user can hide.
 * IDs are stable — don't rename without migrating persisted lists.
 *
 * Non-hideable (intentionally excluded): MascotHeader on both screens, the
 * Quick log button on Today, and the "Open full day log" CTA (primary
 * navigation into the detailed logger).
 */

export type CustomizeScreen = 'today' | 'insights';

export type HideableSectionDef = {
  id: string;
  label: string;
  hint?: string;
};

export const HIDEABLE_TODAY: readonly HideableSectionDef[] = [
  { id: 'next-period', label: 'Next period line', hint: 'Small line under the date' },
  { id: 'pms-banner', label: 'Pre-period heads-up', hint: 'Banner in the 1–5 days before your period' },
  { id: 'cycle-progress', label: 'Cycle progress card', hint: 'Day N of ~28, phase, fertile window' },
  { id: 'today-so-far', label: 'Today so far', hint: 'Flow / mood / symptoms summary row' },
  { id: 'birth-control-button', label: 'Birth control shortcut', hint: 'Secondary CTA at the bottom' },
] as const;

export const HIDEABLE_INSIGHTS: readonly HideableSectionDef[] = [
  { id: 'todays-body', label: "Today's body card", hint: 'Phase info + what you logged today' },
  { id: 'notes-link', label: 'Notes search shortcut' },
  { id: 'cycle-summary', label: 'Cycle & period averages', hint: 'Two side-by-side stat cards' },
  { id: 'prediction-accuracy', label: 'Prediction accuracy' },
  { id: 'year-heatmap', label: 'Year at a glance heatmap' },
  { id: 'bbt-chart', label: 'Basal body temperature chart' },
  { id: 'symptom-heatmap', label: 'Symptoms by cycle day heatmap' },
  { id: 'mood-timeline', label: 'Mood over time chart' },
] as const;

export function catalogFor(screen: CustomizeScreen): readonly HideableSectionDef[] {
  return screen === 'today' ? HIDEABLE_TODAY : HIDEABLE_INSIGHTS;
}

export function labelFor(screen: CustomizeScreen, id: string): string {
  return catalogFor(screen).find((s) => s.id === id)?.label ?? id;
}
