// Marks the SQLCipher database file (and its possible journal/WAL/SHM
// sidecars) as excluded from iCloud Backup and iTunes/Finder backup.
//
// Why this exists at all, given SQLCipher already encrypts the file:
//   The 256-bit master key lives in Keychain at WHEN_UNLOCKED_THIS_DEVICE_ONLY,
//   which is *not* included in any backup. So even if the encrypted .sqlite
//   landed in iCloud, an attacker holding it would have ciphertext with no
//   key material and no realistic recovery path. Excluding the file anyway is
//   defense-in-depth plus promise integrity: the product positioning is
//   "your data never leaves the device", and a chunk of opaque-but-yours
//   ciphertext sitting in Apple's cloud violates the spirit of that even if
//   the contents are unrecoverable.
//
// Implementation notes:
//   - The flag is per-file. Setting it on the parent directory does NOT
//     propagate to children. We therefore enumerate every possible suffix
//     SQLite might create.
//   - Journal/WAL/SHM sidecars are transient in default (DELETE) journal mode
//     and may not exist at the moment we run. The native module returns
//     false for missing files — we treat that as success-by-absence.
//   - We do NOT log the absolute path. It contains the user's bundle ID and
//     home-directory layout; in a privacy-first app, even a debug log is a
//     leak vector.

import { getRawDb } from '@/db/client';
import { setExcludedFromBackup } from '../../modules/backup-exclusion';

// SQLite file suffixes that may exist alongside the main DB depending on
// journal_mode. We exclude all of them defensively — missing files are a
// no-op, so this is safe to call regardless of the active mode.
const SUFFIXES = ['', '-journal', '-wal', '-shm'] as const;

export type ExclusionReport = {
  excluded: number; // count of files we successfully marked
  missing: number; // count of files that didn't exist (expected for sidecars)
  failed: number; // count of files that existed but rejected the flag write
  unsupported: boolean; // true if the native module isn't installed at all
};

/**
 * Excludes the currently-open DB file (and all possible sidecar paths)
 * from iOS backups. Idempotent — safe to call on every unlock.
 *
 * Returns a report so the caller can decide whether to surface a warning
 * (e.g. if `unsupported` is true on a release build, that's a real bug).
 */
export async function excludeOpenDbFromBackups(): Promise<ExclusionReport> {
  const report: ExclusionReport = { excluded: 0, missing: 0, failed: 0, unsupported: false };

  let basePath: string;
  try {
    basePath = getRawDb().getDbPath();
  } catch {
    // DB isn't open. Nothing to exclude.
    return report;
  }

  // Probe the native module once via the first call. If it's missing on iOS
  // we'll get a structured error back; track and short-circuit the rest.
  for (const suffix of SUFFIXES) {
    const path = basePath + suffix;
    const result = await setExcludedFromBackup(path, true);
    if (result.ok) {
      report.excluded += 1;
    } else if (/not installed/i.test(result.reason)) {
      report.unsupported = true;
      // No point trying the other suffixes — same module is missing for all.
      break;
    } else if (/may not exist|file may not exist/i.test(result.reason)) {
      report.missing += 1;
    } else {
      report.failed += 1;
    }
  }

  return report;
}
