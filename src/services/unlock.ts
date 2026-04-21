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
import { openDatabase, runMigrations, type DbVariant } from '@/db';
import { useSession } from '@/state/session';
import { panicWipe } from '@/services/panicWipe';

async function openWithKey(key: Uint8Array, variant: DbVariant = 'real') {
  openDatabase(key, variant);
  await runMigrations();
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
  const attempt = await unwrapFromAnySlot(passphrase);
  if (!attempt) throw new Error('wrong passphrase');

  if (attempt.slot === 'wipe') {
    // Observer sees "wrong passphrase" on the screen, but the data is already
    // gone. The wipe sets session status to needsOnboarding, which the app
    // routes to after the error alert is dismissed.
    await panicWipe();
    throw new Error('wrong passphrase');
  }

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
