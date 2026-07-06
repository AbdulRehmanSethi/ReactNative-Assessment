import React from 'react';
import { StyleSheet } from 'react-native';
import { Map, Camera, type MapRef, type CameraRef } from '@maplibre/maplibre-react-native';
import { useTheme } from '~/theme';
import { MAP_STYLE_URLS } from '~/config/mapStyles';
import { LatLng } from '~/features/ride/types';

export interface ThemedMapViewProps {
  mapRef?: React.Ref<MapRef>;
  cameraRef?: React.Ref<CameraRef>;
  initialCenter: LatLng;
  onStyleLoadError?: () => void;
  children?: React.ReactNode;
}

export function ThemedMapView({
  mapRef,
  cameraRef,
  initialCenter,
  onStyleLoadError,
  children,
}: ThemedMapViewProps) {
  const theme = useTheme();

  return (
    <Map
      ref={mapRef}
      style={StyleSheet.absoluteFill}
      mapStyle={MAP_STYLE_URLS[theme.scheme]}
      logo={false}
      onDidFailLoadingMap={onStyleLoadError}>
      <Camera
        ref={cameraRef}
        initialViewState={{
          center: [initialCenter.longitude, initialCenter.latitude],
          zoom: 15,
        }}
      />
      {children}
    </Map>
  );
}
