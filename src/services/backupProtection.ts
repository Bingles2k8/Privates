import { addDays, differenceInHours, parseISO } from 'date-fns';

export type DoseLike = { scheduledFor: string; skipped: boolean };

export type BackupProtection = {
  active: true;
  untilIso: string;
  reason: string;
};

/**
 * Given a medication kind and recent dose history, decides whether the user
 * should be using a backup contraceptive method and for how long.
 *
 * Rules (simplified, conservative v1):
 *  - combined pill: any skipped dose in the last 24h → backup for 7 days from the skip.
 *                    Package inserts vary, but 7 days is the common guidance after
 *                    missing 2+ active pills. We use 7 even for a single miss because
 *                    the user's cycle context is unknown to us.
 *  - progestin-only pill: any skipped dose in the last 24h → backup for 2 days.
 *                    Progestin-only pills have a 3-hour window and lose effectiveness
 *                    quickly; 48h of backup is standard.
 *
 * Returns `null` when no backup is needed. Cycles-per-method guidance is
 * intentionally conservative — missed a pill? Use backup. We'd rather be
 * cautious than clever.
 */
export function assessBackupProtection(
  kind: string,
  doses: DoseLike[],
  now: Date = new Date(),
): BackupProtection | null {
  if (kind !== 'pill_combined' && kind !== 'pill_progestin') return null;

  // Find the most recent skipped dose within the last 7 days.
  const window = 7 * 24;
  const lastSkip = doses
    .filter((d) => d.skipped)
    .map((d) => parseISO(d.scheduledFor))
    .filter((d) => differenceInHours(now, d) <= window)
    .sort((a, b) => b.getTime() - a.getTime())[0];

  if (!lastSkip) return null;

  const addSeven = addDays(lastSkip, 7);
  const addTwo = addDays(lastSkip, 2);
  const until = kind === 'pill_combined' ? addSeven : addTwo;
  if (until.getTime() <= now.getTime()) return null;

  const reason =
    kind === 'pill_combined'
      ? 'Missed pill detected — use backup protection for 7 days after the skip.'
      : 'Missed progestin-only pill — use backup protection for 48 hours.';

  return {
    active: true,
    untilIso: until.toISOString(),
    reason,
  };
}
