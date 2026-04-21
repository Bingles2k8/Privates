import { useState } from 'react';
import { Alert, Pressable, Text, TextInput, View } from 'react-native';
import { HandIcon } from '@/ui/HandIcon';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { format, parseISO } from 'date-fns';
import { Card, CardTitle } from '@/ui/Card';
import { PrimaryButton } from '@/ui/PrimaryButton';
import { Screen } from '@/ui/Screen';
import { MEDICATION_KINDS } from '@/data/constants';
import {
  createMedication,
  endMedication,
  listActiveMedications,
  recentDoses,
  recordDose,
} from '@/data/medications';
import { Chip } from '@/ui/Chip';
import { cancelMedicationReminders, ensurePermissions, scheduleDailyReminder } from '@/services/reminders';
import { assessBackupProtection } from '@/services/backupProtection';
import { useTheme } from '@/theme/useTheme';

const DAILY_KINDS = new Set(['pill_combined', 'pill_progestin']);

export default function BirthControlScreen() {
  const qc = useQueryClient();
  const { data: meds } = useQuery({ queryKey: ['meds'], queryFn: listActiveMedications });
  const [adding, setAdding] = useState(false);
  const [name, setName] = useState('');
  const [kind, setKind] = useState<string>('pill_combined');
  const [time, setTime] = useState('09:00');
  const [reminder, setReminder] = useState(true);

  const { palette } = useTheme();

  const create = useMutation({
    mutationFn: async () => {
      const [hh, mm] = time.split(':').map((n) => parseInt(n, 10));
      const id = await createMedication({
        name: name || MEDICATION_KINDS.find((k) => k.value === kind)?.label || 'Birth control',
        kind,
        schedule: { timeOfDay: time, daysOfWeek: [0, 1, 2, 3, 4, 5, 6], reminderEnabled: reminder },
      });
      if (reminder && Number.isFinite(hh) && Number.isFinite(mm)) {
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
      return id;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['meds'] });
      setAdding(false);
      setName('');
    },
  });

  return (
    <Screen topInset={false}>
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
                onPress={() => setKind(k.value)}
              />
            ))}
          </View>
          <TextInput
            value={name}
            onChangeText={setName}
            placeholder="Name (optional)"
            placeholderTextColor={palette.inkDim}
            className="text-ink text-base py-3 px-4 mb-3 bg-bg-soft rounded-xl"
          />
          {(kind === 'pill_combined' || kind === 'pill_progestin') && (
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
          <View className="flex-row gap-3">
            <View className="flex-1">
              <PrimaryButton label="Cancel" variant="ghost" onPress={() => setAdding(false)} />
            </View>
            <View className="flex-1">
              <PrimaryButton
                label={create.isPending ? 'Saving…' : 'Save'}
                icon={<HandIcon name="save" size={16} color="white" />}
                onPress={() => create.mutate()}
                disabled={create.isPending}
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
  onEnded,
}: {
  id: string;
  name: string;
  kind: string;
  scheduleJson: string | null;
  onEnded: () => void;
}) {
  const qc = useQueryClient();
  const sched = scheduleJson ? JSON.parse(scheduleJson) : null;
  const isDaily = DAILY_KINDS.has(kind);
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
