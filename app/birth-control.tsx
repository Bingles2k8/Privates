import { useMemo, useState } from 'react';
import { Alert, Pressable, Text, TextInput, View } from 'react-native';
import { HandIcon } from '@/ui/HandIcon';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { addDays, format, isValid, parseISO } from 'date-fns';
import { Card, CardTitle } from '@/ui/Card';
import { PrimaryButton } from '@/ui/PrimaryButton';
import { Screen } from '@/ui/Screen';
import {
  HORMONAL_IUD_BRANDS,
  MEDICATION_KINDS,
  REPLACEMENT_DAYS_BY_KIND,
  replacementIntervalLabel,
  type HormonalIudBrand,
} from '@/data/constants';
import {
  createMedication,
  endMedication,
  listActiveMedications,
  recentDoses,
  recordDose,
} from '@/data/medications';
import { Chip } from '@/ui/Chip';
import {
  cancelMedicationReminders,
  ensurePermissions,
  scheduleDailyReminder,
  scheduleReplacementReminder,
} from '@/services/reminders';
import { assessBackupProtection } from '@/services/backupProtection';
import { useTheme } from '@/theme/useTheme';

const DAILY_KINDS = new Set(['pill_combined', 'pill_progestin']);

// Which kinds get the "when did this start?" insertion-date question.
// Hormonal IUD also asks for brand because Mirena/Liletta/Kyleena/Skyla all
// have different approved use periods.
function kindHasReplacement(kind: string): boolean {
  return kind === 'iud_hormonal' || REPLACEMENT_DAYS_BY_KIND[kind] != null;
}

/** Days-until-replacement for a given kind + brand. Null if not applicable. */
function replacementDaysFor(kind: string, brand: HormonalIudBrand | null): number | null {
  if (kind === 'iud_hormonal') {
    const b = HORMONAL_IUD_BRANDS.find((x) => x.value === (brand ?? 'unknown'));
    return b ? b.years * 365 : null;
  }
  return REPLACEMENT_DAYS_BY_KIND[kind] ?? null;
}

const TODAY_ISO = () => format(new Date(), 'yyyy-MM-dd');

function isValidDate(s: string): boolean {
  const d = parseISO(s);
  return isValid(d) && /^\d{4}-\d{2}-\d{2}$/.test(s);
}

function fallbackNameForKind(kind: string): string {
  return MEDICATION_KINDS.find((k) => k.value === kind)?.label ?? 'Birth control';
}

