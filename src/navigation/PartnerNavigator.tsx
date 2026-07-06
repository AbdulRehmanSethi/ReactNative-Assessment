import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import { PartnerStackParamList } from '~/navigation/types';
import { useAppSelector } from '~/redux/hooks';
import PartnerTabs from '~/navigation/PartnerTabs';
import Offers from '~/screens/ride/Offers';
import ActiveRide from '~/screens/ride/ActiveRide';

const Stack = createStackNavigator<PartnerStackParamList>();

export default function PartnerNavigator() {
  const activeRideId = useAppSelector((state) => state.ride.activeRideId);

  // "Light" resume within the current session — see Phase 4 plan notes: `ride` isn't persisted,
  // so this only covers in-session navigator remounts, not resume-after-app-kill (that's Phase 5).
  const initialRouteName = activeRideId ? 'ActiveRide' : 'Tabs';

  return (
    <Stack.Navigator screenOptions={{ headerShown: false }} initialRouteName={initialRouteName}>
      <Stack.Screen name="Tabs" component={PartnerTabs} />
      <Stack.Screen name="Offers" component={Offers} />
      <Stack.Screen
        name="ActiveRide"
        component={ActiveRide}
        initialParams={{ rideId: activeRideId ?? '' }}
      />
    </Stack.Navigator>
  );
}
