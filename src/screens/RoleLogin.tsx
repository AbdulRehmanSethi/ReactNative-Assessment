import React, { useState } from 'react';
import { View, ScrollView, KeyboardAvoidingView, Platform } from 'react-native';
import { StackScreenProps } from '@react-navigation/stack';
import { useTheme } from '~/theme';
import { Screen, Text, Button, Card, FormField } from '~/components';
import { useAppDispatch, useAppSelector } from '~/redux/hooks';
import { loginByName } from '~/redux/auth/authSlice';
import { AuthStackParamList } from '~/navigation/types';

type Props = StackScreenProps<AuthStackParamList, 'RoleLogin'>;

const NOT_FOUND_MESSAGE = 'No profile found — register first.';

export default function RoleLogin({ route, navigation }: Props) {
  const { role } = route.params;
  const theme = useTheme();
  const dispatch = useAppDispatch();
  const status = useAppSelector((state) => state.auth.status);
  const error = useAppSelector((state) => state.auth.error);

  const [fullName, setFullName] = useState('');
  const [attempted, setAttempted] = useState(false);

  const loading = status === 'loading';
  const roleLabel = role === 'partner' ? 'Partner' : 'Driver';
  const notFound = error === NOT_FOUND_MESSAGE;

  function handleLogin() {
    setAttempted(true);
    if (fullName.trim().length < 2 || loading) return;
    dispatch(loginByName({ role, fullName: fullName.trim() }));
  }

  return (
    <Screen style={{ flex: 1 }}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{
            padding: theme.spacing.lg,
            flexGrow: 1,
            justifyContent: 'center',
          }}>
          <Text variant="title" style={{ marginBottom: theme.spacing.xs }}>
            Login as {roleLabel}
          </Text>
          <Text variant="body" color="textMuted" style={{ marginBottom: theme.spacing.lg }}>
            Enter the full name you registered with.
          </Text>

          <Card style={{ marginBottom: theme.spacing.md }}>
            <FormField
              label="Full Name"
              placeholder="Your full name"
              value={fullName}
              onChangeText={setFullName}
              error={attempted && fullName.trim().length < 2 ? 'Enter your full name' : undefined}
            />

            {notFound ? (
              <View
                style={{
                  padding: theme.spacing.md,
                  borderRadius: theme.radius.md,
                  backgroundColor: theme.colors.background,
                  marginBottom: theme.spacing.md,
                }}>
                <Text variant="body" color="textMuted" style={{ marginBottom: theme.spacing.sm }}>
                  No profile found with that name. Would you like to register?
                </Text>
                <Button
                  title={`Register as ${roleLabel}`}
                  variant="secondary"
                  onPress={() => navigation.replace('Register', { role })}
                />
              </View>
            ) : error ? (
              <Text variant="caption" color="error" style={{ marginBottom: theme.spacing.md }}>
                {error}
              </Text>
            ) : null}

            <Button
              title={loading ? 'Checking...' : 'Login'}
              onPress={handleLogin}
              disabled={loading}
              loading={loading}
            />
          </Card>
        </ScrollView>
      </KeyboardAvoidingView>
    </Screen>
  );
}
