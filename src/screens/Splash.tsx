import React from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { StatusBar } from 'expo-status-bar';
import { useTheme } from '~/theme';
import { Text } from '~/components/Text';

export default function Splash() {
  const theme = useTheme();

  return (
    <LinearGradient
      colors={[theme.colors.gradientStart, theme.colors.gradientEnd]}
      start={{ x: 0, y: 0 }}
      end={{ x: 0, y: 1 }}
      style={styles.container}>
      <StatusBar style="light" />
      <Text style={styles.wordmark}>BookRide</Text>
      <Text style={styles.tagline}>Your ride, your way.</Text>
      <View style={{ marginTop: theme.spacing.xl }}>
        <ActivityIndicator size="small" color="#FFFFFF" />
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  wordmark: {
    fontSize: 40,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: 0.5,
  },
  tagline: {
    marginTop: 8,
    fontSize: 15,
    color: 'rgba(255,255,255,0.85)',
  },
});
