import { useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
import { Modal, Pressable, Text, View } from 'react-native';
import { HandIcon } from '@/ui/HandIcon';
import {
  addMonths,
  differenceInCalendarDays,
  eachDayOfInterval,
  endOfMonth,
  format,
  isSameDay,
  isSameMonth,
  isWithinInterval,
  parseISO,
  startOfMonth,
  startOfWeek,
  endOfWeek,
} from 'date-fns';
import { useQuery } from '@tanstack/react-query';
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';
import { Card, CardTitle } from '@/ui/Card';
import { MascotHeader } from '@/ui/MascotHeader';
import { Screen } from '@/ui/Screen';
import { listDayLogsBetween } from '@/data/dayLogs';
import { FLOW_LEVELS } from '@/data/constants';
import { useDayLog } from '@/hooks/useDayLog';
import { usePrediction } from '@/hooks/usePrediction';
import { useStreak } from '@/hooks/useStreak';
import { useTheme } from '@/theme/useTheme';

export default function CalendarScreen() {
  const router = useRouter();
  const { palette } = useTheme();
  const [cursor, setCursor] = useState(() => startOfMonth(new Date()));
  const [peekDate, setPeekDate] = useState<string | null>(null);
  const { data: pred } = usePrediction();

  const monthStart = startOfMonth(cursor);
  const monthEnd = endOfMonth(cursor);
  const gridStart = startOfWeek(monthStart, { weekStartsOn: 0 });
  const gridEnd = endOfWeek(monthEnd, { weekStartsOn: 0 });
  const days = useMemo(
    () => eachDayOfInterval({ start: gridStart, end: gridEnd }),
    [gridStart, gridEnd],
  );

  const { data: logs } = useQuery({
    queryKey: ['monthLogs', format(gridStart, 'yyyy-MM-dd')],
    queryFn: () =>
      listDayLogsBetween(format(gridStart, 'yyyy-MM-dd'), format(gridEnd, 'yyyy-MM-dd')),
  });
  const flowByDate = useMemo(() => {
    const m = new Map<string, number>();
    (logs ?? []).forEach((l) => l.flow != null && m.set(l.date, l.flow));
    return m;
  }, [logs]);

  const fertile = pred?.fertile;

  const { data: streak } = useStreak();
  const mascotCtx = useMemo(() => {
    const today = new Date();
    const fwin = pred?.fertile;
    const fertileCtx = fwin
      ? {
          inWindow: today >= parseISO(fwin.windowStart) && today <= parseISO(fwin.windowEnd),
          daysToOv: differenceInCalendarDays(parseISO(fwin.ovulation), today),
        }
      : null;
    const daysToPeriod = pred?.prediction
      ? differenceInCalendarDays(parseISO(pred.prediction.nextPeriodStart), today)
      : null;
    return {
      screen: 'calendar' as const,
      fertile: fertileCtx,
      daysToPeriod,
      streak: streak ?? null,
    };
  }, [pred, streak]);

  return (
    <Screen>
      <MascotHeader
        title={format(cursor, 'MMMM')}
        kicker={`this month · ${format(cursor, 'yyyy')}`}
        context={mascotCtx}
      />
      <Animated.View entering={FadeInDown.delay(60).duration(400)}>
        <View className="flex-row items-center justify-end">
          <View className="flex-row items-center gap-2">
            <Pressable
              onPress={() => setCursor((c) => addMonths(c, -1))}
              className="w-10 h-10 rounded-full bg-bg-card items-center justify-center active:opacity-60"
              style={{
                shadowColor: '#2a241f',
                shadowOpacity: 0.06,
                shadowRadius: 8,
                shadowOffset: { width: 0, height: 2 },
                elevation: 2,
              }}
            >
              <HandIcon name="chevron-left" size={18} color={palette.ink} />
            </Pressable>
            <Pressable
              onPress={() => setCursor((c) => addMonths(c, 1))}
              className="w-10 h-10 rounded-full bg-bg-card items-center justify-center active:opacity-60"
              style={{
                shadowColor: '#2a241f',
                shadowOpacity: 0.06,
                shadowRadius: 8,
                shadowOffset: { width: 0, height: 2 },
                elevation: 2,
              }}
            >
              <HandIcon name="chevron-right" size={18} color={palette.ink} />
            </Pressable>
          </View>
        </View>
      </Animated.View>

      <Animated.View entering={FadeIn.delay(100).duration(400)}>
        <Card>
          <View className="flex-row mb-2">
            {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((d, i) => (
              <Text
                key={i}
                className="text-ink-dim text-center flex-1 text-[11px] font-bold uppercase tracking-wider"
              >
                {d}
              </Text>
            ))}
          </View>

          <View className="flex-row flex-wrap">
            {days.map((d) => {
              const iso = format(d, 'yyyy-MM-dd');
              const inMonth = isSameMonth(d, cursor);
              const flow = flowByDate.get(iso);
              const isFertile =
                fertile &&
                isWithinInterval(d, {
                  start: parseISO(fertile.windowStart),
                  end: parseISO(fertile.windowEnd),
                });
              const isOvulation = fertile && isSameDay(d, parseISO(fertile.ovulation));
              const isToday = isSameDay(d, new Date());
              return (
                <Pressable
                  key={iso}
                  onPress={() => router.push(`/log/${iso}`)}
                  onLongPress={() => setPeekDate(iso)}
                  delayLongPress={240}
                  className="w-[14.28%] aspect-square items-center justify-center active:opacity-60"
                >
                  <View
                    className={`w-10 h-10 rounded-2xl items-center justify-center ${
                      flow
                        ? 'bg-period'
                        : isOvulation
                          ? 'bg-ovulation'
                          : isFertile
                            ? 'bg-fertile/40'
                            : ''
                    }`}
                    style={
                      isToday && !flow && !isOvulation
                        ? { borderWidth: 2, borderColor: palette.accent }
                        : undefined
                    }
                  >
                    <Text
                      className={`text-sm font-medium ${
                        flow || isOvulation
                          ? 'text-white font-bold'
                          : inMonth
                            ? isToday
                              ? 'text-accent font-bold'
                              : 'text-ink'
                            : 'text-ink-dim'
                      }`}
                    >
                      {format(d, 'd')}
                    </Text>
                  </View>
                </Pressable>
              );
            })}
          </View>
        </Card>
      </Animated.View>

      <Animated.View entering={FadeIn.delay(200).duration(400)}>
        <Card>
          <CardTitle icon={<HandIcon name="info" size={14} color={palette.inkMuted} />}>
            Legend
          </CardTitle>
          <View className="gap-2.5">
            <Legend color="bg-period" label="Logged period" />
            <Legend color="bg-fertile/40" label="Fertile window" />
            <Legend color="bg-ovulation" label="Predicted ovulation" />
          </View>
          <Text className="text-ink-dim text-xs mt-3">
            tip: long-press a day to peek
          </Text>
        </Card>
      </Animated.View>

      <DayPeek
        date={peekDate}
        onClose={() => setPeekDate(null)}
        onEdit={(d) => {
          setPeekDate(null);
          router.push(`/log/${d}`);
        }}
      />
    </Screen>
  );
}

function DayPeek({
  date,
  onClose,
  onEdit,
}: {
  date: string | null;
  onClose: () => void;
  onEdit: (d: string) => void;
}) {
  const { palette } = useTheme();
  const { data } = useDayLog(date ?? '');
  if (!date) return null;
  const flowLabel =
    data?.flow != null ? FLOW_LEVELS.find((f) => f.value === data.flow)?.label : null;
  const hasAnything =
    data &&
    (data.flow != null ||
      data.mood != null ||
      data.bbt != null ||
      data.cervicalMucus != null ||
      data.sex != null ||
      data.lhTest != null ||
      (data.notes && data.notes.length > 0) ||
      data.symptoms.length > 0 ||
      data.moods.length > 0);

  return (
    <Modal transparent animationType="fade" visible onRequestClose={onClose}>
      <Pressable
        onPress={onClose}
        className="flex-1 items-center justify-center px-6"
        style={{ backgroundColor: '#00000099' }}
      >
        <Pressable
          onPress={(e) => e.stopPropagation()}
          className="w-full bg-bg-card rounded-3xl p-5"
          style={{
            borderWidth: 1.5,
            borderColor: palette.ink + '33',
            shadowColor: palette.ink,
            shadowOpacity: 0.95,
            shadowRadius: 0,
            shadowOffset: { width: 3, height: 5 },
          }}
        >
          <View className="flex-row items-center justify-between mb-3">
            <View>
              <Text
                className="text-ink-muted text-sm font-hand"
                style={{ transform: [{ rotate: '-1deg' }] }}
              >
                peek
              </Text>
              <Text className="text-ink text-2xl font-display">
                {format(parseISO(date), 'EEEE, MMM d')}
              </Text>
            </View>
            <Pressable onPress={onClose} hitSlop={10}>
              <HandIcon name="x" size={20} color={palette.inkMuted} />
            </Pressable>
          </View>

          {!hasAnything ? (
            <Text className="text-ink-muted text-sm mb-4">Nothing logged for this day.</Text>
          ) : (
            <View className="gap-2 mb-4">
              {flowLabel && (
                <PeekRow
                  icon="droplet"
                  label="flow"
                  value={flowLabel}
                  color={palette.accent}
                />
              )}
              {data?.mood != null && (
                <PeekRow
                  icon="smile"
                  label="mood"
                  value={`${data.mood}/5`}
                  color={palette.ovulation}
                />
              )}
              {data?.bbt != null && (
                <PeekRow
                  icon="thermometer"
                  label="bbt"
                  value={`${data.bbt.toFixed(2)}°`}
                  color={palette.accent}
                />
              )}
              {data?.symptoms && data.symptoms.length > 0 && (
                <PeekRow
                  icon="activity"
                  label="symptoms"
                  value={data.symptoms.map((s) => s.tag.replace(/_/g, ' ')).join(', ')}
                  color={palette.inkMuted}
                />
              )}
              {data?.moods && data.moods.length > 0 && (
                <PeekRow
                  icon="heart"
                  label="moods"
                  value={data.moods.map((m) => m.tag).join(', ')}
                  color={palette.inkMuted}
                />
              )}
              {data?.notes && (
                <View className="flex-row gap-2 items-start mt-1">
                  <HandIcon name="book-open" size={13} color={palette.inkMuted} />
                  <Text className="text-ink-muted text-sm flex-1 italic">“{data.notes}”</Text>
                </View>
              )}
            </View>
          )}

          <Pressable
            onPress={() => onEdit(date)}
            className="bg-accent rounded-2xl py-3 items-center flex-row justify-center gap-2 active:opacity-80"
            style={{
              borderWidth: 1.5,
              borderColor: palette.ink,
              shadowColor: palette.ink,
              shadowOpacity: 0.9,
              shadowRadius: 0,
              shadowOffset: { width: 2, height: 2 },
            }}
          >
            <HandIcon name="edit-3" size={14} color="white" />
            <Text className="text-white font-bold">
              {hasAnything ? 'Edit day' : 'Log this day'}
            </Text>
          </Pressable>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

function PeekRow({
  icon,
  label,
  value,
  color,
}: {
  icon: any;
  label: string;
  value: string;
  color: string;
}) {
  return (
    <View className="flex-row items-center gap-2">
      <HandIcon name={icon} size={13} color={color} />
      <Text className="text-ink-dim text-xs w-16">{label}</Text>
      <Text className="text-ink text-sm flex-1" numberOfLines={2}>
        {value}
      </Text>
    </View>
  );
}

function Legend({ color, label }: { color: string; label: string }) {
  return (
    <View className="flex-row items-center gap-3">
      <View className={`w-5 h-5 rounded-lg ${color}`} />
      <Text className="text-ink text-sm">{label}</Text>
    </View>
  );
}
