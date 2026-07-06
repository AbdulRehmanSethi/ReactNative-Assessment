import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { DriverTabParamList } from '~/navigation/types';
import { useTheme } from '~/theme';
import { useAppSelector } from '~/redux/hooks';
import { useOnlineDriverRequests } from '~/hooks/useOnlineDriverRequests';
import DriverHome from '~/screens/DriverHome';
import Profile from '~/screens/Profile';
import DriverRequests from '~/screens/ride/DriverRequests';

const Tab = createBottomTabNavigator<DriverTabParamList>();

const ICONS: Record<keyof DriverTabParamList, keyof typeof Ionicons.glyphMap> = {
  Home: 'home',
  Requests: 'car',
  Profile: 'person',
};

export default function DriverTabs() {
  const theme = useTheme();
  const online = useAppSelector((state) => state.driver.online);
  const location = useAppSelector((state) => state.driver.location);
  // Kept mounted here (not in DriverRequests) so the listener stays active across the whole
  // driver session regardless of which tab is focused — bottom-tabs can lazily mount screens,
  // so a badge driven only from the screen itself would never appear before the tab is opened.
  const { requests } = useOnlineDriverRequests(location, online);
  const badgeCount = requests.length;

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: theme.colors.primary,
        tabBarInactiveTintColor: theme.colors.textMuted,
        tabBarStyle: {
          backgroundColor: theme.colors.background,
          borderTopColor: theme.colors.border,
        },
        tabBarIcon: ({ color, size }) => (
          <Ionicons
            name={ICONS[route.name as keyof DriverTabParamList]}
            size={size}
            color={color}
          />
        ),
      })}>
      <Tab.Screen name="Home" component={DriverHome} />
      <Tab.Screen
        name="Requests"
        component={DriverRequests}
        options={{ tabBarBadge: badgeCount > 0 ? badgeCount : undefined }}
      />
      <Tab.Screen name="Profile" component={Profile} />
    </Tab.Navigator>
  );
}
