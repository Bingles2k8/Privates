import { useState } from 'react';
import { Alert, Pressable, Text, TextInput, View } from 'react-native';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { Card, CardTitle } from '@/ui/Card';
import { HandIcon } from '@/ui/HandIcon';
import { PrimaryButton } from '@/ui/PrimaryButton';
import { Screen } from '@/ui/Screen';
import { createCustomTag, deleteCustomTag, listCustomTags, type TagKind } from '@/data/customTags';
import { tagUsageCounts } from '@/data/dayLogs';
import { SYMPTOM_TAGS, MOOD_TAGS } from '@/data/constants';
import { useTheme } from '@/theme/useTheme';

export default function TagsScreen() {
  return (
    <Screen topInset={false} modalHandle>
      <View>
        <Text
          className="text-ink-muted text-sm font-hand"
          style={{ transform: [{ rotate: '-1deg' }] }}
        >
          your vocabulary
        </Text>
        <Text className="text-ink text-4xl font-display mt-0.5">Tags</Text>
      </View>

      <TagSection kind="symptom" title="Symptoms" builtins={SYMPTOM_TAGS as readonly string[]} />
      <TagSection kind="mood" title="Moods" builtins={MOOD_TAGS as readonly string[]} />
    </Screen>
  );
}

function TagSection({
  kind,
  title,
  builtins,
}: {
  kind: TagKind;
  title: string;
  builtins: readonly string[];
}) {
  const qc = useQueryClient();
  const { palette } = useTheme();
  const [newLabel, setNewLabel] = useState('');

  const { data: custom } = useQuery({
    queryKey: ['customTags', kind],
    queryFn: () => listCustomTags(kind),
  });

  const { data: usage } = useQuery({
    queryKey: ['tagUsage'],
    queryFn: tagUsageCounts,
  });

  async function onAdd() {
    const label = newLabel.trim();
    if (label.length === 0) return;
    await createCustomTag(kind, label);
    setNewLabel('');
    qc.invalidateQueries({ queryKey: ['customTags', kind] });
  }

  function onDelete(id: string, label: string) {
    Alert.alert('Delete tag?', `"${label}" will no longer appear in pickers. Past logs keep their entries.`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          await deleteCustomTag(id);
          qc.invalidateQueries({ queryKey: ['customTags', kind] });
        },
      },
    ]);
  }

  const usageMap = kind === 'symptom' ? usage?.symptoms ?? {} : usage?.moods ?? {};

  const sortedBuiltins = [...builtins].sort((a, b) => (usageMap[b] ?? 0) - (usageMap[a] ?? 0));

  return (
    <Animated.View entering={FadeInDown.duration(300)}>
      <Card>
        <CardTitle
          icon={
            <HandIcon
              name={kind === 'symptom' ? 'activity' : 'smile'}
              size={14}
              color={palette.inkMuted}
            />
          }
        >
          {title}
        </CardTitle>

        <Text
          className="text-ink-muted text-base font-hand mb-2"
          style={{ transform: [{ rotate: '-1deg' }] }}
        >
          your custom
        </Text>
        {custom && custom.length > 0 ? (
          <View className="gap-2 mb-4">
            {custom.map((c) => (
              <View
                key={c.id}
                className="flex-row items-center justify-between bg-bg-soft rounded-2xl px-3 py-2"
              >
                <Text className="text-ink text-sm flex-1">{c.label}</Text>
                <Text className="text-ink-dim text-xs mr-3">
                  {usageMap[c.label] ?? 0} log{(usageMap[c.label] ?? 0) === 1 ? '' : 's'}
                </Text>
                <Pressable onPress={() => onDelete(c.id, c.label)} hitSlop={8}>
                  <HandIcon name="trash-2" size={14} color={palette.inkMuted} />
                </Pressable>
              </View>
            ))}
          </View>
        ) : (
          <Text className="text-ink-dim text-xs mb-4">No custom tags yet.</Text>
        )}

        <View className="flex-row items-center gap-2 mb-4">
          <TextInput
            value={newLabel}
            onChangeText={setNewLabel}
            placeholder={`Add a ${kind}`}
            placeholderTextColor={palette.inkDim}
            autoCapitalize="none"
            className="flex-1 bg-bg-soft rounded-2xl px-3 py-2 text-ink text-sm"
            onSubmitEditing={onAdd}
          />
          <PrimaryButton
            label="Add"
            icon={<HandIcon name="plus" size={14} color="white" />}
            onPress={onAdd}
            disabled={newLabel.trim().length === 0}
          />
        </View>

        <Text
          className="text-ink-muted text-base font-hand mb-2"
          style={{ transform: [{ rotate: '1deg' }] }}
        >
          built-in · sorted by use
        </Text>
        <View className="gap-1">
          {sortedBuiltins.map((tag) => {
            const count = usageMap[tag] ?? 0;
            return (
              <View
                key={tag}
                className="flex-row items-center justify-between py-1"
              >
                <Text className="text-ink text-sm flex-1">
                  {tag.replace(/_/g, ' ')}
                </Text>
                <View
                  className="flex-row items-center gap-2"
                  style={{ opacity: count > 0 ? 1 : 0.4 }}
                >
                  <View
                    className="h-1.5 rounded-full"
                    style={{
                      backgroundColor: count > 0 ? palette.accent : palette.bgSoft,
                      width: Math.min(60, Math.max(4, count * 4)),
                    }}
                  />
                  <Text
                    className="text-ink-dim text-xs"
                    style={{ width: 30, textAlign: 'right' }}
                  >
                    {count}
                  </Text>
                </View>
              </View>
            );
          })}
        </View>
      </Card>
    </Animated.View>
  );
}
