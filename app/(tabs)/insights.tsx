import { Fragment, useMemo, type ReactNode } from 'react';
import { Pressable, Text, View, useWindowDimensions } from 'react-native';
import { HandIcon } from '@/ui/HandIcon';
import { useQuery } from '@tanstack/react-query';
import {
  CartesianChart,
  Line,
  Scatter,
  useChartTransformState,
} from 'victory-native';
import { Line as SkiaLine, vec } from '@shopify/react-native-skia';
import { format, parseISO, subDays } from 'date-fns';
import { useRouter } from 'expo-router';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { Card, CardTitle } from '@/ui/Card';
import { HideableSection } from '@/ui/HideableSection';
import { MascotHeader } from '@/ui/MascotHeader';
import { ReorderBar } from '@/ui/ReorderBar';
import { Screen } from '@/ui/Screen';
import { HIDEABLE_INSIGHTS } from '@/ui/customizeSections';
import { mergeOrder, useCustomize } from '@/state/customize';
import {
  listDayLogsBetween,
  listRecentBbt,
  listRecentMoods,
  listSymptomsInRange,
} from '@/data/dayLogs';
import { listCycles } from '@/data/cycles';
import { cycleLengths } from '@/predictions/cycle';
import {
  bbtCoverLine,
  cycleRegularity,
  periodLengths,
  predictionAccuracy,
  symptomsByPhase,
} from '@/predictions/insights';
import { useStreak } from '@/hooks/useStreak';
import { useTodaysBody } from '@/hooks/useTodaysBody';
import { useTheme } from '@/theme/useTheme';

const SYMPTOM_LABELS: Record<string, string> = {
  cramps: 'cramps',
  headache: 'headache',
  migraine: 'migraine',
  bloating: 'bloating',
  nausea: 'nausea',
  fatigue: 'fatigue',
  acne: 'acne',
  breast_tenderness: 'breast tender',
  back_pain: 'back pain',
  joint_pain: 'joint pain',
  cravings: 'cravings',
  insomnia: 'insomnia',
  dizziness: 'dizziness',
  constipation: 'constipation',
  diarrhea: 'diarrhea',
  gas: 'gas',
  spotting: 'spotting',
  discharge: 'discharge',
  tender_skin: 'tender skin',
  hot_flashes: 'hot flashes',
  cold_sweats: 'cold sweats',
  low_libido: 'low libido',
  high_libido: 'high libido',
  appetite_loss: 'low appetite',
  increased_appetite: 'hungry',
  sore_throat: 'sore throat',
  congestion: 'congested',
  swelling: 'swelling',
  cervical_pain: 'cervical pain',
  ovulation_pain: 'ov pain',
};

