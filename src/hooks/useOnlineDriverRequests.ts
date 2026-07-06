import { useEffect, useMemo, useState } from 'react';
import { LatLng, Ride } from '~/features/ride/types';
import { haversineDistanceMeters } from '~/utils/geo';
import { subscribeNearbyRequests } from '~/services/rideService';
import { useAppDispatch } from '~/redux/hooks';
import { setIncomingRequests, setIncomingRequestsError } from '~/redux/ride/rideSlice';

const DEFAULT_RADIUS_METERS = 5000;

export function useOnlineDriverRequests(
  reference: LatLng | null,
  online: boolean,
  radiusMeters = DEFAULT_RADIUS_METERS
) {
  const dispatch = useAppDispatch();
  const [rawRequests, setRawRequests] = useState<Ride[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!online) {
      setRawRequests([]);
      return;
    }
    const unsubscribe = subscribeNearbyRequests(
      (rides) => {
        setRawRequests(rides);
        setError(null);
        dispatch(setIncomingRequestsError(null));
      },
      (err) => {
        setError(err.message);
        dispatch(setIncomingRequestsError(err.message));
      }
    );
    return unsubscribe;
  }, [online, dispatch]);

  const nearby = useMemo(() => {
    const filtered = reference
      ? rawRequests.filter(
          (r) => haversineDistanceMeters(reference, r.pickup.coords) <= radiusMeters
        )
      : rawRequests;
    return [...filtered].sort((a, b) => a.createdAt - b.createdAt);
  }, [rawRequests, reference, radiusMeters]);

  useEffect(() => {
    dispatch(setIncomingRequests(nearby));
  }, [nearby, dispatch]);

  return { requests: nearby, error };
}
