import { useEffect, useRef } from 'react';
import { LatLng } from '~/features/ride/types';
import { haversineDistanceMeters } from '~/utils/geo';
import { useAppDispatch } from '~/redux/hooks';
import { setLocation, publishLocation } from '~/redux/driver/driverSlice';

const MIN_INTERVAL_MS = 10000;
const MIN_DISTANCE_METERS = 50;

export function useDriverLocationPublisher(coords: LatLng | null, online: boolean, uid: string) {
  const dispatch = useAppDispatch();
  const lastAt = useRef(0);
  const lastCoords = useRef<LatLng | null>(null);

  useEffect(() => {
    if (!online || !coords) return;

    const now = Date.now();
    const moved = lastCoords.current
      ? haversineDistanceMeters(lastCoords.current, coords)
      : Infinity;

    if (now - lastAt.current >= MIN_INTERVAL_MS || moved >= MIN_DISTANCE_METERS) {
      lastAt.current = now;
      lastCoords.current = coords;
      dispatch(setLocation(coords));
      dispatch(publishLocation({ uid, location: coords }));
    }
  }, [coords, online, uid, dispatch]);
}
