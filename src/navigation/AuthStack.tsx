import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import { AuthStackParamList } from '~/navigation/types';
import { useAppSelector } from '~/redux/hooks';
import Welcome from '~/screens/Welcome';
import Otp from '~/screens/Otp';
import Register from '~/screens/Register';
import RoleLogin from '~/screens/RoleLogin';

const Stack = createStackNavigator<AuthStackParamList>();

export default function AuthStack() {
  const pendingUid = useAppSelector((state) => state.auth.pendingUid);
  const pendingPhone = useAppSelector((state) => state.auth.pendingPhone);

  // Resume an interrupted registration on relaunch instead of bouncing back to Welcome.
  const initialRouteName = pendingUid ? 'Register' : 'Welcome';

  return (
    <Stack.Navigator screenOptions={{ headerShown: false }} initialRouteName={initialRouteName}>
      <Stack.Screen name="Welcome" component={Welcome} />
      <Stack.Screen name="Otp" component={Otp} initialParams={{ phone: pendingPhone ?? '' }} />
      <Stack.Screen
        name="Register"
        component={Register}
        initialParams={{
          role: 'partner',
          uid: pendingUid ?? undefined,
          phone: pendingPhone ?? undefined,
        }}
      />
      <Stack.Screen name="RoleLogin" component={RoleLogin} />
    </Stack.Navigator>
  );
}
