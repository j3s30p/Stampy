import * as SplashScreen from 'expo-splash-screen';
import { useEffect, useRef, useState } from 'react';
import { Animated, Dimensions, StyleSheet, View } from 'react-native';
import { Mascot } from './Mascot';
import { AppText } from './Text';
import { colors, spacing } from './tokens';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

// Animated values are created once per component mount via lazy useState.
const mkValue = (v: number) => new Animated.Value(v);

export function SplashGate() {
  const [visible, setVisible] = useState(true);

  // Mascot entrance
  const [mascotTranslateY] = useState(() => mkValue(-300));
  const [mascotScale] = useState(() => mkValue(1.2));

  // Ink splash (brand-red circle behind mascot)
  const [splashScale] = useState(() => mkValue(0));
  const [splashOpacity] = useState(() => mkValue(0));

  // Wordmark
  const [wordmarkOpacity] = useState(() => mkValue(0));
  const [wordmarkTranslateY] = useState(() => mkValue(12));

  // Tagline
  const [taglineOpacity] = useState(() => mkValue(0));

  // Overlay fade-out
  const [overlayOpacity] = useState(() => mkValue(1));

  // Stable ref for the ready timer so cleanup works reliably
  const readyTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    // Mascot: spring drop from top + scale 1.2 → 1
    Animated.parallel([
      Animated.spring(mascotTranslateY, {
        toValue: 0,
        mass: 1,
        damping: 12,
        stiffness: 120,
        useNativeDriver: true,
      }),
      Animated.timing(mascotScale, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
      }),
    ]).start();

    // Ink splash at 100ms — brand-red circle scales 0 → 4, opacity fades 0.18 → 0
    Animated.sequence([
      Animated.delay(100),
      Animated.parallel([
        Animated.timing(splashOpacity, { toValue: 0.18, duration: 60, useNativeDriver: true }),
        Animated.timing(splashScale, { toValue: 4, duration: 450, useNativeDriver: true }),
      ]),
      Animated.timing(splashOpacity, { toValue: 0, duration: 250, useNativeDriver: true }),
    ]).start();

    // Wordmark at 500ms
    Animated.sequence([
      Animated.delay(500),
      Animated.parallel([
        Animated.timing(wordmarkOpacity, { toValue: 1, duration: 300, useNativeDriver: true }),
        Animated.timing(wordmarkTranslateY, { toValue: 0, duration: 300, useNativeDriver: true }),
      ]),
    ]).start();

    // Tagline at 700ms
    Animated.sequence([
      Animated.delay(700),
      Animated.timing(taglineOpacity, { toValue: 1, duration: 300, useNativeDriver: true }),
    ]).start();

    // Ready after 1300ms minimum, then fade out 300ms
    readyTimerRef.current = setTimeout(() => {
      SplashScreen.hideAsync().catch(() => undefined);
      Animated.timing(overlayOpacity, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }).start(() => {
        setVisible(false);
      });
    }, 1300);

    return () => {
      if (readyTimerRef.current !== null) {
        clearTimeout(readyTimerRef.current);
      }
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
      <View style={styles.canvas}>
        <View style={styles.center}>
          {/* Ink splash behind mascot */}
          <Animated.View
            style={[
              styles.splash,
              {
                opacity: splashOpacity,
                transform: [{ scale: splashScale }],
              },
            ]}
          />

          {/* Mascot: 도장이 drop */}
          <Animated.View
            style={{
              transform: [{ translateY: mascotTranslateY }, { scale: mascotScale }],
            }}
          >
            <Mascot size={96} mood="happy" />
          </Animated.View>

          {/* Wordmark */}
          <Animated.View
            style={[
              styles.wordmarkBlock,
              {
                opacity: wordmarkOpacity,
                transform: [{ translateY: wordmarkTranslateY }],
              },
            ]}
          >
            <AppText variant="title" tone="ink">
              스탬피
            </AppText>
          </Animated.View>

          {/* Tagline */}
          <Animated.View style={{ opacity: taglineOpacity }}>
            <AppText variant="caption" tone="inkMuted" style={styles.tagline}>
              오늘의 도장을 찾아서
            </AppText>
          </Animated.View>
        </View>
      </View>
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
  canvas: {
    flex: 1,
    backgroundColor: colors.canvas,
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.lg,
  },
  splash: {
    position: 'absolute',
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: colors.brand,
  },
  wordmarkBlock: {
    alignItems: 'center',
  },
  tagline: {
    textAlign: 'center',
  },
});
