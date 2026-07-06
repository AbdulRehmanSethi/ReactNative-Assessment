import { useEffect, useMemo, useState } from 'react';
import { LatLng } from '~/features/ride/types';
import { haversineDistanceMeters } from '~/utils/geo';
import { subscribeOnlineDrivers, OnlineDriver } from '~/services/driverLocationService';

const DEFAULT_RADIUS_METERS = 5000;

export function useOnlineDrivers(reference: LatLng | null, radiusMeters = DEFAULT_RADIUS_METERS) {
  const [drivers, setDrivers] = useState<OnlineDriver[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const unsubscribe = subscribeOnlineDrivers(
      (next) => setDrivers(next),
      (err) => setError(err.message)
    );
    return unsubscribe;
  }, []);

  const nearby = useMemo(() => {
    if (!reference) return drivers;
    return drivers.filter((d) => haversineDistanceMeters(reference, d.location) <= radiusMeters);
  }, [drivers, reference, radiusMeters]);

  return { drivers: nearby, error };
}
