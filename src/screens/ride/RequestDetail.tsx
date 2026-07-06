import React, { useEffect, useState } from 'react';
import { View } from 'react-native';
import { StackScreenProps } from '@react-navigation/stack';
import { useTheme } from '~/theme';
import { Screen, Text, Button, Card, FormField, StatusChip, FareInput } from '~/components';
import { useAppDispatch, useAppSelector } from '~/redux/hooks';
import { submitQuote, withdrawQuote } from '~/redux/ride/rideSlice';
import { useQuoteOutcomeListener } from '~/hooks/useQuoteOutcomeListener';
import { subscribeRide } from '~/services/rideService';
import { getUserProfile } from '~/services/profileService';
import { Ride } from '~/features/ride/types';
import { VehicleType } from '~/services/profileTypes';
import { haversineDistanceMeters } from '~/utils/geo';
import { DriverStackParamList } from '~/navigation/types';

type Props = StackScreenProps<DriverStackParamList, 'RequestDetail'>;

interface DriverProfileSummary {
  fullName: string;
  vehicleType: VehicleType;
  vehicleModel: string;
}

export default function RequestDetail({ route, navigation }: Props) {
  const { rideId } = route.params;
  const theme = useTheme();
  const dispatch = useAppDispatch();
  const user = useAppSelector((state) => state.auth.user);
  const driverLocation = useAppSelector((state) => state.driver.location);
  const lastError = useAppSelector((state) => state.ride.lastError);

  const [ride, setRide] = useState<Ride | null>(null);
  const [rideError, setRideError] = useState<string | null>(null);
  const [driverProfile, setDriverProfile] = useState<DriverProfileSummary | null>(null);
  const [fare, setFare] = useState('');
  const [note, setNote] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [withdrawing, setWithdrawing] = useState(false);

  const { outcome } = useQuoteOutcomeListener(rideId, user?.id ?? '');

  useEffect(() => {
    const unsubscribe = subscribeRide(rideId, setRide, (err) => setRideError(err.message));
    return unsubscribe;
  }, [rideId]);

  useEffect(() => {
    if (!user) return;
    getUserProfile(user.id)
      .then((profile) => {
        if (profile?.role === 'driver') {
          setDriverProfile({
            fullName: profile.fullName,
            vehicleType: profile.vehicle.type,
            vehicleModel: profile.vehicle.model,
          });
        }
      })
      .catch(() => {});
  }, [user]);

  useEffect(() => {
    if (outcome === 'won') {
      navigation.replace('ActiveRide', { rideId });
    }
  }, [outcome, navigation, rideId]);

  async function handleSubmit() {
    if (!user || !driverProfile) return;
    const fareNumber = Number(fare);
    if (!fareNumber || fareNumber <= 0) return;

    setSubmitting(true);
    const result = await dispatch(
      submitQuote({
        rideId,
        driverId: user.id,
        driverName: driverProfile.fullName,
        vehicleType: driverProfile.vehicleType,
        vehicleModel: driverProfile.vehicleModel,
        fare: fareNumber,
        note: note.trim() || undefined,
      })
    );
    setSubmitting(false);
    if (submitQuote.fulfilled.match(result)) {
      setSubmitted(true);
    }
  }

  async function handleWithdraw() {
    if (!user) return;
    setWithdrawing(true);
    const result = await dispatch(withdrawQuote({ rideId, driverId: user.id }));
    setWithdrawing(false);
    if (withdrawQuote.fulfilled.match(result)) {
      navigation.goBack();
    }
  }

  if (outcome === 'lost' || outcome === 'cancelled') {
    return (
      <Screen style={{ alignItems: 'center', justifyContent: 'center', padding: theme.spacing.lg }}>
        <Card style={{ alignItems: 'center', width: '100%' }}>
          <Text variant="subtitle" style={{ textAlign: 'center' }}>
            {outcome === 'lost'
              ? 'This ride was taken by another driver'
              : 'The partner cancelled this request'}
          </Text>
          <Button
            title="Back to Requests"
            variant="secondary"
            onPress={() => navigation.goBack()}
            style={{ marginTop: theme.spacing.lg, width: '100%' }}
          />
        </Card>
      </Screen>
    );
  }

  if (!ride) {
    return (
      <Screen style={{ alignItems: 'center', justifyContent: 'center' }}>
        <Text variant="body" color="textMuted">
          {rideError ?? 'Loading trip details…'}
        </Text>
      </Screen>
    );
  }

  const distanceKm = driverLocation
    ? haversineDistanceMeters(driverLocation, ride.pickup.coords) / 1000
    : null;

  return (
    <Screen style={{ padding: theme.spacing.lg }}>
      <Text variant="title" style={{ marginBottom: theme.spacing.sm }}>
        Ride Request
      </Text>
      <StatusChip status={ride.status} />

      <Card style={{ marginTop: theme.spacing.md }}>
        <View style={{ flexDirection: 'row' }}>
          <Text variant="caption" color="textMuted" style={{ width: 70 }}>
            Pickup
          </Text>
          <Text variant="body" style={{ flex: 1 }}>
            {ride.pickup.address}
          </Text>
        </View>
        <View style={{ flexDirection: 'row', marginTop: theme.spacing.sm }}>
          <Text variant="caption" color="textMuted" style={{ width: 70 }}>
            Drop-off
          </Text>
          <Text variant="body" style={{ flex: 1 }}>
            {ride.dropoff.address}
          </Text>
        </View>
        <Text variant="caption" color="textMuted" style={{ marginTop: theme.spacing.sm }}>
          {ride.estimatedDistanceKm.toFixed(1)} km trip
          {distanceKm !== null ? ` · ${distanceKm.toFixed(1)} km from you` : ''}
        </Text>
      </Card>

      {submitted ? (
        <Card style={{ marginTop: theme.spacing.lg, alignItems: 'center' }}>
          <Text variant="subtitle">Waiting for the partner…</Text>
          <Text variant="caption" color="textMuted" style={{ marginTop: theme.spacing.xs }}>
            You offered Rs {fare}. We&apos;ll notify you if it&apos;s accepted.
          </Text>
          <Button
            title="Withdraw Offer"
            variant="secondary"
            loading={withdrawing}
            onPress={handleWithdraw}
            style={{ marginTop: theme.spacing.md, width: '100%' }}
          />
        </Card>
      ) : (
        <View style={{ marginTop: theme.spacing.lg }}>
          <FareInput value={fare} onChangeValue={setFare} />
          <FormField
            label="Note (optional)"
            placeholder="e.g. Arriving in 5 mins"
            value={note}
            onChangeText={setNote}
          />
          {lastError ? (
            <Text variant="caption" color="error" style={{ marginBottom: theme.spacing.sm }}>
              {lastError}
            </Text>
          ) : null}
          <Button
            title="Submit Quote"
            onPress={handleSubmit}
            loading={submitting}
            disabled={!driverProfile || !Number(fare) || Number(fare) <= 0}
          />
        </View>
      )}
    </Screen>
  );
}
