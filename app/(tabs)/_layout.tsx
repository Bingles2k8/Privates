import { Tabs } from 'expo-router';
import { HandIcon } from '@/ui/HandIcon';
import { useTheme } from '@/theme/useTheme';

export default function TabsLayout() {
  const { palette } = useTheme();
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: palette.bg,
          borderTopColor: palette.bgSoft,
          borderTopWidth: 1,
          height: 84,
          paddingTop: 8,
          paddingBottom: 24,
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
