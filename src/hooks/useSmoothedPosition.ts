import { useEffect, useRef, useState } from 'react';
import { useSharedValue, useAnimatedReaction, withTiming, runOnJS } from 'react-native-reanimated';
import { LatLng } from '~/features/ride/types';

export function useSmoothedPosition(target: LatLng | null, durationMs = 1500): LatLng | null {
  const [display, setDisplay] = useState<LatLng | null>(target);
  const lat = useSharedValue(target?.latitude ?? 0);
  const lng = useSharedValue(target?.longitude ?? 0);
  const initialized = useRef(false);

  useEffect(() => {
    if (!target) return;

    if (!initialized.current) {
      initialized.current = true;
      lat.value = target.latitude;
      lng.value = target.longitude;
      setDisplay(target);
      return;
    }

    lat.value = withTiming(target.latitude, { duration: durationMs });
    lng.value = withTiming(target.longitude, { duration: durationMs });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [target?.latitude, target?.longitude, durationMs]);

  useAnimatedReaction(
    () => ({ latitude: lat.value, longitude: lng.value }),
    (current) => {
      runOnJS(setDisplay)(current);
    }
  );

  return display;
}
