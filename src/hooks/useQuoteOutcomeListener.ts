import { useEffect, useState } from 'react';
import { RideStatus } from '~/features/ride/types';
import { subscribeRide } from '~/services/rideService';
import { useAppDispatch } from '~/redux/hooks';
import { setActiveRide, setActiveRideId } from '~/redux/ride/rideSlice';

export type QuoteOutcome = 'pending' | 'won' | 'lost' | 'cancelled';

export function useQuoteOutcomeListener(rideId: string | null, driverId: string) {
  const dispatch = useAppDispatch();
  const [outcome, setOutcome] = useState<QuoteOutcome>('pending');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!rideId) return;

    const unsubscribe = subscribeRide(
      rideId,
      (ride) => {
        if (ride.status === RideStatus.FareAccepted) {
          if (ride.driverId === driverId) {
            dispatch(setActiveRide(ride));
            dispatch(setActiveRideId(ride.id));
            setOutcome('won');
          } else {
            setOutcome('lost');
          }
        } else if (ride.status === RideStatus.RideCancelled) {
          setOutcome('cancelled');
        }
      },
      (err) => setError(err.message)
    );

    return unsubscribe;
  }, [rideId, driverId, dispatch]);

  return { outcome, error };
}
