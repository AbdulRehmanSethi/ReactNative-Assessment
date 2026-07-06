import React, { useEffect, useState } from 'react';
import { FlatList, View } from 'react-native';
import { StackScreenProps } from '@react-navigation/stack';
import { useTheme } from '~/theme';
import {
  Screen,
  Text,
  Button,
  Card,
  StatusChip,
  QuoteCard,
  SearchingIndicator,
} from '~/components';
import { useAppDispatch, useAppSelector } from '~/redux/hooks';
import { useRideRequestListener } from '~/hooks/useRideRequestListener';
import { acceptQuote, cancelRequest, clearRideNegotiation } from '~/redux/ride/rideSlice';
import { RideStatus } from '~/features/ride/types';
import { PartnerStackParamList } from '~/navigation/types';

type Props = StackScreenProps<PartnerStackParamList, 'Offers'>;

const TIMEOUT_MS = 60000;

export default function Offers({ route, navigation }: Props) {
  const { rideId } = route.params;
  const theme = useTheme();
  const dispatch = useAppDispatch();
  const currentRequest = useAppSelector((state) => state.ride.currentRequest);
  const quotes = useAppSelector((state) => state.ride.quotes);
  const activeRideId = useAppSelector((state) => state.ride.activeRideId);
  const lastError = useAppSelector((state) => state.ride.lastError);

  const [timedOut, setTimedOut] = useState(false);
  const [waitToken, setWaitToken] = useState(0);
  const [acceptingDriverId, setAcceptingDriverId] = useState<string | null>(null);
  const [cancelling, setCancelling] = useState(false);

  useRideRequestListener(rideId);

  const openQuotes = quotes.filter((q) => q.status === 'offered');

  useEffect(() => {
    if (openQuotes.length > 0) {
      setTimedOut(false);
      return;
    }
    setTimedOut(false);
    const timer = setTimeout(() => setTimedOut(true), TIMEOUT_MS);
    return () => clearTimeout(timer);
  }, [openQuotes.length, waitToken]);

  useEffect(() => {
    if (activeRideId) {
      navigation.replace('ActiveRide', { rideId: activeRideId });
    }
  }, [activeRideId, navigation]);

  async function handleAccept(driverId: string) {
    setAcceptingDriverId(driverId);
    await dispatch(acceptQuote({ rideId, driverId }));
    setAcceptingDriverId(null);
  }

  async function handleCancel() {
    setCancelling(true);
    const result = await dispatch(cancelRequest({ rideId, cancelledBy: 'partner' }));
    setCancelling(false);
    if (cancelRequest.fulfilled.match(result)) {
      dispatch(clearRideNegotiation());
      navigation.navigate('Tabs');
    }
  }

  if (!currentRequest) {
    return (
      <Screen style={{ alignItems: 'center', justifyContent: 'center' }}>
        <Text variant="body" color="textMuted">
          Loading your request…
        </Text>
      </Screen>
    );
  }

  const canCancel =
    currentRequest.status === RideStatus.Requested ||
    currentRequest.status === RideStatus.DriverQuotedFare;

  return (
    <Screen style={{ padding: theme.spacing.lg }}>
      <Text variant="title" style={{ marginBottom: theme.spacing.sm }}>
        Finding Your Ride
      </Text>
      <StatusChip status={currentRequest.status} />

      <Card style={{ marginTop: theme.spacing.md }}>
        <View style={{ flexDirection: 'row' }}>
          <Text variant="caption" color="textMuted" style={{ width: 70 }}>
            Pickup
          </Text>
          <Text variant="body" style={{ flex: 1 }}>
            {currentRequest.pickup.address}
          </Text>
        </View>
        <View style={{ flexDirection: 'row', marginTop: theme.spacing.sm }}>
          <Text variant="caption" color="textMuted" style={{ width: 70 }}>
            Drop-off
          </Text>
          <Text variant="body" style={{ flex: 1 }}>
            {currentRequest.dropoff.address}
          </Text>
        </View>
        <Text variant="caption" color="textMuted" style={{ marginTop: theme.spacing.sm }}>
          {currentRequest.estimatedDistanceKm.toFixed(1)} km trip
        </Text>
      </Card>

      {lastError ? (
        <Text variant="caption" color="error" style={{ marginTop: theme.spacing.sm }}>
          {lastError}
        </Text>
      ) : null}

      <View style={{ flex: 1, marginTop: theme.spacing.lg }}>
        {openQuotes.length === 0 && !timedOut ? (
          <SearchingIndicator />
        ) : openQuotes.length === 0 && timedOut ? (
          <Card style={{ alignItems: 'center' }}>
            <Text variant="subtitle" style={{ textAlign: 'center' }}>
              No drivers have responded yet
            </Text>
            <Text
              variant="body"
              color="textMuted"
              style={{ marginTop: theme.spacing.xs, textAlign: 'center' }}>
              You can keep waiting a bit longer or cancel this request.
            </Text>
            <Button
              title="Keep Waiting"
              onPress={() => setWaitToken((t) => t + 1)}
              style={{ marginTop: theme.spacing.md, width: '100%' }}
            />
          </Card>
        ) : (
          <FlatList
            data={openQuotes}
            keyExtractor={(item) => item.driverId}
            renderItem={({ item }) => (
              <QuoteCard
                quote={item}
                onAccept={() => handleAccept(item.driverId)}
                accepting={acceptingDriverId === item.driverId}
              />
            )}
          />
        )}
      </View>

      {canCancel ? (
        <Button
          title="Cancel Request"
          variant="secondary"
          loading={cancelling}
          onPress={handleCancel}
          style={{ marginTop: theme.spacing.md }}
        />
      ) : null}
    </Screen>
  );
}