export default function InsightsScreen() {
  const { width } = useWindowDimensions();
  const { palette } = useTheme();
  const router = useRouter();
  const { data: bbt } = useQuery({ queryKey: ['bbtSeries'], queryFn: () => listRecentBbt(60) });
  const { data: moods } = useQuery({
    queryKey: ['moodSeries'],
    queryFn: () => listRecentMoods(180),
  });
  const { data: cycles } = useQuery({ queryKey: ['cycles'], queryFn: listCycles });
  const moodTransform = useChartTransformState({ scaleX: 1, scaleY: 1 });

  const today = useMemo(() => new Date(), []);
  const yearStart = useMemo(() => {
    return subDays(today, 364);
  }, [today]);

  const { data: yearLogs } = useQuery({
    queryKey: ['yearLogs', format(yearStart, 'yyyy-MM-dd')],
    queryFn: () =>
      listDayLogsBetween(format(yearStart, 'yyyy-MM-dd'), format(today, 'yyyy-MM-dd')),
  });

  const { data: phaseSymptoms } = useQuery({
    queryKey: ['phaseSymptoms', format(yearStart, 'yyyy-MM-dd')],
    queryFn: () =>
      listSymptomsInRange(format(yearStart, 'yyyy-MM-dd'), format(today, 'yyyy-MM-dd')),
  });

  const bbtData = useMemo(() => {
    return (bbt ?? []).map((r, i) => ({ x: i, y: r.bbt as number, date: r.date }));
  }, [bbt]);

  const bbtCover = useMemo(
    () => bbtCoverLine((bbt ?? []).map((r) => ({ date: r.date, bbt: r.bbt as number }))),
    [bbt],
  );

  const moodData = useMemo(() => {
    return (moods ?? []).map((r) => ({
      x: parseISO(r.date).getTime(),
      y: r.mood as number,
    }));
  }, [moods]);

  const lengths = useMemo(() => cycleLengths(cycles ?? []), [cycles]);
  const avg = lengths.length ? lengths.reduce((a, b) => a + b, 0) / lengths.length : 0;
  const stdDev = useMemo(() => {
    if (lengths.length < 2) return 0;
    const mean = avg;
    const variance =
      lengths.reduce((a, b) => a + (b - mean) ** 2, 0) / Math.max(1, lengths.length - 1);
    return Math.sqrt(variance);
  }, [lengths, avg]);

  const periodLens = useMemo(() => periodLengths(cycles ?? []), [cycles]);
  const periodAvg = periodLens.length
    ? periodLens.reduce((a, b) => a + b, 0) / periodLens.length
    : 0;

  const regularity = cycleRegularity(stdDev, lengths.length);
  const accuracy = useMemo(() => predictionAccuracy(cycles ?? []), [cycles]);

  const phase = useMemo(
    () => symptomsByPhase(cycles ?? [], phaseSymptoms ?? []),
    [cycles, phaseSymptoms],
  );

  const flowByDate = useMemo(() => {
    const m = new Map<string, number>();
    (yearLogs ?? []).forEach((l) => l.flow != null && m.set(l.date, l.flow));
    return m;
  }, [yearLogs]);

  const loggedByDate = useMemo(() => {
    const m = new Set<string>();
    (yearLogs ?? []).forEach((l) => {
      if (
        l.flow != null ||
        l.mood != null ||
        l.bbt != null ||
        l.cervicalMucus != null ||
        l.sexJson != null ||
        l.lhTest != null ||
        (l.notes && l.notes.length > 0)
      ) {
        m.add(l.date);
      }
    });
    return m;
  }, [yearLogs]);

  const { data: streak } = useStreak();
  const todaysBody = useTodaysBody();

  const insightsOrder = useCustomize((s) => s.insightsOrder);
  const orderedIds = useMemo(
    () => mergeOrder(insightsOrder, INSIGHTS_CATALOG_IDS),
    [insightsOrder],
  );

  const sections: Record<string, () => ReactNode> = {
    'todays-body': () =>
      todaysBody ? (
        <HideableSection screen="insights" id="todays-body" label="Today's body">
          <Animated.View entering={FadeInDown.duration(360)}>
            <Card>
              <View className="flex-row items-center justify-between mb-2">
                <View className="flex-row items-center gap-2">
                  <HandIcon name="user" size={14} color={palette.inkMuted} />
                  <Text
                    className="text-ink-muted text-lg font-hand"
                    style={{ transform: [{ rotate: '-0.5deg' }] }}
                  >
                    today&apos;s body
                  </Text>
                </View>
                <View
                  className="px-2.5 py-0.5 rounded-full"
                  style={{ backgroundColor: palette.accent + '22' }}
                >
                  <Text className="text-accent text-[11px] font-bold">
                    {todaysBody.phaseName} · day {todaysBody.cycleDay}
                  </Text>
                </View>
              </View>
              <Text className="text-ink text-sm leading-5">{todaysBody.short}</Text>

              {todaysBody.symptomBlurbs.length > 0 && (
                <View className="mt-4 pt-4 border-t border-bg-soft gap-3">
                  <Text className="text-ink-dim text-[11px] uppercase tracking-wide font-bold">
                    about what you logged today
                  </Text>
                  {todaysBody.symptomBlurbs.map((b) => (
                    <View key={b.tag}>
                      <Text className="text-ink text-sm font-bold mb-0.5">
                        {b.tag.replace(/_/g, ' ')}
                      </Text>
                      <Text className="text-ink-muted text-sm leading-5">{b.text}</Text>
                    </View>
                  ))}
                </View>
              )}

              <Pressable
                onPress={() => router.push('/learn')}
                className="flex-row items-center justify-center gap-2 mt-4 pt-3 border-t border-bg-soft active:opacity-70"
              >
                <Text className="text-accent text-sm font-bold">Learn more about your cycle</Text>
                <HandIcon name="chevron-right" size={14} color={palette.accent} />
              </Pressable>
            </Card>
          </Animated.View>
        </HideableSection>
      ) : null,

    'notes-link': () => (
      <HideableSection screen="insights" id="notes-link" label="Search your notes shortcut">
        <Animated.View entering={FadeInDown.duration(360)}>
          <Pressable
            onPress={() => router.push('/notes')}
            className="flex-row items-center gap-3 bg-bg-card rounded-3xl px-4 py-3 active:opacity-70"
            style={{
              borderWidth: 1.5,
              borderColor: palette.ink + '22',
              shadowColor: palette.ink,
              shadowOpacity: 0.5,
              shadowRadius: 0,
              shadowOffset: { width: 2, height: 3 },
              elevation: 2,
            }}
          >
            <HandIcon name="book-open" size={16} color={palette.accent} />
            <Text className="text-ink text-sm flex-1">Search your notes</Text>
            <HandIcon name="chevron-right" size={16} color={palette.inkDim} />
          </Pressable>
        </Animated.View>
      </HideableSection>
    ),

    'cycle-summary': () => (
      <HideableSection screen="insights" id="cycle-summary" label="Cycle & period averages">
        <Animated.View entering={FadeInDown.duration(360)}>
          <View className="flex-row gap-3 items-stretch">
            <View className="flex-1">
              <Card className="flex-1">
                <CardTitle icon={<HandIcon name="repeat" size={14} color={palette.inkMuted} />}>
                  cycle
                </CardTitle>
                {lengths.length === 0 ? (
                  <Text className="text-ink-muted text-sm">Log 2+ periods.</Text>
                ) : (
                  <>
                    <Text
                      className="text-accent font-handBold"
                      style={{ fontSize: 52, lineHeight: 56 }}
                      numberOfLines={1}
                      adjustsFontSizeToFit
                    >
                      {avg.toFixed(1)}
                    </Text>
                    <Text className="text-ink-muted text-sm -mt-1">days avg</Text>
                    <View
                      className="px-2 py-0.5 rounded-full self-start mt-3"
                      style={{ backgroundColor: palette.accent + '22' }}
                    >
                      <Text className="text-accent text-[11px] font-bold">{regularity.label}</Text>
                    </View>
                    <Text className="text-ink-muted mt-2 text-xs leading-4">{regularity.blurb}</Text>
                    <Text className="text-ink-dim mt-2 text-[11px]">
                      last {lengths.length}: {lengths.join(', ')}
                    </Text>
                  </>
                )}
              </Card>
            </View>
            <View className="flex-1">
              <Card className="flex-1">
                <CardTitle icon={<HandIcon name="droplet" size={14} color={palette.inkMuted} />}>
                  period
                </CardTitle>
                {periodLens.length === 0 ? (
                  <Text className="text-ink-muted text-sm">Log period end dates.</Text>
                ) : (
                  <>
                    <Text
                      className="text-accent font-handBold"
                      style={{ fontSize: 52, lineHeight: 56 }}
                      numberOfLines={1}
                      adjustsFontSizeToFit
                    >
                      {periodAvg.toFixed(1)}
                    </Text>
                    <Text className="text-ink-muted text-sm -mt-1">
                      day{periodAvg === 1 ? '' : 's'} avg
                    </Text>
                    <Text className="text-ink-dim mt-3 text-[11px]">
                      last {periodLens.length}: {periodLens.join(', ')}d
                    </Text>
                  </>
                )}
              </Card>
            </View>
          </View>
        </Animated.View>
      </HideableSection>
    ),

    'prediction-accuracy': () =>
      accuracy ? (
        <HideableSection screen="insights" id="prediction-accuracy" label="Prediction accuracy">
          <Animated.View entering={FadeInDown.duration(360)}>
            <Card>
              <CardTitle icon={<HandIcon name="trending-up" size={14} color={palette.inkMuted} />}>
                Prediction accuracy
              </CardTitle>
              <View className="flex-row items-baseline gap-2">
                <Text className="text-accent text-5xl font-handBold" style={{ lineHeight: 52 }}>
                  ±{accuracy.meanAbsError.toFixed(1)}
                </Text>
                <Text className="text-ink-muted text-base">
                  day{accuracy.meanAbsError === 1 ? '' : 's'} off, avg
                </Text>
              </View>
              <Text className="text-ink-muted mt-2 text-sm">
                Across your last {accuracy.sampleSize} cycle{accuracy.sampleSize === 1 ? '' : 's'}.
              </Text>
              <View className="mt-3 gap-1.5">
                {accuracy.lastErrors.map((e, i) => (
                  <View key={i} className="flex-row items-center gap-2">
                    <Text className="text-ink-dim text-xs w-16">
                      {format(parseISO(e.actual), 'MMM d')}
                    </Text>
                    <Text
                      className="text-xs"
                      style={{
                        color:
                          Math.abs(e.diff) <= 1
                            ? palette.accent
                            : Math.abs(e.diff) <= 3
                              ? palette.inkMuted
                              : palette.inkDim,
                      }}
                    >
                      {e.diff === 0
                        ? 'on the day'
                        : e.diff > 0
                          ? `${e.diff} day${e.diff === 1 ? '' : 's'} late`
                          : `${Math.abs(e.diff)} day${Math.abs(e.diff) === 1 ? '' : 's'} early`}
                    </Text>
                  </View>
                ))}
              </View>
            </Card>
          </Animated.View>
        </HideableSection>
      ) : null,

    'year-heatmap': () => (
      <HideableSection screen="insights" id="year-heatmap" label="Year at a glance">
        <Animated.View entering={FadeInDown.duration(360)}>
          <Card>
            <CardTitle icon={<HandIcon name="calendar" size={14} color={palette.inkMuted} />}>
              Year at a glance
            </CardTitle>
            <YearHeatmap
              today={today}
              flowByDate={flowByDate}
              loggedByDate={loggedByDate}
              palette={palette}
              width={width - 80}
            />
            <View className="flex-row items-center gap-3 mt-3 flex-wrap">
              <Legend color={palette.bgSoft} label="no log" palette={palette} />
              <Legend color={palette.accentSoft} label="logged" palette={palette} />
              <Legend color={palette.accent} label="period" palette={palette} />
            </View>
          </Card>
        </Animated.View>
      </HideableSection>
    ),

    'bbt-chart': () => (
      <HideableSection screen="insights" id="bbt-chart" label="Basal body temperature chart">
        <Animated.View entering={FadeInDown.duration(360)}>
          <Card>
            <CardTitle
              icon={<HandIcon name="thermometer" size={14} color={palette.inkMuted} />}
            >
              Basal body temperature
            </CardTitle>
            {bbtData.length < 2 ? (
              <Text className="text-ink-muted text-sm">
                Log BBT for a few days to see the chart.
              </Text>
            ) : (
              <>
                <View style={{ height: 220, width: width - 80 }}>
                  <CartesianChart
                    data={bbtData}
                    xKey="x"
                    yKeys={['y']}
                    domainPadding={{ left: 12, right: 12, top: 12, bottom: 12 }}
                    axisOptions={{
                      lineColor: palette.bgSoft,
                      labelColor: palette.inkMuted,
                    }}
                  >
                    {({ points, chartBounds, yScale }) => {
                      const coverY = bbtCover ? yScale(bbtCover.coverLine) : null;
                      return (
                        <>
                          {coverY != null && (
                            <SkiaLine
                              p1={vec(chartBounds.left, coverY)}
                              p2={vec(chartBounds.right, coverY)}
                              color={palette.ovulation}
                              strokeWidth={1.5}
                              style="stroke"
                            />
                          )}
                          <Line points={points.y} color={palette.accent} strokeWidth={2.5} />
                          <Scatter
                            points={points.y}
                            radius={3.5}
                            style="fill"
                            color={palette.accentSoft}
                          />
                        </>
                      );
                    }}
                  </CartesianChart>
                </View>
                {bbtCover && (
                  <View className="flex-row items-center gap-2 mt-2">
                    <View
                      className="w-4 h-0.5"
                      style={{ backgroundColor: palette.ovulation }}
                    />
                    <Text className="text-ink-muted text-xs">
                      Cover line at {bbtCover.coverLine.toFixed(2)}°
                      {bbtCover.confirmedShiftIndex != null ? ' — biphasic shift detected' : ''}
                    </Text>
                  </View>
                )}
              </>
            )}
          </Card>
        </Animated.View>
      </HideableSection>
    ),

    'symptom-heatmap': () => (
      <HideableSection screen="insights" id="symptom-heatmap" label="Symptoms by cycle day">
        <Animated.View entering={FadeInDown.duration(360)}>
          <Card>
            <CardTitle icon={<HandIcon name="activity" size={14} color={palette.inkMuted} />}>
              Symptoms by cycle day
            </CardTitle>
            {phase.top.length === 0 ? (
              <Text className="text-ink-muted text-sm">
                Log symptoms across a cycle to see when they cluster.
              </Text>
            ) : (
              <>
                <Text className="text-ink-muted text-xs mb-3">
                  Across {phase.cycleCount} cycle{phase.cycleCount === 1 ? '' : 's'} · darker = more often
                </Text>
                <SymptomHeatmap
                  phase={phase.top}
                  cycleCount={phase.cycleCount}
                  palette={palette}
                  width={width - 80}
                />
                <Text className="text-ink-dim text-[10px] mt-2">
                  day 1 = period start · day 14 ≈ ovulation · day 28+ = next period
                </Text>
              </>
            )}
          </Card>
        </Animated.View>
      </HideableSection>
    ),

    'mood-timeline': () => (
      <HideableSection screen="insights" id="mood-timeline" label="Mood over time chart">
        <Animated.View entering={FadeInDown.duration(360)}>
          <Card>
            <CardTitle icon={<HandIcon name="smile" size={14} color={palette.inkMuted} />}>
              Mood over time
            </CardTitle>
            {moodData.length < 2 ? (
              <Text className="text-ink-muted text-sm">
                Log mood on a few days to see the chart. Pinch to zoom.
              </Text>
            ) : (
              <>
                <View style={{ height: 240, width: width - 80 }}>
                  <CartesianChart
                    data={moodData}
                    xKey="x"
                    yKeys={['y']}
                    domain={{ y: [0.5, 5.5] }}
                    domainPadding={{ left: 12, right: 12, top: 12, bottom: 12 }}
                    transformState={moodTransform.state}
                    transformConfig={{
                      pan: { dimensions: 'x' },
                      pinch: { dimensions: 'x' },
                    }}
                    axisOptions={{
                      lineColor: palette.bgSoft,
                      labelColor: palette.inkMuted,
                      tickCount: { x: 4, y: 5 },
                      formatXLabel: (v) => {
                        const d = new Date(Number(v));
                        return `${d.getMonth() + 1}/${d.getDate()}`;
                      },
                      formatYLabel: (v) => {
                        const labels = ['', 'Awful', 'Bad', 'Okay', 'Good', 'Great'];
                        return labels[Math.round(Number(v))] ?? '';
                      },
                    }}
                  >
                    {({ points }) => (
                      <>
                        <Line points={points.y} color={palette.ovulation} strokeWidth={2.5} />
                        <Scatter
                          points={points.y}
                          radius={3.5}
                          style="fill"
                          color={palette.ovulation}
                        />
                      </>
                    )}
                  </CartesianChart>
                </View>
                <View className="flex-row items-center gap-1.5 mt-2">
                  <HandIcon name="move" size={11} color={palette.inkDim} />
                  <Text className="text-ink-dim text-xs">Pinch to zoom · drag to pan</Text>
                </View>
              </>
            )}
          </Card>
        </Animated.View>
      </HideableSection>
    ),
  };

  return (
    <Screen>
      <MascotHeader
        title="Insights"
        kicker="your patterns"
        context={{ screen: 'insights', streak: streak ?? null }}
      />

      <ReorderBar screen="insights" />

      {orderedIds.map((id) => (
        <Fragment key={id}>{sections[id]?.()}</Fragment>
      ))}
    </Screen>
  );
}

