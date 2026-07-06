import { LatLng } from '~/features/ride/types';

export interface GeocodeResult {
  label: string;
  coords: LatLng;
}

interface PhotonProperties {
  name?: string;
  street?: string;
  city?: string;
  state?: string;
  country?: string;
}

interface PhotonFeature {
  geometry: { coordinates: [number, number] };
  properties: PhotonProperties;
}

interface PhotonResponse {
  features: PhotonFeature[];
}

function toResult(feature: PhotonFeature): GeocodeResult {
  const [longitude, latitude] = feature.geometry.coordinates;
  const { name, street, city, state, country } = feature.properties;
  const label =
    [name, street, city, state, country].filter(Boolean).join(', ') ||
    `${latitude.toFixed(5)}, ${longitude.toFixed(5)}`;
  return { label, coords: { latitude, longitude } };
}

async function fetchPhoton(url: string): Promise<GeocodeResult[]> {
  let response: Response;
  try {
    response = await fetch(url);
  } catch {
    throw new Error('Could not search right now. Check your connection.');
  }
  if (!response.ok) {
    throw new Error('Could not search right now. Check your connection.');
  }
  const data = (await response.json()) as PhotonResponse;
  return data.features.map(toResult);
}

export async function searchAddress(
  query: string,
  bias?: LatLng,
  limit = 8
): Promise<GeocodeResult[]> {
  if (!query.trim()) return [];
  const params = new URLSearchParams({ q: query, limit: String(limit), lang: 'en' });
  if (bias) {
    params.set('lat', String(bias.latitude));
    params.set('lon', String(bias.longitude));
  }
  return fetchPhoton(`https://photon.komoot.io/api/?${params.toString()}`);
}

export async function reverseGeocode(coords: LatLng): Promise<GeocodeResult | null> {
  const params = new URLSearchParams({
    lon: String(coords.longitude),
    lat: String(coords.latitude),
  });
  const results = await fetchPhoton(`https://photon.komoot.io/reverse?${params.toString()}`);
  return results[0] ?? null;
}
