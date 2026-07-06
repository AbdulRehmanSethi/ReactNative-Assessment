import React from 'react';
import { View, Pressable, Image, ActivityIndicator, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '~/theme';
import { Text } from '~/components/Text';
import { useImagePicker, PickedImage } from '~/hooks/useImagePicker';
import { showImageSourceSheet } from '~/components/imagePickerActionSheet';

export interface ImagePickerTileProps {
  label: string;
  image: PickedImage | null;
  onChange: (image: PickedImage | null) => void;
  error?: string;
}

export function ImagePickerTile({ label, image, onChange, error }: ImagePickerTileProps) {
  const theme = useTheme();
  const { pick, busy } = useImagePicker();

  function handlePress() {
    showImageSourceSheet(
      async () => onChange(await pick('camera')),
      async () => onChange(await pick('library')),
      image ? () => onChange(null) : undefined
    );
  }

  return (
    <View style={{ marginBottom: theme.spacing.md }}>
      <Text variant="caption" color="textMuted" style={{ marginBottom: theme.spacing.xs }}>
        {label}
      </Text>
      <Pressable
        onPress={handlePress}
        style={[
          styles.tile,
          {
            borderRadius: theme.radius.md,
            borderColor: error ? theme.colors.error : theme.colors.border,
            borderStyle: image ? 'solid' : 'dashed',
            backgroundColor: theme.colors.background,
          },
        ]}>
        {image ? (
          <Image source={{ uri: image.uri }} style={styles.image} />
        ) : (
          <Ionicons name="camera-outline" size={28} color={theme.colors.textMuted} />
        )}
        {image ? (
          <View style={[styles.editBadge, { backgroundColor: theme.colors.primary }]}>
            <Ionicons name="create-outline" size={14} color={theme.colors.primaryText} />
          </View>
        ) : null}
        {busy ? (
          <View style={styles.busyOverlay}>
            <ActivityIndicator color={theme.colors.primaryText} />
          </View>
        ) : null}
      </Pressable>
      {error ? (
        <Text variant="caption" color="error" style={{ marginTop: theme.spacing.xs }}>
          {error}
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  tile: {
    width: 96,
    height: 96,
    borderWidth: 1,
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  editBadge: {
    position: 'absolute',
    bottom: 4,
    right: 4,
    width: 22,
    height: 22,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
  },
  busyOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.35)',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
