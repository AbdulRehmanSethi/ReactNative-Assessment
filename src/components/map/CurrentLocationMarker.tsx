import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Marker } from '@maplibre/maplibre-react-native';
import { useTheme } from '~/theme';
import { LatLng } from '~/features/ride/types';

export interface CurrentLocationMarkerProps {
  coords: LatLng;
}

export function CurrentLocationMarker({ coords }: CurrentLocationMarkerProps) {
  const theme = useTheme();

  return (
    <Marker id="current-location" lngLat={[coords.longitude, coords.latitude]} anchor="center">
      <View
        style={[
          styles.dot,
          { backgroundColor: theme.colors.primary, borderColor: theme.colors.background },
        ]}
      />
    </Marker>
  );
}

const styles = StyleSheet.create({
  dot: {
    width: 18,
    height: 18,
    borderRadius: 9,
    borderWidth: 3,
  },
});
