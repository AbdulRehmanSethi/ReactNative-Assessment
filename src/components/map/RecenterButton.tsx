import React from 'react';
import { Pressable, StyleProp, ViewStyle, StyleSheet, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '~/theme';

export interface RecenterButtonProps {
  onPress: () => void;
  style?: StyleProp<ViewStyle>;
}

export function RecenterButton({ onPress, style }: RecenterButtonProps) {
  const theme = useTheme();

  const shadow = Platform.select({
    ios: {
      shadowColor: '#000000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: theme.scheme === 'dark' ? 0.4 : 0.15,
      shadowRadius: 6,
    },
    android: { elevation: 4 },
    default: {},
  });

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.button,
        { backgroundColor: theme.colors.surface, opacity: pressed ? 0.8 : 1 },
        shadow,
        style,
      ]}>
      <Ionicons name="locate" size={22} color={theme.colors.primary} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    width: 52,
    height: 52,
    borderRadius: 26,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
