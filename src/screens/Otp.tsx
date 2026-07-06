import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  TextInput,
  StyleSheet,
  NativeSyntheticEvent,
  TextInputKeyPressEventData,
} from 'react-native';
import { StackScreenProps } from '@react-navigation/stack';
import { useTheme } from '~/theme';
import { Screen, Text, Button } from '~/components';
import { useAppDispatch, useAppSelector } from '~/redux/hooks';
import { sendOtp, verifyOtp } from '~/redux/auth/authSlice';
import { AuthStackParamList } from '~/navigation/types';

const CODE_LENGTH = 6;
const RESEND_SECONDS = 30;

type Props = StackScreenProps<AuthStackParamList, 'Otp'>;

export default function Otp({ route, navigation }: Props) {
  const { phone } = route.params;
  const theme = useTheme();
  const dispatch = useAppDispatch();
  const status = useAppSelector((state) => state.auth.status);
  const error = useAppSelector((state) => state.auth.error);
  const pendingUid = useAppSelector((state) => state.auth.pendingUid);

  const [digits, setDigits] = useState<string[]>(Array(CODE_LENGTH).fill(''));
  const [secondsLeft, setSecondsLeft] = useState(RESEND_SECONDS);
  const inputRefs = useRef<(TextInput | null)[]>([]);

  const loading = status === 'loading';

  useEffect(() => {
    if (secondsLeft <= 0) return;
    const timer = setTimeout(() => setSecondsLeft((s) => s - 1), 1000);
    return () => clearTimeout(timer);
  }, [secondsLeft]);

  useEffect(() => {
    if (pendingUid) {
      // Role isn't known yet at this point in the OTP flow — Register shows a role toggle so
      // the user can confirm/change it right there, defaulting to Partner.
      navigation.replace('Register', { uid: pendingUid, phone, role: 'partner' });
    }
  }, [pendingUid, phone, navigation]);

  function handleChange(text: string, index: number) {
    // Paste-friendly: if the user pastes/enters more than one digit, spread it across boxes.
    if (text.length > 1) {
      const pasted = text.replace(/\D/g, '').slice(0, CODE_LENGTH).split('');
      const next = Array(CODE_LENGTH).fill('');
      pasted.forEach((d, i) => (next[i] = d));
      setDigits(next);
      const lastIndex = Math.min(pasted.length, CODE_LENGTH) - 1;
      inputRefs.current[Math.max(lastIndex, 0)]?.focus();
      return;
    }

    const next = [...digits];
    next[index] = text.replace(/\D/g, '');
    setDigits(next);

    if (text && index < CODE_LENGTH - 1) {
      inputRefs.current[index + 1]?.focus();
    }
  }

  function handleKeyPress(e: NativeSyntheticEvent<TextInputKeyPressEventData>, index: number) {
    if (e.nativeEvent.key === 'Backspace' && !digits[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  }

  function handleVerify() {
    const code = digits.join('');
    if (code.length !== CODE_LENGTH) return;
    dispatch(verifyOtp({ phone, code }));
  }

  function handleResend() {
    if (secondsLeft > 0) return;
    setDigits(Array(CODE_LENGTH).fill(''));
    setSecondsLeft(RESEND_SECONDS);
    dispatch(sendOtp(phone));
  }

  const code = digits.join('');

  return (
    <Screen style={styles.container}>
      <Text variant="title" style={{ marginBottom: theme.spacing.sm }}>
        Enter Code
      </Text>

      <View style={[styles.phoneRow, { marginBottom: theme.spacing.xl }]}>
        <Text variant="body" color="textMuted">
          Sent to {phone}
        </Text>
        <Text
          variant="body"
          color="primary"
          onPress={() => navigation.navigate('Welcome')}
          style={{ marginLeft: theme.spacing.sm }}>
          Edit
        </Text>
      </View>

      <View style={styles.codeRow}>
        {digits.map((digit, index) => (
          <TextInput
            key={index}
            ref={(ref) => {
              inputRefs.current[index] = ref;
            }}
            value={digit}
            onChangeText={(text) => handleChange(text, index)}
            onKeyPress={(e) => handleKeyPress(e, index)}
            keyboardType="number-pad"
            maxLength={CODE_LENGTH}
            style={[
              styles.codeBox,
              {
                borderColor: theme.colors.border,
                color: theme.colors.text,
                borderRadius: theme.radius.md,
              },
            ]}
          />
        ))}
      </View>

      {error ? (
        <Text variant="caption" color="error" style={{ marginTop: theme.spacing.md }}>
          {error}
        </Text>
      ) : null}

      <Button
        title={loading ? 'Verifying...' : 'Verify'}
        onPress={handleVerify}
        disabled={loading || code.length !== CODE_LENGTH}
        style={{ marginTop: theme.spacing.xl }}
      />

      <Text
        variant="caption"
        color={secondsLeft > 0 ? 'textMuted' : 'primary'}
        onPress={handleResend}
        style={{ marginTop: theme.spacing.lg, textAlign: 'center' }}>
        {secondsLeft > 0 ? `Resend code in ${secondsLeft}s` : 'Resend code'}
      </Text>
    </Screen>
  );
}

const styles = StyleSheet.create({
  container: {
    justifyContent: 'center',
    padding: 24,
  },
  phoneRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  codeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  codeBox: {
    width: 44,
    height: 52,
    borderWidth: 1,
    textAlign: 'center',
    fontSize: 20,
  },
});
