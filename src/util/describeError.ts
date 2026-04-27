/**
 * Turns an unknown thrown value into a short, human-readable string.
 *
 * Why this exists: every screen catches errors via `catch (e: unknown)` and
 * shows them in an Alert. The naive `String(e)` produces `"[object Object]"`
 * when something throws a plain object (which `op-sqlite` does for native-
 * layer errors), and an empty string when an `Error` was constructed without
 * a message. Both cases shipped before this helper. Always route alert
 * messages through this function rather than calling `String()` ad-hoc.
 *
 * Order of preference, in priority order:
 *   1. `Error.message` if non-empty
 *   2. The string itself if it's already a string
 *   3. A `.message` property on a plain object
 *   4. JSON of the object if it has any own enumerable properties
 *   5. A fallback "Unknown error"
 */
export function describeError(e: unknown): string {
  if (e == null) return 'Unknown error';

  if (e instanceof Error) {
    if (e.message && e.message.trim() !== '') return e.message;
    if (e.name && e.name !== 'Error') return e.name;
    return 'Unknown error';
  }

  if (typeof e === 'string') {
    return e.trim() === '' ? 'Unknown error' : e;
  }

  if (typeof e === 'number' || typeof e === 'boolean') {
    return String(e);
  }

  if (typeof e === 'object') {
    const maybeMessage = (e as { message?: unknown }).message;
    if (typeof maybeMessage === 'string' && maybeMessage.trim() !== '') {
      return maybeMessage;
    }
    try {
      const s = JSON.stringify(e);
      if (s && s !== '{}' && s !== '[]') return s;
    } catch {
      // Circular references etc. \u2014 fall through to default.
    }
  }

  return 'Unknown error';
}
