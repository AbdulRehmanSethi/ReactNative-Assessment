import React from 'react';
import { View, Switch, StyleProp, ViewStyle, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '~/theme';
import { Text } from '~/components/Text';
import { Card } from '~/components/Card';

export interface OnlineToggleCardProps {
  online: boolean;
  loading?: boolean;
  onToggle: (next: boolean) => void;
  errorMessage?: string | null;
  style?: StyleProp<ViewStyle>;
}

export function OnlineToggleCard({
  online,
  loading,
  onToggle,
  errorMessage,
  style,
}: OnlineToggleCardProps) {
  const theme = useTheme();

  return (
    <Card style={style}>
      <View style={{ flexDirection: 'row', alignItems: 'center' }}>
        <Ionicons
          name={online ? 'radio-button-on' : 'radio-button-off'}
          size={20}
          color={online ? theme.colors.success : theme.colors.textMuted}
          style={{ marginRight: theme.spacing.sm }}
        />
        <Text variant="subtitle" style={{ flex: 1 }}>
          {online ? "You're Online" : "You're Offline"}
        </Text>
        {loading ? (
          <ActivityIndicator color={theme.colors.primary} />
        ) : (
          <Switch
            value={online}
            onValueChange={onToggle}
            trackColor={{ true: theme.colors.success, false: theme.colors.border }}
          />
        )}
      </View>
      {errorMessage ? (
        <Text variant="caption" color="error" style={{ marginTop: theme.spacing.xs }}>
          {errorMessage}
        </Text>
      ) : null}
    </Card>
  );
}
