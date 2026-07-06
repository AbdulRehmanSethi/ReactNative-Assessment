import React, { useState } from 'react';
import { View, ScrollView, KeyboardAvoidingView, Platform } from 'react-native';
import { StackScreenProps } from '@react-navigation/stack';
import { useTheme } from '~/theme';
import {
  Screen,
  Text,
  Button,
  Card,
  FormField,
  CNICInput,
  SegmentedControl,
  DateField,
  ImagePickerTile,
  ImagePickerGrid,
} from '~/components';
import { PickedImage } from '~/hooks/useImagePicker';
import { useAppDispatch, useAppSelector } from '~/redux/hooks';
import { submitRegistration } from '~/redux/auth/authSlice';
import { SimpleRegistrationPayload } from '~/redux/auth/registrationTypes';
import { VehicleType } from '~/services/profileTypes';
import { AuthStackParamList } from '~/navigation/types';

type Props = StackScreenProps<AuthStackParamList, 'Register'>;

const VEHICLE_TYPE_OPTIONS: { label: string; value: VehicleType }[] = [
  { label: 'Bike', value: 'bike' },
  { label: 'Car', value: 'car' },
  { label: 'Rickshaw', value: 'rickshaw' },
];

export default function Register({ route }: Props) {
  const { role: initialRole, uid, phone: initialPhone } = route.params;
  const theme = useTheme();
  const dispatch = useAppDispatch();
  const status = useAppSelector((state) => state.auth.status);
  const error = useAppSelector((state) => state.auth.error);
  const registrationProgress = useAppSelector((state) => state.auth.registrationProgress);

  const [role, setRole] = useState<'partner' | 'driver'>(initialRole);
  const [fullName, setFullName] = useState('');
  const [cnic, setCnic] = useState('');
  const [phone, setPhone] = useState(initialPhone ?? '');
  const [email, setEmail] = useState('');
  const [profilePhoto, setProfilePhoto] = useState<PickedImage | null>(null);
  const [licenseNumber, setLicenseNumber] = useState('');
  const [licenseExpiry, setLicenseExpiry] = useState<string | null>(null);
  const [licenseImage, setLicenseImage] = useState<PickedImage | null>(null);
  const [vehicleType, setVehicleType] = useState<VehicleType | null>(null);
  const [vehicleModel, setVehicleModel] = useState('');
  const [vehicleReg, setVehicleReg] = useState('');
  const [vehicleColor, setVehicleColor] = useState('');
  const [vehicleImages, setVehicleImages] = useState<PickedImage[]>([]);
  const [attempted, setAttempted] = useState(false);

  const submitting = status === 'loading';
  const fullNameError =
    attempted && fullName.trim().length < 2
      ? 'Enter your full name (at least 2 characters)'
      : undefined;

  function handleSubmit() {
    setAttempted(true);
    if (fullName.trim().length < 2 || submitting) return;

    const payload: SimpleRegistrationPayload = {
      uid: uid || undefined,
      phone: phone.trim() || undefined,
      role,
      fullName: fullName.trim(),
      cnic: cnic.trim() || undefined,
      email: role === 'partner' ? email.trim() || undefined : undefined,
      profilePhoto: profilePhoto ?? undefined,
      license:
        role === 'driver'
          ? {
              number: licenseNumber.trim() || undefined,
              expiryDate: licenseExpiry ?? undefined,
              image: licenseImage ?? undefined,
            }
          : undefined,
      vehicle:
        role === 'driver'
          ? {
              type: vehicleType ?? undefined,
              model: vehicleModel.trim() || undefined,
              registrationNumber: vehicleReg.trim() || undefined,
              color: vehicleColor.trim() || undefined,
              images: vehicleImages.length ? vehicleImages : undefined,
            }
          : undefined,
    };

    dispatch(submitRegistration(payload));
    // No manual navigation on success — RootNavigator swaps stacks once state.auth.user is set.
  }

  const submitLabel = registrationProgress
    ? `Saving ${registrationProgress.completed}/${registrationProgress.total}…`
    : 'Create Account';

  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);

  return (
    <Screen style={{ flex: 1 }}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ padding: theme.spacing.lg, paddingBottom: theme.spacing.xxl }}>
          <Text variant="title" style={{ marginBottom: theme.spacing.xs }}>
            Create your account
          </Text>
          <Text variant="body" color="textMuted" style={{ marginBottom: theme.spacing.lg }}>
            Only your full name is required — everything else can be added now or later.
          </Text>

          <Card style={{ marginBottom: theme.spacing.md }}>
            <SegmentedControl
              label="I am a"
              options={[
                { label: 'Partner', value: 'partner' as const },
                { label: 'Driver', value: 'driver' as const },
              ]}
              value={role}
              onChange={setRole}
            />

            <FormField
              label="Full Name"
              placeholder="Your full name"
              value={fullName}
              onChangeText={setFullName}
              error={fullNameError}
            />

            <CNICInput value={cnic} onChangeValue={setCnic} />

            <FormField
              label="Mobile Number (optional)"
              placeholder="+92 3xx xxxxxxx"
              value={phone}
              onChangeText={setPhone}
              keyboardType="phone-pad"
            />

            {role === 'partner' ? (
              <FormField
                label="Email (optional)"
                placeholder="you@example.com"
                value={email}
                onChangeText={setEmail}
                autoCapitalize="none"
                keyboardType="email-address"
              />
            ) : null}

            <ImagePickerTile
              label="Profile Photo (optional)"
              image={profilePhoto}
              onChange={setProfilePhoto}
            />
          </Card>

          {role === 'driver' ? (
            <Card style={{ marginBottom: theme.spacing.md }}>
              <Text variant="subtitle" style={{ marginBottom: theme.spacing.md }}>
                Driving License (optional)
              </Text>
              <FormField
                label="License Number"
                placeholder="License number"
                value={licenseNumber}
                onChangeText={setLicenseNumber}
              />
              <DateField
                label="Expiry Date"
                value={licenseExpiry}
                onChange={setLicenseExpiry}
                minimumDate={tomorrow}
              />
              <ImagePickerTile
                label="License Photo"
                image={licenseImage}
                onChange={setLicenseImage}
              />
            </Card>
          ) : null}

          {role === 'driver' ? (
            <Card style={{ marginBottom: theme.spacing.md }}>
              <Text variant="subtitle" style={{ marginBottom: theme.spacing.md }}>
                Vehicle (optional)
              </Text>
              <SegmentedControl
                label="Vehicle Type"
                options={VEHICLE_TYPE_OPTIONS}
                value={vehicleType}
                onChange={setVehicleType}
              />
              <FormField
                label="Model"
                placeholder="e.g. Honda CD 70"
                value={vehicleModel}
                onChangeText={setVehicleModel}
              />
              <FormField
                label="Registration Number"
                placeholder="e.g. LEA-1234"
                value={vehicleReg}
                onChangeText={setVehicleReg}
                autoCapitalize="characters"
              />
              <FormField
                label="Color"
                placeholder="e.g. White"
                value={vehicleColor}
                onChangeText={setVehicleColor}
              />
              <ImagePickerGrid
                label="Vehicle Photos"
                images={vehicleImages}
                onChange={setVehicleImages}
                min={0}
                max={4}
              />
            </Card>
          ) : null}

          {error ? (
            <Text variant="body" color="error" style={{ marginBottom: theme.spacing.md }}>
              {error}
            </Text>
          ) : null}

          <View style={{ marginTop: theme.spacing.sm }}>
            <Button
              title={submitLabel}
              onPress={handleSubmit}
              disabled={submitting}
              loading={submitting}
            />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </Screen>
  );
}
