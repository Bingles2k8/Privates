import * as LocalAuthentication from 'expo-local-authentication';
import {
  enableBiometric,
  disableBiometric,
  generateMasterKey,
  getLockMode,
  hasMasterKey,
  loadMasterKeyBiometricOrNull,
  loadMasterKeyWithPassphrase,
  setupBiometricAndPassphrase,
  setupPassphraseOnly,
  unwrapFromAnySlot,
  type LockMode,
} from '@/crypto/keys';
import { deleteDbFiles, openDatabase, runMigrations, type DbVariant } from '@/db';
import { useSession } from '@/state/session';
import { panicWipe } from '@/services/panicWipe';
import { ensureCleanReinstall } from '@/services/installMarker';
import { excludeOpenDbFromBackups } from '@/services/dbBackupExclusion';
import {
  clearLockout,
  getLockoutMsRemaining,
  LockedOutError,
  recordFailedAttempt,
  getLockoutSnapshot,
} from '@/services/lockout';

async function openWithKey(key: Uint8Array, variant: DbVariant = 'real') {
  openDatabase(key, variant);
  await runMigrations();
  // Mark the on-disk SQLCipher file as excluded from iCloud + iTunes/Finder
  // backups. Idempotent and best-effort: a failure here is logged but does
  // NOT block the unlock — the file is encrypted regardless, and surfacing
  // a backup-config error would be a confusing first-launch experience.
  // The `unsupported` case (native module missing) is a real bug in a
  // shipped build but harmless in dev clients that haven't been rebuilt.
  try {
    const report = await excludeOpenDbFromBackups();
    if (report.unsupported && __DEV__) {
      console.warn(
        '[backup-exclusion] Native module not installed. Run `npx expo prebuild` ' +
          'and rebuild. The DB file is being included in backups until then.',
      );
    }
  } catch {
    // Defensive: never let backup-exclusion failure cascade into an
    // unlock failure. Worst case the file ends up in a backup as
    // unrecoverable ciphertext (no key, since the key is in Keychain
    // at WHEN_UNLOCKED_THIS_DEVICE_ONLY which doesn't backup).
  }
  if (variant === 'decoy') {
    // Lazy seed: first time the decoy DB opens it's empty, so fill it with
    // plausible fake data. Subsequent opens are a no-op (fast path).
    const { seedDecoyIfEmpty } = await import('@/services/decoySeed');
    await seedDecoyIfEmpty();
  }
  useSession.getState().markUnlocked();
}

export type BiometricKind = 'face' | 'touch' | 'iris' | 'generic' | 'none';

export async function biometricAvailable(): Promise<boolean> {
  const has = await LocalAuthentication.hasHardwareAsync();
  if (!has) return false;
  return await LocalAuthentication.isEnrolledAsync();
}

export async function biometricKind(): Promise<BiometricKind> {
  if (!(await biometricAvailable())) return 'none';
  const types = await LocalAuthentication.supportedAuthenticationTypesAsync();
  if (types.includes(LocalAuthentication.AuthenticationType.FACIAL_RECOGNITION)) return 'face';
  if (types.includes(LocalAuthentication.AuthenticationType.FINGERPRINT)) return 'touch';
  if (types.includes(LocalAuthentication.AuthenticationType.IRIS)) return 'iris';
  return 'generic';
}

export function biometricLabel(kind: BiometricKind): string {
  switch (kind) {
    case 'face':
      return 'Face ID';
    case 'touch':
      return 'Touch ID';
    case 'iris':
      return 'iris unlock';
    case 'generic':
      return 'biometric unlock';
    default:
      return 'biometric unlock';
  }
}

export async function determineInitialStatus(): Promise<void> {
  // iOS Keychain survives app uninstall. If this is a fresh install (or a
  // post-uninstall reinstall), clear any surviving Keychain entries BEFORE
  // hasMasterKey() reads them — otherwise we'd route a reinstalling user to
  // the lock screen and let the old passphrase "still work," which both
  // confuses the user and leaves residual key material on the device.
  await ensureCleanReinstall();
  const exists = await hasMasterKey();
  useSession.getState().setStatus(exists ? 'locked' : 'needsOnboarding');
}

