import { useRouter } from 'expo-router';
import { Fragment, useEffect, useMemo, useState, type ReactNode } from 'react';
import { Alert, Pressable, Text, View } from 'react-native';
import { HandIcon, type HandIconName } from '@/ui/HandIcon';
import { type MascotReaction } from '@/ui/Mascot';
import { MascotHeader } from '@/ui/MascotHeader';
import { useStreak } from '@/hooks/useStreak';
import { useTodaysBody } from '@/hooks/useTodaysBody';
import { phaseOneLiner } from '@/education';
import { useQuery } from '@tanstack/react-query';
import { differenceInCalendarDays, format, parseISO } from 'date-fns';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { Card, CardTitle } from '@/ui/Card';
import { CycleTimeline } from '@/ui/CycleTimeline';
import { PrimaryButton } from '@/ui/PrimaryButton';
import { HideableSection } from '@/ui/HideableSection';
import { QuickLogModal } from '@/ui/QuickLogModal';
import { ReorderBar } from '@/ui/ReorderBar';
import { Screen } from '@/ui/Screen';
import { HIDEABLE_TODAY } from '@/ui/customizeSections';
import { mergeOrder, useCustomize } from '@/state/customize';
import { FLOW_LEVELS } from '@/data/constants';
import { lastCycle } from '@/data/cycles';
import { useDayLog, useUpsertDayLog } from '@/hooks/useDayLog';
import { usePrediction } from '@/hooks/usePrediction';
import { MOOD_LEVELS } from '@/ui/MoodScale';
import { useTheme } from '@/theme/useTheme';

const TODAY_CATALOG_IDS = HIDEABLE_TODAY.map((s) => s.id);

