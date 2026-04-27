import * as SecureStore from 'expo-secure-store';
import { deriveKey, kdfParams, KdfParams, newKdfSalt } from './kdf';
import { open as aeadOpen, seal as aeadSeal, SealedBox } from './aead';
import { fromBase64, randomBytes, toBase64, toHex } from './sodium';

const SS_LEGACY_MASTER_KEY = 'pt.masterKey.v1';
const SS_BIOMETRIC_KEY = 'pt.biometricKey.v1';
const SS_WRAPPED_KEY = 'pt.wrappedKey.v1';
const SS_KDF_PARAMS = 'pt.kdfParams.v1';
const SS_LOCK_MODE = 'pt.lockMode.v1';
// Optional extra unlock slots. Both are nullable — users who haven't set them
// up just don't have these entries in SecureStore. All three (real, decoy,
// wipe) use separate Argon2id salts so you can't tell from the ciphertext
// which passphrase a given slot accepts.
const SS_WRAPPED_KEY_DECOY = 'pt.wrappedKey.decoy.v1';
const SS_KDF_PARAMS_DECOY = 'pt.kdfParams.decoy.v1';
const SS_WRAPPED_KEY_WIPE = 'pt.wrappedKey.wipe.v1';
const SS_KDF_PARAMS_WIPE = 'pt.kdfParams.wipe.v1';

const SECURE_STORE_OPTS: SecureStore.SecureStoreOptions = {
  keychainAccessible: SecureStore.WHEN_UNLOCKED_THIS_DEVICE_ONLY,
  requireAuthentication: false,
};

const BIOMETRIC_STORE_OPTS: SecureStore.SecureStoreOptions = {
  keychainAccessible: SecureStore.WHEN_UNLOCKED_THIS_DEVICE_ONLY,
  requireAuthentication: true,
  authenticationPrompt: 'Unlock Privates',
};

export type LockMode = 'passphrase' | 'biometric+passphrase';

const KEY_BYTES = 32;

export function generateMasterKey(): Uint8Array {
  return randomBytes(KEY_BYTES);
}

export function masterKeyToHexLiteral(key: Uint8Array): string {
  return `x''${toHex(key)}''`;
}

export async function hasMasterKey(): Promise<boolean> {
  const wrapped = await SecureStore.getItemAsync(SS_WRAPPED_KEY, SECURE_STORE_OPTS);
  return !!wrapped;
}

export async function getLockMode(): Promise<LockMode | null> {
  const v = await SecureStore.getItemAsync(SS_LOCK_MODE, SECURE_STORE_OPTS);
  if (v === 'biometric' || v === 'biometric+passphrase') return 'biometric+passphrase';
  if (v === 'passphrase') return 'passphrase';
  return null;
}

/**
 * Returns the biometric-cached master key.
 * Returns null if the key is gone or was invalidated by iOS (e.g., user re-enrolled Face ID).
 * Throws if the user cancels or biometric auth fails for non-invalidation reasons.
 */
export async function loadMasterKeyBiometricOrNull(): Promise<Uint8Array | null> {
  const b64 = await SecureStore.getItemAsync(SS_BIOMETRIC_KEY, BIOMETRIC_STORE_OPTS);
  if (!b64) return null;
  return fromBase64(b64);
}

export async function loadMasterKeyWithPassphrase(passphrase: string): Promise<Uint8Array> {
  const result = await unwrapFromAnySlot(passphrase, { requireRealSlot: true });
  if (!result || result.slot !== 'real') throw new Error('wrong passphrase');
  return result.key;
}

// ── Multi-slot passphrase unwrap ────────────────────────────────────────────
// The lock screen accepts any of three passphrases (real, decoy, wipe) and
// routes based on which slot unwrapped successfully. Each slot is indepen-
// dently wrapped with its own salt so ciphertexts are indistinguishable.

export type UnlockSlot = 'real' | 'decoy' | 'wipe';

export type UnlockAttempt = {
  slot: UnlockSlot;
  key: Uint8Array;
};

async function readWrappedSlot(
  wrappedKeyName: string,
  paramsKeyName: string,
): Promise<{ wrapped: SealedBox; params: KdfParams } | null> {
  const wrappedJson = await SecureStore.getItemAsync(wrappedKeyName, SECURE_STORE_OPTS);
  const paramsJson = await SecureStore.getItemAsync(paramsKeyName, SECURE_STORE_OPTS);
  if (!wrappedJson || !paramsJson) return null;
  return {
    wrapped: JSON.parse(wrappedJson) as SealedBox,
    params: JSON.parse(paramsJson) as KdfParams,
  };
}

