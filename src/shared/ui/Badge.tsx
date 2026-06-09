import { StyleSheet, Text, View } from 'react-native';
import { colors, radius, spacing } from './tokens';

type BadgeTone = 'neutral' | 'brand' | 'reward' | 'ready' | 'done';
type BadgeSize = 'sm' | 'md';

interface BadgeProps {
  readonly tone?: BadgeTone;
  readonly size?: BadgeSize;
  readonly children: React.ReactNode;
}

const toneStyles: Record<BadgeTone, { bg: string; text: string }> = {
  neutral: { bg: colors.surfaceSink, text: colors.inkSoft },
  brand: { bg: colors.brandSoft, text: colors.brandInk },
  reward: { bg: colors.rewardSoft, text: colors.inkSoft },
  ready: { bg: colors.brand, text: colors.surface },
  done: { bg: colors.mapLand, text: colors.stampInk },
};

export function Badge({ tone = 'neutral', size = 'sm', children }: BadgeProps) {
  const { bg, text } = toneStyles[tone];

  return (
    <View style={[styles.base, { backgroundColor: bg }, size === 'md' ? styles.md : styles.sm]}>
      <Text
        numberOfLines={1}
        style={[styles.text, { color: text }, size === 'md' ? styles.textMd : styles.textSm]}
      >
        {children}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  base: {
    borderRadius: radius.full,
    alignSelf: 'flex-start',
    overflow: 'hidden',
    maxWidth: '100%',
  },
  sm: {
    paddingHorizontal: spacing.sm + 1,
    paddingVertical: spacing.xs + 1,
  },
  md: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm - 2,
  },
  text: {
    fontFamily: 'Pretendard-Bold',
    flexShrink: 1,
  },
  textSm: {
    fontSize: 11,
    lineHeight: 16,
  },
  textMd: {
    fontSize: 12,
    lineHeight: 18,
  },
});
