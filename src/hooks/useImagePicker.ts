import { useState } from 'react';
import { Alert, Linking } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { compressImage, checkImageSize } from '~/services/imageCompression';

export interface PickedImage {
  uri: string;
  base64: string;
  mime: string;
}

export type ImageSource = 'camera' | 'library';

function showPermissionAlert(canAskAgain: boolean) {
  if (canAskAgain) {
    Alert.alert(
      'Permission needed',
      'We need access to your camera or photos to add this picture.'
    );
    return;
  }
  Alert.alert(
    'Permission needed',
    'Camera/photo access is disabled. Enable it in Settings to continue.',
    [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Open Settings', onPress: () => Linking.openSettings() },
    ]
  );
}

export function useImagePicker() {
  const [busy, setBusy] = useState(false);

  async function pick(source: ImageSource): Promise<PickedImage | null> {
    setBusy(true);
    try {
      const permission =
        source === 'camera'
          ? await ImagePicker.requestCameraPermissionsAsync()
          : await ImagePicker.requestMediaLibraryPermissionsAsync();

      if (permission.status !== 'granted') {
        showPermissionAlert(permission.canAskAgain);
        return null;
      }

      const result =
        source === 'camera'
          ? await ImagePicker.launchCameraAsync({ mediaTypes: ['images'], quality: 1 })
          : await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], quality: 1 });

      if (result.canceled || !result.assets?.length) {
        return null;
      }

      const asset = result.assets[0];
      const { base64, mime } = await compressImage(asset.uri, asset.width, asset.height);
      checkImageSize(base64);
      return { uri: asset.uri, base64, mime };
    } catch (err) {
      Alert.alert(
        'Could not add photo',
        err instanceof Error ? err.message : 'Something went wrong. Please try again.'
      );
      return null;
    } finally {
      setBusy(false);
    }
  }

  return { pick, busy };
}