const INSIGHTS_CATALOG_IDS = HIDEABLE_INSIGHTS.map((s) => s.id);

function Legend({
  color,
  label,
  palette,
}: {
  color: string;
  label: string;
  palette: ReturnType<typeof useTheme>['palette'];
}) {
  return (
    <View className="flex-row items-center gap-1.5">
      <View
        style={{
          width: 12,
          height: 12,
          borderRadius: 3,
          backgroundColor: color,
          borderWidth: 1,
          borderColor: palette.ink + '22',
        }}
      />
      <Text className="text-ink-dim text-xs">{label}</Text>
    </View>
  );
}

function YearHeatmap({
  today,
  flowByDate,
  loggedByDate,
  palette,
  width,
}: {
  today: Date;
  flowByDate: Map<string, number>;
  loggedByDate: Set<string>;
  palette: ReturnType<typeof useTheme>['palette'];
  width: number;
}) {
  const columns = useMemo(() => {
    const days: Date[] = [];
    for (let i = 364; i >= 0; i--) days.push(subDays(today, i));
    const startDate = days[0];
    const startDow = startDate.getDay();
    const cols: (Date | null)[][] = [];
    let cur: (Date | null)[] = new Array(startDow).fill(null);
    for (const d of days) {
      cur.push(d);
      if (cur.length === 7) {
        cols.push(cur);
        cur = [];
      }
    }
    if (cur.length) {
      while (cur.length < 7) cur.push(null);
      cols.push(cur);
    }
    return cols;
  }, [today]);

  const gap = 1;
  const cell = Math.max(3, Math.floor((width - (columns.length - 1) * gap) / columns.length));
  const colStride = cell + gap;

  const monthLabels = useMemo(() => {
    const labels: { col: number; label: string }[] = [];
    let lastMonth = -1;
    columns.forEach((col, i) => {
      const first = col.find((d): d is Date => d != null);
      if (!first) return;
      const m = first.getMonth();
      if (m !== lastMonth) {
        labels.push({ col: i, label: format(first, 'MMMMM') });
        lastMonth = m;
      }
    });
    return labels;
  }, [columns]);

  const gridWidth = columns.length * colStride - gap;

  return (
    <View style={{ width, overflow: 'hidden' }}>
      <View style={{ height: 16, marginBottom: 4, position: 'relative', width: gridWidth }}>
        {monthLabels.map((m, i) => {
          const leftPx = m.col * colStride;
          return (
            <Text
              key={i}
              className="text-ink-muted font-hand font-bold"
              style={{
                position: 'absolute',
                left: leftPx,
                maxWidth: Math.max(0, gridWidth - leftPx),
                fontSize: 13,
                lineHeight: 16,
              }}
              numberOfLines={1}
            >
              {m.label}
            </Text>
          );
        })}
      </View>
      <View style={{ flexDirection: 'row', width: gridWidth }}>
        {columns.map((col, ci) => (
          <View key={ci} style={{ marginRight: ci < columns.length - 1 ? gap : 0 }}>
            {col.map((d, di) => {
              if (!d) {
                return (
                  <View
                    key={di}
                    style={{ width: cell, height: cell, marginBottom: gap }}
                  />
                );
              }
              const iso = format(d, 'yyyy-MM-dd');
              const flow = flowByDate.get(iso);
              const logged = loggedByDate.has(iso);
              let color = palette.bgSoft;
              if (flow != null && flow > 0) color = palette.accent;
              else if (logged) color = palette.accentSoft;
              return (
                <View
                  key={di}
                  style={{
                    width: cell,
                    height: cell,
                    marginBottom: gap,
                    borderRadius: 1.5,
                    backgroundColor: color,
                    opacity: flow === 1 ? 0.5 : 1,
                  }}
                />
              );
            })}
          </View>
        ))}
      </View>
    </View>
  );
}

