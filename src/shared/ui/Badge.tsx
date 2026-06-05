import { StyleSheet, Text, View } from 'react-native';
import { colors, radius, spacing } from './tokens';

type BadgeTone = 'neutral' | 'success' | 'warning' | 'coral' | 'brand';
type BadgeSize = 'sm' | 'md';

interface BadgeProps {
  readonly tone?: BadgeTone;
  readonly size?: BadgeSize;
  readonly children: React.ReactNode;
}

const toneStyles: Record<BadgeTone, { bg: string; text: string }> = {
  neutral: { bg: colors.surfaceSink, text: colors.inkSoft },
  success: { bg: colors.successSoft, text: colors.success },
  warning: { bg: colors.warningSoft, text: colors.warning },
  coral: { bg: colors.coralSoft, text: colors.coral },
  brand: { bg: colors.surfaceSink, text: colors.brand },
};

export function Badge({ tone = 'neutral', size = 'sm', children }: BadgeProps) {
  const { bg, text } = toneStyles[tone];

  return (
    <View style={[styles.base, { backgroundColor: bg }, size === 'md' ? styles.md : styles.sm]}>
      <Text style={[styles.text, { color: text }, size === 'md' ? styles.textMd : styles.textSm]}>
        {children}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  base: {
    borderRadius: radius.pill,
    alignSelf: 'flex-start',
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
    fontWeight: '700',
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
