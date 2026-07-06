import React, { useState } from 'react';
import { View, ScrollView, KeyboardAvoidingView, Platform, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { StatusBar } from 'expo-status-bar';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { StackScreenProps } from '@react-navigation/stack';
import { useTheme } from '~/theme';
import { Text, Button, Card, FormField } from '~/components';
import { useAppDispatch, useAppSelector } from '~/redux/hooks';
import { sendOtp } from '~/redux/auth/authSlice';
import { AuthStackParamList } from '~/navigation/types';

type Props = StackScreenProps<AuthStackParamList, 'Welcome'>;

const DEFAULT_COUNTRY_CODE = '+92';

function isValidPhone(countryCode: string, digits: string): boolean {
  return countryCode.startsWith('+') && countryCode.length > 1 && digits.length >= 7;
}

interface RoleActionCardProps {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  description: string;
  onRegister: () => void;
  onLogin: () => void;
}

function RoleActionCard({ icon, title, description, onRegister, onLogin }: RoleActionCardProps) {
  const theme = useTheme();

  return (
    <Card style={{ marginBottom: theme.spacing.md }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: theme.spacing.md }}>
        <View
          style={[
            styles.roleIcon,
            { backgroundColor: theme.colors.primary, borderRadius: theme.radius.md },
          ]}>
          <Ionicons name={icon} size={22} color={theme.colors.primaryText} />
        </View>
        <View style={{ flex: 1, marginLeft: theme.spacing.md }}>
          <Text variant="subtitle">{title}</Text>
          <Text variant="caption" color="textMuted">
            {description}
          </Text>
        </View>
      </View>
      <View style={{ flexDirection: 'row' }}>
        <Button
          title="Register"
          onPress={onRegister}
          style={{ flex: 1, marginRight: theme.spacing.sm }}
        />
        <Button title="Login" variant="secondary" onPress={onLogin} style={{ flex: 1 }} />
      </View>
    </Card>
  );
}

export default function Welcome({ navigation }: Props) {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const dispatch = useAppDispatch();
  const status = useAppSelector((state) => state.auth.status);
  const error = useAppSelector((state) => state.auth.error);

  const [countryCode, setCountryCode] = useState(DEFAULT_COUNTRY_CODE);
  const [digits, setDigits] = useState('');

  const loading = status === 'loading';
  const valid = isValidPhone(countryCode, digits);

  async function handleSendOtp() {
    if (!valid || loading) return;
    const phone = `${countryCode}${digits}`;
    const result = await dispatch(sendOtp(phone));
    if (sendOtp.fulfilled.match(result)) {
      navigation.navigate('Otp', { phone });
    }
  }

  return (
    <View style={{ flex: 1, backgroundColor: theme.colors.background }}>
      <StatusBar style="light" />
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView
          contentContainerStyle={{ flexGrow: 1 }}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}>
          <LinearGradient
            colors={[theme.colors.gradientStart, theme.colors.gradientEnd]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={{
              paddingTop: insets.top + theme.spacing.lg,
              paddingBottom: theme.spacing.xxl,
              paddingHorizontal: theme.spacing.lg,
            }}>
            <Text style={styles.wordmark}>BookRide</Text>
            <Text style={styles.tagline}>Book a ride, or drive and earn — your call.</Text>
          </LinearGradient>

          <View
            style={{
              flex: 1,
              marginTop: -theme.radius.lg,
              backgroundColor: theme.colors.background,
              borderTopLeftRadius: theme.radius.lg * 1.75,
              borderTopRightRadius: theme.radius.lg * 1.75,
              padding: theme.spacing.lg,
            }}>
            <Card style={{ marginBottom: theme.spacing.lg }}>
              <Text variant="subtitle" style={{ marginBottom: theme.spacing.md }}>
                Login with phone
              </Text>
              <View style={{ flexDirection: 'row' }}>
                <FormField
                  label="Code"
                  value={countryCode}
                  onChangeText={setCountryCode}
                  placeholder="+92"
                  keyboardType="phone-pad"
                  containerStyle={{ width: 84, marginRight: theme.spacing.sm }}
                />
                <FormField
                  label="Phone number"
                  value={digits}
                  onChangeText={(text) => setDigits(text.replace(/\D/g, ''))}
                  placeholder="3xx xxxxxxx"
                  keyboardType="phone-pad"
                  containerStyle={{ flex: 1 }}
                />
              </View>

              {error ? (
                <Text variant="caption" color="error" style={{ marginBottom: theme.spacing.sm }}>
                  {error}
                </Text>
              ) : null}

              <Button
                title={loading ? 'Sending...' : 'Send OTP'}
                onPress={handleSendOtp}
                disabled={!valid || loading}
                loading={loading}
              />
            </Card>

            <Text
              variant="caption"
              color="textMuted"
              style={{ textAlign: 'center', marginBottom: theme.spacing.lg }}>
              or continue as
            </Text>

            <RoleActionCard
              icon="briefcase-outline"
              title="Partner"
              description="Book rides and manage your trips."
              onRegister={() => navigation.navigate('Register', { role: 'partner' })}
              onLogin={() => navigation.navigate('RoleLogin', { role: 'partner' })}
            />
            <RoleActionCard
              icon="car-outline"
              title="Driver"
              description="Drive and earn with your vehicle."
              onRegister={() => navigation.navigate('Register', { role: 'driver' })}
              onLogin={() => navigation.navigate('RoleLogin', { role: 'driver' })}
            />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  wordmark: {
    fontSize: 34,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: 0.5,
  },
  tagline: {
    marginTop: 6,
    fontSize: 15,
    color: 'rgba(255,255,255,0.9)',
  },
  roleIcon: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
