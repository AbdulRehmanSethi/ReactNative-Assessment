import { useEffect, useRef } from 'react';
import { LatLng } from '~/features/ride/types';
import { haversineDistanceMeters } from '~/utils/geo';
import { getRoute } from '~/services/routingService';
import { updateRideTracking } from '~/services/rideService';

const MIN_INTERVAL_MS = 20000;
const MIN_DISTANCE_METERS = 100;

export function useDriverRouteTracking(
  rideId: string | null,
  driverCoords: LatLng | null,
  target: LatLng | null,
  enabled: boolean
) {
  const lastAt = useRef(0);
  const lastCoords = useRef<LatLng | null>(null);

  useEffect(() => {
    if (!enabled || !rideId || !driverCoords || !target) return;

    const now = Date.now();
    const moved = lastCoords.current
      ? haversineDistanceMeters(lastCoords.current, driverCoords)
      : Infinity;

    if (now - lastAt.current < MIN_INTERVAL_MS && moved < MIN_DISTANCE_METERS) return;

    lastAt.current = now;
    lastCoords.current = driverCoords;

    getRoute(driverCoords, target)
      .then((route) =>
        updateRideTracking(rideId, {
          driverLocation: driverCoords,
          route,
          etaSeconds: Math.round(route.durationSeconds),
          remainingDistanceMeters: Math.round(route.distanceMeters),
        })
      )
      .catch(() => {
        // Best-effort telemetry — a failed tick just tries again next time.
      });
  }, [rideId, driverCoords, target, enabled]);
}
