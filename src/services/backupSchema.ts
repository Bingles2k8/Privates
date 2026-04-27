import { z } from 'zod';

/**
 * Zod schemas for the contents of a `.ptbk` backup file.
 *
 * The shape mirrors the `drizzle.select()` rows from each table in
 * `src/db/schema.ts`. Goals, in order of priority:
 *
 * 1. **Reject anything that would crash a SQL insert.** The backup file is
 *    user-supplied (they can edit the JSON if they really want), so we treat
 *    its contents as untrusted before they touch the DB. Bad shapes here
 *    surface as a friendly "backup contents malformed" message; without
 *    validation a stray non-string in a TEXT column could throw mid-restore
 *    and leave the DB half-empty (we delete-then-insert).
 *
 * 2. **Tolerate forward-compat extras.** New columns added in future schema
 *    versions land in old backups as missing keys; new backups loaded by an
 *    old client carry extra keys. zod's default `.strip()` discards unknown
 *    fields silently, and every nullable column accepts missing/null.
 *
 * 3. **Tolerate legacy enum values.** Strings that used to be valid
 *    (`sex_json` containing `protected`/`unprotected`, old mucus tags, etc.)
 *    must round-trip through the validator unchanged \u2014 callers like
 *    `normalizeSex` handle the migration on read.
 *
 * Drizzle returns booleans as actual JS booleans for columns declared with
 * `mode: 'boolean'`, hence `z.boolean()` rather than `z.number()`. After
 * `JSON.stringify` + `JSON.parse` they survive as booleans \u2014 confirmed by
 * round-tripping a backup in dev.
 */

const isoDate = z.string();

const settingsRow = z.object({
  id: z.number().int(),
  json: z.string(),
  updatedAt: isoDate,
});

const cyclesRow = z.object({
  id: z.string(),
  startDate: isoDate,
  endDate: isoDate.nullable().optional(),
  predicted: z.boolean(),
  notes: z.string().nullable().optional(),
  createdAt: isoDate,
});

const dayLogsRow = z.object({
  id: z.string(),
  date: isoDate,
  flow: z.number().int().nullable().optional(),
  mood: z.number().int().nullable().optional(),
  bbt: z.number().nullable().optional(),
  cervicalMucus: z.string().nullable().optional(),
  sexJson: z.string().nullable().optional(),
  lhTest: z.string().nullable().optional(),
  notes: z.string().nullable().optional(),
  updatedAt: isoDate,
});

const symptomsRow = z.object({
  id: z.string(),
  dayLogId: z.string(),
  tag: z.string(),
  intensity: z.number().int(),
});

const moodsRow = z.object({
  id: z.string(),
  dayLogId: z.string(),
  tag: z.string(),
  intensity: z.number().int(),
});

const medicationsRow = z.object({
  id: z.string(),
  name: z.string(),
  kind: z.string(),
  scheduleJson: z.string().nullable().optional(),
  active: z.boolean(),
  startedAt: isoDate,
  endedAt: isoDate.nullable().optional(),
});

const medDosesRow = z.object({
  id: z.string(),
  medicationId: z.string(),
  takenAt: isoDate.nullable().optional(),
  skipped: z.boolean(),
  scheduledFor: isoDate,
});

const customTagsRow = z.object({
  id: z.string(),
  kind: z.string(),
  label: z.string(),
});

export const backupContentsSchema = z.object({
  settings: z.array(settingsRow),
  cycles: z.array(cyclesRow),
  dayLogs: z.array(dayLogsRow),
  symptoms: z.array(symptomsRow),
  moods: z.array(moodsRow),
  medications: z.array(medicationsRow),
  medDoses: z.array(medDosesRow),
  customTags: z.array(customTagsRow),
});

export type BackupContents = z.infer<typeof backupContentsSchema>;

/**
 * Returns a short, human-friendly summary of the first failure point in a
 * malformed backup. Surfaced in the restore-error alert so a user editing the
 * JSON by hand can find what they broke. Never includes raw values \u2014 the
 * backup is sensitive even when malformed.
 */
export function summarizeBackupError(err: z.ZodError): string {
  const first = err.issues[0];
  if (!first) return 'unknown shape error';
  const path = first.path.length > 0 ? first.path.join('.') : '(root)';
  return `${path}: ${first.message}`;
}
