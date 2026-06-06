import { useEffect, useRef } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';
import { colors, radius } from './tokens';

type GaugeTone = 'brand' | 'reward';

interface GaugeProps {
  readonly value: number; // 0-100
  readonly tone?: GaugeTone;
}

const TRACK_HEIGHT = 6;

const fillColor: Record<GaugeTone, string> = {
  brand: colors.brand,
  reward: colors.reward,
};

export function Gauge({ value, tone = 'brand' }: GaugeProps) {
  const clampedValue = Math.max(0, Math.min(100, value));
  const widthPercent = useSharedValue(clampedValue);
  // Stable ref so the effect can mutate without triggering react-hooks/immutability.
  // eslint-disable-next-line react-hooks/immutability -- Reanimated SharedValue.value mutation is the intended API; ref wrapper satisfies React Compiler immutability analysis
  const widthRef = useRef(widthPercent);

  useEffect(() => {
    widthRef.current.value = withSpring(clampedValue, { damping: 20, stiffness: 120 });
  }, [clampedValue]);

  const fillStyle = useAnimatedStyle(() => ({
    width: `${widthRef.current.value}%`,
  }));

  return (
    <View style={styles.track}>
      <Animated.View style={[styles.fill, { backgroundColor: fillColor[tone] }, fillStyle]} />
    </View>
  );
}

const styles = StyleSheet.create({
  track: {
    height: TRACK_HEIGHT,
    borderRadius: radius.full,
    backgroundColor: colors.surfaceSink,
    overflow: 'hidden',
  },
  fill: {
    height: '100%',
    borderRadius: radius.full,
  },
});
