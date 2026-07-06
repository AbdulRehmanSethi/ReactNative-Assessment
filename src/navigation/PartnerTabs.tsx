import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { PartnerTabParamList } from '~/navigation/types';
import { useTheme } from '~/theme';
import PartnerHome from '~/screens/PartnerHome';
import Placeholder from '~/screens/Placeholder';
import Profile from '~/screens/Profile';

const Tab = createBottomTabNavigator<PartnerTabParamList>();

const ICONS: Record<keyof PartnerTabParamList, keyof typeof Ionicons.glyphMap> = {
  Home: 'home',
  Rides: 'list',
  Profile: 'person',
};

export default function PartnerTabs() {
  const theme = useTheme();

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
            name={ICONS[route.name as keyof PartnerTabParamList]}
            size={size}
            color={color}
          />
        ),
      })}>
      <Tab.Screen name="Home" component={PartnerHome} />
      <Tab.Screen name="Rides" component={Placeholder} />
      <Tab.Screen name="Profile" component={Profile} />
    </Tab.Navigator>
  );
}
