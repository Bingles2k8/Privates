import { Modal, Pressable, Text, View } from 'react-native';
import Animated, { FadeIn, FadeOut, SlideInDown, SlideOutDown } from 'react-native-reanimated';
import { Chip } from './Chip';
import { HandIcon } from './HandIcon';
import { MoodScale } from './MoodScale';
import { PrimaryButton } from './PrimaryButton';
import { FLOW_LEVELS } from '@/data/constants';
import { useTheme } from '@/theme/useTheme';

/**
 * Bottom-sheet modal version of the quick-log surface. Opens from the
 * "Quick log" button beneath the mascot on Today. Non-bouncy: simple
 * slide-up + fade, closes on backdrop tap or save. No layout-animation
 * springs — the old sticky bar was too lively.
 */
export function QuickLogModal({
  visible,
  onClose,
  flow,
  mood,
  onFlowChange,
  onMoodChange,
  onSave,
  dirty,
  saving,
}: {
  visible: boolean;
  onClose: () => void;
  flow: number | null;
  mood: number | null;
  onFlowChange: (next: number | null) => void;
  onMoodChange: (next: number | null) => void;
  onSave: () => void;
  dirty: boolean;
  saving: boolean;
}) {
  const { palette, isDark } = useTheme();

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      onRequestClose={onClose}
      statusBarTranslucent
    >
      {visible && (
        <View style={{ flex: 1 }}>
          <Animated.View
            entering={FadeIn.duration(180)}
            exiting={FadeOut.duration(160)}
            style={{
              ...StyleSheetAbsoluteFill,
              backgroundColor: 'rgba(0,0,0,0.35)',
            }}
          >
            <Pressable style={{ flex: 1 }} onPress={onClose} />
          </Animated.View>

          <View style={{ flex: 1, justifyContent: 'flex-end' }} pointerEvents="box-none">
            <Animated.View
              entering={SlideInDown.duration(220)}
              exiting={SlideOutDown.duration(180)}
              style={{
                backgroundColor: palette.bgCard,
                borderTopLeftRadius: 28,
                borderTopRightRadius: 28,
                borderWidth: 1.5,
                borderColor: isDark ? palette.bgSoft : palette.ink + '22',
                shadowColor: isDark ? '#000' : palette.ink,
                shadowOpacity: isDark ? 0.5 : 0.35,
                shadowRadius: isDark ? 12 : 0,
                shadowOffset: { width: 0, height: -4 },
                elevation: 10,
                paddingHorizontal: 20,
                paddingTop: 16,
                paddingBottom: 32,
              }}
            >
              {/* handle */}
              <View
                style={{
                  alignSelf: 'center',
                  width: 44,
                  height: 5,
                  borderRadius: 3,
                  backgroundColor: palette.ink + '22',
                  marginBottom: 12,
                }}
              />

              <View className="flex-row items-center gap-2 mb-4">
                <HandIcon name="edit-3" size={16} color={palette.inkMuted} />
                <Text
                  className="text-ink-muted text-lg font-hand flex-1"
                  style={{ transform: [{ rotate: '-0.5deg' }] }}
                >
                  quick log
                </Text>
                <Pressable
                  onPress={onClose}
                  hitSlop={14}
                  accessibilityRole="button"
                  accessibilityLabel="Close quick log"
                >
                  <HandIcon name="x" size={18} color={palette.inkMuted} />
                </Pressable>
              </View>

              <Text
                className="text-ink-muted text-base font-hand mb-2"
                style={{ transform: [{ rotate: '-1deg' }] }}
              >
                flow
              </Text>
              <View className="flex-row flex-wrap gap-2">
                {FLOW_LEVELS.map((f) => (
                  <Chip
                    key={f.value}
                    label={f.label}
                    tone="period"
                    selected={flow === f.value}
                    onPress={() => onFlowChange(flow === f.value ? null : f.value)}
                  />
                ))}
              </View>

              <Text
                className="text-ink-muted text-base font-hand mt-5 mb-2"
                style={{ transform: [{ rotate: '1deg' }] }}
              >
                mood
              </Text>
              <MoodScale value={mood} onChange={onMoodChange} />

              <View className="mt-5">
                <PrimaryButton
                  label={saving ? 'Saving…' : dirty ? 'Save' : 'Saved'}
                  icon={
                    <HandIcon name={dirty ? 'save' : 'check'} size={16} color="white" />
                  }
                  onPress={onSave}
                  disabled={!dirty || saving}
                />
              </View>
            </Animated.View>
          </View>
        </View>
      )}
    </Modal>
  );
}

// Inline constant so we don't import StyleSheet just for one call.
const StyleSheetAbsoluteFill = {
  position: 'absolute' as const,
  top: 0,
  left: 0,
  right: 0,
  bottom: 0,
};
