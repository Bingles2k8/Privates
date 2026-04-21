import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { Alert, Text, TextInput, View } from 'react-native';
import { HandIcon, type HandIconName } from '@/ui/HandIcon';
import { format, parseISO } from 'date-fns';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { Card, CardTitle } from '@/ui/Card';
import { Chip } from '@/ui/Chip';
import { IntensityDots } from '@/ui/IntensityDots';
import { MoodScale } from '@/ui/MoodScale';
import { PrimaryButton } from '@/ui/PrimaryButton';
import { Screen } from '@/ui/Screen';
import {
  CERVICAL_MUCUS,
  FLOW_LEVELS,
  LH_TEST,
  SEX_KINDS,
  SYMPTOM_TAGS,
} from '@/data/constants';
import { useDayLog, useUpsertDayLog } from '@/hooks/useDayLog';
import { useTheme } from '@/theme/useTheme';

export default function DayLogScreen() {
  const router = useRouter();
  const { date } = useLocalSearchParams<{ date: string }>();
  const dateIso = (date as string) ?? format(new Date(), 'yyyy-MM-dd');
  const { data: existing } = useDayLog(dateIso);
  const upsert = useUpsertDayLog(dateIso);
  const { palette } = useTheme();

  const [flow, setFlow] = useState<number | null>(null);
  const [mood, setMood] = useState<number | null>(null);
  const [mucus, setMucus] = useState<string | null>(null);
  const [lh, setLh] = useState<string | null>(null);
  const [bbt, setBbt] = useState('');
  const [notes, setNotes] = useState('');
  const [sexKind, setSexKind] = useState<string | null>(null);
  const [symptomInts, setSymptomInts] = useState<Map<string, number>>(new Map());

  useEffect(() => {
    if (!existing) return;
    setFlow(existing.flow);
    setMood(existing.mood);
    setMucus(existing.cervicalMucus);
    setLh(existing.lhTest);
    setBbt(existing.bbt != null ? String(existing.bbt) : '');
    setNotes(existing.notes ?? '');
    setSexKind(existing.sex?.kind ?? null);
    setSymptomInts(
      new Map(existing.symptoms.map((s) => [s.tag, Math.min(3, Math.max(1, s.intensity || 1))])),
    );
  }, [existing]);

  function toggleSymptom(tag: string) {
    setSymptomInts((prev) => {
      const next = new Map(prev);
      if (next.has(tag)) next.delete(tag);
      else next.set(tag, 1);
      return next;
    });
  }

  function setSymptomIntensity(tag: string, intensity: number) {
    setSymptomInts((prev) => {
      const next = new Map(prev);
      next.set(tag, intensity);
      return next;
    });
  }

  function onSave() {
    const bbtNum = bbt.trim() === '' ? null : Number(bbt);
    upsert.mutate(
      {
        flow,
        mood,
        cervicalMucus: mucus,
        lhTest: lh,
        bbt: Number.isFinite(bbtNum as number) ? (bbtNum as number) : null,
        notes: notes.trim() === '' ? null : notes,
        sex: sexKind ? { kind: sexKind } : null,
        symptoms: [...symptomInts.entries()].map(([tag, intensity]) => ({ tag, intensity })),
      },
      {
        onSuccess: () => router.back(),
        onError: (e) => Alert.alert('Save failed', String((e as Error)?.message ?? e)),
      },
    );
  }

  const sections = [
    {
      title: 'Flow',
      icon: 'droplet' as const,
      content: (
        <View className="flex-row flex-wrap gap-2">
          {FLOW_LEVELS.map((f) => (
            <Chip
              key={f.value}
              label={f.label}
              tone="period"
              selected={flow === f.value}
              onPress={() => setFlow(f.value)}
            />
          ))}
        </View>
      ),
    },
    {
      title: 'Symptoms',
      icon: 'activity' as const,
      content: (
        <View className="gap-3">
          <View className="flex-row flex-wrap gap-2">
            {SYMPTOM_TAGS.map((t) => (
              <Chip
                key={t}
                label={t.replace(/_/g, ' ')}
                selected={symptomInts.has(t)}
                onPress={() => toggleSymptom(t)}
              />
            ))}
          </View>
          {symptomInts.size > 0 && (
            <View className="mt-1 pt-3 border-t border-bg-soft gap-2">
              <Text
                className="text-ink-muted text-xs font-hand"
                style={{ transform: [{ rotate: '-1deg' }] }}
              >
                how intense?
              </Text>
              {[...symptomInts.entries()].map(([tag, intensity]) => (
                <View
                  key={tag}
                  className="flex-row items-center justify-between py-1"
                >
                  <Text className="text-ink text-sm flex-1">{tag.replace(/_/g, ' ')}</Text>
                  <IntensityDots
                    value={intensity}
                    onChange={(v) => setSymptomIntensity(tag, v)}
                  />
                </View>
              ))}
            </View>
          )}
        </View>
      ),
    },
    {
      title: 'Mood',
      icon: 'smile' as const,
      content: <MoodScale value={mood} onChange={setMood} />,
    },
    {
      title: 'Cervical mucus',
      icon: 'circle' as const,
      content: (
        <View className="flex-row flex-wrap gap-2">
          {CERVICAL_MUCUS.map((m) => (
            <Chip
              key={m.value}
              label={m.label}
              selected={mucus === m.value}
              onPress={() => setMucus(mucus === m.value ? null : m.value)}
            />
          ))}
        </View>
      ),
    },
    {
      title: 'LH test',
      icon: 'check-square' as const,
      content: (
        <View className="flex-row flex-wrap gap-2">
          {LH_TEST.map((l) => (
            <Chip
              key={l.value}
              label={l.label}
              selected={lh === l.value}
              onPress={() => setLh(lh === l.value ? null : l.value)}
            />
          ))}
        </View>
      ),
    },
    {
      title: 'Sex',
      icon: 'heart' as const,
      content: (
        <View className="flex-row flex-wrap gap-2">
          {SEX_KINDS.map((s) => (
            <Chip
              key={s.value}
              label={s.label}
              selected={sexKind === s.value}
              onPress={() => setSexKind(sexKind === s.value ? null : s.value)}
            />
          ))}
        </View>
      ),
    },
    {
      title: 'Basal body temperature',
      icon: 'thermometer' as const,
      content: (
        <TextInput
          value={bbt}
          onChangeText={setBbt}
          keyboardType="decimal-pad"
          placeholder="36.5"
          placeholderTextColor={palette.inkDim}
          className="text-ink text-lg py-2 bg-bg-soft rounded-xl px-4"
        />
      ),
    },
    {
      title: 'Notes',
      icon: 'edit-2' as const,
      content: (
        <TextInput
          value={notes}
          onChangeText={setNotes}
          multiline
          numberOfLines={4}
          placeholder="Anything to remember…"
          placeholderTextColor={palette.inkDim}
          className="text-ink text-base min-h-24 bg-bg-soft rounded-xl px-4 py-3"
          textAlignVertical="top"
        />
      ),
    },
  ];

  return (
    <Screen topInset={false}>
      <Animated.View entering={FadeInDown.duration(400)}>
        <Text
          className="text-ink-muted text-base font-hand"
          style={{ transform: [{ rotate: '-1deg' }] }}
        >
          {format(parseISO(dateIso), 'EEEE').toLowerCase()}
        </Text>
        <Text className="text-ink text-4xl font-display mt-0.5">
          {format(parseISO(dateIso), 'MMM d')}
        </Text>
      </Animated.View>

      {sections.map((s, i) => (
        <Animated.View key={s.title} entering={FadeInDown.delay(60 + i * 40).duration(360)}>
          <Card>
            <CardTitle icon={<HandIcon name={s.icon} size={14} color={palette.inkMuted} />}>
              {s.title}
            </CardTitle>
            {s.content}
          </Card>
        </Animated.View>
      ))}

      <Animated.View entering={FadeInDown.delay(60 + sections.length * 40).duration(360)}>
        <PrimaryButton
          label={upsert.isPending ? 'Saving…' : 'Save'}
          icon={<HandIcon name="save" size={16} color="white" />}
          onPress={onSave}
          disabled={upsert.isPending}
        />
      </Animated.View>
    </Screen>
  );
}
