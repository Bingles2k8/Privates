import { useEffect } from 'react';
import { usePrediction } from '@/hooks/usePrediction';
import { useReminderPrefs } from '@/state/reminders';
import {
  cancelDailyLogReminder,
  cancelFertileReminder,
  cancelPeriodReminder,
  ensurePermissions,
  scheduleDailyLogReminder,
  scheduleFertileReminder,
  schedulePeriodReminder,
} from '@/services/reminders';

/**
 * Keeps the three lifecycle reminders (period, fertile, daily log) in sync
 * with the current prediction data and user toggles.
 *
 * We re-run whenever the prediction or any toggle changes. Each scheduler
 * cancels its own identifier first, so re-scheduling is idempotent.
 *
 * Note on "rough estimates": when the prediction's sampleSize is < 2 the user
 * hasn't logged enough cycles for a confident forecast. We still fire the
 * reminder, but the body explains the forecast is rough. This honours the
 * user's choice to be pinged early while being honest about accuracy.
 */
export function useRescheduleReminders(): void {
  const { data: pred } = usePrediction();
  const hydrated = useReminderPrefs((s) => s.hydrated);
  const upcomingPeriod = useReminderPrefs((s) => s.upcomingPeriod);
  const fertileWindow = useReminderPrefs((s) => s.fertileWindow);
  const dailyLog = useReminderPrefs((s) => s.dailyLog);
  const dailyLogTime = useReminderPrefs((s) => s.dailyLogTime);

  useEffect(() => {
    if (!hydrated) return;
    let cancelled = false;

    async function run() {
      // Any enabled toggle → ensure notification permission; bail quietly if denied.
      const anyEnabled = upcomingPeriod || fertileWindow || dailyLog;
      if (anyEnabled) {
        const ok = await ensurePermissions();
        if (!ok) return;
      }
      if (cancelled) return;

      const rough = (pred?.prediction?.sampleSize ?? 0) < 2;

      if (upcomingPeriod && pred?.prediction) {
        await schedulePeriodReminder({
          nextPeriodStart: pred.prediction.nextPeriodStart,
          rough,
        });
      } else {
        await cancelPeriodReminder();
      }

      if (fertileWindow && pred?.fertile) {
        await scheduleFertileReminder({
          fertileStart: pred.fertile.windowStart,
          rough,
        });
      } else {
        await cancelFertileReminder();
      }

      if (dailyLog) {
        await scheduleDailyLogReminder(dailyLogTime);
      } else {
        await cancelDailyLogReminder();
      }
    }

    run();
    return () => {
      cancelled = true;
    };
  }, [
    hydrated,
    upcomingPeriod,
    fertileWindow,
    dailyLog,
    dailyLogTime,
    pred?.prediction?.nextPeriodStart,
    pred?.prediction?.sampleSize,
    pred?.fertile?.windowStart,
  ]);
}