export default function BirthControlScreen() {
  const qc = useQueryClient();
  const { data: meds } = useQuery({ queryKey: ['meds'], queryFn: listActiveMedications });
  const [adding, setAdding] = useState(false);
  const [name, setName] = useState('');
  const [kind, setKind] = useState<string>('pill_combined');
  const [time, setTime] = useState('09:00');
  const [reminder, setReminder] = useState(true);
  const [iudBrand, setIudBrand] = useState<HormonalIudBrand | null>(null);
  const [insertedAt, setInsertedAt] = useState(TODAY_ISO());
  const [replacementReminder, setReplacementReminder] = useState(true);

  const { palette } = useTheme();

  const isPill = kind === 'pill_combined' || kind === 'pill_progestin';
  const wantsReplacementUi = kindHasReplacement(kind);
  const replaceDays = useMemo(
    () => replacementDaysFor(kind, iudBrand),
    [kind, iudBrand],
  );
  // The hormonal-IUD picker is required before we know the duration. Disable
  // save until the user picks (or "I'm not sure") so we never schedule a
  // reminder against a guessed default.
  const needsBrandPick = kind === 'iud_hormonal' && iudBrand == null;
  const dateOk = !wantsReplacementUi || isValidDate(insertedAt);
  const canSave = !needsBrandPick && dateOk;

  const replacementPreview = useMemo(() => {
    if (!wantsReplacementUi || !replaceDays || !isValidDate(insertedAt)) return null;
    const due = addDays(parseISO(insertedAt), replaceDays);
    return {
      dueDate: due,
      intervalLabel: replacementIntervalLabel(replaceDays),
    };
  }, [wantsReplacementUi, replaceDays, insertedAt]);

  function resetForm() {
    setName('');
    setKind('pill_combined');
    setTime('09:00');
    setReminder(true);
    setIudBrand(null);
    setInsertedAt(TODAY_ISO());
    setReplacementReminder(true);
  }

  const create = useMutation({
    mutationFn: async () => {
      const [hh, mm] = time.split(':').map((n) => parseInt(n, 10));
      const fallbackName =
        MEDICATION_KINDS.find((k) => k.value === kind)?.label ?? 'Birth control';
      const id = await createMedication({
        name: name || fallbackName,
        kind,
        schedule: isPill
          ? { timeOfDay: time, daysOfWeek: [0, 1, 2, 3, 4, 5, 6], reminderEnabled: reminder }
          : null,
        insertedAt: wantsReplacementUi && isValidDate(insertedAt) ? insertedAt : null,
        replacementDays: wantsReplacementUi ? replaceDays : null,
      });
      // Daily pill reminder — same flow as before.
      if (isPill && reminder && Number.isFinite(hh) && Number.isFinite(mm)) {
        const ok = await ensurePermissions();
        if (ok) {
          await scheduleDailyReminder({
            medicationId: id,
            hour: hh,
            minute: mm,
            title: 'Time to take it',
            body: name || 'Daily birth control reminder',
          });
        }
      }
      // Replacement reminder for long-acting / recurring methods. We fire
      // 14 days before the actual due date to give the user time to book
      // an appointment (see scheduleReplacementReminder).
      if (
        wantsReplacementUi &&
        replacementReminder &&
        replaceDays != null &&
        isValidDate(insertedAt)
      ) {
        await scheduleReplacementReminder({
          medicationId: id,
          insertedAt,
          replacementDays: replaceDays,
          deviceLabel: name || fallbackName,
        });
      }
      return id;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['meds'] });
      setAdding(false);
      resetForm();
    },
    onError: (e: unknown) => {
      Alert.alert('Could not save', e instanceof Error ? e.message : 'Unknown error');
    },
  });

  return (
    <Screen topInset={false} modalHandle>
      <View>
        <Text
          className="text-ink-muted text-base font-hand"
          style={{ transform: [{ rotate: '-1deg' }] }}
        >
          stay on track
        </Text>
        <Text className="text-ink text-4xl font-display mt-0.5">Birth control</Text>
      </View>

      {(meds ?? []).map((m) => (
        <MedicationCard
          key={m.id}
          id={m.id}
          name={m.name}
          kind={m.kind}
          scheduleJson={m.scheduleJson}
          insertedAt={m.insertedAt}
          replacementDays={m.replacementDays}
          onEnded={() => qc.invalidateQueries({ queryKey: ['meds'] })}
        />
      ))}

      {adding ? (
        <Card>
          <CardTitle icon={<HandIcon name="plus-circle" size={14} color={palette.inkMuted} />}>
            Add a method
          </CardTitle>
          <View className="flex-row flex-wrap gap-2 mb-4">
            {MEDICATION_KINDS.map((k) => (
              <Chip
                key={k.value}
                label={k.label}
                selected={kind === k.value}
                onPress={() => {
                  setKind(k.value);
                  // Reset brand when leaving the hormonal-IUD branch so a
                  // stale brand selection can't bleed into a copper IUD.
                  if (k.value !== 'iud_hormonal') setIudBrand(null);
                }}
              />
            ))}
          </View>

          {/* Hormonal IUD brand picker — durations vary 3–8 years by brand */}
          {kind === 'iud_hormonal' && (
            <View className="mb-4">
              <Text
                className="text-ink-muted text-base font-hand mb-2"
                style={{ transform: [{ rotate: '-1deg' }] }}
              >
                which one?
              </Text>
              <View className="flex-row flex-wrap gap-2">
                {HORMONAL_IUD_BRANDS.map((b) => (
                  <Chip
                    key={b.value}
                    label={b.value === 'unknown' ? b.label : `${b.label} (${b.years}y)`}
                    selected={iudBrand === b.value}
                    onPress={() => {
                      setIudBrand(b.value);
                      // Helpful default name; user can still edit. Leave
                      // "I'm not sure" alone since the brand isn't known.
                      if (b.value !== 'unknown' && (!name || name === fallbackNameForKind(kind))) {
                        setName(`${b.label} IUD`);
                      }
                    }}
                  />
                ))}
              </View>
              {iudBrand === 'unknown' && (
                <Text className="text-ink-muted text-xs mt-2 leading-4">
                  We&apos;ll use a 5-year reminder as a safe default. You can check your insertion
                  paperwork or ask your provider for the exact brand.
                </Text>
              )}
            </View>
          )}

          <TextInput
            value={name}
            onChangeText={setName}
            placeholder="Name (optional)"
            placeholderTextColor={palette.inkDim}
            className="text-ink text-base py-3 px-4 mb-3 bg-bg-soft rounded-xl"
          />

          {/* Daily-pill time + reminder (existing behavior) */}
          {isPill && (
            <>
              <Text
                className="text-ink-muted text-base font-hand mb-2"
                style={{ transform: [{ rotate: '-1deg' }] }}
              >
                daily time (hh:mm, 24h)
              </Text>
              <TextInput
                value={time}
                onChangeText={setTime}
                placeholder="09:00"
                placeholderTextColor={palette.inkDim}
                className="text-ink text-base py-3 px-4 mb-3 bg-bg-soft rounded-xl"
                inputMode="numeric"
              />
              <Pressable
                onPress={() => setReminder((r) => !r)}
                className="flex-row items-center gap-2 mb-3 active:opacity-70"
                accessibilityRole="switch"
                accessibilityState={{ checked: reminder }}
                accessibilityLabel="Schedule a daily local reminder"
              >
                <HandIcon
                  name={reminder ? 'check-square' : 'square'}
                  size={20}
                  color={reminder ? palette.accent : palette.inkMuted}
                />
                <Text className="text-ink">Schedule a daily local reminder</Text>
              </Pressable>
            </>
          )}

          {/* Insertion / start date + replacement reminder for long-acting and
              recurring methods (IUD, implant, shot, patch, ring, diaphragm). */}
          {wantsReplacementUi && !needsBrandPick && (
            <>
              <Text
                className="text-ink-muted text-base font-hand mb-2"
                style={{ transform: [{ rotate: '-1deg' }] }}
              >
                {kind === 'shot' ? 'last shot date' : 'date inserted / started'}
              </Text>
              <TextInput
                value={insertedAt}
                onChangeText={setInsertedAt}
                placeholder="2025-04-23"
                placeholderTextColor={palette.inkDim}
                className="text-ink text-base py-3 px-4 mb-1 bg-bg-soft rounded-xl"
                inputMode="numeric"
                autoCapitalize="none"
                autoCorrect={false}
              />
              <Text className="text-ink-dim text-xs mb-3">Format: YYYY-MM-DD</Text>

              <Pressable
                onPress={() => setReplacementReminder((r) => !r)}
                className="flex-row items-center gap-2 mb-2 active:opacity-70"
                accessibilityRole="switch"
                accessibilityState={{ checked: replacementReminder }}
                accessibilityLabel="Remind me before replacement is due"
              >
                <HandIcon
                  name={replacementReminder ? 'check-square' : 'square'}
                  size={20}
                  color={replacementReminder ? palette.accent : palette.inkMuted}
                />
                <Text className="text-ink">Remind me 2 weeks before it expires</Text>
              </Pressable>

              {replacementPreview && (
                <View
                  className="rounded-xl p-3 mb-3 flex-row items-start gap-2"
                  style={{ backgroundColor: palette.bgSoft }}
                >
                  <View style={{ marginTop: 1 }}>
                    <HandIcon name="clock" size={14} color={palette.accent} />
                  </View>
                  <View className="flex-1">
                    <Text className="text-ink text-sm leading-5">
                      Lasts {replacementPreview.intervalLabel}. We&apos;ll remind you around{' '}
                      <Text className="font-bold">
                        {format(addDays(replacementPreview.dueDate, -14), 'MMM d, yyyy')}
                      </Text>
                      , two weeks before the {format(replacementPreview.dueDate, 'MMM d, yyyy')}{' '}
                      replacement date.
                    </Text>
                  </View>
                </View>
              )}
            </>
          )}

          <View className="flex-row gap-3">
            <View className="flex-1">
              <PrimaryButton
                label="Cancel"
                variant="ghost"
                onPress={() => {
                  setAdding(false);
                  resetForm();
                }}
              />
            </View>
            <View className="flex-1">
              <PrimaryButton
                label={create.isPending ? 'Saving…' : 'Save'}
                icon={<HandIcon name="save" size={16} color="white" />}
                onPress={() => create.mutate()}
                disabled={create.isPending || !canSave}
              />
            </View>
          </View>
        </Card>
      ) : (
        <PrimaryButton
          label="Add a method"
          icon={<HandIcon name="plus" size={16} color="white" />}
          onPress={() => setAdding(true)}
        />
      )}
    </Screen>
  );
}

