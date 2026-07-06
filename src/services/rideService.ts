import firestore, { FirebaseFirestoreTypes } from '@react-native-firebase/firestore';
import {
  LatLng,
  Ride,
  RidePoint,
  RideQuote,
  RideStatus,
  RouteInfo,
  canTransition,
} from '~/features/ride/types';
import { VehicleType } from '~/services/profileTypes';
import { haversineDistanceMeters } from '~/utils/geo';
import { mapFirestoreError } from '~/services/firestoreErrors';

function toMillis(value: FirebaseFirestoreTypes.Timestamp | null | undefined): number {
  return value?.toMillis() ?? Date.now();
}

function mapRideDoc(id: string, data: FirebaseFirestoreTypes.DocumentData): Ride {
  return {
    id,
    status: data.status,
    partnerId: data.partnerId,
    partnerName: data.partnerName,
    driverId: data.driverId ?? null,
    driverName: data.driverName ?? null,
    pickup: data.pickup,
    dropoff: data.dropoff,
    estimatedDistanceKm: data.estimatedDistanceKm,
    fare: data.fare ?? null,
    createdAt: toMillis(data.createdAt),
    updatedAt: toMillis(data.updatedAt),
    cancelledBy: data.cancelledBy,
    cancelReason: data.cancelReason,
    driverLocation: data.driverLocation ?? null,
    route: data.route ?? null,
    etaSeconds: data.etaSeconds ?? null,
    remainingDistanceMeters: data.remainingDistanceMeters ?? null,
    enRouteAt: data.enRouteAt ? toMillis(data.enRouteAt) : undefined,
    arrivedAt: data.arrivedAt ? toMillis(data.arrivedAt) : undefined,
    startedAt: data.startedAt ? toMillis(data.startedAt) : undefined,
    completedAt: data.completedAt ? toMillis(data.completedAt) : undefined,
  };
}

function mapQuoteDoc(data: FirebaseFirestoreTypes.DocumentData): RideQuote {
  return {
    driverId: data.driverId,
    driverName: data.driverName,
    vehicleType: data.vehicleType,
    vehicleModel: data.vehicleModel,
    fare: data.fare,
    note: data.note ?? undefined,
    status: data.status,
    createdAt: toMillis(data.createdAt),
  };
}

export interface CreateRideRequestParams {
  partnerId: string;
  partnerName: string;
  pickup: RidePoint;
  dropoff: RidePoint;
}

export async function createRideRequest(params: CreateRideRequestParams): Promise<string> {
  try {
    const distanceKm = haversineDistanceMeters(params.pickup.coords, params.dropoff.coords) / 1000;
    const docRef = await firestore()
      .collection('rides')
      .add({
        status: RideStatus.Requested,
        partnerId: params.partnerId,
        partnerName: params.partnerName,
        driverId: null,
        driverName: null,
        pickup: params.pickup,
        dropoff: params.dropoff,
        estimatedDistanceKm: Math.round(distanceKm * 10) / 10,
        fare: null,
        driverLocation: null,
        route: null,
        etaSeconds: null,
        remainingDistanceMeters: null,
        createdAt: firestore.FieldValue.serverTimestamp(),
        updatedAt: firestore.FieldValue.serverTimestamp(),
      });
    return docRef.id;
  } catch (err) {
    throw mapFirestoreError(err);
  }
}

export function subscribeRide(
  rideId: string,
  onChange: (ride: Ride) => void,
  onError: (err: Error) => void
): () => void {
  return firestore()
    .collection('rides')
    .doc(rideId)
    .onSnapshot(
      (snapshot) => {
        if (!snapshot.exists()) return;
        onChange(mapRideDoc(snapshot.id, snapshot.data()!));
      },
      (err) => onError(mapFirestoreError(err))
    );
}

export function subscribeQuotes(
  rideId: string,
  onChange: (quotes: RideQuote[]) => void,
  onError: (err: Error) => void
): () => void {
  return firestore()
    .collection('rides')
    .doc(rideId)
    .collection('quotes')
    .orderBy('createdAt', 'asc')
    .onSnapshot(
      (snapshot) => onChange(snapshot.docs.map((doc) => mapQuoteDoc(doc.data()))),
      (err) => onError(mapFirestoreError(err))
    );
}

