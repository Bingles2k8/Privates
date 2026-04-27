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
import { backupContentsSchema, summarizeBackupError } from './backupSchema';

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

export async function restoreEncryptedBackup(
  envelopeJson: string,
  passphrase: string,
): Promise<RestoreStats> {
  const decoded = await decryptBackup(envelopeJson, passphrase);

  // Validate every row before we touch the DB. Without this, a single
  // malformed row (e.g. a string in a NUMERIC column from a hand-edited
  // backup) would throw mid-insert AFTER we'd already deleted the existing
  // tables \u2014 leaving the user with empty tables. zod gives us a single
  // pre-flight check with a precise error path.
  const parsed = backupContentsSchema.safeParse(decoded);
  if (!parsed.success) {
    throw new Error(`backup contents malformed (${summarizeBackupError(parsed.error)})`);
  }
  const data = parsed.data;

  const db = getDb();

  await db.delete(moods);
  await db.delete(symptoms);
  await db.delete(medDoses);
  await db.delete(medications);
  await db.delete(dayLogs);
  await db.delete(cycles);
  await db.delete(customTags);
  await db.delete(settings);

  if (data.settings.length) await db.insert(settings).values(data.settings);
  if (data.cycles.length) await db.insert(cycles).values(data.cycles);
  if (data.dayLogs.length) await db.insert(dayLogs).values(data.dayLogs);
  if (data.symptoms.length) await db.insert(symptoms).values(data.symptoms);
  if (data.moods.length) await db.insert(moods).values(data.moods);
  if (data.medications.length) await db.insert(medications).values(data.medications);
  if (data.medDoses.length) await db.insert(medDoses).values(data.medDoses);
  if (data.customTags.length) await db.insert(customTags).values(data.customTags);

  return {
    settings: data.settings.length,
    cycles: data.cycles.length,
    dayLogs: data.dayLogs.length,
    symptoms: data.symptoms.length,
    moods: data.moods.length,
    medications: data.medications.length,
    medDoses: data.medDoses.length,
    customTags: data.customTags.length,
  };
}
