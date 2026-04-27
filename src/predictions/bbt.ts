/**
 * Wake-up temperature (basal body temperature) helpers.
 *
 * Storage convention
 * ------------------
 * BBT values are persisted in `dayLogs.bbt` as \u00b0C (Celsius). This is the
 * canonical unit \u2014 fertility literature is overwhelmingly in \u00b0C and the
 * per-degree resolution is finer, which keeps the cover-line math precise.
 * The UI converts at the I/O boundary based on the user's `bbt.unit` setting.
 *
 * Backwards-compat heuristic: any stored value > 50 is interpreted as \u00b0F.
 * Pre-preference rows could be in either unit because the input was a bare
 * "decimal" with no unit attached. The 50\u00b0 split is comfortably between any
 * plausible \u00b0C BBT (35\u201338) and any plausible \u00b0F BBT (95\u2013101). When the user
 * edits an old row we save it back in canonical \u00b0C, so the heuristic only ever
 * matters until the row is touched.
 */

export type TempUnit = 'C' | 'F';

/** Below this value we assume \u00b0C; at or above we assume \u00b0F. */
const F_HEURISTIC_THRESHOLD = 50;

/** Plausibility bounds in each unit \u2014 used to reject clearly-wrong input. */
export const BBT_C_MIN = 34;
export const BBT_C_MAX = 39;
export const BBT_F_MIN = 93;
export const BBT_F_MAX = 102;

export function cToF(c: number): number {
  return c * 9 / 5 + 32;
}

export function fToC(f: number): number {
  return (f - 32) * 5 / 9;
}

/**
 * Convert a stored BBT value to canonical \u00b0C, applying the legacy-data
 * heuristic. Returns null for null/undefined/NaN. Pure.
 */
export function storedToCelsius(value: number | null | undefined): number | null {
  if (value == null || !Number.isFinite(value)) return null;
  if (value >= F_HEURISTIC_THRESHOLD) return fToC(value);
  return value;
}

/**
 * Convert a stored value to the user's chosen display unit. Applies the legacy
 * heuristic on the way through.
 */
export function storedToDisplay(value: number | null | undefined, unit: TempUnit): number | null {
  const c = storedToCelsius(value);
  if (c == null) return null;
  return unit === 'C' ? c : cToF(c);
}

/**
 * Parse a user-entered string in the given unit and return canonical \u00b0C.
 * Returns null for empty / non-numeric input. Does NOT validate plausibility \u2014
 * that's `isPlausible(value, unit)` so callers can show a soft warning rather
 * than reject outright.
 */
export function parseInputToCelsius(raw: string, unit: TempUnit): number | null {
  const trimmed = raw.trim();
  if (trimmed === '') return null;
  const n = Number(trimmed);
  if (!Number.isFinite(n)) return null;
  return unit === 'C' ? n : fToC(n);
}

export function isPlausible(value: number, unit: TempUnit): boolean {
  if (unit === 'C') return value >= BBT_C_MIN && value <= BBT_C_MAX;
  return value >= BBT_F_MIN && value <= BBT_F_MAX;
}

/** Format a stored value for compact display, e.g. "36.52\u00b0C" or "97.74\u00b0F". */
export function formatBbt(value: number | null | undefined, unit: TempUnit): string {
  const v = storedToDisplay(value, unit);
  if (v == null) return '\u2014';
  return `${v.toFixed(2)}\u00b0${unit}`;
}

export function unitLabel(unit: TempUnit): string {
  return unit === 'C' ? '\u00b0C' : '\u00b0F';
}

export function placeholderFor(unit: TempUnit): string {
  return unit === 'C' ? '36.50' : '97.70';
}

/**
 * Cover-line shift threshold in \u00b0C. The clinical biphasic-shift rule is
 * usually stated as "0.2\u00b0F (\u22480.11\u00b0C) above the previous 6-day high for at
 * least 3 consecutive days". We use 0.1\u00b0C as the threshold and draw the cover
 * line 0.05\u00b0C above the high \u2014 these are the \u00b0C equivalents of the original
 * \u00b0F constants this module replaced.
 */
export const COVER_SHIFT_C = 0.1;
export const COVER_OFFSET_C = 0.05;
