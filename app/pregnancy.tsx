import { useEffect, useRef, useState } from 'react';
import { Alert, Pressable, Text, TextInput, View } from 'react-native';
import { format, parseISO } from 'date-fns';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { Card, CardTitle } from '@/ui/Card';
import { HandIcon } from '@/ui/HandIcon';
import { PrimaryButton } from '@/ui/PrimaryButton';
import { Screen } from '@/ui/Screen';
import {
  activePregnancy,
  addKickCount,
  endContraction,
  endPregnancy,
  recentContractions,
  recentKickCounts,
  startContraction,
  startPregnancy,
  updatePregnancyDueDate,
} from '@/data/pregnancy';
import {
  contractionStats,
  currentMilestone,
  estimatedDueFromLmp,
  nextMilestone,
  pregnancyProgress,
} from '@/predictions/pregnancy';
import { useTheme } from '@/theme/useTheme';

export default function PregnancyScreen() {
  const { data: preg } = useQuery({ queryKey: ['pregnancy'], queryFn: activePregnancy });

  return (
    <Screen topInset={false} modalHandle>
      <View>
        <Text
          className="text-ink-muted text-sm font-hand"
          style={{ transform: [{ rotate: '-1deg' }] }}
        >
          growing a human
        </Text>
        <Text className="text-ink text-4xl font-display mt-0.5">Pregnancy</Text>
      </View>
      {preg ? <ActivePregnancy preg={preg} /> : <StartPregnancy />}
    </Screen>
  );
}

