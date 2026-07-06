import React from 'react';
import { View } from 'react-native';
import { useTheme } from '~/theme';
import { ColorTokens } from '~/theme/tokens';
import { Text } from '~/components/Text';
import { RideStatus } from '~/features/ride/types';

export interface StatusChipProps {
  status: RideStatus;
}

const STATUS_CONFIG: Record<RideStatus, { label: string; colorKey: keyof ColorTokens }> = {
  [RideStatus.Requested]: { label: 'Requested', colorKey: 'textMuted' },
  [RideStatus.DriverQuotedFare]: { label: 'Quote Received', colorKey: 'primary' },
  [RideStatus.FareAccepted]: { label: 'Accepted', colorKey: 'success' },
  [RideStatus.DriverEnRoute]: { label: 'Driver En Route', colorKey: 'primary' },
  [RideStatus.DriverArrived]: { label: 'Driver Arrived', colorKey: 'primary' },
  [RideStatus.RideStarted]: { label: 'In Progress', colorKey: 'primary' },
  [RideStatus.RideCompleted]: { label: 'Completed', colorKey: 'success' },
  [RideStatus.RideCancelled]: { label: 'Cancelled', colorKey: 'error' },
};

export function StatusChip({ status }: StatusChipProps) {
  const theme = useTheme();
  const config = STATUS_CONFIG[status];
  const color = theme.colors[config.colorKey];

  return (
    <View
      style={{
        alignSelf: 'flex-start',
        borderWidth: 1,
        borderColor: color,
        backgroundColor: theme.colors.surface,
        borderRadius: theme.radius.full,
        paddingHorizontal: theme.spacing.sm,
        paddingVertical: 4,
      }}>
      <Text variant="caption" style={{ color }}>
        {config.label}
      </Text>
    </View>
  );
}
