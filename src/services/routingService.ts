import { LatLng, RouteInfo } from '~/features/ride/types';
import { haversineDistanceMeters } from '~/utils/geo';

const OSRM_TIMEOUT_MS = 8000;
const AVG_SPEED_MPS = 8.33; // ~30 km/h, a rough urban average for the fallback ETA

interface OsrmResponse {
  code: string;
  routes?: {
    distance: number;
    duration: number;
    geometry: { type: 'LineString'; coordinates: [number, number][] };
  }[];
}

function fallbackRoute(origin: LatLng, destination: LatLng): RouteInfo {
  const distanceMeters = haversineDistanceMeters(origin, destination);
  return {
    coords: [origin, destination],
    distanceMeters,
    durationSeconds: distanceMeters / AVG_SPEED_MPS,
  };
}

// Deliberately never throws — any failure (network, timeout, no route found) silently falls
// back to a straight line + haversine distance so tracking never crashes or shows a raw error.
export async function getRoute(origin: LatLng, destination: LatLng): Promise<RouteInfo> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), OSRM_TIMEOUT_MS);

  try {
    const url =
      `https://router.project-osrm.org/route/v1/driving/` +
      `${origin.longitude},${origin.latitude};${destination.longitude},${destination.latitude}` +
      `?overview=full&geometries=geojson`;
    const response = await fetch(url, { signal: controller.signal });
    if (!response.ok) return fallbackRoute(origin, destination);

    const data = (await response.json()) as OsrmResponse;
    const route = data.routes?.[0];
    if (data.code !== 'Ok' || !route) return fallbackRoute(origin, destination);

    return {
      coords: route.geometry.coordinates.map(([longitude, latitude]) => ({ latitude, longitude })),
      distanceMeters: route.distance,
      durationSeconds: route.duration,
    };
  } catch {
    return fallbackRoute(origin, destination);
  } finally {
    clearTimeout(timeout);
  }
}