function MedicationCard({
  id,
  name,
  kind,
  scheduleJson,
  insertedAt,
  replacementDays,
  onEnded,
}: {
  id: string;
  name: string;
  kind: string;
  scheduleJson: string | null;
  insertedAt: string | null;
  replacementDays: number | null;
  onEnded: () => void;
}) {
  const qc = useQueryClient();
  const sched = scheduleJson ? JSON.parse(scheduleJson) : null;
  const isDaily = DAILY_KINDS.has(kind);

  // Compute replacement-due display fields. Both `insertedAt` and
  // `replacementDays` are required — pre-v4 rows have neither.
  const replacement = useMemo(() => {
    if (!insertedAt || replacementDays == null) return null;
    const due = addDays(parseISO(insertedAt), replacementDays);
    const daysLeft = Math.round((due.getTime() - Date.now()) / 86400000);
    return {
      due,
      daysLeft,
      overdue: daysLeft < 0,
      // "Due soon" = within 30 days. We highlight these to match the
      // 14-day-out reminder window plus a buffer.
      soon: daysLeft >= 0 && daysLeft <= 30,
    };
  }, [insertedAt, replacementDays]);
  const { data: doses } = useQuery({
    queryKey: ['doses', id],
    queryFn: () => recentDoses(id, 7),
    enabled: isDaily,
  });

  const take = useMutation({
    mutationFn: () => recordDose({ medicationId: id, scheduledFor: new Date().toISOString() }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['doses', id] }),
  });
  const skip = useMutation({
    mutationFn: () => recordDose({ medicationId: id, scheduledFor: new Date().toISOString(), skipped: true }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['doses', id] }),
  });

  function onEnd() {
    Alert.alert('End this method?', 'It will be marked inactive. History stays in your records.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'End',
        style: 'destructive',
        onPress: async () => {
          await cancelMedicationReminders(id);
          await endMedication(id);
          onEnded();
        },
      },
    ]);
  }

  const backup = isDaily && doses ? assessBackupProtection(kind, doses) : null;

  return (
    <Card>
      <CardTitle icon={<HandIcon name="shield" size={14} color="#999" />}>
        {MEDICATION_KINDS.find((k) => k.value === kind)?.label ?? kind}
      </CardTitle>
      <Text className="text-ink text-xl font-displayBold">{name}</Text>
      {backup && <BackupProtectionBanner backup={backup} />}
      {isDaily && sched?.timeOfDay && (
        <View className="flex-row items-center gap-1.5 mt-1">
          <HandIcon name="clock" size={12} color="#999" />
          <Text className="text-ink-muted text-sm">Daily at {sched.timeOfDay}</Text>
        </View>
      )}
      {replacement && insertedAt && (
        <ReplacementBanner
          insertedAt={insertedAt}
          due={replacement.due}
          daysLeft={replacement.daysLeft}
          overdue={replacement.overdue}
          soon={replacement.soon}
        />
      )}
      {isDaily && (
        <View className="flex-row gap-2 mt-4">
          <View className="flex-1">
            <PrimaryButton
              label="Took it"
              icon={<HandIcon name="check" size={16} color="white" />}
              onPress={() => take.mutate()}
            />
          </View>
          <View className="flex-1">
            <PrimaryButton
              label="Skipped"
              variant="secondary"
              icon={<HandIcon name="x" size={16} color="#666" />}
              onPress={() => skip.mutate()}
            />
          </View>
        </View>
      )}
      {isDaily && (doses?.length ?? 0) > 0 && (
        <View className="mt-4 pt-4 border-t border-bg-soft">
          <Text
            className="text-ink-muted text-base font-hand mb-2"
            style={{ transform: [{ rotate: '1deg' }] }}
          >
            last 7
          </Text>
          <View className="flex-row flex-wrap gap-1.5">
            {(doses ?? []).map((d) => (
              <View
                key={d.id}
                className={`w-4 h-4 rounded-md ${d.skipped ? 'bg-red-500' : 'bg-accent'}`}
              />
            ))}
          </View>
          <Text className="text-ink-muted text-xs mt-2">
            Most recent {doses?.[0] ? format(parseISO(doses[0].scheduledFor), 'MMM d') : '—'}
          </Text>
        </View>
      )}
      <View className="mt-4">
        <PrimaryButton
          label="End method"
          variant="ghost"
          icon={<HandIcon name="x-circle" size={16} color="#999" />}
          onPress={onEnd}
        />
      </View>
    </Card>
  );
}