export default function TodayScreen() {
  const router = useRouter();
  const today = format(new Date(), 'yyyy-MM-dd');
  const { data: log } = useDayLog(today);
  const { data: pred } = usePrediction();
  const { data: last } = useQuery({ queryKey: ['lastCycle'], queryFn: lastCycle });
  const upsert = useUpsertDayLog(today);
  const { palette } = useTheme();

  const [pendingFlow, setPendingFlow] = useState<number | null>(null);
  const [pendingMood, setPendingMood] = useState<number | null>(null);
  useEffect(() => {
    setPendingFlow(log?.flow ?? null);
    setPendingMood(log?.mood ?? null);
  }, [log?.flow, log?.mood]);
  const dirty =
    pendingFlow !== (log?.flow ?? null) || pendingMood !== (log?.mood ?? null);

  const cycleProgress = useMemo(() => {
    if (!last) return null;
    const start = parseISO(last.startDate);
    const dayNum = differenceInCalendarDays(new Date(), start) + 1;
    const avg = pred?.prediction?.cycleLengthMean
      ? Math.round(pred.prediction.cycleLengthMean)
      : 28;
    return { dayNum: Math.max(1, dayNum), avg, startDate: last.startDate };
  }, [last, pred]);

  const nextPeriod = useMemo(() => {
    if (!pred?.prediction) return null;
    const next = parseISO(pred.prediction.nextPeriodStart);
    const days = differenceInCalendarDays(next, new Date());
    return {
      next,
      days,
      confidence: pred.prediction.confidenceDays,
      sampleSize: pred.prediction.sampleSize,
    };
  }, [pred]);

  const fertile = useMemo(() => {
    if (!pred?.fertile) return null;
    const start = parseISO(pred.fertile.windowStart);
    const end = parseISO(pred.fertile.windowEnd);
    const ov = parseISO(pred.fertile.ovulation);
    const today = new Date();
    const daysToOv = differenceInCalendarDays(ov, today);
    const inWindow = today >= start && today <= end;
    return { start, end, ov, daysToOv, inWindow };
  }, [pred]);

  const showPmsBanner = nextPeriod != null && nextPeriod.days >= 1 && nextPeriod.days <= 5;

  const { data: streak } = useStreak();
  const todaysBody = useTodaysBody();

  const mascotCtx = useMemo(
    () => ({
      screen: 'today' as const,
      fertile: fertile ? { inWindow: fertile.inWindow, daysToOv: fertile.daysToOv } : null,
      cycleDay: cycleProgress?.dayNum ?? null,
      daysToPeriod: nextPeriod?.days ?? null,
      streak: streak ?? null,
    }),
    [fertile, cycleProgress, nextPeriod, streak],
  );

  const [logReaction, setLogReaction] = useState<{ key: number; reaction: MascotReaction } | null>(
    null,
  );
  const reactToLog = (reaction: MascotReaction) => {
    setLogReaction({ key: Date.now(), reaction });
  };

  const [quickLogOpen, setQuickLogOpen] = useState(false);

  const todayStats = useMemo(() => {
    const flowLabel =
      log?.flow != null
        ? (FLOW_LEVELS.find((f) => f.value === log.flow)?.label ?? null)
        : null;
    const moodLabel =
      log?.mood != null ? (MOOD_LEVELS[log.mood - 1]?.label ?? null) : null;
    const symptomCount = log?.symptoms.length ?? 0;
    return { flowLabel, moodLabel, symptomCount };
  }, [log]);

  const todayOrder = useCustomize((s) => s.todayOrder);
  const orderedIds = useMemo(
    () => mergeOrder(todayOrder, TODAY_CATALOG_IDS),
    [todayOrder],
  );

  const sections: Record<string, () => ReactNode> = {
    'next-period': () =>
      nextPeriod ? (
        <HideableSection screen="today" id="next-period" label="Next period line">
          <View className="flex-row items-center gap-1.5">
            <HandIcon name="droplet" size={13} color={palette.accent} />
            <Text className="text-ink-muted text-sm">
              {nextPeriod.days < 0
                ? `Period ${Math.abs(nextPeriod.days)} day${Math.abs(nextPeriod.days) === 1 ? '' : 's'} late`
                : nextPeriod.days === 0
                  ? 'Period expected today'
                  : `Period in ${nextPeriod.days} day${nextPeriod.days === 1 ? '' : 's'}`}
            </Text>
          </View>
        </HideableSection>
      ) : null,
    'pms-banner': () =>
      showPmsBanner ? (
        <HideableSection screen="today" id="pms-banner" label="Pre-period heads-up">
          <Animated.View entering={FadeInDown.duration(360)}>
            <Card tone="soft" className="border-l-4 border-l-accent">
              <View className="flex-row items-center gap-2 mb-1">
                <HandIcon name="alert-circle" size={16} color={palette.accent} />
                <Text className="text-ink font-bold">
                  Heads up — period in {nextPeriod!.days} day{nextPeriod!.days === 1 ? '' : 's'}
                </Text>
              </View>
              <Text className="text-ink-muted text-sm leading-5">
                Pre-period symptoms (cramps, mood shifts, breast tenderness) often start now.
              </Text>
            </Card>
          </Animated.View>
        </HideableSection>
      ) : null,
    'cycle-progress': () =>
      cycleProgress ? (
        <HideableSection screen="today" id="cycle-progress" label="Cycle progress card">
          <Animated.View entering={FadeInDown.duration(360)}>
            <Card>
              <View className="flex-row items-end justify-between mb-4 gap-3">
                <View className="flex-1">
                  <Text
                    className="text-ink-muted text-base font-hand"
                    style={{ transform: [{ rotate: '-1deg' }] }}
                  >
                    where you&apos;re at
                  </Text>
                  <View className="flex-row items-baseline gap-2 mt-1 flex-wrap">
                    <Text
                      className="text-accent text-5xl font-handBold"
                      style={{ lineHeight: 60, paddingRight: 4 }}
                      numberOfLines={1}
                    >
                      day {cycleProgress.dayNum}
                    </Text>
                    <Text className="text-ink-dim text-sm">of ~{cycleProgress.avg}</Text>
                  </View>
                  <Text className="text-ink-dim text-xs mt-0.5">
                    started {format(parseISO(cycleProgress.startDate), 'MMM d')}
                  </Text>
                </View>
                {nextPeriod && (
                  <View className="items-end">
                    <Text
                      className="text-ink-dim text-sm font-hand"
                      style={{ transform: [{ rotate: '2deg' }] }}
                    >
                      next period
                    </Text>
                    <Text
                      className="text-accent text-2xl font-handBold"
                      style={{ lineHeight: 30, paddingHorizontal: 2 }}
                      numberOfLines={1}
                    >
                      {nextPeriod.days <= 0 ? 'today!' : `in ${nextPeriod.days}d`}
                    </Text>
                    <Text className="text-ink-dim text-xs">
                      {format(nextPeriod.next, 'MMM d')}
                      {nextPeriod.sampleSize > 0 ? ` ±${nextPeriod.confidence}d` : ''}
                    </Text>
                  </View>
                )}
              </View>
              <CycleTimeline
                cycleStart={cycleProgress.startDate}
                cycleLength={cycleProgress.avg}
                fertileStart={pred?.fertile?.windowStart}
                fertileEnd={pred?.fertile?.windowEnd}
                ovulation={pred?.fertile?.ovulation}
              />
              {todaysBody && (
                <View className="mt-4 pt-4 border-t border-bg-soft">
                  <View className="flex-row items-center gap-2 mb-1">
                    <View
                      className="px-2 py-0.5 rounded-full"
                      style={{ backgroundColor: palette.accent + '22' }}
                    >
                      <Text className="text-accent text-[10px] font-bold uppercase tracking-wider">
                        {todaysBody.phaseName} phase
                      </Text>
                    </View>
                  </View>
                  <Text className="text-ink-muted text-sm leading-5">
                    {phaseOneLiner(todaysBody.phase)}
                  </Text>
                  <Pressable
                    onPress={() => router.push('/learn')}
                    className="flex-row items-center gap-1 mt-2 active:opacity-70"
                  >
                    <Text className="text-accent text-xs font-bold">Learn more</Text>
                    <HandIcon name="chevron-right" size={12} color={palette.accent} />
                  </Pressable>
                </View>
              )}
              {fertile && (
                <View className="mt-4 pt-4 border-t border-bg-soft gap-1.5">
                  <View className="flex-row items-center gap-2">
                    <HandIcon
                      name={fertile.inWindow ? 'star' : 'clock'}
                      size={14}
                      color={palette.fertile}
                    />
                    <Text className="text-ink-muted text-sm">
                      {fertile.inWindow
                        ? `Fertile window — ${format(fertile.start, 'MMM d')} to ${format(fertile.end, 'MMM d')}`
                        : fertile.daysToOv > 0
                          ? `Ovulation in ${fertile.daysToOv} days · ${format(fertile.ov, 'MMM d')}`
                          : `Ovulation was ${Math.abs(fertile.daysToOv)} days ago · ${format(fertile.ov, 'MMM d')}`}
                    </Text>
                  </View>
                  {!fertile.inWindow && fertile.daysToOv > 0 && (
                    <View className="flex-row items-center gap-2 pl-6">
                      <Text className="text-ink-dim text-xs">
                        fertile window {format(fertile.start, 'MMM d')} – {format(fertile.end, 'MMM d')}
                      </Text>
                    </View>
                  )}
                </View>
              )}
            </Card>
          </Animated.View>
        </HideableSection>
      ) : (
        // Non-hideable empty-state that occupies the cycle-progress slot when
        // there's no cycle data yet. Renders in the same ordered position so
        // reordering stays consistent across first-run vs. populated state.
        <Animated.View entering={FadeInDown.duration(360)}>
          <Card>
            <View className="items-center py-4">
              <View className="w-12 h-12 rounded-full bg-bg-soft items-center justify-center mb-2">
                <HandIcon name="calendar" size={20} color={palette.inkMuted} />
              </View>
              <Text className="text-ink font-medium">Log a period to start tracking</Text>
              <Text className="text-ink-muted text-sm mt-1 text-center">
                We&apos;ll predict your cycle once we have your first period.
              </Text>
            </View>
          </Card>
        </Animated.View>
      ),
    'today-so-far': () => (
      <HideableSection screen="today" id="today-so-far" label="Today so far">
        <Animated.View entering={FadeInDown.duration(360)}>
          <Card>
            <CardTitle icon={<HandIcon name="check-circle" size={14} color={palette.inkMuted} />}>
              today so far
            </CardTitle>
            <View className="flex-row gap-3">
              <Stat label="Flow" value={todayStats.flowLabel} icon="droplet" />
              <Stat label="Mood" value={todayStats.moodLabel} icon="smile" />
              <Stat
                label="Symptoms"
                value={todayStats.symptomCount > 0 ? String(todayStats.symptomCount) : null}
                icon="activity"
              />
            </View>
          </Card>
        </Animated.View>
      </HideableSection>
    ),
    'birth-control-button': () => (
      <HideableSection screen="today" id="birth-control-button" label="Birth control shortcut">
        <Animated.View entering={FadeInDown.duration(360)}>
          <PrimaryButton
            label="Birth control"
            variant="secondary"
            icon={<HandIcon name="shield" size={16} color={palette.ink} />}
            onPress={() => router.push('/birth-control')}
          />
        </Animated.View>
      </HideableSection>
    ),
  };

  return (
    <Screen>
      <MascotHeader
        title={format(new Date(), 'EEEE, MMM d')}
        kicker="today is"
        context={mascotCtx}
        forcedReaction={logReaction ?? undefined}
      />

      <QuickLogButton
        flowLabel={todayStats.flowLabel}
        moodLabel={todayStats.moodLabel}
        dirty={dirty}
        onPress={() => setQuickLogOpen(true)}
      />

      <QuickLogModal
        visible={quickLogOpen}
        onClose={() => setQuickLogOpen(false)}
        flow={pendingFlow}
        mood={pendingMood}
        onFlowChange={(next) => {
          setPendingFlow(next);
          if (next != null) reactToLog(next >= 3 ? 'shocked' : 'wiggle');
        }}
        onMoodChange={(m) => {
          setPendingMood(m);
          if (m != null) {
            const r: MascotReaction =
              m >= 4 ? 'celebrate' : m === 3 ? 'wink' : m === 2 ? 'tongue' : 'annoyed';
            reactToLog(r);
          }
        }}
        onSave={() =>
          upsert.mutate(
            { flow: pendingFlow, mood: pendingMood },
            {
              onSuccess: () => {
                reactToLog('celebrate');
                setQuickLogOpen(false);
              },
              onError: (e) =>
                Alert.alert('Save failed', String((e as Error)?.message ?? e)),
            },
          )
        }
        dirty={dirty}
        saving={upsert.isPending}
      />

      <ReorderBar screen="today" />

      {orderedIds.map((id) => (
        <Fragment key={id}>{sections[id]?.()}</Fragment>
      ))}

      <Animated.View entering={FadeInDown.duration(360)}>
        <PrimaryButton
          label="Open full day log"
          icon={<HandIcon name="book-open" size={16} color="white" />}
          onPress={() => router.push(`/log/${today}`)}
        />
      </Animated.View>
    </Screen>
  );
}

