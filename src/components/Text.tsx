import React from 'react';
import { Text as RNText, TextProps as RNTextProps, StyleSheet } from 'react-native';
import { useTheme } from '~/theme';
import { ColorTokens } from '~/theme/tokens';

export type TextVariant = 'title' | 'subtitle' | 'body' | 'caption' | 'button';

export interface TextProps extends RNTextProps {
  variant?: TextVariant;
  color?: keyof ColorTokens;
}

export function Text({ variant = 'body', color, style, ...rest }: TextProps) {
  const theme = useTheme();

  const variantStyle = {
    title: { fontSize: theme.fontSize.xxl, fontWeight: '700' as const },
    subtitle: { fontSize: theme.fontSize.lg, fontWeight: '600' as const },
    body: { fontSize: theme.fontSize.md, fontWeight: '400' as const },
    caption: { fontSize: theme.fontSize.sm, fontWeight: '400' as const },
    button: { fontSize: theme.fontSize.md, fontWeight: '600' as const },
  }[variant];

  return (
    <RNText
      style={[StyleSheet.flatten(variantStyle), { color: theme.colors[color ?? 'text'] }, style]}
      {...rest}
    />
  );
}
