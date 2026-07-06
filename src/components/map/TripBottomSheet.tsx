import React, { useMemo, useState } from 'react';
import { View, Pressable, StyleSheet } from 'react-native';
import BottomSheet, { BottomSheetScrollView } from '@gorhom/bottom-sheet';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '~/theme';
import { Text } from '~/components/Text';
import { Button } from '~/components/Button';
import { AddressSearchInput } from '~/components/map/AddressSearchInput';
import { LatLng } from '~/features/ride/types';
import { GeocodeResult } from '~/services/geocodingService';

export interface TripPoint {
  address: string;
}

export interface TripBottomSheetProps {
  pickup: TripPoint | null;
  dropoff: TripPoint | null;
  onSelectPickup: (result: GeocodeResult) => void;
  onSelectDropoff: (result: GeocodeResult) => void;
  onPinPickup: () => void;
  onPinDropoff: () => void;
  ctaEnabled: boolean;
  ctaLoading?: boolean;
  onPressCta: () => void;
  bias?: LatLng | null;
}

type ActiveField = 'pickup' | 'dropoff' | null;

export function TripBottomSheet({
  pickup,
  dropoff,
  onSelectPickup,
  onSelectDropoff,
  onPinPickup,
  onPinDropoff,
  ctaEnabled,
  ctaLoading,
  onPressCta,
  bias,
}: TripBottomSheetProps) {
  const theme = useTheme();
  const [activeField, setActiveField] = useState<ActiveField>(null);
  const snapPoints = useMemo(() => ['32%', '65%'], []);

  function toggleField(field: ActiveField) {
    setActiveField((current) => (current === field ? null : field));
  }

  function handleSelect(field: 'pickup' | 'dropoff', result: GeocodeResult) {
    if (field === 'pickup') onSelectPickup(result);
    else onSelectDropoff(result);
    setActiveField(null);
  }

  return (
    <BottomSheet
      index={0}
      snapPoints={snapPoints}
      backgroundStyle={{ backgroundColor: theme.colors.background }}
      handleIndicatorStyle={{ backgroundColor: theme.colors.border }}>
      <BottomSheetScrollView
        contentContainerStyle={{
          paddingHorizontal: theme.spacing.lg,
          paddingBottom: theme.spacing.xl,
        }}>
        <FieldRow
          icon="location"
          iconColor={theme.colors.success}
          label={pickup?.address ?? 'Set pickup location'}
          onPress={() => toggleField('pickup')}
          onPinPress={onPinPickup}
        />
        {activeField === 'pickup' ? (
          <AddressSearchInput
            placeholder="Search pickup address"
            bias={bias}
            onSelect={(result) => handleSelect('pickup', result)}
          />
        ) : null}

        <FieldRow
          icon="flag"
          iconColor={theme.colors.error}
          label={dropoff?.address ?? 'Where to?'}
          onPress={() => toggleField('dropoff')}
          onPinPress={onPinDropoff}
          style={{ marginTop: theme.spacing.sm }}
        />
        {activeField === 'dropoff' ? (
          <AddressSearchInput
            placeholder="Search drop-off address"
            bias={bias}
            onSelect={(result) => handleSelect('dropoff', result)}
          />
        ) : null}

        <Button
          title="Find nearby drivers"
          onPress={onPressCta}
          disabled={!ctaEnabled || ctaLoading}
          loading={ctaLoading}
          style={{ marginTop: theme.spacing.lg }}
        />
      </BottomSheetScrollView>
    </BottomSheet>
  );
}

interface FieldRowProps {
  icon: keyof typeof Ionicons.glyphMap;
  iconColor: string;
  label: string;
  onPress: () => void;
  onPinPress: () => void;
  style?: object;
}

function FieldRow({ icon, iconColor, label, onPress, onPinPress, style }: FieldRowProps) {
  const theme = useTheme();

  return (
    <View
      style={[
        styles.row,
        { borderColor: theme.colors.border, borderRadius: theme.radius.md },
        style,
      ]}>
      <Pressable onPress={onPress} style={styles.rowMain}>
        <Ionicons
          name={icon}
          size={18}
          color={iconColor}
          style={{ marginRight: theme.spacing.sm }}
        />
        <Text variant="body" numberOfLines={1} style={{ flex: 1 }}>
          {label}
        </Text>
      </Pressable>
      <Pressable onPress={onPinPress} hitSlop={8} style={{ padding: theme.spacing.xs }}>
        <Ionicons name="map-outline" size={18} color={theme.colors.textMuted} />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    paddingHorizontal: 12,
    height: 52,
  },
  rowMain: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    height: '100%',
  },
});
