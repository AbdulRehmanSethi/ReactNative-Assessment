import React, { useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '~/theme';
import { Text } from '~/components/Text';

export function SearchingIndicator() {
  const theme = useTheme();
  const scale = useSharedValue(1);
  const opacity = useSharedValue(0.6);

  useEffect(() => {
    scale.value = withRepeat(
      withSequence(withTiming(1.4, { duration: 900 }), withTiming(1, { duration: 900 })),
      -1
    );
    opacity.value = withRepeat(
      withSequence(withTiming(0.15, { duration: 900 }), withTiming(0.6, { duration: 900 })),
      -1
    );
  }, [scale, opacity]);

  const pulseStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: opacity.value,
  }));

  return (
    <View style={[styles.container, { padding: theme.spacing.xl }]}>
      <View style={styles.badge}>
        <Animated.View
          style={[styles.pulse, { backgroundColor: theme.colors.primary }, pulseStyle]}
        />
        <Ionicons name="car-outline" size={32} color={theme.colors.primary} />
      </View>
      <Text variant="subtitle" style={{ marginTop: theme.spacing.md }}>
        Searching for drivers…
      </Text>
      <Text variant="caption" color="textMuted" style={{ marginTop: theme.spacing.xs }}>
        This usually takes less than a minute.
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  badge: {
    width: 80,
    height: 80,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pulse: {
    position: 'absolute',
    width: 80,
    height: 80,
    borderRadius: 40,
  },
});
