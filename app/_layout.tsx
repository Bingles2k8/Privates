import '../global.css';
import { Stack, useRouter, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useEffect, useRef } from 'react';
import { Alert, AppState, View, type AppStateStatus } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import 'react-native-reanimated';
import {
  useFonts,
  Nunito_400Regular,
  Nunito_600SemiBold,
  Nunito_700Bold,
} from '@expo-google-fonts/nunito';
import { Fraunces_600SemiBold, Fraunces_700Bold } from '@expo-google-fonts/fraunces';
import { Caveat_500Medium, Caveat_700Bold } from '@expo-google-fonts/caveat';
import { determineInitialStatus, tryAutoUnlock } from '@/services/unlock';
import { hydrateSessionFromSettings, useSession } from '@/state/session';
import { hydrateCustomizeFromSettings } from '@/state/customize';
import { hydrateIapFromSettings } from '@/state/iap';
import { hydrateWardrobeFromSettings } from '@/state/wardrobe';
import { hydrateRemindersFromSettings } from '@/state/reminders';
import { hydrateBbtFromSettings } from '@/state/bbtPrefs';
import { hydrateRetentionFromSettings, useRetention } from '@/state/retention';
import { runRetentionSweep, sweepSummary } from '@/services/retention';
import { useRescheduleReminders } from '@/hooks/useRescheduleReminders';
import { ThemeProvider, hydrateThemeFromSettings } from '@/theme/ThemeProvider';
import { useTheme } from '@/theme/useTheme';

const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: 0, staleTime: 5_000 } },
});

// Bottom-sheet modal preset used for every screen pushed from a tab. iOS
// renders as a pageSheet with rounded corners and a native swipe-down
// dismiss; Android gets a fullscreen modal with slide-up transition. The
// stack header is suppressed because each target screen renders its own
// in-content title block (kicker + display-font heading).
const MODAL_OPTS = {
  presentation: 'modal' as const,
  headerShown: false,
  gestureEnabled: true,
};

function SessionGate() {
  const router = useRouter();
  const segments = useSegments();
  const status = useSession((s) => s.status);
  const lock = useSession((s) => s.lock);
  const lastBackgroundedAt = useRef<number | null>(null);

  useEffect(() => {
    determineInitialStatus().then(async () => {
      if (useSession.getState().status === 'locked') await tryAutoUnlock();
    });
  }, []);

  useEffect(() => {
    if (status !== 'unlocked') return;
    hydrateThemeFromSettings();
    hydrateCustomizeFromSettings();
    hydrateSessionFromSettings();
    hydrateRemindersFromSettings();
    hydrateBbtFromSettings();
    hydrateRetentionFromSettings();
    hydrateIapFromSettings();
    hydrateWardrobeFromSettings();

    // Fire retention sweep in the background — it throttles itself to once
    // per 20h, so safe to call every unlock.
    (async () => {
      try {
        const report = await runRetentionSweep();
        if (!report.ran) return;
        const summary = sweepSummary(report.totals);
        useRetention.getState().markSwept(new Date().toISOString());
        if (summary) {
          Alert.alert(
            'Retention sweep',
            `Cleared older data per your settings: ${summary}.`,
            [{ text: 'OK' }],
          );
        }
      } catch {
        /* non-fatal */
      }
    })();
  }, [status]);

  useEffect(() => {
    const sub = AppState.addEventListener('change', (next: AppStateStatus) => {
      if (next === 'background' || next === 'inactive') {
        lastBackgroundedAt.current = Date.now();
      } else if (next === 'active' && lastBackgroundedAt.current) {
        const away = Date.now() - lastBackgroundedAt.current;
        lastBackgroundedAt.current = null;
        if (useSession.getState().status !== 'unlocked') return;
        const lockAfter = useSession.getState().autoLockSeconds;
        // -1 => never; 0 => always; else compare
        if (lockAfter < 0) return;
        if (lockAfter === 0 || away > lockAfter * 1000) lock();
      }
    });
    return () => sub.remove();
  }, [lock]);

  useEffect(() => {
    const inOnboarding = segments[0] === 'onboarding';
    const onLock = segments[0] === 'lock';
    if (status === 'needsOnboarding' && !inOnboarding) router.replace('/onboarding');
    else if (status === 'locked' && !onLock) router.replace('/lock');
    else if (status === 'unlocked' && (inOnboarding || onLock)) router.replace('/');
  }, [status, segments, router]);

  return null;
}

function ReminderScheduler() {
  useRescheduleReminders();
  return null;
}

function ThemedStack() {
  const { palette, isDark } = useTheme();
  const status = useSession((s) => s.status);
  return (
    <>
      <StatusBar style={isDark ? 'light' : 'dark'} />
      {status === 'unlocked' && <ReminderScheduler />}
      <Stack
        screenOptions={{
          headerStyle: { backgroundColor: palette.bg },
          headerTintColor: palette.ink,
          contentStyle: { backgroundColor: palette.bg },
        }}
      >
        <Stack.Screen name="index" options={{ headerShown: false }} />
        <Stack.Screen name="onboarding" options={{ headerShown: false, gestureEnabled: false }} />
        <Stack.Screen name="lock" options={{ headerShown: false, gestureEnabled: false }} />
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        {/*
          Everything below is pushed from a tab screen and presents as a
          bottom-sheet modal (iOS pageSheet / Android fullscreen). No stack
          header — each screen renders its own in-content title plus a drag
          handle (via <Screen modalHandle />) so the dismiss gesture is
          obvious.
        */}
        <Stack.Screen name="log/[date]" options={MODAL_OPTS} />
        <Stack.Screen name="birth-control" options={MODAL_OPTS} />
        <Stack.Screen name="backup" options={MODAL_OPTS} />
        <Stack.Screen name="notes" options={MODAL_OPTS} />
        <Stack.Screen name="tags" options={MODAL_OPTS} />
        <Stack.Screen name="pregnancy" options={MODAL_OPTS} />
        <Stack.Screen name="learn" options={MODAL_OPTS} />
        <Stack.Screen name="settings/customize" options={MODAL_OPTS} />
        <Stack.Screen name="settings/session" options={MODAL_OPTS} />
        <Stack.Screen name="settings/reminders" options={MODAL_OPTS} />
        <Stack.Screen name="settings/bbt" options={MODAL_OPTS} />
        <Stack.Screen name="settings/retention" options={MODAL_OPTS} />
        <Stack.Screen name="settings/theme" options={MODAL_OPTS} />
        <Stack.Screen name="settings/decoy" options={MODAL_OPTS} />
        <Stack.Screen name="settings/appearance" options={MODAL_OPTS} />
        <Stack.Screen name="settings/supporter" options={MODAL_OPTS} />
        <Stack.Screen name="settings/wardrobe" options={MODAL_OPTS} />
      </Stack>
    </>
  );
}

export default function RootLayout() {
  const [fontsLoaded, fontError] = useFonts({
    Nunito_400Regular,
    Nunito_600SemiBold,
    Nunito_700Bold,
    Fraunces_600SemiBold,
    Fraunces_700Bold,
    Caveat_500Medium,
    Caveat_700Bold,
  });
  // Fall through to the app even if a font failed to load on this platform —
  // system fonts will be substituted, which is better than a permanently
  // blank placeholder screen.
  if (!fontsLoaded && !fontError) return <View style={{ flex: 1, backgroundColor: '#faf6f1' }} />;
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <QueryClientProvider client={queryClient}>
          <ThemeProvider>
            <SessionGate />
            <ThemedStack />
          </ThemeProvider>
        </QueryClientProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