function StartPregnancy() {
  const { palette } = useTheme();
  const qc = useQueryClient();
  const [lmp, setLmp] = useState('');
  const [busy, setBusy] = useState(false);

  const isoPattern = /^\d{4}-\d{2}-\d{2}$/;
  const valid = isoPattern.test(lmp);
  const estDue = valid ? estimatedDueFromLmp(lmp) : null;

  async function onStart() {
    if (!valid) return;
    setBusy(true);
    try {
      await startPregnancy(lmp);
      qc.invalidateQueries({ queryKey: ['pregnancy'] });
    } catch (e: any) {
      Alert.alert('Could not start', String(e?.message ?? e));
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <Animated.View entering={FadeInDown.duration(300)}>
        <Card>
          <Text className="text-ink-muted leading-5 mb-3">
            Pregnancy tracking uses your last menstrual period (LMP). Standard Naegele estimate =
            LMP + 280 days.
          </Text>
          <CardTitle icon={<HandIcon name="calendar" size={14} color={palette.inkMuted} />}>
            First day of last period
          </CardTitle>
          <TextInput
            value={lmp}
            onChangeText={setLmp}
            placeholder="YYYY-MM-DD"
            placeholderTextColor={palette.inkDim}
            autoCapitalize="none"
            autoCorrect={false}
            className="bg-bg-soft rounded-2xl px-3 py-2 text-ink text-lg"
          />
          {estDue && (
            <Text className="text-ink-muted text-sm mt-3">
              Estimated due date: <Text className="text-accent font-bold">{format(parseISO(estDue), 'EEEE, MMM d, yyyy')}</Text>
            </Text>
          )}
        </Card>
      </Animated.View>
      <PrimaryButton
        label={busy ? 'Starting…' : 'Start pregnancy tracking'}
        icon={<HandIcon name="heart" size={16} color="white" />}
        onPress={onStart}
        disabled={!valid || busy}
      />
    </>
  );
}

function ActivePregnancy({
  preg,
}: {
  preg: { id: string; lmpDate: string; dueDate: string; notes: string | null };
}) {
  const { palette } = useTheme();
  const qc = useQueryClient();
  const progress = pregnancyProgress(preg.lmpDate, preg.dueDate);
  const current = currentMilestone(progress.weeks);
  const next = nextMilestone(progress.weeks);

  const [editingDue, setEditingDue] = useState(false);
  const [newDue, setNewDue] = useState(preg.dueDate);

  const { data: kicks } = useQuery({
    queryKey: ['kickCounts', preg.id],
    queryFn: () => recentKickCounts(preg.id, 10),
  });
  const { data: contractions } = useQuery({
    queryKey: ['contractions', preg.id],
    queryFn: () => recentContractions(preg.id, 30),
    refetchInterval: 2000,
  });
  const cStats = contractionStats(contractions ?? []);

  async function saveDue() {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(newDue)) return;
    await updatePregnancyDueDate(preg.id, newDue);
    setEditingDue(false);
    qc.invalidateQueries({ queryKey: ['pregnancy'] });
  }

  function confirmEnd() {
    Alert.alert('End pregnancy tracking?', 'You can pick an outcome and keep all logged data.', [
      { text: 'Cancel', style: 'cancel' },
      ...(['birth', 'loss', 'other'] as const).map((o) => ({
        text: o === 'birth' ? 'Birth' : o === 'loss' ? 'Loss' : 'Other',
        onPress: async () => {
          await endPregnancy(preg.id, o);
          qc.invalidateQueries({ queryKey: ['pregnancy'] });
        },
      })),
    ]);
  }

  return (
    <>
      <Animated.View entering={FadeInDown.delay(40).duration(300)}>
        <Card>
          <View className="flex-row items-end gap-2 mb-1">
            <Text className="text-accent text-6xl font-handBold" style={{ lineHeight: 68 }}>
              {progress.weeks}
            </Text>
            <View className="mb-2">
              <Text className="text-ink-muted text-base">
                week{progress.weeks === 1 ? '' : 's'} + {progress.days} day
                {progress.days === 1 ? '' : 's'}
              </Text>
              <Text
                className="text-ink-dim text-xs font-hand"
                style={{ transform: [{ rotate: '-1deg' }] }}
              >
                trimester {progress.trimester}
              </Text>
            </View>
          </View>
          <View className="mt-3 h-2 bg-bg-soft rounded-full overflow-hidden">
            <View
              style={{
                width: `${progress.percent}%`,
                height: '100%',
                backgroundColor: palette.accent,
              }}
            />
          </View>
          <View className="flex-row justify-between mt-2">
            <Text className="text-ink-dim text-xs">{progress.percent.toFixed(0)}% there</Text>
            <Text className="text-ink-dim text-xs">
              {progress.daysToDue > 0
                ? `${progress.daysToDue} day${progress.daysToDue === 1 ? '' : 's'} to due`
                : `${Math.abs(progress.daysToDue)} day${Math.abs(progress.daysToDue) === 1 ? '' : 's'} past due`}
            </Text>
          </View>
        </Card>
      </Animated.View>

      <Animated.View entering={FadeInDown.delay(80).duration(300)}>
        <Card>
          <CardTitle icon={<HandIcon name="star" size={14} color={palette.inkMuted} />}>
            Milestones
          </CardTitle>
          {current && (
            <View className="bg-bg-soft rounded-2xl p-3 mb-2">
              <Text className="text-ink-dim text-xs">week {current.week}</Text>
              <Text className="text-ink text-sm leading-5 mt-0.5">{current.note}</Text>
            </View>
          )}
          {next && (
            <View className="flex-row items-start gap-2">
              <HandIcon name="arrow-right" size={13} color={palette.inkMuted} />
              <View className="flex-1">
                <Text className="text-ink-dim text-xs">next · week {next.week}</Text>
                <Text className="text-ink-muted text-sm leading-5">{next.note}</Text>
              </View>
            </View>
          )}
        </Card>
      </Animated.View>

      <Animated.View entering={FadeInDown.delay(120).duration(300)}>
        <KickCounterCard
          pregnancyId={preg.id}
          kicks={kicks ?? []}
          onSaved={() => qc.invalidateQueries({ queryKey: ['kickCounts', preg.id] })}
        />
      </Animated.View>

      <Animated.View entering={FadeInDown.delay(160).duration(300)}>
        <ContractionCard
          pregnancyId={preg.id}
          contractions={contractions ?? []}
          stats={cStats}
          onChanged={() => qc.invalidateQueries({ queryKey: ['contractions', preg.id] })}
        />
      </Animated.View>

      <Animated.View entering={FadeInDown.delay(200).duration(300)}>
        <Card>
          <CardTitle icon={<HandIcon name="calendar" size={14} color={palette.inkMuted} />}>
            Due date
          </CardTitle>
          {editingDue ? (
            <View className="gap-2">
              <TextInput
                value={newDue}
                onChangeText={setNewDue}
                placeholder="YYYY-MM-DD"
                placeholderTextColor={palette.inkDim}
                autoCapitalize="none"
                className="bg-bg-soft rounded-2xl px-3 py-2 text-ink text-base"
              />
              <View className="flex-row gap-2">
                <PrimaryButton label="Save" onPress={saveDue} />
                <PrimaryButton
                  label="Cancel"
                  variant="secondary"
                  onPress={() => {
                    setEditingDue(false);
                    setNewDue(preg.dueDate);
                  }}
                />
              </View>
            </View>
          ) : (
            <Pressable onPress={() => setEditingDue(true)}>
              <Text className="text-accent text-xl font-handBold">
                {format(parseISO(preg.dueDate), 'EEEE, MMM d, yyyy')}
              </Text>
              <Text className="text-ink-dim text-xs mt-1">tap to adjust</Text>
            </Pressable>
          )}
        </Card>
      </Animated.View>

      <Animated.View entering={FadeInDown.delay(240).duration(300)}>
        <PrimaryButton
          label="End pregnancy tracking"
          variant="secondary"
          icon={<HandIcon name="x-circle" size={16} color={palette.ink} />}
          onPress={confirmEnd}
        />
      </Animated.View>
    </>
  );
}

