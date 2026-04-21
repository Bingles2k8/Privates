import Papa from 'papaparse';
import JSZip from 'jszip';
import { File, Paths } from 'expo-file-system';
import { eq } from 'drizzle-orm';
import { getDb } from '@/db';
import {
  customTags,
  cycles,
  dayLogs,
  medDoses,
  medications,
  moods,
  symptoms,
} from '@/db/schema';
import { uuid } from '@/ids';

// Each CSV has a stable schema so importing into a spreadsheet (or a future
// version of this app) is predictable. We keep timestamps as ISO strings and
// booleans as 0/1. The `.ptcsv.zip` extension disambiguates it from arbitrary
// zips the user might pick.
const FILES = {
  dayLogs: 'day-logs.csv',
  symptoms: 'symptoms.csv',
  moods: 'moods.csv',
  cycles: 'cycles.csv',
  medications: 'medications.csv',
  medDoses: 'med-doses.csv',
  customTags: 'custom-tags.csv',
} as const;

// ──────────────────────────────────────────────────────────────────────────
// Export
// ──────────────────────────────────────────────────────────────────────────

export async function exportCsvBundle(): Promise<string> {
  const db = getDb();
  const [dl, sy, mo, cy, me, md, ct] = await Promise.all([
    db.select().from(dayLogs),
    db.select().from(symptoms),
    db.select().from(moods),
    db.select().from(cycles),
    db.select().from(medications),
    db.select().from(medDoses),
    db.select().from(customTags),
  ]);

  const zip = new JSZip();
  zip.file(FILES.dayLogs, Papa.unparse(dl));
  zip.file(FILES.symptoms, Papa.unparse(sy));
  zip.file(FILES.moods, Papa.unparse(mo));
  zip.file(FILES.cycles, Papa.unparse(cy));
  zip.file(FILES.medications, Papa.unparse(me));
  zip.file(FILES.medDoses, Papa.unparse(md));
  zip.file(FILES.customTags, Papa.unparse(ct));

  const base64 = await zip.generateAsync({ type: 'base64' });

  const stamp = new Date().toISOString().replace(/[:.]/g, '-');
  const filename = `pt-csv-${stamp}.ptcsv.zip`;
  const file = new File(Paths.document, filename);
  file.create({ overwrite: true });
  // expo-file-system's File.write doesn't support base64 directly in all
  // versions, so we write the raw bytes via Uint8Array.
  const bytes = base64ToUint8(base64);
  file.write(bytes);
  return file.uri;
}

function base64ToUint8(b64: string): Uint8Array {
  // atob is available in the Hermes engine used by RN.
  const bin = globalThis.atob(b64);
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
}

// ──────────────────────────────────────────────────────────────────────────
// Import (merge / upsert)
// ──────────────────────────────────────────────────────────────────────────

export type CsvImportStats = {
  dayLogs: { inserted: number; updated: number };
  symptoms: { inserted: number; updated: number };
  moods: { inserted: number; updated: number };
  cycles: { inserted: number; updated: number };
  medications: { inserted: number; updated: number };
  medDoses: { inserted: number; updated: number };
  customTags: { inserted: number; updated: number };
};

function emptyStats(): CsvImportStats {
  const z = () => ({ inserted: 0, updated: 0 });
  return {
    dayLogs: z(),
    symptoms: z(),
    moods: z(),
    cycles: z(),
    medications: z(),
    medDoses: z(),
    customTags: z(),
  };
}

function parseCsv<T = Record<string, string>>(raw: string): T[] {
  const res = Papa.parse<T>(raw, { header: true, skipEmptyLines: true, dynamicTyping: false });
  return (res.data ?? []).filter((r) => r && typeof r === 'object');
}

function asInt(v: unknown): number | null {
  if (v === null || v === undefined || v === '') return null;
  const n = Number(v);
  return Number.isFinite(n) ? Math.trunc(n) : null;
}

function asReal(v: unknown): number | null {
  if (v === null || v === undefined || v === '') return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}

function asBool(v: unknown): boolean {
  const s = String(v).toLowerCase();
  return s === '1' || s === 'true' || s === 'yes';
}

function asStr(v: unknown): string | null {
  if (v === null || v === undefined) return null;
  const s = String(v);
  return s === '' ? null : s;
}

