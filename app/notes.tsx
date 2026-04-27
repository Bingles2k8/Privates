import { useEffect, useState } from 'react';
import { Pressable, Text, TextInput, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { format, parseISO } from 'date-fns';
import { Card } from '@/ui/Card';
import { HandIcon } from '@/ui/HandIcon';
import { Screen } from '@/ui/Screen';
import { listDaysWithNotes, searchNotes } from '@/data/dayLogs';
import { useTheme } from '@/theme/useTheme';

export default function NotesScreen() {
  const router = useRouter();
  const { palette } = useTheme();
  const [input, setInput] = useState('');
  const [query, setQuery] = useState('');

  useEffect(() => {
    const t = setTimeout(() => setQuery(input.trim()), 180);
    return () => clearTimeout(t);
  }, [input]);

  const { data: searchResults } = useQuery({
    queryKey: ['notesSearch', query],
    queryFn: () => searchNotes(query, 80),
    enabled: query.length > 0,
  });

  const { data: allNotes } = useQuery({
    queryKey: ['notesList'],
    queryFn: () => listDaysWithNotes(50),
    enabled: query.length === 0,
  });

  const results = query ? searchResults ?? [] : allNotes ?? [];

  return (
    <Screen topInset={false} modalHandle>
      <View>
        <Text
          className="text-ink-muted text-sm font-hand"
          style={{ transform: [{ rotate: '-1deg' }] }}
        >
          find a thought
        </Text>
        <Text className="text-ink text-4xl font-display mt-0.5">Notes</Text>
      </View>

      <Animated.View entering={FadeInDown.duration(300)}>
        <Card>
          <View className="flex-row items-center gap-2">
            <HandIcon name="edit-3" size={14} color={palette.inkMuted} />
            <TextInput
              value={input}
              onChangeText={setInput}
              placeholder="search everything you've written"
              placeholderTextColor={palette.inkDim}
              autoCapitalize="none"
              autoCorrect={false}
              className="flex-1 text-ink text-base py-1"
            />
            {input.length > 0 && (
              <Pressable
                onPress={() => setInput('')}
                hitSlop={10}
                accessibilityRole="button"
                accessibilityLabel="Clear search"
              >
                <HandIcon name="x-circle" size={16} color={palette.inkDim} />
              </Pressable>
            )}
          </View>
        </Card>
      </Animated.View>

      {results.length === 0 ? (
        <Animated.View entering={FadeInDown.delay(80).duration(300)}>
          <Card>
            <Text className="text-ink-muted text-sm">
              {query
                ? `No notes match "${query}".`
                : 'Your day notes will show up here. Tap any one to jump to that day.'}
            </Text>
          </Card>
        </Animated.View>
      ) : (
        results.map((r, i) => (
          <Animated.View key={r.date} entering={FadeInDown.delay(40 + i * 20).duration(300)}>
            <Pressable
              onPress={() => router.push(`/log/${r.date}`)}
              className="bg-bg-card rounded-3xl p-4 active:opacity-70"
              style={{
                borderWidth: 1.5,
                borderColor: palette.ink + '22',
                shadowColor: palette.ink,
                shadowOpacity: 0.5,
                shadowRadius: 0,
                shadowOffset: { width: 2, height: 3 },
              }}
            >
              <View className="flex-row items-center justify-between mb-2">
                <Text
                  className="text-ink-muted text-xs font-hand"
                  style={{ transform: [{ rotate: '-1deg' }] }}
                >
                  {format(parseISO(r.date), 'EEEE, MMM d, yyyy').toLowerCase()}
                </Text>
                <HandIcon name="chevron-right" size={14} color={palette.inkDim} />
              </View>
              <Text className="text-ink text-sm leading-5" numberOfLines={4}>
                {query ? highlight(r.notes, query) : r.notes}
              </Text>
            </Pressable>
          </Animated.View>
        ))
      )}
    </Screen>
  );
}

function highlight(text: string, q: string): string {
  const i = text.toLowerCase().indexOf(q.toLowerCase());
  if (i < 0) return text;
  const start = Math.max(0, i - 40);
  const end = Math.min(text.length, i + q.length + 80);
  const prefix = start > 0 ? '…' : '';
  const suffix = end < text.length ? '…' : '';
  return `${prefix}${text.slice(start, end)}${suffix}`;
}
