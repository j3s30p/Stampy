import { StyleSheet, View } from 'react-native';
import type { StyleProp, ViewStyle } from 'react-native';
import { colors, radius as radiusTokens, shadow as shadowTokens, spacing } from './tokens';
import type { Radius, ShadowLevel } from './tokens';

interface SurfaceProps {
  readonly elevation?: ShadowLevel;
  readonly radius?: Radius;
  readonly padded?: boolean | number;
  readonly style?: StyleProp<ViewStyle>;
  readonly children?: React.ReactNode;
}

export function Surface({
  elevation = 'e1',
  radius = 'lg',
  padded = false,
  style,
  children,
}: SurfaceProps) {
  const paddingValue = padded === true ? spacing.lg : padded === false ? 0 : padded;

  return (
    <View
      style={[
        styles.base,
        {
          borderRadius: radiusTokens[radius],
          padding: paddingValue,
        },
        shadowTokens[elevation],
        style,
      ]}
    >
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  base: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
});
