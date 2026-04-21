import { useRouter } from 'expo-router';
import { Text, View } from 'react-native';
import { HandIcon } from '@/ui/HandIcon';
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';
import { Screen } from '@/ui/Screen';
import { PrimaryButton } from '@/ui/PrimaryButton';
import { useTheme } from '@/theme/useTheme';

export default function OnboardingWelcome() {
  const router = useRouter();
  const { palette } = useTheme();
  return (
    <Screen>
      <View className="flex-1 justify-between pt-12 pb-6">
        <View className="gap-6">
          <Animated.View entering={FadeIn.duration(500)} className="items-center mb-2">
            <View
              className="w-20 h-20 rounded-full bg-bg-card items-center justify-center mb-4"
              style={{
                shadowColor: '#2a241f',
                shadowOpacity: 0.08,
                shadowRadius: 16,
                shadowOffset: { width: 0, height: 6 },
                elevation: 4,
              }}
            >
              <HandIcon name="shield" size={32} color={palette.accent} />
            </View>
          </Animated.View>
          <Animated.Text
            entering={FadeInDown.delay(100).duration(400)}
            className="text-ink text-5xl font-display text-center"
          >
            PrivatesTracker
          </Animated.Text>
          <Animated.Text
            entering={FadeInDown.delay(180).duration(400)}
            className="text-ink-muted text-base leading-6 text-center"
          >
            A period and reproductive-health tracker designed so that nobody — not us, not our
            servers, not law enforcement — can read your data.
          </Animated.Text>
          <View className="gap-3 pt-4">
            <Bullet delay={260}>
              Your data is encrypted on this device with a key only you control.
            </Bullet>
            <Bullet delay={320}>
              The app makes zero network calls. Nothing leaves the phone.
            </Bullet>
            <Bullet delay={380}>No account, no email, no phone number, no analytics.</Bullet>
          </View>
        </View>
        <Animated.View entering={FadeInDown.delay(440).duration(400)}>
          <PrimaryButton
            label="Continue"
            icon={<HandIcon name="arrow-right" size={16} color="white" />}
            onPress={() => router.push('/onboarding/privacy')}
          />
        </Animated.View>
      </View>
    </Screen>
  );
}

function Bullet({ children, delay = 0 }: { children: string; delay?: number }) {
  const { palette } = useTheme();
  return (
    <Animated.View
      entering={FadeInDown.delay(delay).duration(400)}
      className="flex-row gap-3 items-start"
    >
      <View style={{ marginTop: 2 }}>
        <HandIcon name="check-circle" size={18} color={palette.accent} />
      </View>
      <Text className="text-ink text-base flex-1 leading-6">{children}</Text>
    </Animated.View>
  );
}
