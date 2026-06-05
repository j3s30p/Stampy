import { LinearGradient } from 'expo-linear-gradient';
import type { StyleProp, ViewStyle } from 'react-native';
import { gradient } from './tokens';
import type { GradientVariant } from './tokens';

interface GradientProps {
  readonly variant: GradientVariant;
  readonly style?: StyleProp<ViewStyle>;
  readonly children?: React.ReactNode;
}

export function Gradient({ variant, style, children }: GradientProps) {
  const token = gradient[variant];

  return (
    <LinearGradient
      colors={token.colors as unknown as [string, string, ...string[]]}
      start={token.start}
      end={token.end}
      style={style}
    >
      {children}
    </LinearGradient>
  );
}
