import * as Haptics from 'expo-haptics';
import { useRef } from 'react';
import { Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';
import { colors, radius, spacing } from './tokens';

type ButtonVariant = 'primary' | 'secondary' | 'ghost';
type ButtonSize = 'md' | 'lg';

interface ButtonProps {
  readonly variant?: ButtonVariant;
  readonly size?: ButtonSize;
  readonly loading?: boolean;
  readonly onPress?: () => void;
  readonly fullWidth?: boolean;
  readonly disabled?: boolean;
  readonly accessibilityLabel?: string;
  readonly children: React.ReactNode;
}

export function Button({
  variant = 'primary',
  size = 'md',
  loading = false,
  onPress,
  fullWidth = false,
  disabled = false,
  accessibilityLabel,
  children,
}: ButtonProps) {
  const scaleValue = useSharedValue(1);
  // Keep a stable ref to the shared value so event handlers can mutate without
  // triggering react-hooks/immutability (shared values are mutable by design in Reanimated 3)
  // eslint-disable-next-line react-hooks/immutability -- Reanimated SharedValue.value mutation is the intended API; ref wrapper satisfies React Compiler's immutability analysis
  const scaleRef = useRef(scaleValue);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scaleRef.current.value }],
  }));

  const isDisabled = disabled || loading;

  const handlePressIn = () => {
    scaleRef.current.value = withTiming(0.96, { duration: 80 });
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => undefined);
    }
  };

  return (
    <Animated.View style={[animatedStyle, fullWidth ? styles.fullWidth : null]}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={accessibilityLabel}
        accessibilityState={{ disabled: isDisabled }}
        disabled={isDisabled}
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={() => {
          scaleRef.current.value = withTiming(1, { duration: 120 });
        }}
        style={[
          styles.base,
          size === 'lg' ? styles.lg : styles.md,
          variantStyle(variant, isDisabled),
          fullWidth ? styles.fullWidth : null,
        ]}
      >
        <View style={styles.content}>
          <Text style={[styles.label, labelStyle(variant, isDisabled)]}>
            {loading ? '...' : children}
          </Text>
        </View>
      </Pressable>
    </Animated.View>
  );
}

const variantStyle = (variant: ButtonVariant, disabled: boolean) => {
  if (disabled) {
    return styles.variantDisabled;
  }

  switch (variant) {
    case 'primary':
      return styles.variantPrimary;
    case 'secondary':
      return styles.variantSecondary;
    case 'ghost':
      return styles.variantGhost;
  }
};

const labelStyle = (variant: ButtonVariant, disabled: boolean) => {
  if (disabled) {
    return styles.labelDisabled;
  }

  switch (variant) {
    case 'primary':
      return styles.labelPrimary;
    case 'secondary':
      return styles.labelSecondary;
    case 'ghost':
      return styles.labelGhost;
  }
};

const styles = StyleSheet.create({
  base: {
    borderRadius: radius.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  md: { height: 48, paddingHorizontal: spacing.xl },
  lg: { height: 56, paddingHorizontal: spacing.xxl },
  fullWidth: { width: '100%' },
  content: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  label: { fontSize: 15, lineHeight: 20, fontFamily: 'Pretendard-Bold', letterSpacing: 0 },
  variantPrimary: { backgroundColor: colors.ink },
  variantSecondary: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  variantGhost: { backgroundColor: 'transparent' },
  variantDisabled: { backgroundColor: colors.surfaceSink },
  labelPrimary: { color: colors.surface },
  labelSecondary: { color: colors.ink },
  labelGhost: { color: colors.ink },
  labelDisabled: { color: colors.inkMuted },
});
