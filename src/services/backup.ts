import { File, Paths } from 'expo-file-system';
import { getDb } from '@/db';
import {
  customTags,
  cycles,
  dayLogs,
  medDoses,
  medications,
  moods,
  settings,
  symptoms,
} from '@/db/schema';
import { seal, open as aeadOpen, type SealedBox } from '@/crypto/aead';
import { deriveKey, kdfParams, type KdfParams, newKdfSalt } from '@/crypto/kdf';
import { fromBase64, toBase64 } from '@/crypto/sodium';

const BACKUP_VERSION = 1;
const BACKUP_MAGIC = 'PT-BACKUP';

type BackupEnvelope = {
  magic: typeof BACKUP_MAGIC;
  v: number;
  kdf: KdfParams;
  nonceB64: string;
  ctB64: string;
};

async function dumpAll() {
  const db = getDb();
  const [a, b, c, d, e, f, g, h] = await Promise.all([
    db.select().from(settings),
    db.select().from(cycles),
    db.select().from(dayLogs),
    db.select().from(symptoms),
    db.select().from(moods),
    db.select().from(medications),
    db.select().from(medDoses),
    db.select().from(customTags),
  ]);
  return {
    settings: a,
    cycles: b,
    dayLogs: c,
    symptoms: d,
    moods: e,
    medications: f,
    medDoses: g,
    customTags: h,
  };
}

export async function createEncryptedBackup(passphrase: string): Promise<string> {
  const data = await dumpAll();
  const json = JSON.stringify(data);
  const plaintext = new TextEncoder().encode(json);

  const salt = newKdfSalt();
  const saltB64 = toBase64(salt);
  const key = deriveKey(passphrase, salt);
  const sealed = seal(plaintext, key);
  const env: BackupEnvelope = {
    magic: BACKUP_MAGIC,
    v: BACKUP_VERSION,
    kdf: kdfParams(salt, saltB64),
    nonceB64: sealed.nonceB64,
    ctB64: sealed.ctB64,
  };
  key.fill(0);

  const stamp = new Date().toISOString().replace(/[:.]/g, '-');
  const filename = `pt-backup-${stamp}.ptbk`;
  const file = new File(Paths.document, filename);
  file.create({ overwrite: true });
  file.write(JSON.stringify(env));
  return file.uri;
}

export async function decryptBackup(envelopeJson: string, passphrase: string): Promise<unknown> {
  const env = JSON.parse(envelopeJson) as BackupEnvelope;
  if (env.magic !== BACKUP_MAGIC) throw new Error('not a PrivatesTracker backup file');
  const salt = fromBase64(env.kdf.saltB64);
  const key = deriveKey(passphrase, salt);
  try {
    const pt = aeadOpen({ nonceB64: env.nonceB64, ctB64: env.ctB64 } as SealedBox, key);
    return JSON.parse(new TextDecoder().decode(pt));
  } finally {
    key.fill(0);
  }
}

type BackupContents = {
  settings: unknown[];
  cycles: unknown[];
  dayLogs: unknown[];
  symptoms: unknown[];
  moods: unknown[];
  medications: unknown[];
  medDoses: unknown[];
  customTags: unknown[];
};

export type RestoreStats = {
  cycles: number;
  dayLogs: number;
  symptoms: number;
  moods: number;
  medications: number;
  medDoses: number;
  customTags: number;
  settings: number;
};

function isBackupShape(v: unknown): v is BackupContents {
  if (!v || typeof v !== 'object') return false;
  const o = v as any;
  return (
    Array.isArray(o.cycles) &&
    Array.isArray(o.dayLogs) &&
    Array.isArray(o.symptoms) &&
    Array.isArray(o.moods)
  );
}

export async function restoreEncryptedBackup(
  envelopeJson: string,
  passphrase: string,
): Promise<RestoreStats> {
  const decoded = await decryptBackup(envelopeJson, passphrase);
  if (!isBackupShape(decoded)) throw new Error('backup contents malformed');

  const db = getDb();

  await db.delete(moods);
  await db.delete(symptoms);
  await db.delete(medDoses);
  await db.delete(medications);
  await db.delete(dayLogs);
  await db.delete(cycles);
  await db.delete(customTags);
  await db.delete(settings);

  if (decoded.settings.length) await db.insert(settings).values(decoded.settings as any);
  if (decoded.cycles.length) await db.insert(cycles).values(decoded.cycles as any);
  if (decoded.dayLogs.length) await db.insert(dayLogs).values(decoded.dayLogs as any);
  if (decoded.symptoms.length) await db.insert(symptoms).values(decoded.symptoms as any);
  if (decoded.moods.length) await db.insert(moods).values(decoded.moods as any);
  if (decoded.medications.length) await db.insert(medications).values(decoded.medications as any);
  if (decoded.medDoses.length) await db.insert(medDoses).values(decoded.medDoses as any);
  if (decoded.customTags.length) await db.insert(customTags).values(decoded.customTags as any);

  return {
    settings: decoded.settings.length,
    cycles: decoded.cycles.length,
    dayLogs: decoded.dayLogs.length,
    symptoms: decoded.symptoms.length,
    moods: decoded.moods.length,
    medications: decoded.medications.length,
    medDoses: decoded.medDoses.length,
    customTags: decoded.customTags.length,
  };
}
