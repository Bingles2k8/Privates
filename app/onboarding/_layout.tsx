import { Stack } from 'expo-router';
import { useTheme } from '@/theme/useTheme';

export default function OnboardingLayout() {
  const { palette } = useTheme();
  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: palette.bg },
        headerTintColor: palette.ink,
        contentStyle: { backgroundColor: palette.bg },
        gestureEnabled: false,
      }}
    >
      <Stack.Screen name="index" options={{ headerShown: false }} />
      <Stack.Screen name="privacy" options={{ title: 'Your private data' }} />
      <Stack.Screen name="setup" options={{ title: 'Lock setup' }} />
      <Stack.Screen name="cycle" options={{ title: 'Your last period' }} />
    </Stack>
  );
}
