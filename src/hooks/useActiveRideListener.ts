import { useEffect, useState } from 'react';
import { subscribeRide } from '~/services/rideService';
import { useAppDispatch } from '~/redux/hooks';
import { setActiveRide } from '~/redux/ride/rideSlice';

export function useActiveRideListener(rideId: string | null) {
  const dispatch = useAppDispatch();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!rideId) return;

    const unsubscribe = subscribeRide(
      rideId,
      (ride) => {
        dispatch(setActiveRide(ride));
        setError(null);
      },
      (err) => setError(err.message)
    );

    return unsubscribe;
  }, [rideId, dispatch]);

  return { error };
}
