import { Text } from 'react-native';
import type { TextProps } from 'react-native';
import { colors, typography } from './tokens';
import type { TypographyVariant } from './tokens';

type TextTone = 'ink' | 'inkSoft' | 'inkMuted' | 'brand' | 'onDark';

const toneColor: Record<TextTone, string> = {
  ink: colors.ink,
  inkSoft: colors.inkSoft,
  inkMuted: colors.inkMuted,
  brand: colors.brand,
  onDark: colors.surface,
};

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
          fontWeight: t.weight,
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
