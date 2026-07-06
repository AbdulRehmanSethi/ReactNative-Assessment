import React, { useEffect, useRef, useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { useRoute, useNavigation } from '@react-navigation/native';
import * as Location from 'expo-location';
import type { CameraRef } from '@maplibre/maplibre-react-native';
import { useTheme } from '~/theme';
import {
  Screen,
  Text,
  Button,
  Card,
  StatusChip,
  ThemedMapView,
  TripMarker,
  DriverMarker,
  RoutePolyline,
  RecenterButton,
  LocationPermissionCard,
} from '~/components';
import { useAppDispatch, useAppSelector } from '~/redux/hooks';
import {
  advanceToEnRoute,
  advanceToArrived,
  advanceToStarted,
  advanceToCompleted,
  cancelRequest,
  clearActiveRide,
} from '~/redux/ride/rideSlice';
import { useActiveRideListener } from '~/hooks/useActiveRideListener';
import { useDriverRouteTracking } from '~/hooks/useDriverRouteTracking';
import { useSmoothedPosition } from '~/hooks/useSmoothedPosition';
import { useLocationTracking } from '~/hooks/useLocationTracking';
import { getUserProfile } from '~/services/profileService';
import { computeBounds, haversineDistanceMeters } from '~/utils/geo';
import { LatLng, RideStatus } from '~/features/ride/types';

interface ActiveRideRouteParams {
  rideId: string;
}

interface DriverVehicleSummary {
  model: string;
  color: string;
  registrationNumber: string;
}

const ACTION_CONFIG: Partial<
  Record<RideStatus, { label: string; thunk: typeof advanceToEnRoute }>
> = {
  [RideStatus.FareAccepted]: { label: 'Start Heading to Pickup', thunk: advanceToEnRoute },
  [RideStatus.DriverEnRoute]: { label: "I've Arrived", thunk: advanceToArrived },
  [RideStatus.DriverArrived]: { label: 'Start Ride', thunk: advanceToStarted },
  [RideStatus.RideStarted]: { label: 'Complete Ride', thunk: advanceToCompleted },
};

const CANCELLABLE_STATUSES: RideStatus[] = [
  RideStatus.FareAccepted,
  RideStatus.DriverEnRoute,
  RideStatus.DriverArrived,
];

type LocationStatus = 'checking' | 'granted' | 'denied' | 'services-off';

// Mounted only for the driver role, so `useLocationTracking`'s permission checks never run for
// the partner (who needs no GPS access at all on this screen).
function DriverOwnLocationTracker({
  onCoords,
  onStatus,
  onOpenSettings,
}: {
  onCoords: (c: LatLng | null) => void;
  onStatus: (s: LocationStatus) => void;
  onOpenSettings: (fn: () => void) => void;
}) {
  const { status, coords, openSettings } = useLocationTracking({
    accuracy: Location.Accuracy.High,
    timeInterval: 5000,
    distanceInterval: 15,
    stopOnBlur: false,
  });

  useEffect(() => onCoords(coords), [coords, onCoords]);
  useEffect(() => onStatus(status), [status, onStatus]);
  useEffect(() => onOpenSettings(() => openSettings), [openSettings, onOpenSettings]);

  return null;
}

export default function ActiveRide() {
  const theme = useTheme();
  const route = useRoute();
  const navigation = useNavigation();
  const dispatch = useAppDispatch();
  const { rideId } = route.params as ActiveRideRouteParams;

  const user = useAppSelector((state) => state.auth.user);
  const ride = useAppSelector((state) => state.ride.activeRide);
  const { error: listenerError } = useActiveRideListener(rideId);

  const isDriver = user?.role === 'driver';

  const [myCoords, setMyCoords] = useState<LatLng | null>(null);
  const [myLocationStatus, setMyLocationStatus] = useState<LocationStatus>('checking');
  const [openSettingsFn, setOpenSettingsFn] = useState<() => void>(() => () => {});
  const [driverVehicle, setDriverVehicle] = useState<DriverVehicleSummary | null>(null);
  const [advancing, setAdvancing] = useState(false);
  const [cancelling, setCancelling] = useState(false);
  const [styleError, setStyleError] = useState(false);

  const cameraRef = useRef<CameraRef>(null);
  const lastFitStatus = useRef<RideStatus | null>(null);

  const smoothedDriverLocation = useSmoothedPosition(
    !isDriver ? (ride?.driverLocation ?? null) : null
  );
  const driverMarkerCoords = isDriver ? myCoords : smoothedDriverLocation;

  // FareAccepted already targets pickup (not just DriverEnRoute) so the route/ETA are visible
  // immediately when both sides land on this screen, not only after the driver taps "Start
  // Heading to Pickup".
  const routeTarget =
    ride?.status === RideStatus.FareAccepted || ride?.status === RideStatus.DriverEnRoute
      ? ride.pickup.coords
      : ride?.status === RideStatus.RideStarted
        ? ride.dropoff.coords
        : null;

  useDriverRouteTracking(rideId, isDriver ? myCoords : null, routeTarget, isDriver);

  useEffect(() => {
    if (isDriver || !ride?.driverId) return;
    getUserProfile(ride.driverId)
      .then((profile) => {
        if (profile?.role === 'driver') {
          setDriverVehicle({
            model: profile.vehicle.model,
            color: profile.vehicle.color,
            registrationNumber: profile.vehicle.registrationNumber,
          });
        }
      })
      .catch(() => {});
  }, [isDriver, ride?.driverId]);

  useEffect(() => {
    if (!ride || lastFitStatus.current === ride.status) return;
    lastFitStatus.current = ride.status;

    const target =
      ride.status === RideStatus.DriverArrived || ride.status === RideStatus.RideStarted
        ? ride.dropoff.coords
        : ride.pickup.coords;

    if (driverMarkerCoords) {
      const bounds = computeBounds(driverMarkerCoords, target);
      cameraRef.current?.fitBounds(bounds, {
        padding: { top: 80, left: 80, right: 80, bottom: 260 },
        duration: 600,
      });
    } else {
      cameraRef.current?.easeTo({
        center: [target.longitude, target.latitude],
        zoom: 14,
        duration: 500,
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ride?.status]);

  function handleRecenter() {
    const point = driverMarkerCoords ?? ride?.pickup.coords;
    if (!point) return;
    cameraRef.current?.easeTo({
      center: [point.longitude, point.latitude],
      zoom: 15,
      duration: 500,
    });
  }

  async function handlePrimaryAction(thunk: typeof advanceToEnRoute) {
    setAdvancing(true);
    await dispatch(thunk({ rideId }));
    setAdvancing(false);
  }

  async function handleCancel() {
    setCancelling(true);
    await dispatch(cancelRequest({ rideId, cancelledBy: 'partner' }));
    setCancelling(false);
  }

  function handleDone() {
    dispatch(clearActiveRide());
    navigation.navigate('Tabs' as never);
  }

  if (isDriver && (myLocationStatus === 'denied' || myLocationStatus === 'services-off')) {
    return (
      <Screen edges={['top']}>
        <DriverOwnLocationTracker
          onCoords={setMyCoords}
          onStatus={setMyLocationStatus}
          onOpenSettings={setOpenSettingsFn}
        />
        <LocationPermissionCard variant={myLocationStatus} onOpenSettings={openSettingsFn} />
      </Screen>
    );
  }

  if (!ride) {
    return (
      <Screen style={{ alignItems: 'center', justifyContent: 'center', padding: theme.spacing.lg }}>
        {isDriver ? (
          <DriverOwnLocationTracker
            onCoords={setMyCoords}
            onStatus={setMyLocationStatus}
            onOpenSettings={setOpenSettingsFn}
          />
        ) : null}
        <Text variant="body" color="textMuted">
          Loading your ride…
        </Text>
      </Screen>
    );
  }

  const counterpartName = isDriver ? ride.partnerName : ride.driverName;
  const counterpartLabel = isDriver ? 'Your Partner' : 'Your Driver';

  if (ride.status === RideStatus.RideCompleted) {
    const durationMinutes =
      ride.startedAt && ride.completedAt
        ? Math.max(1, Math.round((ride.completedAt - ride.startedAt) / 60000))
        : null;

    return (
      <Screen style={{ padding: theme.spacing.lg }}>
        <Text variant="title" style={{ marginBottom: theme.spacing.sm }}>
          Ride Complete
        </Text>
        <StatusChip status={ride.status} />

        <Card style={{ marginTop: theme.spacing.lg, alignItems: 'center' }}>
          <Text variant="title">Rs {ride.fare}</Text>
          <Text variant="caption" color="textMuted" style={{ marginTop: theme.spacing.xs }}>
            {ride.estimatedDistanceKm.toFixed(1)} km (approx. distance)
            {durationMinutes ? ` · ${durationMinutes} min` : ''}
          </Text>
        </Card>

        <Card style={{ marginTop: theme.spacing.md }}>
          <Text variant="caption" color="textMuted">
            {counterpartLabel}
          </Text>
          <Text variant="subtitle" style={{ marginTop: theme.spacing.xs }}>
            {counterpartName ?? 'Unknown'}
          </Text>
        </Card>

        <Button title="Done" onPress={handleDone} style={{ marginTop: theme.spacing.xl }} />
      </Screen>
    );
  }

  if (ride.status === RideStatus.RideCancelled) {
    return (
      <Screen style={{ alignItems: 'center', justifyContent: 'center', padding: theme.spacing.lg }}>
        <Card style={{ alignItems: 'center', width: '100%' }}>
          <StatusChip status={ride.status} />
          <Text variant="subtitle" style={{ marginTop: theme.spacing.md, textAlign: 'center' }}>
            This ride was cancelled
          </Text>
          <Text
            variant="body"
            color="textMuted"
            style={{ marginTop: theme.spacing.xs, textAlign: 'center' }}>
            {ride.cancelledBy === 'driver' ? 'The driver' : 'The partner'} cancelled this ride
            {ride.cancelReason ? `: ${ride.cancelReason}` : '.'}
          </Text>
          <Button
            title="Done"
            onPress={handleDone}
            style={{ marginTop: theme.spacing.lg, width: '100%' }}
          />
        </Card>
      </Screen>
    );
  }

  const actionConfig = ACTION_CONFIG[ride.status];
  const canCancel = CANCELLABLE_STATUSES.includes(ride.status);
  const etaMinutes = ride.etaSeconds != null ? Math.round(ride.etaSeconds / 60) : null;
  const distanceKm =
    ride.remainingDistanceMeters != null ? ride.remainingDistanceMeters / 1000 : null;
  const distanceToPickupKm =
    isDriver && myCoords ? haversineDistanceMeters(myCoords, ride.pickup.coords) / 1000 : null;

  const center = driverMarkerCoords ?? ride.pickup.coords;

  return (
    <Screen edges={['top']}>
      {isDriver ? (
        <DriverOwnLocationTracker
          onCoords={setMyCoords}
          onStatus={setMyLocationStatus}
          onOpenSettings={setOpenSettingsFn}
        />
      ) : null}

      <View style={{ flex: 1 }}>
        {styleError ? (
          <View style={styles.centerFill}>
            <Text
              variant="body"
              color="textMuted"
              style={{ textAlign: 'center', padding: theme.spacing.lg }}>
              Could not load the map. Check your connection and try again.
            </Text>
          </View>
        ) : (
          <ThemedMapView
            cameraRef={cameraRef}
            initialCenter={center}
            onStyleLoadError={() => setStyleError(true)}>
            <TripMarker kind="pickup" coords={ride.pickup.coords} />
            <TripMarker kind="dropoff" coords={ride.dropoff.coords} />
            {ride.route?.coords ? <RoutePolyline coords={ride.route.coords} /> : null}
            {driverMarkerCoords ? (
              <DriverMarker uid={ride.driverId ?? 'driver'} coords={driverMarkerCoords} />
            ) : null}
          </ThemedMapView>
        )}

        {!styleError ? (
          <RecenterButton
            onPress={handleRecenter}
            style={[styles.recenter, { bottom: theme.spacing.xxl * 4 }]}
          />
        ) : null}

        {listenerError ? (
          <View
            style={[
              styles.errorBanner,
              { backgroundColor: theme.colors.surface, borderColor: theme.colors.error },
            ]}>
            <Text variant="caption" color="error">
              Reconnecting…
            </Text>
          </View>
        ) : null}

        <Card style={[styles.bottomCard, { margin: theme.spacing.lg }]}>
          <View
            style={{
              flexDirection: 'row',
              justifyContent: 'space-between',
              alignItems: 'flex-start',
            }}>
            <View style={{ flex: 1 }}>
              <Text variant="caption" color="textMuted">
                {counterpartLabel}
              </Text>
              <Text variant="subtitle">{counterpartName ?? 'Unknown'}</Text>
              {!isDriver && driverVehicle ? (
                <Text variant="caption" color="textMuted" style={{ marginTop: theme.spacing.xs }}>
                  {driverVehicle.color} {driverVehicle.model} · {driverVehicle.registrationNumber}
                </Text>
              ) : null}
            </View>
            <StatusChip status={ride.status} />
          </View>

          <View
            style={{
              flexDirection: 'row',
              justifyContent: 'space-between',
              marginTop: theme.spacing.md,
            }}>
            <Text variant="body" color="textMuted">
              {etaMinutes != null && distanceKm != null
                ? `${etaMinutes} min · ${distanceKm.toFixed(1)} km`
                : 'Calculating route…'}
            </Text>
            {ride.fare != null ? <Text variant="subtitle">Rs {ride.fare}</Text> : null}
          </View>

          {isDriver &&
          ride.status === RideStatus.DriverEnRoute &&
          distanceToPickupKm &&
          distanceToPickupKm > 0.3 ? (
            <Text variant="caption" color="textMuted" style={{ marginTop: theme.spacing.xs }}>
              You&apos;re still {distanceToPickupKm.toFixed(1)} km from pickup.
            </Text>
          ) : null}

          {isDriver && actionConfig ? (
            <Button
              title={actionConfig.label}
              onPress={() => handlePrimaryAction(actionConfig.thunk)}
              loading={advancing}
              style={{ marginTop: theme.spacing.md }}
            />
          ) : null}

          {!isDriver && canCancel ? (
            <Button
              title="Cancel Ride"
              variant="secondary"
              loading={cancelling}
              onPress={handleCancel}
              style={{ marginTop: theme.spacing.md }}
            />
          ) : null}
        </Card>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  centerFill: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  recenter: {
    position: 'absolute',
    right: 16,
  },
  errorBanner: {
    position: 'absolute',
    top: 16,
    left: 16,
    right: 16,
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    alignItems: 'center',
  },
  bottomCard: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
  },
});
