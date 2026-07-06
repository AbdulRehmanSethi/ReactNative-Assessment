import { LatLng } from '~/features/ride/types';

const EARTH_RADIUS_METERS = 6371000;

function toRadians(deg: number): number {
  return (deg * Math.PI) / 180;
}

export function haversineDistanceMeters(a: LatLng, b: LatLng): number {
  const dLat = toRadians(b.latitude - a.latitude);
  const dLon = toRadians(b.longitude - a.longitude);
  const lat1 = toRadians(a.latitude);
  const lat2 = toRadians(b.latitude);

  const h = Math.sin(dLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLon / 2) ** 2;
  return 2 * EARTH_RADIUS_METERS * Math.asin(Math.sqrt(h));
}

export type LngLatBounds = [west: number, south: number, east: number, north: number];

export function computeBounds(a: LatLng, b: LatLng): LngLatBounds {
  return [
    Math.min(a.longitude, b.longitude),
    Math.min(a.latitude, b.latitude),
    Math.max(a.longitude, b.longitude),
    Math.max(a.latitude, b.latitude),
  ];
}
