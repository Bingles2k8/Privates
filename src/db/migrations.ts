import { getRawDb } from './client';

type Migration = { v: number; sql: string[] };

const MIGRATIONS: Migration[] = [
  {
    v: 1,
    sql: [
      `CREATE TABLE IF NOT EXISTS settings (
        id INTEGER PRIMARY KEY,
        json TEXT NOT NULL,
        updated_at TEXT NOT NULL
      )`,
      `CREATE TABLE IF NOT EXISTS cycles (
        id TEXT PRIMARY KEY,
        start_date TEXT NOT NULL,
        end_date TEXT,
        predicted INTEGER NOT NULL DEFAULT 0,
        notes TEXT,
        created_at TEXT NOT NULL
      )`,
      `CREATE INDEX IF NOT EXISTS cycles_start_idx ON cycles(start_date)`,
      `CREATE TABLE IF NOT EXISTS day_logs (
        id TEXT PRIMARY KEY,
        date TEXT NOT NULL,
        flow INTEGER,
        bbt REAL,
        cervical_mucus TEXT,
        sex_json TEXT,
        lh_test TEXT,
        notes TEXT,
        updated_at TEXT NOT NULL
      )`,
      `CREATE UNIQUE INDEX IF NOT EXISTS day_logs_date_idx ON day_logs(date)`,
      `CREATE TABLE IF NOT EXISTS symptoms (
        id TEXT PRIMARY KEY,
        day_log_id TEXT NOT NULL REFERENCES day_logs(id) ON DELETE CASCADE,
        tag TEXT NOT NULL,
        intensity INTEGER NOT NULL DEFAULT 1
      )`,
      `CREATE INDEX IF NOT EXISTS symptoms_day_idx ON symptoms(day_log_id)`,
      `CREATE TABLE IF NOT EXISTS moods (
        id TEXT PRIMARY KEY,
        day_log_id TEXT NOT NULL REFERENCES day_logs(id) ON DELETE CASCADE,
        tag TEXT NOT NULL,
        intensity INTEGER NOT NULL DEFAULT 1
      )`,
      `CREATE INDEX IF NOT EXISTS moods_day_idx ON moods(day_log_id)`,
      `CREATE TABLE IF NOT EXISTS medications (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        kind TEXT NOT NULL,
        schedule_json TEXT,
        active INTEGER NOT NULL DEFAULT 1,
        started_at TEXT NOT NULL,
        ended_at TEXT
      )`,
      `CREATE TABLE IF NOT EXISTS med_doses (
        id TEXT PRIMARY KEY,
        medication_id TEXT NOT NULL REFERENCES medications(id) ON DELETE CASCADE,
        taken_at TEXT,
        skipped INTEGER NOT NULL DEFAULT 0,
        scheduled_for TEXT NOT NULL
      )`,
      `CREATE INDEX IF NOT EXISTS med_doses_med_idx ON med_doses(medication_id)`,
      `CREATE INDEX IF NOT EXISTS med_doses_sched_idx ON med_doses(scheduled_for)`,
      `CREATE TABLE IF NOT EXISTS custom_tags (
        id TEXT PRIMARY KEY,
        kind TEXT NOT NULL,
        label TEXT NOT NULL
      )`,
      `CREATE INDEX IF NOT EXISTS custom_tags_kind_idx ON custom_tags(kind)`,
    ],
  },
  {
    v: 2,
    sql: [`ALTER TABLE day_logs ADD COLUMN mood INTEGER`],
  },
  {
    v: 3,
    sql: [
      `CREATE TABLE IF NOT EXISTS pregnancies (
        id TEXT PRIMARY KEY,
        lmp_date TEXT NOT NULL,
        due_date TEXT NOT NULL,
        ended_at TEXT,
        outcome TEXT,
        notes TEXT,
        created_at TEXT NOT NULL
      )`,
      `CREATE TABLE IF NOT EXISTS kick_counts (
        id TEXT PRIMARY KEY,
        pregnancy_id TEXT NOT NULL REFERENCES pregnancies(id) ON DELETE CASCADE,
        started_at TEXT NOT NULL,
        count INTEGER NOT NULL DEFAULT 0,
        duration_seconds INTEGER NOT NULL DEFAULT 0
      )`,
      `CREATE INDEX IF NOT EXISTS kick_counts_preg_idx ON kick_counts(pregnancy_id)`,
      `CREATE TABLE IF NOT EXISTS contractions (
        id TEXT PRIMARY KEY,
        pregnancy_id TEXT NOT NULL REFERENCES pregnancies(id) ON DELETE CASCADE,
        started_at TEXT NOT NULL,
        ended_at TEXT
      )`,
      `CREATE INDEX IF NOT EXISTS contractions_preg_idx ON contractions(pregnancy_id)`,
    ],
  },
  {
    // Replacement-reminder fields for long-acting contraceptives. Both columns
    // are nullable so existing rows (pre-v4 medications, plus daily methods
    // like the pill that don't have a scheduled replacement) keep working.
    v: 4,
    sql: [
      `ALTER TABLE medications ADD COLUMN inserted_at TEXT`,
      `ALTER TABLE medications ADD COLUMN replacement_days INTEGER`,
    ],
  },
];

export async function runMigrations(): Promise<void> {
  const db = getRawDb();
  await db.execute(`PRAGMA foreign_keys = ON`);
  await db.execute(
    `CREATE TABLE IF NOT EXISTS _meta (key TEXT PRIMARY KEY, value TEXT NOT NULL)`,
  );

  const res = await db.execute(`SELECT value FROM _meta WHERE key = 'schema_version'`);
  const current = res.rows.length ? parseInt((res.rows[0] as any).value, 10) : 0;

  for (const m of MIGRATIONS) {
    if (m.v <= current) continue;
    await db.transaction(async (tx) => {
      for (const stmt of m.sql) {
        await tx.execute(stmt);
      }
      await tx.execute(
        `INSERT INTO _meta (key, value) VALUES ('schema_version', ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value`,
        [String(m.v)],
      );
    });
  }
}

export const LATEST_SCHEMA_VERSION = MIGRATIONS[MIGRATIONS.length - 1].v;
