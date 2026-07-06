import React from 'react';
import { View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '~/theme';
import { Text } from '~/components/Text';
import { Button } from '~/components/Button';
import { Card } from '~/components/Card';

export interface LocationPermissionCardProps {
  variant: 'denied' | 'services-off';
  onOpenSettings: () => void;
}

const COPY: Record<
  'denied' | 'services-off',
  { icon: keyof typeof Ionicons.glyphMap; title: string; body: string }
> = {
  denied: {
    icon: 'location-outline',
    title: 'Location access needed',
    body: 'We use your location to center the map and match you with nearby drivers. Please allow location access to continue.',
  },
  'services-off': {
    icon: 'navigate-circle-outline',
    title: 'Turn on location services',
    body: 'Your device’s location services are off. Turn them on in Settings to use the map.',
  },
};

export function LocationPermissionCard({ variant, onOpenSettings }: LocationPermissionCardProps) {
  const theme = useTheme();
  const copy = COPY[variant];

  return (
    <View
      style={{
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        padding: theme.spacing.lg,
      }}>
      <Card style={{ alignItems: 'center', width: '100%' }}>
        <Ionicons name={copy.icon} size={40} color={theme.colors.primary} />
        <Text variant="subtitle" style={{ marginTop: theme.spacing.md, textAlign: 'center' }}>
          {copy.title}
        </Text>
        <Text
          variant="body"
          color="textMuted"
          style={{ marginTop: theme.spacing.xs, textAlign: 'center' }}>
          {copy.body}
        </Text>
        <Button
          title="Open Settings"
          onPress={onOpenSettings}
          style={{ marginTop: theme.spacing.lg, width: '100%' }}
        />
      </Card>
    </View>
  );
}
