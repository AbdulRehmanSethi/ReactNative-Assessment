import React from 'react';
import { NavigationContainer, LinkingOptions } from '@react-navigation/native';
import { useAppSelector } from '~/redux/hooks';
import AuthStack from '~/navigation/AuthStack';
import PartnerNavigator from '~/navigation/PartnerNavigator';
import DriverNavigator from '~/navigation/DriverNavigator';

const linking: LinkingOptions<object> = {
  prefixes: ['rnassessment://'],
  config: { screens: {} }, // extend as concrete deep-link routes land in later phases
};

export default function RootNavigator() {
  const user = useAppSelector((state) => state.auth.user);

  return (
    <NavigationContainer linking={linking}>
      {!user ? <AuthStack /> : user.role === 'partner' ? <PartnerNavigator /> : <DriverNavigator />}
    </NavigationContainer>
  );
}