function Stat({
  label,
  value,
  icon,
}: {
  label: string;
  value: string | null;
  icon: HandIconName;
}) {
  const { palette } = useTheme();
  return (
    <View className="flex-1 bg-bg-soft rounded-2xl p-3">
      <View className="flex-row items-center gap-1.5 mb-1">
        <HandIcon name={icon} size={12} color={palette.inkDim} />
        <Text
          className="text-ink-dim text-sm font-hand"
          style={{ transform: [{ rotate: '-1deg' }] }}
        >
          {label.toLowerCase()}
        </Text>
      </View>
      <Text
        className={`text-base font-medium mt-0.5 ${value ? 'text-ink' : 'text-ink-dim'}`}
        numberOfLines={1}
      >
        {value ?? '—'}
      </Text>
    </View>
  );
}

function QuickLogButton({
  flowLabel,
  moodLabel,
  dirty,
  onPress,
}: {
  flowLabel: string | null;
  moodLabel: string | null;
  dirty: boolean;
  onPress: () => void;
}) {
  const { palette, isDark } = useTheme();
  const subtitle =
    !flowLabel && !moodLabel
      ? 'Tap to log flow & mood'
      : `${flowLabel ?? 'flow —'} · ${moodLabel ? moodLabel.toLowerCase() : 'mood —'}`;
  return (
    <Pressable
      onPress={onPress}
      className="rounded-3xl px-4 py-3 flex-row items-center gap-3 active:opacity-80"
      style={{
        backgroundColor: palette.bgCard,
        borderWidth: 1.5,
        borderColor: isDark ? palette.bgSoft : palette.ink + '22',
        shadowColor: isDark ? '#000' : palette.ink,
        shadowOpacity: isDark ? 0.45 : 0.6,
        shadowRadius: isDark ? 8 : 0,
        shadowOffset: { width: 2, height: 3 },
        elevation: 3,
      }}
    >
      <View
        className="items-center justify-center rounded-2xl"
        style={{
          width: 40,
          height: 40,
          backgroundColor: palette.accent + '1e',
        }}
      >
        <HandIcon name="edit-3" size={18} color={palette.accent} />
      </View>
      <View className="flex-1">
        <Text
          className="text-ink-muted text-xs font-hand"
          style={{ transform: [{ rotate: '-0.5deg' }] }}
        >
          quick log
        </Text>
        <Text className="text-ink text-sm font-medium" numberOfLines={1}>
          {subtitle}
        </Text>
      </View>
      {dirty && (
        <View
          style={{
            width: 8,
            height: 8,
            borderRadius: 4,
            backgroundColor: palette.accent,
          }}
        />
      )}
      <HandIcon name="chevron-right" size={16} color={palette.inkMuted} />
    </Pressable>
  );
}
