import { sqliteTable, text, integer, real, index, uniqueIndex } from 'drizzle-orm/sqlite-core';

export const settings = sqliteTable('settings', {
  id: integer('id').primaryKey(),
  json: text('json').notNull(),
  updatedAt: text('updated_at').notNull(),
});

export const cycles = sqliteTable(
  'cycles',
  {
    id: text('id').primaryKey(),
    startDate: text('start_date').notNull(),
    endDate: text('end_date'),
    predicted: integer('predicted', { mode: 'boolean' }).notNull().default(false),
    notes: text('notes'),
    createdAt: text('created_at').notNull(),
  },
  (t) => ({
    startIdx: index('cycles_start_idx').on(t.startDate),
  }),
);

export const dayLogs = sqliteTable(
  'day_logs',
  {
    id: text('id').primaryKey(),
    date: text('date').notNull(),
    flow: integer('flow'),
    mood: integer('mood'),
    bbt: real('bbt'),
    cervicalMucus: text('cervical_mucus'),
    sexJson: text('sex_json'),
    lhTest: text('lh_test'),
    notes: text('notes'),
    updatedAt: text('updated_at').notNull(),
  },
  (t) => ({
    dateIdx: uniqueIndex('day_logs_date_idx').on(t.date),
  }),
);

export const symptoms = sqliteTable(
  'symptoms',
  {
    id: text('id').primaryKey(),
    dayLogId: text('day_log_id')
      .notNull()
      .references(() => dayLogs.id, { onDelete: 'cascade' }),
    tag: text('tag').notNull(),
    intensity: integer('intensity').notNull().default(1),
  },
  (t) => ({
    dayIdx: index('symptoms_day_idx').on(t.dayLogId),
  }),
);

export const moods = sqliteTable(
  'moods',
  {
    id: text('id').primaryKey(),
    dayLogId: text('day_log_id')
      .notNull()
      .references(() => dayLogs.id, { onDelete: 'cascade' }),
    tag: text('tag').notNull(),
    intensity: integer('intensity').notNull().default(1),
  },
  (t) => ({
    dayIdx: index('moods_day_idx').on(t.dayLogId),
  }),
);

export const medications = sqliteTable('medications', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  kind: text('kind').notNull(),
  scheduleJson: text('schedule_json'),
  active: integer('active', { mode: 'boolean' }).notNull().default(true),
  startedAt: text('started_at').notNull(),
  endedAt: text('ended_at'),
});

export const medDoses = sqliteTable(
  'med_doses',
  {
    id: text('id').primaryKey(),
    medicationId: text('medication_id')
      .notNull()
      .references(() => medications.id, { onDelete: 'cascade' }),
    takenAt: text('taken_at'),
    skipped: integer('skipped', { mode: 'boolean' }).notNull().default(false),
    scheduledFor: text('scheduled_for').notNull(),
  },
  (t) => ({
    medIdx: index('med_doses_med_idx').on(t.medicationId),
    schedIdx: index('med_doses_sched_idx').on(t.scheduledFor),
  }),
);

export const customTags = sqliteTable(
  'custom_tags',
  {
    id: text('id').primaryKey(),
    kind: text('kind').notNull(),
    label: text('label').notNull(),
  },
  (t) => ({
    kindIdx: index('custom_tags_kind_idx').on(t.kind),
  }),
);

export const pregnancies = sqliteTable('pregnancies', {
  id: text('id').primaryKey(),
  lmpDate: text('lmp_date').notNull(),
  dueDate: text('due_date').notNull(),
  endedAt: text('ended_at'),
  outcome: text('outcome'),
  notes: text('notes'),
  createdAt: text('created_at').notNull(),
});

export const kickCounts = sqliteTable(
  'kick_counts',
  {
    id: text('id').primaryKey(),
    pregnancyId: text('pregnancy_id')
      .notNull()
      .references(() => pregnancies.id, { onDelete: 'cascade' }),
    startedAt: text('started_at').notNull(),
    count: integer('count').notNull().default(0),
    durationSeconds: integer('duration_seconds').notNull().default(0),
  },
  (t) => ({
    pregIdx: index('kick_counts_preg_idx').on(t.pregnancyId),
  }),
);

export const contractions = sqliteTable(
  'contractions',
  {
    id: text('id').primaryKey(),
    pregnancyId: text('pregnancy_id')
      .notNull()
      .references(() => pregnancies.id, { onDelete: 'cascade' }),
    startedAt: text('started_at').notNull(),
    endedAt: text('ended_at'),
  },
  (t) => ({
    pregIdx: index('contractions_preg_idx').on(t.pregnancyId),
  }),
);

export type Cycle = typeof cycles.$inferSelect;
export type DayLog = typeof dayLogs.$inferSelect;
export type Symptom = typeof symptoms.$inferSelect;
export type Mood = typeof moods.$inferSelect;
export type Medication = typeof medications.$inferSelect;
export type MedDose = typeof medDoses.$inferSelect;
export type Pregnancy = typeof pregnancies.$inferSelect;
export type KickCount = typeof kickCounts.$inferSelect;
export type Contraction = typeof contractions.$inferSelect;