// Deliberately no `.orderBy()` here — combining it with the `status` equality filter would
// require a Firestore composite index. Sorting by createdAt happens client-side instead.
export function subscribeNearbyRequests(
  onChange: (rides: Ride[]) => void,
  onError: (err: Error) => void
): () => void {
  return firestore()
    .collection('rides')
    .where('status', '==', RideStatus.Requested)
    .onSnapshot(
      (snapshot) => onChange(snapshot.docs.map((doc) => mapRideDoc(doc.id, doc.data()))),
      (err) => onError(mapFirestoreError(err))
    );
}

export interface SubmitQuoteParams {
  rideId: string;
  driverId: string;
  driverName: string;
  vehicleType: VehicleType;
  vehicleModel: string;
  fare: number;
  note?: string;
}

export async function submitQuote(params: SubmitQuoteParams): Promise<void> {
  const rideRef = firestore().collection('rides').doc(params.rideId);
  const quoteRef = rideRef.collection('quotes').doc(params.driverId);
  try {
    await firestore().runTransaction(async (tx) => {
      const rideSnap = await tx.get(rideRef);
      if (!rideSnap.exists()) throw new Error('RIDE_NOT_FOUND');
      const currentStatus = rideSnap.data()!.status as RideStatus;
      if (currentStatus !== RideStatus.Requested && currentStatus !== RideStatus.DriverQuotedFare) {
        throw new Error('RIDE_NOT_OPEN');
      }

      tx.set(quoteRef, {
        driverId: params.driverId,
        driverName: params.driverName,
        vehicleType: params.vehicleType,
        vehicleModel: params.vehicleModel,
        fare: params.fare,
        note: params.note ?? null,
        status: 'offered',
        createdAt: firestore.FieldValue.serverTimestamp(),
      });

      if (currentStatus === RideStatus.Requested) {
        if (!canTransition(currentStatus, RideStatus.DriverQuotedFare)) {
          throw new Error('ILLEGAL_TRANSITION');
        }
        tx.update(rideRef, {
          status: RideStatus.DriverQuotedFare,
          updatedAt: firestore.FieldValue.serverTimestamp(),
        });
      }
    });
  } catch (err) {
    if (
      err instanceof Error &&
      (err.message === 'RIDE_NOT_OPEN' || err.message === 'ILLEGAL_TRANSITION')
    ) {
      throw new Error('This ride is no longer accepting offers.');
    }
    throw mapFirestoreError(err);
  }
}

export async function withdrawQuote(rideId: string, driverId: string): Promise<void> {
  try {
    await firestore()
      .collection('rides')
      .doc(rideId)
      .collection('quotes')
      .doc(driverId)
      .update({ status: 'withdrawn' });
  } catch (err) {
    throw mapFirestoreError(err);
  }
}

export async function acceptQuote(rideId: string, driverId: string): Promise<Ride> {
  const rideRef = firestore().collection('rides').doc(rideId);
  const quoteRef = rideRef.collection('quotes').doc(driverId);
  try {
    const rideData = await firestore().runTransaction(async (tx) => {
      const rideSnap = await tx.get(rideRef);
      if (!rideSnap.exists()) throw new Error('RIDE_NOT_FOUND');
      const data = rideSnap.data()!;
      if (!canTransition(data.status, RideStatus.FareAccepted)) {
        throw new Error('RIDE_ALREADY_RESOLVED');
      }

      const quoteSnap = await tx.get(quoteRef);
      if (!quoteSnap.exists()) throw new Error('QUOTE_NOT_FOUND');
      const quote = quoteSnap.data()!;

      tx.update(rideRef, {
        driverId,
        driverName: quote.driverName,
        fare: quote.fare,
        status: RideStatus.FareAccepted,
        updatedAt: firestore.FieldValue.serverTimestamp(),
      });
      tx.update(quoteRef, { status: 'accepted' });

      return {
        ...data,
        driverId,
        driverName: quote.driverName,
        fare: quote.fare,
        status: RideStatus.FareAccepted,
      };
    });

    // Best-effort cleanup outside the transaction — not required for correctness (every driver's
    // own listener independently detects loss from the ride doc's status/driverId), just improves
    // the partner's quote-history display.
    try {
      const others = await rideRef.collection('quotes').get();
      const batch = firestore().batch();
      others.forEach((doc) => {
        if (doc.id !== driverId && doc.data().status === 'offered') {
          batch.update(doc.ref, { status: 'lost' });
        }
      });
      await batch.commit();
    } catch {
      // non-fatal
    }

    return mapRideDoc(rideId, rideData);
  } catch (err) {
    if (err instanceof Error && err.message === 'RIDE_ALREADY_RESOLVED') {
      throw new Error('This ride has already been taken by another driver.');
    }
    if (err instanceof Error && err.message === 'QUOTE_NOT_FOUND') {
      throw new Error('This quote is no longer available.');
    }
    throw mapFirestoreError(err);
  }
}

