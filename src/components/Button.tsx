import React from 'react';
import { Pressable, StyleProp, ViewStyle, StyleSheet, ActivityIndicator } from 'react-native';
import { useTheme } from '~/theme';
import { Text } from '~/components/Text';

export interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary';
  disabled?: boolean;
  loading?: boolean;
  style?: StyleProp<ViewStyle>;
}

export function Button({
  title,
  onPress,
  variant = 'primary',
  disabled,
  loading,
  style,
}: ButtonProps) {
  const theme = useTheme();
  const isDisabled = disabled || loading;

  const containerStyle: ViewStyle =
    variant === 'primary'
      ? { backgroundColor: theme.colors.primary }
      : { backgroundColor: theme.colors.surface, borderWidth: 1, borderColor: theme.colors.border };

  const textColor = variant === 'primary' ? theme.colors.primaryText : theme.colors.text;

  return (
    <Pressable
      onPress={onPress}
      disabled={isDisabled}
      style={({ pressed }) => [
        styles.base,
        {
          borderRadius: theme.radius.md,
          paddingVertical: theme.spacing.sm,
          paddingHorizontal: theme.spacing.md,
        },
        containerStyle,
        isDisabled && styles.disabled,
        pressed && !isDisabled && styles.pressed,
        style,
      ]}>
      {loading ? (
        <ActivityIndicator color={textColor} />
      ) : (
        <Text variant="button" style={{ color: textColor }}>
          {title}
        </Text>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  disabled: {
    opacity: 0.5,
  },
  pressed: {
    opacity: 0.8,
  },
});
