import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Marker } from '@maplibre/maplibre-react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '~/theme';
import { LatLng } from '~/features/ride/types';

export interface DriverMarkerProps {
  uid: string;
  coords: LatLng;
}

export function DriverMarker({ uid, coords }: DriverMarkerProps) {
  const theme = useTheme();

  return (
    <Marker id={`driver-${uid}`} lngLat={[coords.longitude, coords.latitude]} anchor="center">
      <View
        style={[
          styles.badge,
          { backgroundColor: theme.colors.surface, borderColor: theme.colors.border },
        ]}>
        <Ionicons name="car" size={16} color={theme.colors.primary} />
      </View>
    </Marker>
  );
}

const styles = StyleSheet.create({
  badge: {
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
});
