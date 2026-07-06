import React from 'react';
import { Screen, Text, Button, Card } from '~/components';
import { useTheme } from '~/theme';
import { useAppDispatch, useAppSelector } from '~/redux/hooks';
import { logout } from '~/redux/auth/authSlice';

export default function Profile() {
  const theme = useTheme();
  const dispatch = useAppDispatch();
  const user = useAppSelector((state) => state.auth.user);

  return (
    <Screen style={{ padding: theme.spacing.lg }}>
      <Card>
        <Text variant="subtitle">{user?.fullName || 'Your account'}</Text>
        <Text variant="body" color="textMuted" style={{ marginTop: theme.spacing.xs }}>
          {user?.phone}
        </Text>
        <Text variant="caption" color="textMuted" style={{ marginTop: theme.spacing.xs }}>
          {user?.role === 'driver' ? 'Driver' : 'Partner'}
        </Text>
      </Card>
      <Button
        title="Logout"
        variant="secondary"
        onPress={() => dispatch(logout())}
        style={{ marginTop: theme.spacing.lg }}
      />
    </Screen>
  );
}
