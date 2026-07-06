import React from 'react';
import { Pressable, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '~/theme';
import { Text } from '~/components/Text';
import { Card } from '~/components/Card';
import { Ride } from '~/features/ride/types';

export interface RequestCardProps {
  ride: Ride;
  distanceKm?: number;
  onPress: () => void;
  onDismiss?: () => void;
}

function timeAgo(epochMs: number): string {
  const seconds = Math.max(0, Math.round((Date.now() - epochMs) / 1000));
  if (seconds < 60) return 'just now';
  const minutes = Math.round(seconds / 60);
  return `${minutes}m ago`;
}

export function RequestCard({ ride, distanceKm, onPress, onDismiss }: RequestCardProps) {
  const theme = useTheme();

  return (
    <Pressable onPress={onPress} style={{ marginBottom: theme.spacing.md }}>
      <Card>
        <View style={{ flexDirection: 'row', alignItems: 'flex-start' }}>
          <View style={{ flex: 1 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <Ionicons name="location" size={16} color={theme.colors.success} />
              <Text
                variant="body"
                numberOfLines={1}
                style={{ flex: 1, marginLeft: theme.spacing.xs }}>
                {ride.pickup.address}
              </Text>
            </View>
          </View>
          {onDismiss ? (
            <Pressable onPress={onDismiss} hitSlop={8} style={{ marginLeft: theme.spacing.sm }}>
              <Ionicons name="close" size={18} color={theme.colors.textMuted} />
            </Pressable>
          ) : null}
        </View>
        <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: theme.spacing.xs }}>
          <Ionicons name="flag" size={16} color={theme.colors.error} />
          <Text variant="body" numberOfLines={1} style={{ flex: 1, marginLeft: theme.spacing.xs }}>
            {ride.dropoff.address}
          </Text>
        </View>
        <View
          style={{
            flexDirection: 'row',
            justifyContent: 'space-between',
            marginTop: theme.spacing.sm,
          }}>
          <Text variant="caption" color="textMuted">
            {distanceKm !== undefined ? `${distanceKm.toFixed(1)} km away` : ''}
          </Text>
          <Text variant="caption" color="textMuted">
            {timeAgo(ride.createdAt)}
          </Text>
        </View>
      </Card>
    </Pressable>
  );
}