function KickCounterCard({
  pregnancyId,
  kicks,
  onSaved,
}: {
  pregnancyId: string;
  kicks: { id: string; startedAt: string; count: number; durationSeconds: number }[];
  onSaved: () => void;
}) {
  const { palette } = useTheme();
  const [active, setActive] = useState(false);
  const [count, setCount] = useState(0);
  const [startedAt, setStartedAt] = useState<number | null>(null);
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    if (!active || !startedAt) return;
    const t = setInterval(() => {
      setElapsed(Math.floor((Date.now() - startedAt) / 1000));
    }, 500);
    return () => clearInterval(t);
  }, [active, startedAt]);

  function start() {
    setActive(true);
    setCount(0);
    setStartedAt(Date.now());
    setElapsed(0);
  }

  function tap() {
    if (!active) return;
    setCount((c) => c + 1);
  }

  async function stop() {
    if (!startedAt) return;
    if (count > 0) {
      await addKickCount(pregnancyId, count, Math.floor((Date.now() - startedAt) / 1000));
      onSaved();
    }
    setActive(false);
    setStartedAt(null);
    setCount(0);
    setElapsed(0);
  }

  return (
    <Card>
      <CardTitle icon={<HandIcon name="heart" size={14} color={palette.inkMuted} />}>
        Kick counter
      </CardTitle>
      {active ? (
        <View>
          <Pressable
            onPress={tap}
            className="bg-accent rounded-3xl items-center justify-center py-10 active:opacity-80"
            style={{
              borderWidth: 2,
              borderColor: palette.ink,
              shadowColor: palette.ink,
              shadowOpacity: 0.9,
              shadowRadius: 0,
              shadowOffset: { width: 3, height: 4 },
            }}
          >
            <Text className="text-white text-6xl font-handBold">{count}</Text>
            <Text className="text-white text-sm opacity-80 mt-1">tap for each kick</Text>
          </Pressable>
          <Text className="text-ink-muted text-sm mt-3 text-center">
            {Math.floor(elapsed / 60)}:{String(elapsed % 60).padStart(2, '0')} elapsed
          </Text>
          <View className="mt-3">
            <PrimaryButton
              label="Finish session"
              variant="secondary"
              icon={<HandIcon name="check" size={14} color={palette.ink} />}
              onPress={stop}
            />
          </View>
        </View>
      ) : (
        <>
          <PrimaryButton
            label="Start a kick session"
            icon={<HandIcon name="plus-circle" size={14} color="white" />}
            onPress={start}
          />
          {kicks.length > 0 && (
            <View className="mt-4 gap-1.5">
              <Text className="text-ink-dim text-xs">recent</Text>
              {kicks.slice(0, 5).map((k) => (
                <View key={k.id} className="flex-row items-center justify-between">
                  <Text className="text-ink-muted text-xs">
                    {format(parseISO(k.startedAt), 'MMM d, h:mm a')}
                  </Text>
                  <Text className="text-ink text-sm">
                    <Text className="font-bold">{k.count}</Text> in{' '}
                    {Math.round(k.durationSeconds / 60)}m
                  </Text>
                </View>
              ))}
            </View>
          )}
        </>
      )}
    </Card>
  );
}

