import Ionicons from '@expo/vector-icons/Ionicons';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect, useState } from 'react';
import { Animated, Dimensions, StyleSheet, View } from 'react-native';
import { Gradient } from './Gradient';
import { AppText } from './Text';
import { colors, shadow, spacing } from './tokens';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

// Animated values are created once per component mount via lazy useState.
// This avoids the react-hooks/refs lint rule which forbids accessing
// useRef().current during render.
const mkValue = (v: number) => new Animated.Value(v);

export function SplashGate() {
  const [visible, setVisible] = useState(true);

  // Lazy-initialized Animated.Value instances — stable across renders.
  const [stampScale] = useState(() => mkValue(0.6));
  const [stampOpacity] = useState(() => mkValue(0));
  const [wordmarkOpacity] = useState(() => mkValue(0));
  const [wordmarkTranslateY] = useState(() => mkValue(8));
  const [taglineOpacity] = useState(() => mkValue(0));
  const [taglineTranslateY] = useState(() => mkValue(8));
  const [dot0] = useState(() => mkValue(0.4));
  const [dot1] = useState(() => mkValue(0.4));
  const [dot2] = useState(() => mkValue(0.4));
  const [overlayOpacity] = useState(() => mkValue(1));

  const pulseDot = (anim: Animated.Value, delay: number): Animated.CompositeAnimation =>
    Animated.loop(
      Animated.sequence([
        Animated.delay(delay),
        Animated.timing(anim, { toValue: 1.0, duration: 350, useNativeDriver: true }),
        Animated.timing(anim, { toValue: 0.4, duration: 350, useNativeDriver: true }),
      ]),
    );

  useEffect(() => {
    // Stamp mark entrance at 0ms
    Animated.parallel([
      Animated.spring(stampScale, {
        toValue: 1,
        tension: 60,
        friction: 8,
        useNativeDriver: true,
      }),
      Animated.timing(stampOpacity, {
        toValue: 1,
        duration: 450,
        useNativeDriver: true,
      }),
    ]).start();

    // Wordmark at 200ms
    Animated.sequence([
      Animated.delay(200),
      Animated.parallel([
        Animated.timing(wordmarkOpacity, { toValue: 1, duration: 350, useNativeDriver: true }),
        Animated.timing(wordmarkTranslateY, { toValue: 0, duration: 350, useNativeDriver: true }),
      ]),
    ]).start();

    // Tagline at 350ms
    Animated.sequence([
      Animated.delay(350),
      Animated.parallel([
        Animated.timing(taglineOpacity, { toValue: 1, duration: 350, useNativeDriver: true }),
        Animated.timing(taglineTranslateY, { toValue: 0, duration: 350, useNativeDriver: true }),
      ]),
    ]).start();

    // Loader dots pulse
    const d0 = pulseDot(dot0, 0);
    const d1 = pulseDot(dot1, 200);
    const d2 = pulseDot(dot2, 400);
    d0.start();
    d1.start();
    d2.start();

    // Ready after 1100ms
    const readyTimer = setTimeout(() => {
      SplashScreen.hideAsync().catch(() => undefined);
      Animated.timing(overlayOpacity, {
        toValue: 0,
        duration: 350,
        useNativeDriver: true,
      }).start(() => {
        d0.stop();
        d1.stop();
        d2.stop();
        setVisible(false);
      });
    }, 1100);

    return () => {
      clearTimeout(readyTimer);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- Animated values from lazy useState are stable; deps would cause re-animation on every render
  }, []);

  if (!visible) {
    return null;
  }

  return (
    <Animated.View
      accessibilityRole="progressbar"
      accessibilityLabel="앱 시작 중"
      style={[styles.overlay, { opacity: overlayOpacity }]}
    >
      <Gradient variant="splash" style={styles.fill}>
        <View style={styles.center}>
          {/* Stamp mark */}
          <Animated.View
            style={[
              styles.stampMark,
              shadow.e2,
              { opacity: stampOpacity, transform: [{ scale: stampScale }] },
            ]}
          >
            <View style={styles.stampInner}>
              <Ionicons name="leaf" size={36} color={colors.surface} style={styles.leafRotated} />
            </View>
          </Animated.View>

          {/* Wordmark */}
          <Animated.View
            style={[
              styles.wordmarkBlock,
              { opacity: wordmarkOpacity, transform: [{ translateY: wordmarkTranslateY }] },
            ]}
          >
            <AppText variant="display" tone="onDark">
              스탬피
            </AppText>
          </Animated.View>

          {/* Tagline */}
          <Animated.View
            style={{ opacity: taglineOpacity, transform: [{ translateY: taglineTranslateY }] }}
          >
            <AppText variant="caption" tone="onDark" style={styles.tagline}>
              오늘의 도장을 찾아서
            </AppText>
          </Animated.View>

          {/* Loader dots */}
          <View style={styles.dots}>
            <Animated.View style={[styles.dot, { opacity: dot0 }]} />
            <Animated.View style={[styles.dot, { opacity: dot1 }]} />
            <Animated.View style={[styles.dot, { opacity: dot2 }]} />
          </View>
        </View>
      </Gradient>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: SCREEN_WIDTH,
    height: SCREEN_HEIGHT,
    zIndex: 9999,
  },
  fill: {
    flex: 1,
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.lg,
  },
  stampMark: {
    width: 96,
    height: 96,
    borderRadius: 48,
    borderWidth: 4,
    borderColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'transparent',
  },
  stampInner: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: colors.gold,
    alignItems: 'center',
    justifyContent: 'center',
  },
  leafRotated: {
    transform: [{ rotate: '-15deg' }],
  },
  wordmarkBlock: {
    alignItems: 'center',
  },
  tagline: {
    opacity: 0.85,
  },
  dots: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.xs,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.surface,
  },
});
