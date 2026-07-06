import React, { useEffect, useRef, useState } from 'react';
import { View, StyleSheet } from 'react-native';
import * as Location from 'expo-location';
import type { CameraRef } from '@maplibre/maplibre-react-native';
import { useTheme } from '~/theme';
import {
  Screen,
  Text,
  ThemedMapView,
  CurrentLocationMarker,
  RecenterButton,
  LocationPermissionCard,
  OnlineToggleCard,
} from '~/components';
import { useAppDispatch, useAppSelector } from '~/redux/hooks';
import { setOnline, setLocation, goOnline, goOffline } from '~/redux/driver/driverSlice';
import { useLocationTracking } from '~/hooks/useLocationTracking';
import { useDriverLocationPublisher } from '~/hooks/useDriverLocationPublisher';
import { getUserProfile } from '~/services/profileService';
import { VehicleType } from '~/services/profileTypes';
import { LatLng } from '~/features/ride/types';

const FALLBACK_CENTER: LatLng = { latitude: 24.8607, longitude: 67.0011 }; // Karachi

export default function DriverHome() {
  const theme = useTheme();
  const dispatch = useAppDispatch();
  const user = useAppSelector((state) => state.auth.user);
  const online = useAppSelector((state) => state.driver.online);
  const lastPublishError = useAppSelector((state) => state.driver.lastPublishError);

  const { status, coords, errorMessage, openSettings } = useLocationTracking({
    accuracy: Location.Accuracy.High,
    timeInterval: 5000,
    distanceInterval: 15,
    stopOnBlur: false,
  });

  const cameraRef = useRef<CameraRef>(null);
  const hasCentered = useRef(false);
  const [vehicleType, setVehicleType] = useState<VehicleType | null>(null);
  const [toggling, setToggling] = useState(false);
  const [styleError, setStyleError] = useState(false);

  useDriverLocationPublisher(coords, online, user?.id ?? '');

  useEffect(() => {
    if (!user) return;
    getUserProfile(user.id)
      .then((profile) => {
        if (profile?.role === 'driver') setVehicleType(profile.vehicle.type);
      })
      .catch(() => {});
  }, [user]);

  useEffect(() => {
    if (coords && !hasCentered.current) {
      hasCentered.current = true;
      cameraRef.current?.easeTo({
        center: [coords.longitude, coords.latitude],
        zoom: 16,
        duration: 500,
      });
    }
  }, [coords]);

  function handleRecenter() {
    if (!coords) return;
    cameraRef.current?.easeTo({
      center: [coords.longitude, coords.latitude],
      zoom: 16,
      duration: 500,
    });
  }

  async function handleToggle(next: boolean) {
    if (!user) return;
    setToggling(true);
    try {
      if (next) {
        if (!coords || !vehicleType) return;
        dispatch(setOnline(true));
        dispatch(setLocation(coords));
        await dispatch(goOnline({ uid: user.id, vehicleType, location: coords }));
      } else {
        dispatch(setOnline(false));
        await dispatch(goOffline({ uid: user.id }));
      }
    } finally {
      setToggling(false);
    }
  }

  if (status === 'denied' || status === 'services-off') {
    return (
      <Screen edges={['top']}>
        <LocationPermissionCard variant={status} onOpenSettings={openSettings} />
      </Screen>
    );
  }

  const center = coords ?? FALLBACK_CENTER;
  const toggleError = errorMessage ?? lastPublishError;

  return (
    <Screen edges={['top']}>
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
            {coords ? <CurrentLocationMarker coords={coords} /> : null}
          </ThemedMapView>
        )}

        {!styleError ? (
          <RecenterButton
            onPress={handleRecenter}
            style={[styles.recenter, { bottom: theme.spacing.xxl * 2 }]}
          />
        ) : null}

        <OnlineToggleCard
          online={online}
          loading={toggling || !vehicleType}
          onToggle={handleToggle}
          errorMessage={toggleError}
          style={[styles.toggleCard, { margin: theme.spacing.lg }]}
        />
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
  toggleCard: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
  },
});