export async function importCsvBundle(uri: string): Promise<CsvImportStats> {
  const file = new File(uri);
  const bytes = file.bytesSync();
  const zip = await JSZip.loadAsync(bytes);
  const stats = emptyStats();
  const db = getDb();
  const now = new Date().toISOString();

  // ── day_logs — keyed by date (unique index)
  const dlRaw = await zip.file(FILES.dayLogs)?.async('string');
  if (dlRaw) {
    for (const r of parseCsv<Record<string, string>>(dlRaw)) {
      if (!r.date) continue;
      const row = {
        id: r.id || uuid(),
        date: r.date,
        flow: asInt(r.flow),
        mood: asInt(r.mood),
        bbt: asReal(r.bbt),
        cervicalMucus: asStr(r.cervical_mucus ?? r.cervicalMucus),
        sexJson: asStr(r.sex_json ?? r.sexJson),
        lhTest: asStr(r.lh_test ?? r.lhTest),
        notes: asStr(r.notes),
        updatedAt: r.updated_at || r.updatedAt || now,
      };
      const existing = await db.query.dayLogs.findFirst({ where: eq(dayLogs.date, row.date) });
      if (existing) {
        await db.update(dayLogs).set({ ...row, id: existing.id }).where(eq(dayLogs.id, existing.id));
        stats.dayLogs.updated++;
      } else {
        await db.insert(dayLogs).values(row);
        stats.dayLogs.inserted++;
      }
    }
  }

  // ── symptoms — keyed by id, with (day_log_id, tag) upsert semantics
  const syRaw = await zip.file(FILES.symptoms)?.async('string');
  if (syRaw) {
    for (const r of parseCsv<Record<string, string>>(syRaw)) {
      if (!r.day_log_id && !r.dayLogId) continue;
      const dayLogId = (r.day_log_id ?? r.dayLogId) as string;
      const tag = r.tag;
      if (!tag) continue;
      const intensity = asInt(r.intensity) ?? 1;
      const existing = r.id
        ? await db.query.symptoms.findFirst({ where: eq(symptoms.id, r.id) })
        : null;
      if (existing) {
        await db.update(symptoms).set({ dayLogId, tag, intensity }).where(eq(symptoms.id, existing.id));
        stats.symptoms.updated++;
      } else {
        await db.insert(symptoms).values({ id: r.id || uuid(), dayLogId, tag, intensity });
        stats.symptoms.inserted++;
      }
    }
  }

  // ── moods
  const moRaw = await zip.file(FILES.moods)?.async('string');
  if (moRaw) {
    for (const r of parseCsv<Record<string, string>>(moRaw)) {
      if (!r.day_log_id && !r.dayLogId) continue;
      const dayLogId = (r.day_log_id ?? r.dayLogId) as string;
      const tag = r.tag;
      if (!tag) continue;
      const intensity = asInt(r.intensity) ?? 1;
      const existing = r.id
        ? await db.query.moods.findFirst({ where: eq(moods.id, r.id) })
        : null;
      if (existing) {
        await db.update(moods).set({ dayLogId, tag, intensity }).where(eq(moods.id, existing.id));
        stats.moods.updated++;
      } else {
        await db.insert(moods).values({ id: r.id || uuid(), dayLogId, tag, intensity });
        stats.moods.inserted++;
      }
    }
  }

  // ── cycles
  const cyRaw = await zip.file(FILES.cycles)?.async('string');
  if (cyRaw) {
    for (const r of parseCsv<Record<string, string>>(cyRaw)) {
      if (!r.start_date && !r.startDate) continue;
      const startDate = (r.start_date ?? r.startDate) as string;
      const endDate = asStr(r.end_date ?? r.endDate);
      const predicted = asBool(r.predicted);
      const notes = asStr(r.notes);
      const createdAt = r.created_at || r.createdAt || now;
      const existing = r.id
        ? await db.query.cycles.findFirst({ where: eq(cycles.id, r.id) })
        : null;
      if (existing) {
        await db
          .update(cycles)
          .set({ startDate, endDate, predicted, notes, createdAt })
          .where(eq(cycles.id, existing.id));
        stats.cycles.updated++;
      } else {
        await db.insert(cycles).values({
          id: r.id || uuid(),
          startDate,
          endDate,
          predicted,
          notes,
          createdAt,
        });
        stats.cycles.inserted++;
      }
    }
  }

  // ── medications
  const meRaw = await zip.file(FILES.medications)?.async('string');
  if (meRaw) {
    for (const r of parseCsv<Record<string, string>>(meRaw)) {
      if (!r.name || !r.kind) continue;
      const row = {
        id: r.id || uuid(),
        name: r.name,
        kind: r.kind,
        scheduleJson: asStr(r.schedule_json ?? r.scheduleJson),
        active: asBool(r.active),
        startedAt: r.started_at || r.startedAt || now,
        endedAt: asStr(r.ended_at ?? r.endedAt),
      };
      const existing = r.id
        ? await db.query.medications.findFirst({ where: eq(medications.id, r.id) })
        : null;
      if (existing) {
        await db.update(medications).set(row).where(eq(medications.id, existing.id));
        stats.medications.updated++;
      } else {
        await db.insert(medications).values(row);
        stats.medications.inserted++;
      }
    }
  }

  // ── med_doses
  const mdRaw = await zip.file(FILES.medDoses)?.async('string');
  if (mdRaw) {
    for (const r of parseCsv<Record<string, string>>(mdRaw)) {
      if (!r.medication_id && !r.medicationId) continue;
      const medicationId = (r.medication_id ?? r.medicationId) as string;
      const row = {
        id: r.id || uuid(),
        medicationId,
        takenAt: asStr(r.taken_at ?? r.takenAt),
        skipped: asBool(r.skipped),
        scheduledFor: r.scheduled_for || r.scheduledFor || now,
      };
      const existing = r.id
        ? await db.query.medDoses.findFirst({ where: eq(medDoses.id, r.id) })
        : null;
      if (existing) {
        await db.update(medDoses).set(row).where(eq(medDoses.id, existing.id));
        stats.medDoses.updated++;
      } else {
        await db.insert(medDoses).values(row);
        stats.medDoses.inserted++;
      }
    }
  }

  // ── custom_tags
  const ctRaw = await zip.file(FILES.customTags)?.async('string');
  if (ctRaw) {
    for (const r of parseCsv<Record<string, string>>(ctRaw)) {
      if (!r.kind || !r.label) continue;
      const existing = r.id
        ? await db.query.customTags.findFirst({ where: eq(customTags.id, r.id) })
        : null;
      if (existing) {
        await db.update(customTags).set({ kind: r.kind, label: r.label }).where(eq(customTags.id, existing.id));
        stats.customTags.updated++;
      } else {
        await db.insert(customTags).values({ id: r.id || uuid(), kind: r.kind, label: r.label });
        stats.customTags.inserted++;
      }
    }
  }

  return stats;
}
