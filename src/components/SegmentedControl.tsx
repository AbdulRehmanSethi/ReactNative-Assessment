import React from 'react';
import { View, Pressable, StyleSheet } from 'react-native';
import { useTheme } from '~/theme';
import { Text } from '~/components/Text';

export interface SegmentedControlOption<T extends string> {
  label: string;
  value: T;
}

export interface SegmentedControlProps<T extends string> {
  label: string;
  options: SegmentedControlOption<T>[];
  value: T | null;
  onChange: (value: T) => void;
  error?: string;
}

export function SegmentedControl<T extends string>({
  label,
  options,
  value,
  onChange,
  error,
}: SegmentedControlProps<T>) {
  const theme = useTheme();

  return (
    <View style={{ marginBottom: theme.spacing.md }}>
      <Text variant="caption" color="textMuted" style={{ marginBottom: theme.spacing.xs }}>
        {label}
      </Text>
      <View style={styles.row}>
        {options.map((option) => {
          const selected = option.value === value;
          return (
            <Pressable
              key={option.value}
              onPress={() => onChange(option.value)}
              style={[
                styles.pill,
                {
                  borderRadius: theme.radius.md,
                  paddingVertical: theme.spacing.sm,
                  marginRight: theme.spacing.sm,
                  backgroundColor: selected ? theme.colors.primary : theme.colors.background,
                  borderColor: selected ? theme.colors.primary : theme.colors.border,
                },
              ]}>
              <Text
                variant="body"
                style={{ color: selected ? theme.colors.primaryText : theme.colors.text }}>
                {option.label}
              </Text>
            </Pressable>
          );
        })}
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
  pill: {
    flexGrow: 1,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    minWidth: 90,
  },
});
