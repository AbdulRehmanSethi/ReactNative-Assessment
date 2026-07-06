import { useEffect, useState } from 'react';
import { RideStatus } from '~/features/ride/types';
import { subscribeRide, subscribeQuotes } from '~/services/rideService';
import { useAppDispatch } from '~/redux/hooks';
import {
  setCurrentRequest,
  setQuotes,
  setActiveRide,
  setActiveRideId,
} from '~/redux/ride/rideSlice';

export function useRideRequestListener(rideId: string | null) {
  const dispatch = useAppDispatch();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!rideId) return;

    const unsubscribeRide = subscribeRide(
      rideId,
      (ride) => {
        dispatch(setCurrentRequest(ride));
        if (ride.status === RideStatus.FareAccepted) {
          dispatch(setActiveRide(ride));
          dispatch(setActiveRideId(ride.id));
        }
      },
      (err) => setError(err.message)
    );

    const unsubscribeQuotes = subscribeQuotes(
      rideId,
      (quotes) => dispatch(setQuotes(quotes)),
      (err) => setError(err.message)
    );

    return () => {
      unsubscribeRide();
      unsubscribeQuotes();
    };
  }, [rideId, dispatch]);

  return { error };
}
