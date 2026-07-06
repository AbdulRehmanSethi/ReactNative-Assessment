import { VehicleType } from '~/services/profileTypes';

export interface LatLng {
  latitude: number;
  longitude: number;
}

export enum RideStatus {
  Requested = 'Requested',
  DriverQuotedFare = 'Driver Quoted Fare',
  FareAccepted = 'Fare Accepted',
  DriverEnRoute = 'Driver En Route',
  DriverArrived = 'Driver Arrived',
  RideStarted = 'Ride Started',
  RideCompleted = 'Ride Completed',
  RideCancelled = 'Ride Cancelled',
}

export const RIDE_TRANSITIONS: Record<RideStatus, RideStatus[]> = {
  [RideStatus.Requested]: [RideStatus.DriverQuotedFare, RideStatus.RideCancelled],
  [RideStatus.DriverQuotedFare]: [RideStatus.FareAccepted, RideStatus.RideCancelled],
  [RideStatus.FareAccepted]: [RideStatus.DriverEnRoute, RideStatus.RideCancelled],
  [RideStatus.DriverEnRoute]: [RideStatus.DriverArrived, RideStatus.RideCancelled],
  [RideStatus.DriverArrived]: [RideStatus.RideStarted, RideStatus.RideCancelled],
  [RideStatus.RideStarted]: [RideStatus.RideCompleted],
  [RideStatus.RideCompleted]: [],
  [RideStatus.RideCancelled]: [],
};

export function canTransition(from: RideStatus, to: RideStatus): boolean {
  return RIDE_TRANSITIONS[from]?.includes(to) ?? false;
}

export interface RidePoint {
  coords: LatLng;
  address: string;
}

export interface RouteInfo {
  coords: LatLng[];
  distanceMeters: number;
  durationSeconds: number;
}

export interface Ride {
  id: string;
  status: RideStatus;
  partnerId: string;
  partnerName: string;
  driverId: string | null;
  driverName: string | null;
  pickup: RidePoint;
  dropoff: RidePoint;
  estimatedDistanceKm: number;
  fare: number | null;
  createdAt: number;
  updatedAt: number;
  cancelledBy?: 'partner' | 'driver';
  cancelReason?: string;
  driverLocation: LatLng | null;
  route: RouteInfo | null;
  etaSeconds: number | null;
  remainingDistanceMeters: number | null;
  enRouteAt?: number;
  arrivedAt?: number;
  startedAt?: number;
  completedAt?: number;
}

export type QuoteStatus = 'offered' | 'accepted' | 'lost' | 'withdrawn';

export interface RideQuote {
  driverId: string;
  driverName: string;
  vehicleType: VehicleType;
  vehicleModel: string;
  fare: number;
  note?: string;
  status: QuoteStatus;
  createdAt: number;
}
