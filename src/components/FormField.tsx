import React, { useState } from 'react';
import { View, TextInput, TextInputProps, StyleProp, ViewStyle, StyleSheet } from 'react-native';
import { useTheme } from '~/theme';
import { Text } from '~/components/Text';

export interface FormFieldProps extends TextInputProps {
  label: string;
  error?: string;
  leftAccessory?: React.ReactNode;
  rightAccessory?: React.ReactNode;
  containerStyle?: StyleProp<ViewStyle>;
}

export function FormField({
  label,
  error,
  leftAccessory,
  rightAccessory,
  containerStyle,
  style,
  onFocus,
  onBlur,
  ...rest
}: FormFieldProps) {
  const theme = useTheme();
  const [focused, setFocused] = useState(false);

  const borderColor = error
    ? theme.colors.error
    : focused
      ? theme.colors.primary
      : theme.colors.border;

  return (
    <View style={[{ marginBottom: theme.spacing.md }, containerStyle]}>
      <Text variant="caption" color="textMuted" style={{ marginBottom: theme.spacing.xs }}>
        {label}
      </Text>
      <View
        style={[
          styles.row,
          {
            borderColor,
            borderRadius: theme.radius.md,
            backgroundColor: theme.colors.background,
            paddingHorizontal: theme.spacing.md,
          },
        ]}>
        {leftAccessory ? (
          <View style={{ marginRight: theme.spacing.sm }}>{leftAccessory}</View>
        ) : null}
        <TextInput
          placeholderTextColor={theme.colors.textMuted}
          onFocus={(e) => {
            setFocused(true);
            onFocus?.(e);
          }}
          onBlur={(e) => {
            setFocused(false);
            onBlur?.(e);
          }}
          style={[styles.input, { color: theme.colors.text }, style]}
          {...rest}
        />
        {rightAccessory}
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
    alignItems: 'center',
    height: 52,
    borderWidth: 1,
  },
  input: {
    flex: 1,
    fontSize: 16,
    height: '100%',
  },
});
