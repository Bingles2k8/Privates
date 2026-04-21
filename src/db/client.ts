import { open, type DB } from '@op-engineering/op-sqlite';
import { drizzle } from 'drizzle-orm/op-sqlite';
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

export async function deleteDatabaseFile(variant: DbVariant = 'real'): Promise<void> {
  const db = open({ name: DB_FILES[variant], encryptionKey: 'noop' });
  try {
    db.delete();
  } catch {
    // already gone or wrong key — try a hard delete
  }
  if (_variant === variant) {
    _db = null;
    _drizzle = null;
    _variant = null;
  }
}
