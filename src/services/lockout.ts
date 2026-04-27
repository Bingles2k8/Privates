// Brute-force protection for the lock screen.
//
// Why this exists: a stolen unlocked phone with the app installed lets an
// attacker hammer the passphrase prompt with no penalty. The crypto is sound
// (Argon2id is intentionally slow), but a determined attacker with a script
// can still try a dictionary in a few hours. Adding a per-attempt backoff
// raises the cost dramatically once the user is clearly fat-fingering vs.
// guessing: the first 5 misses are free (typos, half-remembered passphrase),
// then the wait jumps fast. Past attempt 11 every wrong guess costs a full
// day, so a brute-force script gets ~365 attempts/year per device.
//
// Schedule (after N consecutive failures):
//   1–5: 0     (free — assume legitimate user fumbling)
//   6:   15s
//   7:   30s
//   8:   1min
//   9:   5min
//   10:  1h
//   11+: 1 day (each subsequent miss adds another day)
//
// Persistence: stored in SecureStore so force-quitting the app doesn't reset
// the counter. We deliberately do NOT use AsyncStorage — that's plaintext
// in the app sandbox and a forensic-extraction artefact. SecureStore puts
// the state in Keychain at WHEN_UNLOCKED_THIS_DEVICE_ONLY, same accessibility
// as the master key, so it shares the master key's threat model.
//
// Reset: any successful unlock (real OR decoy slot) clears the counter.
// We do NOT reset on a wipe-slot match — the wipe has already destroyed
// everything, the state going stale doesn't matter.

import * as SecureStore from 'expo-secure-store';

const SS_LOCKOUT = 'pt.lockout.v1';

const SECURE_STORE_OPTS: SecureStore.SecureStoreOptions = {
  keychainAccessible: SecureStore.WHEN_UNLOCKED_THIS_DEVICE_ONLY,
  requireAuthentication: false,
};

type LockoutState = {
  failedAttempts: number;
  lockedUntil: number; // unix ms; 0 means not locked
};

const EMPTY: LockoutState = { failedAttempts: 0, lockedUntil: 0 };

/**
 * Lockout duration after the Nth consecutive failed attempt.
 * N is 1-indexed (first failure = 1).
 *
 * Returns 0 for the first 5 misses — typos shouldn't punish the user. From
 * the 6th miss onward we ramp aggressively (15s → 30s → 1min → 5min → 1h),
 * and from the 11th onward every additional miss costs a full day.
 */
export function lockoutDurationMs(failedAttempts: number): number {
  if (failedAttempts <= 5) return 0;
  if (failedAttempts === 6) return 15_000;
  if (failedAttempts === 7) return 30_000;
  if (failedAttempts === 8) return 60_000;
  if (failedAttempts === 9) return 5 * 60_000;
  if (failedAttempts === 10) return 60 * 60_000;
  return 24 * 60 * 60_000; // 11+ → 1 day per attempt, indefinitely
}

async function readState(): Promise<LockoutState> {
  try {
    const raw = await SecureStore.getItemAsync(SS_LOCKOUT, SECURE_STORE_OPTS);
    if (!raw) return { ...EMPTY };
    const parsed = JSON.parse(raw) as Partial<LockoutState>;
    return {
      failedAttempts: Number(parsed.failedAttempts) || 0,
      lockedUntil: Number(parsed.lockedUntil) || 0,
    };
  } catch {
    // Corrupt JSON or read error — start clean. We err on the side of
    // letting the user in (no lockout) rather than locking them out
    // forever from a malformed entry.
    return { ...EMPTY };
  }
}

async function writeState(state: LockoutState): Promise<void> {
  await SecureStore.setItemAsync(SS_LOCKOUT, JSON.stringify(state), SECURE_STORE_OPTS);
}

/**
 * Returns ms remaining until the user can try again. 0 = no lockout.
 * Safe to call on every render.
 */
export async function getLockoutMsRemaining(): Promise<number> {
  const state = await readState();
  if (state.lockedUntil <= 0) return 0;
  const remaining = state.lockedUntil - Date.now();
  return remaining > 0 ? remaining : 0;
}

export async function getLockoutSnapshot(): Promise<{
  failedAttempts: number;
  msRemaining: number;
}> {
  const state = await readState();
  const msRemaining =
    state.lockedUntil > 0 ? Math.max(0, state.lockedUntil - Date.now()) : 0;
  return { failedAttempts: state.failedAttempts, msRemaining };
}

/**
 * Records a failed unlock attempt and returns the lockout that now applies.
 * Called by the unlock service on every wrong passphrase.
 */
export async function recordFailedAttempt(): Promise<{
  failedAttempts: number;
  lockedForMs: number;
}> {
  const prev = await readState();
  const failedAttempts = prev.failedAttempts + 1;
  const lockedForMs = lockoutDurationMs(failedAttempts);
  const next: LockoutState = {
    failedAttempts,
    lockedUntil: Date.now() + lockedForMs,
  };
  await writeState(next);
  return { failedAttempts, lockedForMs };
}

/**
 * Clears the lockout entirely. Called on any successful unlock.
 */
export async function clearLockout(): Promise<void> {
  try {
    await SecureStore.deleteItemAsync(SS_LOCKOUT, SECURE_STORE_OPTS);
  } catch {
    // Worst case: the next attempt sees a stale lockout. Still safer than
    // failing the unlock flow on a SecureStore hiccup.
  }
}

/**
 * Distinguishable error class so the lock screen can render a countdown
 * instead of a generic "wrong passphrase" alert.
 */
export class LockedOutError extends Error {
  readonly msRemaining: number;
  readonly failedAttempts: number;
  constructor(msRemaining: number, failedAttempts: number) {
    super(`locked out for ${msRemaining}ms`);
    this.name = 'LockedOutError';
    this.msRemaining = msRemaining;
    this.failedAttempts = failedAttempts;
  }
}

export function isLockedOutError(e: unknown): e is LockedOutError {
  return e instanceof LockedOutError;
}
