import * as Notifications from 'expo-notifications';
import { addDays, parseISO, set as setDate, subDays } from 'date-fns';

const MED_PREFIX = 'pt.med.';
const REPLACE_PREFIX = 'pt.replace.';
const PERIOD_ID = 'pt.period';
const FERTILE_ID = 'pt.fertile';
const LOG_ID = 'pt.log';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: false,
    shouldSetBadge: false,
  }),
});

export async function ensurePermissions(): Promise<boolean> {
  const settings = await Notifications.getPermissionsAsync();
  if (settings.granted) return true;
  const req = await Notifications.requestPermissionsAsync();
  return !!req.granted;
}

// ──────────────────────────────────────────────────────────────────────────
// Medication (daily) reminders — unchanged
// ──────────────────────────────────────────────────────────────────────────

export async function scheduleDailyReminder(input: {
  medicationId: string;
  hour: number;
  minute: number;
  title: string;
  body: string;
}): Promise<string> {
  return Notifications.scheduleNotificationAsync({
    identifier: MED_PREFIX + input.medicationId,
    content: { title: input.title, body: input.body, sound: false },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.DAILY,
      hour: input.hour,
      minute: input.minute,
    },
  });
}

export async function cancelMedicationReminders(medicationId: string) {
  // A medication can have both a daily-dose reminder (pills) AND a one-shot
  // replacement reminder (IUDs, implant, etc.). Always clean up both — the
  // identifier-not-found case is harmless.
  await Promise.all([
    cancelReminder(MED_PREFIX + medicationId),
    cancelReminder(REPLACE_PREFIX + medicationId),
  ]);
}

export async function cancelAllReminders() {
  await Notifications.cancelAllScheduledNotificationsAsync();
}

/**
 * Schedule a one-shot reminder for a long-acting contraceptive that's due
 * for replacement. We fire two weeks before the actual due date so the user
 * has time to book an appointment — IUD removal/insertion typically requires
 * advance scheduling with a clinician.
 *
 * The trigger date is computed from `insertedAt + replacementDays - 14`. If
 * that date is already in the past (e.g. user is back-filling an IUD that's
 * already overdue), we fire 24h from now so they hear about it immediately.
 *
 * Safe to call repeatedly — replaces any existing schedule for this med.
 *
 * @returns the OS notification id, or null if scheduling failed permission-wise.
 */
export async function scheduleReplacementReminder(input: {
  medicationId: string;
  insertedAt: string;
  replacementDays: number;
  /** Display name for the body text (e.g. "Mirena IUD"). */
  deviceLabel: string;
}): Promise<string | null> {
  const ok = await ensurePermissions();
  if (!ok) return null;
  await cancelReminder(REPLACE_PREFIX + input.medicationId);

  const dueDate = addDays(parseISO(input.insertedAt), input.replacementDays);
  const remindAt = subDays(dueDate, 14);
  // Fire at 10am local — same convention the fertile-window reminder uses,
  // so reminders cluster at a reasonable time of day.
  let target = setDate(remindAt, { hours: 10, minutes: 0, seconds: 0, milliseconds: 0 });
  // Past-due back-fill case: nudge in ~24h so the user actually sees it.
  if (target.getTime() <= Date.now()) {
    target = setDate(addDays(new Date(), 1), {
      hours: 10,
      minutes: 0,
      seconds: 0,
      milliseconds: 0,
    });
  }

  return Notifications.scheduleNotificationAsync({
    identifier: REPLACE_PREFIX + input.medicationId,
    content: {
      title: `${input.deviceLabel} replacement due soon`,
      body: `Your ${input.deviceLabel} is approaching its replacement date. Book an appointment with your provider.`,
      sound: false,
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.DATE,
      date: target,
    },
  });
}

// ──────────────────────────────────────────────────────────────────────────
// Lifecycle reminders: upcoming period, fertile window, daily log
// ──────────────────────────────────────────────────────────────────────────

function roughSuffix(rough: boolean): string {
  return rough
    ? '\nRough estimate — will get sharper once you log a few more cycles.'
    : '';
}

/**
 * Schedule a notification the evening before the predicted period start.
 * Safe to call repeatedly — replaces any existing `pt.period` schedule.
 *
 * @param rough set true when sample size < 2 so we label the estimate.
 */
export async function schedulePeriodReminder(opts: {
  nextPeriodStart: string;
  rough: boolean;
}): Promise<string | null> {
  await cancelReminder(PERIOD_ID);
  const target = setDate(addDays(parseISO(opts.nextPeriodStart), -1), {
    hours: 19,
    minutes: 0,
    seconds: 0,
    milliseconds: 0,
  });
  if (target.getTime() <= Date.now()) return null;
  return Notifications.scheduleNotificationAsync({
    identifier: PERIOD_ID,
    content: {
      title: 'Period expected tomorrow',
      body: `Heads up — your cycle suggests it starts tomorrow.${roughSuffix(opts.rough)}`,
      sound: false,
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.DATE,
      date: target,
    },
  });
}

/**
 * Fires at 10am on the first day of the fertile window.
 */
export async function scheduleFertileReminder(opts: {
  fertileStart: string;
  rough: boolean;
}): Promise<string | null> {
  await cancelReminder(FERTILE_ID);
  const target = setDate(parseISO(opts.fertileStart), {
    hours: 10,
    minutes: 0,
    seconds: 0,
    milliseconds: 0,
  });
  if (target.getTime() <= Date.now()) return null;
  return Notifications.scheduleNotificationAsync({
    identifier: FERTILE_ID,
    content: {
      title: 'Fertile window starts today',
      body: `Ovulation is a few days out.${roughSuffix(opts.rough)}`,
      sound: false,
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.DATE,
      date: target,
    },
  });
}

export async function scheduleDailyLogReminder(time: string): Promise<string> {
  await cancelReminder(LOG_ID);
  const [h, m] = time.split(':').map((n) => parseInt(n, 10));
  return Notifications.scheduleNotificationAsync({
    identifier: LOG_ID,
    content: {
      title: 'Log today?',
      body: 'A couple taps keeps your predictions sharp.',
      sound: false,
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.DAILY,
      hour: Number.isFinite(h) ? h : 20,
      minute: Number.isFinite(m) ? m : 0,
    },
  });
}

async function cancelReminder(id: string): Promise<void> {
  try {
    await Notifications.cancelScheduledNotificationAsync(id);
  } catch {
    /* no-op if not scheduled */
  }
}

export async function cancelLifecycleReminders(): Promise<void> {
  await cancelReminder(PERIOD_ID);
  await cancelReminder(FERTILE_ID);
  await cancelReminder(LOG_ID);
}

export async function cancelPeriodReminder(): Promise<void> {
  await cancelReminder(PERIOD_ID);
}
export async function cancelFertileReminder(): Promise<void> {
  await cancelReminder(FERTILE_ID);
}
export async function cancelDailyLogReminder(): Promise<void> {
  await cancelReminder(LOG_ID);
}