function tryUnwrap(
  passphrase: string,
  wrapped: SealedBox,
  params: KdfParams,
): Uint8Array | null {
  try {
    const salt = fromBase64(params.saltB64);
    const kek = deriveKey(passphrase, salt);
    const key = aeadOpen(wrapped, kek);
    kek.fill(0);
    return key;
  } catch {
    return null;
  }
}

/**
 * Try the passphrase against every configured slot. Returns the first match.
 * Slot order: real → decoy → wipe. Because Argon2id is expensive, we pay a
 * KDF for each configured slot — in practice that's up to ~600ms total with
 * all three slots set. Observable timing does not leak which slot matched
 * because non-matches also run a full KDF.
 *
 * When `requireRealSlot` is true, only the real slot is tried. Used for
 * settings flows where we must specifically verify the real passphrase
 * (e.g. enabling biometric unlock, changing passphrases).
 */
export async function unwrapFromAnySlot(
  passphrase: string,
  opts: { requireRealSlot?: boolean } = {},
): Promise<UnlockAttempt | null> {
  const real = await readWrappedSlot(SS_WRAPPED_KEY, SS_KDF_PARAMS);
  if (!real) throw new Error('no wrapped key on this device');

  const realKey = tryUnwrap(passphrase, real.wrapped, real.params);
  if (realKey) return { slot: 'real', key: realKey };
  if (opts.requireRealSlot) return null;

  const decoy = await readWrappedSlot(SS_WRAPPED_KEY_DECOY, SS_KDF_PARAMS_DECOY);
  if (decoy) {
    const decoyKey = tryUnwrap(passphrase, decoy.wrapped, decoy.params);
    if (decoyKey) return { slot: 'decoy', key: decoyKey };
  }

  const wipe = await readWrappedSlot(SS_WRAPPED_KEY_WIPE, SS_KDF_PARAMS_WIPE);
  if (wipe) {
    const wipeKey = tryUnwrap(passphrase, wipe.wrapped, wipe.params);
    if (wipeKey) {
      // Zero the dummy key immediately — we don't use it. The wipe-slot just
      // signals "this passphrase is the wipe trigger".
      wipeKey.fill(0);
      return { slot: 'wipe', key: new Uint8Array(0) };
    }
  }

  return null;
}

export async function hasDecoySlot(): Promise<boolean> {
  const v = await SecureStore.getItemAsync(SS_WRAPPED_KEY_DECOY, SECURE_STORE_OPTS);
  return !!v;
}

export async function hasWipeSlot(): Promise<boolean> {
  const v = await SecureStore.getItemAsync(SS_WRAPPED_KEY_WIPE, SECURE_STORE_OPTS);
  return !!v;
}

async function writeSlot(
  wrappedKeyName: string,
  paramsKeyName: string,
  masterKey: Uint8Array,
  passphrase: string,
): Promise<void> {
  const salt = newKdfSalt();
  const kek = deriveKey(passphrase, salt);
  const wrapped = aeadSeal(masterKey, kek);
  kek.fill(0);
  const saltB64 = toBase64(salt);
  await SecureStore.setItemAsync(wrappedKeyName, JSON.stringify(wrapped), SECURE_STORE_OPTS);
  await SecureStore.setItemAsync(
    paramsKeyName,
    JSON.stringify(kdfParams(salt, saltB64)),
    SECURE_STORE_OPTS,
  );
}

export async function setupDecoySlot(passphrase: string): Promise<Uint8Array> {
  // The decoy DB has its OWN master key — a different encryption key than
  // the real DB so the two files are cryptographically independent.
  const decoyKey = randomBytes(KEY_BYTES);
  await writeSlot(SS_WRAPPED_KEY_DECOY, SS_KDF_PARAMS_DECOY, decoyKey, passphrase);
  return decoyKey;
}

export async function setupWipeSlot(passphrase: string): Promise<void> {
  // The wipe slot stores a dummy 32-byte random blob. We don't care about the
  // recovered key; we only need to know "did this passphrase unwrap the wipe
  // slot?". Using real random bytes (rather than an all-zero sentinel) means
  // an attacker inspecting SecureStore can't tell which slot is which.
  const dummy = randomBytes(KEY_BYTES);
  await writeSlot(SS_WRAPPED_KEY_WIPE, SS_KDF_PARAMS_WIPE, dummy, passphrase);
  dummy.fill(0);
}

