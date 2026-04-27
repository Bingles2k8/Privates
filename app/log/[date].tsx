import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { Alert, Pressable, Text, TextInput, View } from 'react-native';
import { HandIcon } from '@/ui/HandIcon';
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
  SEX_DRIVE_MAX,
  SEX_DRIVE_MIN,
  SEX_KINDS,
  SEX_PROTECTION,
  SYMPTOM_TAGS,
} from '@/data/constants';
import { useDayLog, useUpsertDayLog } from '@/hooks/useDayLog';
import {
  isPlausible,
  parseInputToCelsius,
  placeholderFor,
  storedToDisplay,
  unitLabel,
} from '@/predictions/bbt';
import { useBbtPrefs } from '@/state/bbtPrefs';
import { describeError } from '@/util/describeError';
import { useTheme } from '@/theme/useTheme';

export default function DayLogScreen() {
  const router = useRouter();
  const { date } = useLocalSearchParams<{ date: string }>();
  const dateIso = (date as string) ?? format(new Date(), 'yyyy-MM-dd');
  const { data: existing } = useDayLog(dateIso);
  const upsert = useUpsertDayLog(dateIso);
  const { palette } = useTheme();
  const tempUnit = useBbtPrefs((s) => s.unit);

  const [flow, setFlow] = useState<number | null>(null);
  const [mood, setMood] = useState<number | null>(null);
  const [mucus, setMucus] = useState<string | null>(null);
  const [lh, setLh] = useState<string | null>(null);
  const [bbt, setBbt] = useState('');
  const [notes, setNotes] = useState('');
  const [sexKind, setSexKind] = useState<string | null>(null);
  const [sexProtection, setSexProtection] = useState<string | null>(null);
  const [sexDrive, setSexDrive] = useState<number | null>(null);
  const [symptomInts, setSymptomInts] = useState<Map<string, number>>(new Map());

  useEffect(() => {
    if (!existing) return;
    setFlow(existing.flow);
    setMood(existing.mood);
    setMucus(existing.cervicalMucus);
    setLh(existing.lhTest);
    // Stored values are canonical \u00b0C (older rows may be raw \u00b0F \u2014 the helper
    // detects via the >50 heuristic). Always show in the user's chosen unit.
    const display = storedToDisplay(existing.bbt, tempUnit);
    setBbt(display != null ? display.toFixed(2) : '');
    setNotes(existing.notes ?? '');
    setSexKind(existing.sex?.kind ?? null);
    setSexProtection(existing.sex?.protection ?? null);
    setSexDrive(existing.sex?.drive ?? null);
    setSymptomInts(
      new Map(existing.symptoms.map((s) => [s.tag, Math.min(3, Math.max(1, s.intensity || 1))])),
    );
  }, [existing, tempUnit]);

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
    // Always persist in canonical \u00b0C. parseInputToCelsius handles both units
    // and trims whitespace; returns null for empty input.
    const bbtCelsius = parseInputToCelsius(bbt, tempUnit);
    // Build the sex log only if any of its fields were touched. A user who
    // logs only "drive: 4" with no activity gets a record with kind=null —
    // we coerce that to kind='none' so the persisted shape always has a kind.
    const anySexSet = sexKind !== null || sexProtection !== null || sexDrive !== null;
    const sexPayload = anySexSet
      ? {
          kind: sexKind ?? 'none',
          // Protection is only relevant for partnered activity; drop it
          // otherwise to avoid storing meaningless data.
          protection: sexKind === 'partnered' ? sexProtection : null,
          drive: sexDrive,
        }
      : null;
    upsert.mutate(
      {
        flow,
        mood,
        cervicalMucus: mucus,
        lhTest: lh,
        bbt: bbtCelsius,
        notes: notes.trim() === '' ? null : notes,
        sex: sexPayload,
        symptoms: [...symptomInts.entries()].map(([tag, intensity]) => ({ tag, intensity })),
      },
      {
        onSuccess: () => router.back(),
        onError: (e) => Alert.alert('Save failed', describeError(e)),
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
      title: 'Ovulation test',
      icon: 'check-square' as const,
      content: (
        <View className="gap-3">
          <Text className="text-ink-muted text-xs leading-4">
            Pee-stick or digital test that picks up the LH surge a day or two before
            ovulation. Compare the test line to the control: faint = early surge, as dark
            or darker = peak.
          </Text>
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
        </View>
      ),
    },
    {
      title: 'Sex',
      icon: 'heart' as const,
      content: (
        <View className="gap-4">
          <View>
            <Text
              className="text-ink-muted text-xs font-hand mb-2"
              style={{ transform: [{ rotate: '-1deg' }] }}
            >
              activity
            </Text>
            <View className="flex-row flex-wrap gap-2">
              {SEX_KINDS.map((s) => (
                <Chip
                  key={s.value}
                  label={s.label}
                  selected={sexKind === s.value}
                  onPress={() => {
                    if (sexKind === s.value) {
                      setSexKind(null);
                      setSexProtection(null);
                    } else {
                      setSexKind(s.value);
                      // Clear protection if switching away from partnered.
                      if (s.value !== 'partnered') setSexProtection(null);
                    }
                  }}
                />
              ))}
            </View>
          </View>

          {sexKind === 'partnered' && (
            <View>
              <Text
                className="text-ink-muted text-xs font-hand mb-2"
                style={{ transform: [{ rotate: '-1deg' }] }}
              >
                protection
              </Text>
              <View className="flex-row flex-wrap gap-2">
                {SEX_PROTECTION.map((p) => (
                  <Chip
                    key={p.value}
                    label={p.label}
                    selected={sexProtection === p.value}
                    onPress={() =>
                      setSexProtection(sexProtection === p.value ? null : p.value)
                    }
                  />
                ))}
              </View>
            </View>
          )}

          <View>
            <Text
              className="text-ink-muted text-xs font-hand mb-2"
              style={{ transform: [{ rotate: '-1deg' }] }}
            >
              drive
            </Text>
            {/*
              Numeric 1-5 scale rather than verbal labels: written labels
              ("very high", etc.) blow past the right edge of the screen on
              compact phones and don't reflow nicely. The flex-1 buttons
              divide the row evenly at any width, and the low/high key
              underneath conveys what the numbers mean without burning
              horizontal space.
            */}
            <View className="flex-row gap-2">
              {Array.from({ length: SEX_DRIVE_MAX - SEX_DRIVE_MIN + 1 }, (_, i) => {
                const v = SEX_DRIVE_MIN + i;
                const selected = sexDrive === v;
                return (
                  <Pressable
                    key={v}
                    onPress={() => setSexDrive(selected ? null : v)}
                    accessibilityRole="radio"
                    accessibilityState={{ selected }}
                    accessibilityLabel={`Drive ${v} of ${SEX_DRIVE_MAX}`}
                    className={`flex-1 py-2.5 rounded-full items-center ${
                      selected ? 'bg-accent' : 'bg-bg-soft'
                    } active:opacity-70`}
                    style={{
                      borderWidth: selected ? 1.5 : 1,
                      borderColor: selected ? palette.ink : palette.ink + '18',
                    }}
                  >
                    <Text
                      className={`text-base ${
                        selected ? 'text-white font-bold' : 'text-ink font-medium'
                      }`}
                    >
                      {v}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
            <View className="flex-row justify-between mt-1.5 px-1">
              <Text className="text-ink-muted text-xs">low</Text>
              <Text className="text-ink-muted text-xs">high</Text>
            </View>
          </View>
        </View>
      ),
    },
    {
      title: 'Wake-up temperature',
      icon: 'thermometer' as const,
      content: (
        <View className="gap-2">
          <Text className="text-ink-muted text-xs leading-4">
            Take it first thing, before getting out of bed. A small bump that lasts a few days
            usually means ovulation just happened.
          </Text>
          <View className="flex-row items-center gap-2">
            <TextInput
              value={bbt}
              onChangeText={setBbt}
              keyboardType="decimal-pad"
              placeholder={placeholderFor(tempUnit)}
              placeholderTextColor={palette.inkDim}
              className="text-ink text-lg py-2 bg-bg-soft rounded-xl px-4 flex-1"
            />
            <Text className="text-ink-muted text-base font-bold">{unitLabel(tempUnit)}</Text>
          </View>
          {bbt.trim() !== '' &&
            (() => {
              const n = Number(bbt);
              if (!Number.isFinite(n)) return null;
              if (isPlausible(n, tempUnit)) return null;
              return (
                <Text className="text-ink-muted text-xs">
                  That looks outside the usual {tempUnit === 'C' ? '34\u201339\u00b0C' : '93\u2013102\u00b0F'}{' '}
                  range \u2014 double-check the unit in Settings if needed.
                </Text>
              );
            })()}
        </View>
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
    <Screen topInset={false} modalHandle>
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
