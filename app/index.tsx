import { Redirect } from 'expo-router';
import { ActivityIndicator, View } from 'react-native';
import { useSession } from '@/state/session';
import { useTheme } from '@/theme/useTheme';

export default function Index() {
  const status = useSession((s) => s.status);
  const { palette } = useTheme();
  if (status === 'unknown') {
    return (
      <View className="flex-1 items-center justify-center bg-bg">
        <ActivityIndicator color={palette.accent} />
      </View>
    );
  }
  if (status === 'needsOnboarding') return <Redirect href="/onboarding" />;
  if (status === 'locked') return <Redirect href="/lock" />;
  return <Redirect href="/(tabs)" />;
}
