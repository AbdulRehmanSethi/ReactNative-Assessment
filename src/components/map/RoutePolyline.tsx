import React from 'react';
import { GeoJSONSource, Layer } from '@maplibre/maplibre-react-native';
import { useTheme } from '~/theme';
import { LatLng } from '~/features/ride/types';

export interface RoutePolylineProps {
  coords: LatLng[];
  color?: string;
}

export function RoutePolyline({ coords, color }: RoutePolylineProps) {
  const theme = useTheme();

  if (coords.length < 2) return null;

  const geojson: GeoJSON.Feature<GeoJSON.LineString> = {
    type: 'Feature',
    properties: {},
    geometry: {
      type: 'LineString',
      coordinates: coords.map((c) => [c.longitude, c.latitude]),
    },
  };

  return (
    <GeoJSONSource id="route-source" data={geojson}>
      <Layer
        id="route-line"
        type="line"
        layout={{ 'line-cap': 'round', 'line-join': 'round' }}
        paint={{
          'line-color': color ?? theme.colors.primary,
          'line-width': 4,
          'line-opacity': 0.85,
        }}
      />
    </GeoJSONSource>
  );
}