function SymptomHeatmap({
  phase,
  cycleCount,
  palette,
  width,
}: {
  phase: { tag: string; total: number; byDay: Record<number, number> }[];
  cycleCount: number;
  palette: ReturnType<typeof useTheme>['palette'];
  width: number;
}) {
  const maxDay = 28;
  const labelWidth = 84;
  const gap = 1;
  const cell = Math.max(5, Math.floor((width - labelWidth - (maxDay - 1) * gap) / maxDay));

  return (
    <View className="gap-1.5">
      <View className="flex-row">
        <View style={{ width: labelWidth }} />
        <View style={{ height: 16, position: 'relative', flex: 1 }}>
          {[1, 7, 14, 21, 28].map((d) => (
            <Text
              key={d}
              className="text-ink-muted text-[11px] font-medium"
              style={{
                position: 'absolute',
                left: (d - 1) * (cell + gap),
                top: 0,
              }}
            >
              {d}
            </Text>
          ))}
        </View>
      </View>
      {phase.map((row) => {
        const maxForRow = Math.max(1, ...Object.values(row.byDay));
        return (
          <View key={row.tag} className="flex-row items-center">
            <Text
              className="text-ink text-[13px] font-medium"
              style={{ width: labelWidth, paddingRight: 4 }}
              numberOfLines={1}
            >
              {SYMPTOM_LABELS[row.tag] ?? row.tag}
            </Text>
            <View style={{ flexDirection: 'row' }}>
              {Array.from({ length: maxDay }, (_, i) => {
                const day = i + 1;
                const count = row.byDay[day] ?? 0;
                const intensity = count / maxForRow;
                return (
                  <View
                    key={day}
                    style={{
                      width: cell,
                      height: cell,
                      marginRight: i < maxDay - 1 ? gap : 0,
                      borderRadius: 1.5,
                      backgroundColor: count === 0 ? palette.bgSoft : palette.accent,
                      opacity: count === 0 ? 1 : 0.25 + intensity * 0.75,
                    }}
                  />
                );
              })}
            </View>
          </View>
        );
      })}
      <Text className="text-ink-dim text-[11px] mt-1.5">
        {cycleCount} cycle{cycleCount === 1 ? '' : 's'} analyzed
      </Text>
    </View>
  );
}
