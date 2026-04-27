import { File, Paths } from 'expo-file-system';
import { wipeAllKeys } from '@/crypto/keys';

const INSTALL_MARKER = '.installed';

/**
 * Detect a fresh install (or post-uninstall reinstall) and erase any Keychain
 * entries that survived from the previous install.
 *
 * Why this exists
 * ───────────────
 * iOS Keychain items persist across app uninstall by design — Apple's stated
 * rationale is "user reinstalls a banking app, doesn't have to log in again."
 * For us that's a privacy bug: an uninstall+reinstall is the user's natural
 * way of saying "wipe everything," and leaving the wrapped master key in
 * Keychain means
 *   1. the same passphrase still works after reinstall (terrible UX — the
 *      user thinks they failed to actually delete anything), and
 *   2. residual cryptographic material lingers on the device, available to
 *      anyone with backup or jailbreak access.
 *
 * Detection trick
 * ───────────────
 * The documents directory IS wiped on iOS uninstall (and on Android with
 * `allowBackup="false"`, which we set). A sentinel file in the documents
 * directory therefore disappears on uninstall and reappears on every normal
 * launch — its absence at boot is a reliable "fresh install" signal. We
 * check for it before any Keychain read, so the lock-vs-onboarding routing
 * decision sees a clean slate after a reinstall.
 *
 * Idempotent: safe to call on every launch; cheap on the hot path (single
 * stat call when the marker exists).
 */
export async function ensureCleanReinstall(): Promise<void> {
  const marker = new File(Paths.document, INSTALL_MARKER);
  if (marker.exists) return;
  // Fresh install (or panic-wiped session): clear every Keychain entry from
  // the prior install before anything reads them. wipeAllKeys is itself
  // idempotent, so a partial failure here doesn't corrupt state — next
  // launch will retry.
  await wipeAllKeys();
  try {
    marker.create();
  } catch {
    // If marker creation fails (disk full, permissions glitch), we'll just
    // wipe again on the next launch. Annoying but not unsafe — there's
    // nothing left to wipe after the first successful pass.
  }
}
