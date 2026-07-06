import React from 'react';
import { View } from 'react-native';
import { useTheme } from '~/theme';
import { Text } from '~/components/Text';
import { Card } from '~/components/Card';
import { Button } from '~/components/Button';
import { RideQuote } from '~/features/ride/types';

export interface QuoteCardProps {
  quote: RideQuote;
  onAccept: () => void;
  accepting?: boolean;
}

const VEHICLE_LABELS: Record<string, string> = {
  bike: 'Bike',
  car: 'Car',
  rickshaw: 'Rickshaw',
};

export function QuoteCard({ quote, onAccept, accepting }: QuoteCardProps) {
  const theme = useTheme();

  return (
    <Card style={{ marginBottom: theme.spacing.md }}>
      <View
        style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <View style={{ flex: 1 }}>
          <Text variant="subtitle">{quote.driverName}</Text>
          <Text variant="caption" color="textMuted">
            {VEHICLE_LABELS[quote.vehicleType] ?? quote.vehicleType} · {quote.vehicleModel}
          </Text>
          {quote.note ? (
            <Text variant="caption" color="textMuted" style={{ marginTop: theme.spacing.xs }}>
              &ldquo;{quote.note}&rdquo;
            </Text>
          ) : null}
        </View>
        <Text variant="title" style={{ marginLeft: theme.spacing.sm }}>
          Rs {quote.fare}
        </Text>
      </View>
      <Button
        title="Accept"
        onPress={onAccept}
        loading={accepting}
        style={{ marginTop: theme.spacing.md }}
      />
    </Card>
  );
}