function ContractionCard({
  pregnancyId,
  contractions,
  stats,
  onChanged,
}: {
  pregnancyId: string;
  contractions: { id: string; startedAt: string; endedAt: string | null }[];
  stats: ReturnType<typeof contractionStats>;
  onChanged: () => void;
}) {
  const { palette } = useTheme();
  const active = contractions.find((c) => c.endedAt == null) ?? null;
  const tick = useRef(0);
  const [, setRerender] = useState(0);

  useEffect(() => {
    if (!active) return;
    const t = setInterval(() => {
      tick.current += 1;
      setRerender((n) => n + 1);
    }, 500);
    return () => clearInterval(t);
  }, [active?.id]);

  async function onStart() {
    await startContraction(pregnancyId);
    onChanged();
  }

  async function onEnd() {
    if (!active) return;
    await endContraction(active.id);
    onChanged();
  }

  const activeElapsed = active
    ? Math.floor((Date.now() - new Date(active.startedAt).getTime()) / 1000)
    : 0;

  function fmt(secs: number | null): string {
    if (secs == null) return '—';
    const m = Math.floor(secs / 60);
    const s = Math.round(secs % 60);
    return `${m}:${String(s).padStart(2, '0')}`;
  }

  return (
    <Card>
      <CardTitle icon={<HandIcon name="clock" size={14} color={palette.inkMuted} />}>
        Contraction timer
      </CardTitle>
      {active ? (
        <View className="items-center py-4">
          <Text className="text-accent text-6xl font-handBold">{fmt(activeElapsed)}</Text>
          <Text className="text-ink-muted text-sm mt-1">contraction in progress</Text>
          <View className="w-full mt-4">
            <PrimaryButton
              label="End contraction"
              variant="danger"
              icon={<HandIcon name="x" size={14} color="white" />}
              onPress={onEnd}
            />
          </View>
        </View>
      ) : (
        <PrimaryButton
          label="Start contraction"
          icon={<HandIcon name="plus-circle" size={14} color="white" />}
          onPress={onStart}
        />
      )}

      {stats.count > 0 && (
        <View className="mt-4 gap-1.5">
          <View className="flex-row gap-2">
            <StatBlock label="avg gap" value={fmt(stats.avgIntervalSeconds)} />
            <StatBlock label="avg length" value={fmt(stats.avgDurationSeconds)} />
          </View>
          <Text className="text-ink-dim text-xs mt-2">recent (last 6)</Text>
          <View className="gap-1">
            {contractions
              .slice(-6)
              .reverse()
              .map((c, i, arr) => {
                const duration = c.endedAt
                  ? (new Date(c.endedAt).getTime() - new Date(c.startedAt).getTime()) / 1000
                  : null;
                const priorStart = arr[i + 1]?.startedAt;
                const gap = priorStart
                  ? (new Date(c.startedAt).getTime() - new Date(priorStart).getTime()) / 1000
                  : null;
                return (
                  <View key={c.id} className="flex-row justify-between">
                    <Text className="text-ink-muted text-xs">
                      {format(parseISO(c.startedAt), 'h:mm:ss a')}
                    </Text>
                    <Text className="text-ink text-xs">
                      {duration != null ? fmt(duration) : 'running'}
                      {gap ? `  · +${fmt(gap)}` : ''}
                    </Text>
                  </View>
                );
              })}
          </View>
        </View>
      )}
    </Card>
  );
}

function StatBlock({ label, value }: { label: string; value: string }) {
  return (
    <View className="flex-1 bg-bg-soft rounded-2xl p-3">
      <Text className="text-ink-dim text-xs">{label}</Text>
      <Text className="text-ink text-xl font-handBold mt-0.5">{value}</Text>
    </View>
  );
}
