import React from 'react';
import { View, Pressable, Image, ActivityIndicator, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '~/theme';
import { Text } from '~/components/Text';
import { useImagePicker, PickedImage } from '~/hooks/useImagePicker';
import { showImageSourceSheet } from '~/components/imagePickerActionSheet';

export interface ImagePickerGridProps {
  label: string;
  images: PickedImage[];
  onChange: (images: PickedImage[]) => void;
  min?: number;
  max?: number;
  error?: string;
}

export function ImagePickerGrid({
  label,
  images,
  onChange,
  min = 1,
  max = 4,
  error,
}: ImagePickerGridProps) {
  const theme = useTheme();
  const { pick, busy } = useImagePicker();

  function removeAt(index: number) {
    onChange(images.filter((_, i) => i !== index));
  }

  function handleAdd() {
    showImageSourceSheet(
      async () => {
        const picked = await pick('camera');
        if (picked) onChange([...images, picked]);
      },
      async () => {
        const picked = await pick('library');
        if (picked) onChange([...images, picked]);
      }
    );
  }

  const belowMinimum = images.length < min;

  return (
    <View style={{ marginBottom: theme.spacing.md }}>
      <Text
        variant="caption"
        color={belowMinimum ? 'warning' : 'textMuted'}
        style={{ marginBottom: theme.spacing.xs }}>
        {label} ({images.length}/{max}, min {min})
      </Text>
      <View style={styles.row}>
        {images.map((image, index) => (
          <View
            key={image.uri + index}
            style={[
              styles.tile,
              {
                borderRadius: theme.radius.md,
                marginRight: theme.spacing.sm,
                marginBottom: theme.spacing.sm,
              },
            ]}>
            <Image source={{ uri: image.uri }} style={styles.image} />
            <Pressable
              onPress={() => removeAt(index)}
              style={[styles.removeBadge, { backgroundColor: theme.colors.error }]}>
              <Ionicons name="close" size={14} color={theme.colors.primaryText} />
            </Pressable>
          </View>
        ))}
        {images.length < max ? (
          <Pressable
            onPress={handleAdd}
            style={[
              styles.tile,
              styles.addTile,
              {
                borderRadius: theme.radius.md,
                borderColor: error ? theme.colors.error : theme.colors.border,
                backgroundColor: theme.colors.background,
                marginBottom: theme.spacing.sm,
              },
            ]}>
            {busy ? (
              <ActivityIndicator color={theme.colors.textMuted} />
            ) : (
              <Ionicons name="add" size={28} color={theme.colors.textMuted} />
            )}
          </Pressable>
        ) : null}
      </View>
      {error ? (
        <Text variant="caption" color="error" style={{ marginTop: theme.spacing.xs }}>
          {error}
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  tile: {
    width: 88,
    height: 88,
    overflow: 'hidden',
  },
  addTile: {
    borderWidth: 1,
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  removeBadge: {
    position: 'absolute',
    top: 4,
    right: 4,
    width: 20,
    height: 20,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
