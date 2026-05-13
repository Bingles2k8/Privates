import { Tabs } from 'expo-router';
import { Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { HandIcon } from '@/ui/HandIcon';
import { useTheme } from '@/theme/useTheme';

export default function TabsLayout() {
  const { palette } = useTheme();
  const insets = useSafeAreaInsets();
  // Android with the 3-button nav reports a real bottom inset; gesture-nav
  // devices report ~0. We add a small constant on top of that so labels
  // sit a touch above the system nav instead of pressed right against it.
  const extra = Platform.OS === 'android' ? 10 : 0;
  const bottomInset = Math.max(insets.bottom, Platform.OS === 'android' ? 8 : 12) + extra;
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: palette.bg,
          borderTopColor: palette.bgSoft,
          borderTopWidth: 1,
          height: 60 + bottomInset,
          paddingTop: 8,
          paddingBottom: bottomInset,
        },
        tabBarLabelStyle: { fontFamily: 'Nunito_600SemiBold', fontSize: 11 },
        tabBarActiveTintColor: palette.accent,
        tabBarInactiveTintColor: palette.inkDim,
        sceneStyle: { backgroundColor: palette.bg },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Today',
          tabBarIcon: ({ color, size }) => <HandIcon name="sun" color={color} size={size - 2} />,
        }}
      />
      <Tabs.Screen
        name="calendar"
        options={{
          title: 'Calendar',
          tabBarIcon: ({ color, size }) => <HandIcon name="calendar" color={color} size={size - 2} />,
        }}
      />
      <Tabs.Screen
        name="insights"
        options={{
          title: 'Insights',
          tabBarIcon: ({ color, size }) => <HandIcon name="trending-up" color={color} size={size - 2} />,
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: 'Settings',
          tabBarIcon: ({ color, size }) => <HandIcon name="settings" color={color} size={size - 2} />,
        }}
      />
    </Tabs>
  );
}