function BackupProtectionBanner({
  backup,
}: {
  backup: { untilIso: string; reason: string };
}) {
  const { palette } = useTheme();
  const until = parseISO(backup.untilIso);
  return (
    <View
      className="mt-3 rounded-2xl p-3 flex-row items-start gap-2"
      style={{
        backgroundColor: '#fef3c7',
        borderLeftWidth: 4,
        borderLeftColor: palette.accent,
      }}
    >
      <View style={{ marginTop: 1 }}>
        <HandIcon name="alert-triangle" size={16} color="#b45309" />
      </View>
      <View className="flex-1">
        <Text className="font-bold text-sm" style={{ color: '#7c2d12' }}>
          Use backup protection
        </Text>
        <Text className="text-xs mt-1 leading-4" style={{ color: '#7c2d12' }}>
          {backup.reason} Condoms or abstinence recommended through{' '}
          {format(until, 'EEE MMM d, h:mm a')}.
        </Text>
      </View>
    </View>
  );
}

/**
 * Inline summary of when this device needs replacing. Tone scales with
 * urgency: muted for "years away", amber for "within 30 days", red when
 * overdue. We never escalate beyond a banner — this is informational, not a
 * medical alarm.
 */
function ReplacementBanner({
  insertedAt,
  due,
  daysLeft,
  overdue,
  soon,
}: {
  insertedAt: string;
  due: Date;
  daysLeft: number;
  overdue: boolean;
  soon: boolean;
}) {
  const { palette } = useTheme();

  let countdown: string;
  if (overdue) {
    const n = Math.abs(daysLeft);
    countdown = n === 1 ? '1 day overdue' : `${n} days overdue`;
  } else if (daysLeft === 0) {
    countdown = 'due today';
  } else if (daysLeft < 60) {
    countdown = daysLeft === 1 ? 'due in 1 day' : `due in ${daysLeft} days`;
  } else if (daysLeft < 365) {
    const months = Math.round(daysLeft / 30);
    countdown = `due in about ${months} months`;
  } else {
    const years = Math.round((daysLeft / 365) * 10) / 10;
    countdown = `due in about ${years % 1 === 0 ? years.toFixed(0) : years} years`;
  }

  // Color tone matches state. Muted gray for the long-future case; amber for
  // soon; red for overdue.
  const toneBg = overdue ? '#fee2e2' : soon ? '#fef3c7' : palette.bgSoft;
  const toneAccent = overdue ? '#b91c1c' : soon ? '#b45309' : palette.accent;
  const toneText = overdue ? '#7f1d1d' : soon ? '#7c2d12' : palette.ink;

  return (
    <View
      className="mt-3 rounded-2xl p-3 flex-row items-start gap-2"
      style={{
        backgroundColor: toneBg,
        borderLeftWidth: 4,
        borderLeftColor: toneAccent,
      }}
    >
      <View style={{ marginTop: 1 }}>
        <HandIcon name="calendar" size={16} color={toneAccent} />
      </View>
      <View className="flex-1">
        <Text className="font-bold text-sm" style={{ color: toneText }}>
          Replacement {countdown}
        </Text>
        <Text className="text-xs mt-1 leading-4" style={{ color: toneText }}>
          Inserted {format(parseISO(insertedAt), 'MMM d, yyyy')} · Replace by{' '}
          {format(due, 'MMM d, yyyy')}.
        </Text>
      </View>
    </View>
  );
}