export async function unlockBiometric(): Promise<void> {
  const key = await loadMasterKeyBiometricOrNull();
  if (!key) {
    // Key was invalidated by iOS (biometric enrollment changed) or was never set.
    // Downgrade mode so the UI stops advertising biometric unlock until user re-enables it.
    await disableBiometric();
    throw new Error(
      'Biometric unlock is unavailable — you may have re-enrolled Face ID or added a fingerprint. Unlock with your passphrase, then re-enable in Settings.',
    );
  }
  await openWithKey(key);
}

/**
 * Unlock with a passphrase. The passphrase is tried against every configured
 * slot (real, decoy, wipe). Behavior branches:
 *  - real: open the real encrypted DB.
 *  - decoy: open the decoy DB and mark the session unlocked. From the user's
 *    perspective the app looks identical — same screens, same components.
 *  - wipe: silently run a panic wipe, then throw "wrong passphrase" so the
 *    user (and anyone watching over their shoulder) sees a rejection.
 *    Everything gets nuked; on the next app open they see the onboarding
 *    flow.
 *  - no match: throws "wrong passphrase".
 */
export async function unlockPassphrase(passphrase: string): Promise<void> {
  // Brute-force gate. Check BEFORE running KDF so an attacker can't keep
  // the CPU pegged on Argon2id during the lockout window — the lockout
  // applies to wall-clock time, not to "attempts that finished computing."
  const msRemaining = await getLockoutMsRemaining();
  if (msRemaining > 0) {
    const { failedAttempts } = await getLockoutSnapshot();
    throw new LockedOutError(msRemaining, failedAttempts);
  }

  const attempt = await unwrapFromAnySlot(passphrase);
  if (!attempt) {
    // Record the failure FIRST (so the lockout takes effect immediately),
    // then surface the error. UI translates this to a countdown if the
    // backoff put us in lockout.
    const { failedAttempts, lockedForMs } = await recordFailedAttempt();
    if (lockedForMs > 0) {
      throw new LockedOutError(lockedForMs, failedAttempts);
    }
    throw new Error('wrong passphrase');
  }

  if (attempt.slot === 'wipe') {
    // Observer sees "wrong passphrase" on the screen, but the data is already
    // gone. The wipe sets session status to needsOnboarding, which the app
    // routes to after the error alert is dismissed.
    // We deliberately do NOT clear the lockout here — the wipe destroys
    // everything anyway, and stale state in SecureStore is harmless after
    // a wipe (the wipe also clears Keychain entries).
    await panicWipe();
    throw new Error('wrong passphrase');
  }

  // Real or decoy slot succeeded — reset the counter. The decoy is treated
  // as a "successful unlock" from the brute-force perspective because that's
  // the whole point of plausible deniability: an observer can't tell from
  // the lockout state whether they hit a real or decoy passphrase.
  await clearLockout();

  const variant: DbVariant = attempt.slot === 'decoy' ? 'decoy' : 'real';
  await openWithKey(attempt.key, variant);
}

export async function tryAutoUnlock(): Promise<boolean> {
  const mode = await getLockMode();
  if (mode !== 'biometric+passphrase') return false;
  if (!(await biometricAvailable())) return false;
  try {
    await unlockBiometric();
    return true;
  } catch {
    return false;
  }
}

export async function setupAndUnlock(mode: LockMode, passphrase: string): Promise<void> {
  if (!passphrase) throw new Error('passphrase required');
  // Belt-and-braces: a previous install may have left an orphan DB file with
  // the Keychain entry gone (very common on simulators after a reinstall, and
  // possible on device after a partial wipe). The freshly generated master
  // key won't decrypt the old SQLCipher pages, and the failure surfaces as a
  // misleading `out of memory` on the first query. Always start from a
  // clean file when we mint a new key.
  await deleteDbFiles('real');
  const key = generateMasterKey();
  if (mode === 'biometric+passphrase') {
    await setupBiometricAndPassphrase(key, passphrase);
  } else {
    await setupPassphraseOnly(key, passphrase);
  }
  await openWithKey(key);
}

export async function enableBiometricWithPassphrase(passphrase: string): Promise<void> {
  // verify passphrase is correct before asking for Face ID
  const key = await loadMasterKeyWithPassphrase(passphrase);
  // ensure biometric hardware is actually available/enrolled before saving
  if (!(await biometricAvailable())) {
    key.fill(0);
    throw new Error('No biometric hardware or none enrolled. Set up Face ID / Touch ID in iOS Settings first.');
  }
  await enableBiometric(key);
  key.fill(0);
}

export async function disableBiometricUnlock(): Promise<void> {
  await disableBiometric();
}
