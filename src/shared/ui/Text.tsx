import { Text } from 'react-native';
import type { TextProps } from 'react-native';
import { colors, typography } from './tokens';
import type { TypographyVariant } from './tokens';

type TextTone = 'ink' | 'inkSoft' | 'inkMuted' | 'inkSubtle' | 'onDark' | 'brand' | 'reward';

const toneColor: Record<TextTone, string> = {
  ink: colors.ink,
  inkSoft: colors.inkSoft,
  inkMuted: colors.inkMuted,
  inkSubtle: colors.inkSubtle,
  onDark: colors.surface,
  brand: colors.brand,
  reward: colors.reward,
};

// Maps typography weight tokens to specific Pretendard family files.
// fontWeight is intentionally omitted when fontFamily is a weighted file
// because RN ignores fontWeight when a specific family variant is used.
function pretendardFamily(weight: string): string {
  switch (weight) {
    case '800':
    case '900':
      return 'Pretendard-ExtraBold';
    case '700':
      return 'Pretendard-Bold';
    case '600':
      return 'Pretendard-SemiBold';
    default:
      // '400' | '500' — Medium file reads well for both
      return 'Pretendard-Regular';
  }
}

interface AppTextProps extends Omit<TextProps, 'style'> {
  readonly variant?: TypographyVariant;
  readonly tone?: TextTone;
  readonly style?: TextProps['style'];
  readonly children?: React.ReactNode;
}

export function AppText({
  variant = 'body',
  tone = 'ink',
  style,
  children,
  ...rest
}: AppTextProps) {
  const t = typography[variant];

  return (
    <Text
      style={[
        {
          fontSize: t.size,
          lineHeight: t.lineHeight,
          fontFamily: pretendardFamily(t.weight),
          letterSpacing: t.letterSpacing,
          color: toneColor[tone],
        },
        style,
      ]}
      {...rest}
    >
      {children}
    </Text>
  );
}
