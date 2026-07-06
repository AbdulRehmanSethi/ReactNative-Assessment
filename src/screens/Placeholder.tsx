import React from 'react';
import { useRoute } from '@react-navigation/native';
import { Screen, Text } from '~/components';
import { useTheme } from '~/theme';

export interface PlaceholderProps {
  label?: string;
}

export default function Placeholder({ label }: PlaceholderProps) {
  const route = useRoute();
  const theme = useTheme();
  const title = label ?? route.name;

  return (
    <Screen style={{ alignItems: 'center', justifyContent: 'center' }}>
      <Text variant="subtitle">{title}</Text>
      <Text variant="caption" color="textMuted" style={{ marginTop: theme.spacing.xs }}>
        Coming in a later phase
      </Text>
    </Screen>
  );
}
