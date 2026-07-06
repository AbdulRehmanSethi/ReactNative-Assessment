import { ActionSheetIOS, Alert, Platform } from 'react-native';

export function showImageSourceSheet(
  onCamera: () => void,
  onLibrary: () => void,
  onRemove?: () => void
) {
  const options = [
    'Take Photo',
    'Choose from Library',
    ...(onRemove ? ['Remove Photo'] : []),
    'Cancel',
  ];
  const cancelButtonIndex = options.length - 1;

  if (Platform.OS === 'ios') {
    ActionSheetIOS.showActionSheetWithOptions(
      {
        options,
        cancelButtonIndex,
        destructiveButtonIndex: onRemove ? options.length - 2 : undefined,
      },
      (index) => {
        const choice = options[index];
        if (choice === 'Take Photo') onCamera();
        else if (choice === 'Choose from Library') onLibrary();
        else if (choice === 'Remove Photo') onRemove?.();
      }
    );
    return;
  }

  Alert.alert('Add Photo', undefined, [
    { text: 'Take Photo', onPress: onCamera },
    { text: 'Choose from Library', onPress: onLibrary },
    ...(onRemove
      ? [{ text: 'Remove Photo', style: 'destructive' as const, onPress: onRemove }]
      : []),
    { text: 'Cancel', style: 'cancel' as const },
  ]);
}