export async function cancelRide(
  rideId: string,
  cancelledBy: 'partner' | 'driver',
  reason?: string
): Promise<void> {
  const rideRef = firestore().collection('rides').doc(rideId);
  try {
    await firestore().runTransaction(async (tx) => {
      const snap = await tx.get(rideRef);
      if (!snap.exists()) throw new Error('RIDE_NOT_FOUND');
      const current = snap.data()!.status as RideStatus;
      if (!canTransition(current, RideStatus.RideCancelled)) {
        throw new Error('ILLEGAL_TRANSITION');
      }
      tx.update(rideRef, {
        status: RideStatus.RideCancelled,
        cancelledBy,
        cancelReason: reason ?? null,
        updatedAt: firestore.FieldValue.serverTimestamp(),
      });
    });
  } catch (err) {
    if (err instanceof Error && err.message === 'ILLEGAL_TRANSITION') {
      throw new Error('This ride can no longer be cancelled.');
    }
    throw mapFirestoreError(err);
  }
}

async function advanceRideStatus(
  rideId: string,
  targetStatus: RideStatus,
  timestampField: string
): Promise<void> {
  const rideRef = firestore().collection('rides').doc(rideId);
  try {
    await firestore().runTransaction(async (tx) => {
      const snap = await tx.get(rideRef);
      if (!snap.exists()) throw new Error('RIDE_NOT_FOUND');
      const current = snap.data()!.status as RideStatus;
      if (!canTransition(current, targetStatus)) {
        throw new Error('ILLEGAL_TRANSITION');
      }
      tx.update(rideRef, {
        status: targetStatus,
        [timestampField]: firestore.FieldValue.serverTimestamp(),
        updatedAt: firestore.FieldValue.serverTimestamp(),
      });
    });
  } catch (err) {
    if (err instanceof Error && err.message === 'ILLEGAL_TRANSITION') {
      throw new Error("This ride can't be advanced right now.");
    }
    throw mapFirestoreError(err);
  }
}

export function startEnRoute(rideId: string): Promise<void> {
  return advanceRideStatus(rideId, RideStatus.DriverEnRoute, 'enRouteAt');
}

export function markArrived(rideId: string): Promise<void> {
  return advanceRideStatus(rideId, RideStatus.DriverArrived, 'arrivedAt');
}

export function startRide(rideId: string): Promise<void> {
  return advanceRideStatus(rideId, RideStatus.RideStarted, 'startedAt');
}

export function completeRide(rideId: string): Promise<void> {
  return advanceRideStatus(rideId, RideStatus.RideCompleted, 'completedAt');
}

export interface RideTrackingUpdate {
  driverLocation: LatLng;
  route: RouteInfo;
  etaSeconds: number;
  remainingDistanceMeters: number;
}

export async function updateRideTracking(
  rideId: string,
  tracking: RideTrackingUpdate
): Promise<void> {
  try {
    await firestore().collection('rides').doc(rideId).update({
      driverLocation: tracking.driverLocation,
      route: tracking.route,
      etaSeconds: tracking.etaSeconds,
      remainingDistanceMeters: tracking.remainingDistanceMeters,
      updatedAt: firestore.FieldValue.serverTimestamp(),
    });
  } catch (err) {
    throw mapFirestoreError(err);
  }
}
