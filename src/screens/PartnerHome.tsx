import React, { useEffect, useRef, useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import type { MapRef, CameraRef } from '@maplibre/maplibre-react-native';
import { useTheme } from '~/theme';
import {
  Screen,
  Text,
  Button,
  ThemedMapView,
  CurrentLocationMarker,
  TripMarker,
  DriverMarker,
  RecenterButton,
  LocationPermissionCard,
  TripBottomSheet,
} from '~/components';
import { useAppDispatch, useAppSelector } from '~/redux/hooks';
import { setPickup, setDropoff, createRideRequest } from '~/redux/ride/rideSlice';
import { useLocationTracking } from '~/hooks/useLocationTracking';
import { useOnlineDrivers } from '~/hooks/useOnlineDrivers';
import { reverseGeocode, GeocodeResult } from '~/services/geocodingService';
import { computeBounds } from '~/utils/geo';
import { LatLng } from '~/features/ride/types';
import { PartnerStackParamList } from '~/navigation/types';

const FALLBACK_CENTER: LatLng = { latitude: 24.8607, longitude: 67.0011 }; // Karachi

type DragTarget = 'pickup' | 'dropoff' | null;

export default function PartnerHome() {
  const theme = useTheme();
  const dispatch = useAppDispatch();
  const navigation = useNavigation<StackNavigationProp<PartnerStackParamList>>();
  const draft = useAppSelector((state) => state.ride.draft);
  const user = useAppSelector((state) => state.auth.user);
  const lastError = useAppSelector((state) => state.ride.lastError);

  const { status, coords, openSettings } = useLocationTracking();
  const mapRef = useRef<MapRef>(null);
  const cameraRef = useRef<CameraRef>(null);
  const hasDefaultedPickup = useRef(false);

  const [dragTarget, setDragTarget] = useState<DragTarget>(null);
  const [confirming, setConfirming] = useState(false);
  const [styleError, setStyleError] = useState(false);
  const [requesting, setRequesting] = useState(false);

  const reference = draft.pickup?.coords ?? coords ?? null;
  const { drivers } = useOnlineDrivers(reference, 5000);

  // Default pickup to the first GPS fix, then upgrade the label once reverse geocoding resolves.
  useEffect(() => {
    if (status === 'granted' && coords && !draft.pickup && !hasDefaultedPickup.current) {
      hasDefaultedPickup.current = true;
      dispatch(setPickup({ coords, address: 'Current location' }));
      reverseGeocode(coords)
        .then((result) => {
          if (result) dispatch(setPickup({ coords, address: result.label }));
        })
        .catch(() => {});
    }
  }, [status, coords, draft.pickup, dispatch]);

  // Fit both points once set; otherwise center on whichever single point exists.
  useEffect(() => {
    if (draft.pickup && draft.dropoff) {
      const bounds = computeBounds(draft.pickup.coords, draft.dropoff.coords);
      cameraRef.current?.fitBounds(bounds, {
        padding: { top: 80, left: 80, right: 80, bottom: 80 },
        duration: 600,
      });
    } else if (draft.pickup || draft.dropoff) {
      const point = (draft.pickup ?? draft.dropoff)!.coords;
      cameraRef.current?.easeTo({
        center: [point.longitude, point.latitude],
        zoom: 15,
        duration: 500,
      });
    }
  }, [draft.pickup, draft.dropoff]);

  function handleRecenter() {
    if (!coords) return;
    cameraRef.current?.easeTo({
      center: [coords.longitude, coords.latitude],
      zoom: 16,
      duration: 500,
    });
  }

  function handleSelectResult(field: 'pickup' | 'dropoff', result: GeocodeResult) {
    const point = { coords: result.coords, address: result.label };
    if (field === 'pickup') dispatch(setPickup(point));
    else dispatch(setDropoff(point));
  }

  function startDrag(target: 'pickup' | 'dropoff') {
    setDragTarget(target);
  }

  async function confirmDrag() {
    if (!dragTarget) return;
    setConfirming(true);
    try {
      const center = await mapRef.current?.getCenter();
      if (!center) return;
      const [longitude, latitude] = center;
      const point: LatLng = { latitude, longitude };
      const result = await reverseGeocode(point).catch(() => null);
      const address = result?.label ?? `${latitude.toFixed(5)}, ${longitude.toFixed(5)}`;
      if (dragTarget === 'pickup') dispatch(setPickup({ coords: point, address }));
      else dispatch(setDropoff({ coords: point, address }));
    } finally {
      setConfirming(false);
      setDragTarget(null);
    }
  }

  async function handleRequestRide() {
    if (!user || !draft.pickup || !draft.dropoff) return;
    setRequesting(true);
    const result = await dispatch(
      createRideRequest({
        partnerId: user.id,
        partnerName: user.fullName || 'Partner',
        pickup: draft.pickup,
        dropoff: draft.dropoff,
      })
    );
    setRequesting(false);
    if (createRideRequest.fulfilled.match(result)) {
      navigation.navigate('Offers', { rideId: result.payload });
    }
  }

  if (status === 'denied' || status === 'services-off') {
    return (
      <Screen edges={['top']}>
        <LocationPermissionCard variant={status} onOpenSettings={openSettings} />
      </Screen>
    );
  }

  const center = coords ?? draft.pickup?.coords ?? FALLBACK_CENTER;

  return (
    <Screen edges={['top']} style={{ padding: 0 }}>
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
            mapRef={mapRef}
            cameraRef={cameraRef}
            initialCenter={center}
            onStyleLoadError={() => setStyleError(true)}>
            {coords ? <CurrentLocationMarker coords={coords} /> : null}
            {draft.pickup ? <TripMarker kind="pickup" coords={draft.pickup.coords} /> : null}
            {draft.dropoff ? <TripMarker kind="dropoff" coords={draft.dropoff.coords} /> : null}
            {drivers.map((driver) => (
              <DriverMarker key={driver.uid} uid={driver.uid} coords={driver.location} />
            ))}
          </ThemedMapView>
        )}

        {!styleError && dragTarget ? (
          <View pointerEvents="none" style={styles.centerPin}>
            <Ionicons
              name={dragTarget === 'pickup' ? 'location' : 'flag'}
              size={32}
              color={dragTarget === 'pickup' ? theme.colors.success : theme.colors.error}
            />
          </View>
        ) : null}

        {!styleError && dragTarget ? (
          <View style={[styles.confirmRow, { padding: theme.spacing.lg }]}>
            <Button
              title="Cancel"
              variant="secondary"
              onPress={() => setDragTarget(null)}
              style={{ marginRight: theme.spacing.sm, flex: 1 }}
            />
            <Button
              title="Confirm location"
              onPress={confirmDrag}
              loading={confirming}
              style={{ flex: 2 }}
            />
          </View>
        ) : null}

        {!styleError && !dragTarget ? (
          <RecenterButton
            onPress={handleRecenter}
            style={[styles.recenter, { bottom: theme.spacing.xxl * 2 }]}
          />
        ) : null}

        {!styleError && !dragTarget && lastError ? (
          <View
            style={[
              styles.errorBanner,
              { backgroundColor: theme.colors.surface, borderColor: theme.colors.error },
            ]}>
            <Text variant="caption" color="error">
              {lastError}
            </Text>
          </View>
        ) : null}

        {!styleError && !dragTarget ? (
          <TripBottomSheet
            pickup={draft.pickup}
            dropoff={draft.dropoff}
            onSelectPickup={(result) => handleSelectResult('pickup', result)}
            onSelectDropoff={(result) => handleSelectResult('dropoff', result)}
            onPinPickup={() => startDrag('pickup')}
            onPinDropoff={() => startDrag('dropoff')}
            ctaEnabled={!!draft.pickup && !!draft.dropoff}
            ctaLoading={requesting}
            onPressCta={handleRequestRide}
            bias={coords}
          />
        ) : null}
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
  centerPin: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    marginLeft: -16,
    marginTop: -32,
  },
  confirmRow: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
  },
  errorBanner: {
    position: 'absolute',
    top: 16,
    left: 16,
    right: 16,
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
  },
  recenter: {
    position: 'absolute',
    right: 16,
  },
});
