import { useCallback, useEffect, useRef, useState } from 'react';
import { AppState, Linking } from 'react-native';
import * as Location from 'expo-location';
import { useFocusEffect } from '@react-navigation/native';
import { LatLng } from '~/features/ride/types';

export type LocationTrackingStatus = 'checking' | 'granted' | 'denied' | 'services-off';

export interface UseLocationTrackingOptions {
  accuracy?: Location.Accuracy;
  timeInterval?: number;
  distanceInterval?: number;
  /** Stop watching when the screen loses focus. Driver Home passes `false`. */
  stopOnBlur?: boolean;
}

export interface UseLocationTrackingResult {
  status: LocationTrackingStatus;
  coords: LatLng | null;
  errorMessage: string | null;
  openSettings: () => void;
}

export function useLocationTracking(
  options: UseLocationTrackingOptions = {}
): UseLocationTrackingResult {
  const {
    accuracy = Location.Accuracy.Balanced,
    timeInterval = 10000,
    distanceInterval = 20,
    stopOnBlur = true,
  } = options;

  const [status, setStatus] = useState<LocationTrackingStatus>('checking');
  const [coords, setCoords] = useState<LatLng | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const subscriptionRef = useRef<Location.LocationSubscription | null>(null);

  const stop = useCallback(() => {
    subscriptionRef.current?.remove();
    subscriptionRef.current = null;
  }, []);

  const start = useCallback(async () => {
    try {
      const servicesEnabled = await Location.hasServicesEnabledAsync();
      if (!servicesEnabled) {
        stop();
        setStatus('services-off');
        return;
      }

      let permission = await Location.getForegroundPermissionsAsync();
      if (permission.status !== 'granted') {
        permission = await Location.requestForegroundPermissionsAsync();
      }
      if (permission.status !== 'granted') {
        stop();
        setStatus('denied');
        return;
      }

      if (subscriptionRef.current) {
        setStatus('granted');
        return;
      }

      setErrorMessage(null);
      const current = await Location.getCurrentPositionAsync({ accuracy });
      setCoords({ latitude: current.coords.latitude, longitude: current.coords.longitude });
      setStatus('granted');

      subscriptionRef.current = await Location.watchPositionAsync(
        { accuracy, timeInterval, distanceInterval },
        (location) => {
          setCoords({ latitude: location.coords.latitude, longitude: location.coords.longitude });
        }
      );
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : 'Could not get your location.');
    }
  }, [accuracy, timeInterval, distanceInterval, stop]);

  useFocusEffect(
    useCallback(() => {
      start();
      return () => {
        if (stopOnBlur) stop();
      };
    }, [start, stop, stopOnBlur])
  );

  // Screen focus doesn't change when the whole app backgrounds/foregrounds —
  // this catches the "granted permission/enabled GPS in Settings, came back" case.
  useEffect(() => {
    const subscription = AppState.addEventListener('change', (next) => {
      if (next === 'active') start();
    });
    return () => subscription.remove();
  }, [start]);

  useEffect(() => stop, [stop]);

  const openSettings = useCallback(() => {
    Linking.openSettings();
  }, []);

  return { status, coords, errorMessage, openSettings };
}
