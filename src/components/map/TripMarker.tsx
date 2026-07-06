import React from 'react';
import { View, StyleSheet, Platform } from 'react-native';
import { Marker } from '@maplibre/maplibre-react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '~/theme';
import { LatLng } from '~/features/ride/types';

export interface TripMarkerProps {
  kind: 'pickup' | 'dropoff';
  coords: LatLng;
}

export function TripMarker({ kind, coords }: TripMarkerProps) {
  const theme = useTheme();
  const color = kind === 'pickup' ? theme.colors.success : theme.colors.error;
  const icon = kind === 'pickup' ? 'location' : 'flag';

  const shadow = Platform.select({
    ios: {
      shadowColor: '#000000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.25,
      shadowRadius: 4,
    },
    android: { elevation: 4 },
    default: {},
  });

  return (
    <Marker id={`trip-${kind}`} lngLat={[coords.longitude, coords.latitude]} anchor="bottom">
      <View style={[styles.pin, { backgroundColor: color }, shadow]}>
        <Ionicons name={icon} size={16} color={theme.colors.primaryText} />
      </View>
    </Marker>
  );
}

const styles = StyleSheet.create({
  pin: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
});
