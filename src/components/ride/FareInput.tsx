import React from 'react';
import { Text } from '~/components/Text';
import { FormField } from '~/components/FormField';

export interface FareInputProps {
  value: string;
  onChangeValue: (digits: string) => void;
  error?: string;
}

export function FareInput({ value, onChangeValue, error }: FareInputProps) {
  return (
    <FormField
      label="Your Fare"
      placeholder="0"
      value={value}
      onChangeText={(text) => onChangeValue(text.replace(/[^0-9]/g, ''))}
      keyboardType="number-pad"
      leftAccessory={
        <Text variant="subtitle" color="textMuted">
          Rs
        </Text>
      }
      error={error}
    />
  );
}
