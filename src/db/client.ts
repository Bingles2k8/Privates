import { open, type DB } from '@op-engineering/op-sqlite';
import { drizzle } from 'drizzle-orm/op-sqlite';
import { File, Paths } from 'expo-file-system';
import { masterKeyToHexLiteral } from '@/crypto/keys';
import * as schema from './schema';

// Two on-device databases: the real one and an optional decoy. They are
// cryptographically independent — different master keys, different SQLCipher
// page encryption. Opening one doesn't reveal the other exists.
export const DB_FILES = {
  real: 'pt.sqlite',
  decoy: 'pt-decoy.sqlite',
} as const;

export type DbVariant = keyof typeof DB_FILES;

let _db: DB | null = null;
let _drizzle: ReturnType<typeof drizzle<typeof schema>> | null = null;
let _key: Uint8Array | null = null;
let _variant: DbVariant | null = null;

export class DbClosedError extends Error {
  constructor() {
    super('database is closed');
  }
}

export function openDatabase(masterKey: Uint8Array, variant: DbVariant = 'real') {
  if (_db) return _drizzle!;
  _key = masterKey;
  _variant = variant;
  _db = open({
    name: DB_FILES[variant],
    encryptionKey: masterKeyToHexLiteral(masterKey),
  });
  _drizzle = drizzle(_db, { schema });
  return _drizzle;
}

export function currentVariant(): DbVariant | null {
  return _variant;
}

export function getDb() {
  if (!_drizzle) throw new DbClosedError();
  return _drizzle;
}

export function getRawDb() {
  if (!_db) throw new DbClosedError();
  return _db;
}

export function closeDatabase() {
  if (_db) {
    _db.close();
    _db = null;
    _drizzle = null;
  }
  if (_key) {
    _key.fill(0);
    _key = null;
  }
  _variant = null;
}

/** Every on-disk file SQLCipher/SQLite might have written for a variant. */
export function dbSidecars(variant: DbVariant): string[] {
  const base = DB_FILES[variant];
  return [base, `${base}-journal`, `${base}-wal`, `${base}-shm`];
}

/**
 * Delete the on-disk SQLCipher file (and every sidecar) for the given variant.
 *
 * Call this BEFORE re-creating a database with a freshly generated master key.
 * SQLCipher decrypts pages lazily on read, so opening an existing file with a
 * mismatched key surfaces as a misleading `out of memory` error from the very
 * first query — not as an authentication failure.
 *
 * Real-world ways a DB gets orphaned (Keychain entry gone, file remains):
 *   - Simulator: app reinstall wipes Keychain but leaves the documents dir.
 *   - Device: panic wipe followed by re-onboarding before the OS reclaims pages.
 *   - Decoy: removing then re-adding the decoy slot (new master key, same file).
 */
export async function deleteDbFiles(variant: DbVariant): Promise<void> {
  // If the live handle is on this variant, close it first — deleting an open
  // SQLite file leaves the OS holding a phantom inode that the next `open`
  // call will reuse, defeating the whole point of this function.
  if (_variant === variant) closeDatabase();
  for (const name of dbSidecars(variant)) {
    try {
      const f = new File(Paths.document, name);
      if (f.exists) f.delete();
    } catch {
      // Best effort: the sidecar may not exist (WAL/SHM only appear once
      // SQLite has actually written one), and a missing file is the goal.
    }
  }
}