export async function removeDecoySlot(): Promise<void> {
  await SecureStore.deleteItemAsync(SS_WRAPPED_KEY_DECOY, SECURE_STORE_OPTS);
  await SecureStore.deleteItemAsync(SS_KDF_PARAMS_DECOY, SECURE_STORE_OPTS);
}

export async function removeWipeSlot(): Promise<void> {
  await SecureStore.deleteItemAsync(SS_WRAPPED_KEY_WIPE, SECURE_STORE_OPTS);
  await SecureStore.deleteItemAsync(SS_KDF_PARAMS_WIPE, SECURE_STORE_OPTS);
}

async function writePassphraseWrappedKey(masterKey: Uint8Array, passphrase: string): Promise<void> {
  const salt = newKdfSalt();
  const kek = deriveKey(passphrase, salt);
  const wrapped = aeadSeal(masterKey, kek);
  const saltB64 = toBase64(salt);
  await SecureStore.setItemAsync(SS_WRAPPED_KEY, JSON.stringify(wrapped), SECURE_STORE_OPTS);
  await SecureStore.setItemAsync(
    SS_KDF_PARAMS,
    JSON.stringify(kdfParams(salt, saltB64)),
    SECURE_STORE_OPTS,
  );
}

export async function setupPassphraseOnly(masterKey: Uint8Array, passphrase: string): Promise<void> {
  await writePassphraseWrappedKey(masterKey, passphrase);
  await SecureStore.deleteItemAsync(SS_BIOMETRIC_KEY, BIOMETRIC_STORE_OPTS);
  await SecureStore.deleteItemAsync(SS_LEGACY_MASTER_KEY, SECURE_STORE_OPTS);
  await SecureStore.setItemAsync(SS_LOCK_MODE, 'passphrase', SECURE_STORE_OPTS);
}

export async function setupBiometricAndPassphrase(
  masterKey: Uint8Array,
  passphrase: string,
): Promise<void> {
  await writePassphraseWrappedKey(masterKey, passphrase);
  await SecureStore.setItemAsync(SS_BIOMETRIC_KEY, toBase64(masterKey), BIOMETRIC_STORE_OPTS);
  await SecureStore.deleteItemAsync(SS_LEGACY_MASTER_KEY, SECURE_STORE_OPTS);
  await SecureStore.setItemAsync(SS_LOCK_MODE, 'biometric+passphrase', SECURE_STORE_OPTS);
}

export async function enableBiometric(masterKey: Uint8Array): Promise<void> {
  await SecureStore.setItemAsync(SS_BIOMETRIC_KEY, toBase64(masterKey), BIOMETRIC_STORE_OPTS);
  await SecureStore.setItemAsync(SS_LOCK_MODE, 'biometric+passphrase', SECURE_STORE_OPTS);
}

export async function disableBiometric(): Promise<void> {
  await SecureStore.deleteItemAsync(SS_BIOMETRIC_KEY, BIOMETRIC_STORE_OPTS);
  await SecureStore.setItemAsync(SS_LOCK_MODE, 'passphrase', SECURE_STORE_OPTS);
}

export async function wipeAllKeys(): Promise<void> {
  await Promise.all([
    SecureStore.deleteItemAsync(SS_LEGACY_MASTER_KEY, SECURE_STORE_OPTS),
    SecureStore.deleteItemAsync(SS_BIOMETRIC_KEY, BIOMETRIC_STORE_OPTS),
    SecureStore.deleteItemAsync(SS_WRAPPED_KEY, SECURE_STORE_OPTS),
    SecureStore.deleteItemAsync(SS_KDF_PARAMS, SECURE_STORE_OPTS),
    SecureStore.deleteItemAsync(SS_LOCK_MODE, SECURE_STORE_OPTS),
    SecureStore.deleteItemAsync(SS_WRAPPED_KEY_DECOY, SECURE_STORE_OPTS),
    SecureStore.deleteItemAsync(SS_KDF_PARAMS_DECOY, SECURE_STORE_OPTS),
    SecureStore.deleteItemAsync(SS_WRAPPED_KEY_WIPE, SECURE_STORE_OPTS),
    SecureStore.deleteItemAsync(SS_KDF_PARAMS_WIPE, SECURE_STORE_OPTS),
  ]);
}
