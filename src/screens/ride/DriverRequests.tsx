import React, { useMemo, useState } from 'react';
import { FlatList } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { useTheme } from '~/theme';
import { Screen, Text, Card, RequestCard } from '~/components';
import { useAppSelector } from '~/redux/hooks';
import { haversineDistanceMeters } from '~/utils/geo';
import { DriverStackParamList } from '~/navigation/types';

export default function DriverRequests() {
  const theme = useTheme();
  const navigation = useNavigation<StackNavigationProp<DriverStackParamList>>();
  const online = useAppSelector((state) => state.driver.online);
  const location = useAppSelector((state) => state.driver.location);
  const [dismissedIds, setDismissedIds] = useState<Set<string>>(new Set());

  // The listener itself runs in DriverTabs (kept alive across the whole driver session so the
  // tab badge stays current) — this screen just reads the state it populates.
  const requests = useAppSelector((state) => state.ride.incomingRequests);
  const error = useAppSelector((state) => state.ride.incomingRequestsError);

  const visibleRequests = useMemo(
    () => requests.filter((r) => !dismissedIds.has(r.id)),
    [requests, dismissedIds]
  );

  if (!online) {
    return (
      <Screen style={{ alignItems: 'center', justifyContent: 'center', padding: theme.spacing.lg }}>
        <Card style={{ alignItems: 'center', width: '100%' }}>
          <Ionicons name="car-outline" size={40} color={theme.colors.primary} />
          <Text variant="subtitle" style={{ marginTop: theme.spacing.md, textAlign: 'center' }}>
            Go online to receive requests
          </Text>
          <Text
            variant="body"
            color="textMuted"
            style={{ marginTop: theme.spacing.xs, textAlign: 'center' }}>
            Toggle yourself online from the Home tab to start seeing nearby ride requests here.
          </Text>
        </Card>
      </Screen>
    );
  }

  return (
    <Screen style={{ padding: theme.spacing.lg }}>
      <Text variant="title" style={{ marginBottom: theme.spacing.md }}>
        Nearby Requests
      </Text>
      {error ? (
        <Text variant="caption" color="error" style={{ marginBottom: theme.spacing.md }}>
          {error}
        </Text>
      ) : null}
      {visibleRequests.length === 0 ? (
        <Card style={{ alignItems: 'center' }}>
          <Ionicons name="time-outline" size={32} color={theme.colors.textMuted} />
          <Text
            variant="body"
            color="textMuted"
            style={{ marginTop: theme.spacing.sm, textAlign: 'center' }}>
            No ride requests nearby right now. New requests will appear here automatically.
          </Text>
        </Card>
      ) : (
        <FlatList
          data={visibleRequests}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <RequestCard
              ride={item}
              distanceKm={
                location ? haversineDistanceMeters(location, item.pickup.coords) / 1000 : undefined
              }
              onPress={() => navigation.navigate('RequestDetail', { rideId: item.id })}
              onDismiss={() =>
                setDismissedIds((prev) => {
                  const next = new Set(prev);
                  next.add(item.id);
                  return next;
                })
              }
            />
          )}
        />
      )}
    </Screen>
  );
}
