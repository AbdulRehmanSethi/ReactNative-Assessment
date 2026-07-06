import React from 'react';
import { View, StyleProp, ViewStyle, Platform } from 'react-native';
import { useTheme } from '~/theme';

export interface CardProps {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
}

export function Card({ children, style }: CardProps) {
  const theme = useTheme();

  const shadow = Platform.select<ViewStyle>({
    ios: {
      shadowColor: '#000000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: theme.scheme === 'dark' ? 0.4 : 0.08,
      shadowRadius: 8,
    },
    android: { elevation: 3 },
    default: {},
  });

  return (
    <View
      style={[
        {
          backgroundColor: theme.colors.surface,
          borderRadius: theme.radius.lg,
          padding: theme.spacing.md,
        },
        shadow,
        style,
      ]}>
      {children}
    </View>
  );
}
