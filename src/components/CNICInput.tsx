import React from 'react';
import { FormField } from '~/components/FormField';

export interface CNICInputProps {
  value: string;
  onChangeValue: (digits: string) => void;
  error?: string;
}

export function formatCnic(raw: string): string {
  const digits = raw.replace(/\D/g, '').slice(0, 13);
  const part1 = digits.slice(0, 5);
  const part2 = digits.slice(5, 12);
  const part3 = digits.slice(12, 13);
  let formatted = part1;
  if (part2) formatted += `-${part2}`;
  if (part3) formatted += `-${part3}`;
  return formatted;
}

export function CNICInput({ value, onChangeValue, error }: CNICInputProps) {
  return (
    <FormField
      label="CNIC"
      placeholder="XXXXX-XXXXXXX-X"
      value={formatCnic(value)}
      onChangeText={(text) => onChangeValue(text.replace(/\D/g, '').slice(0, 13))}
      keyboardType="number-pad"
      maxLength={15}
      error={error}
    />
  );
}
