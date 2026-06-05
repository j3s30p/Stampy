import { View } from 'react-native';
import type { StyleProp, ViewStyle } from 'react-native';
import { Circle, Ellipse, Path, Rect, Svg } from 'react-native-svg';
import { colors } from './tokens';

type MascotMood = 'happy' | 'sad' | 'sleeping';

interface MascotProps {
  readonly size?: number;
  readonly mood?: MascotMood;
  readonly style?: StyleProp<ViewStyle>;
}

export function Mascot({ size = 64, mood = 'happy', style }: MascotProps) {
  return (
    <View style={style}>
      <Svg width={size} height={size} viewBox="0 0 64 64">
        {/* Body — rounded rectangle filled with brand red */}
        <Rect x={4} y={4} width={56} height={56} rx={18} ry={18} fill={colors.brand} />

        {/* Inner highlight — soft inset stroke for "glossy ceramic" feel */}
        <Rect
          x={6}
          y={6}
          width={52}
          height={52}
          rx={16}
          ry={16}
          fill="none"
          stroke="rgba(255,255,255,0.18)"
          strokeWidth={2}
        />

        {/* Top-left gloss reflection */}
        <Ellipse cx={15} cy={12} rx={4} ry={2} fill="rgba(255,255,255,0.4)" />

        {/* Eyes — vary by mood */}
        {mood === 'happy' && (
          <>
            <Circle cx={22} cy={26} r={2.5} fill={colors.ink} />
            <Circle cx={42} cy={26} r={2.5} fill={colors.ink} />
          </>
        )}
        {mood === 'sad' && (
          <>
            <Circle cx={22} cy={26} r={2} fill={colors.ink} />
            <Circle cx={42} cy={26} r={2} fill={colors.ink} />
            {/* Sad under-eye curved lines */}
            <Path
              d="M19 30 Q22 28 25 30"
              stroke={colors.ink}
              strokeWidth={1.5}
              strokeLinecap="round"
              fill="none"
            />
            <Path
              d="M39 30 Q42 28 45 30"
              stroke={colors.ink}
              strokeWidth={1.5}
              strokeLinecap="round"
              fill="none"
            />
          </>
        )}
        {mood === 'sleeping' && (
          <>
            {/* Closed eyes as horizontal bars */}
            <Rect x={18} y={25} width={8} height={2} rx={1} fill={colors.ink} />
            <Rect x={38} y={25} width={8} height={2} rx={1} fill={colors.ink} />
          </>
        )}

        {/* Mouth — vary by mood */}
        {mood === 'happy' && (
          <Path
            d="M22 40 Q32 48 42 40"
            stroke={colors.ink}
            strokeWidth={2.2}
            strokeLinecap="round"
            fill="none"
          />
        )}
        {mood === 'sad' && (
          <Path
            d="M22 44 Q32 36 42 44"
            stroke={colors.ink}
            strokeWidth={2.2}
            strokeLinecap="round"
            fill="none"
          />
        )}
        {mood === 'sleeping' && (
          <>
            {/* Small "Z" near top-right for sleeping */}
            <Path
              d="M44 14 L50 14 L44 20 L50 20"
              stroke={colors.ink}
              strokeWidth={1.5}
              strokeLinecap="round"
              strokeLinejoin="round"
              fill="none"
            />
            {/* Neutral small mouth */}
            <Path
              d="M26 42 Q32 44 38 42"
              stroke={colors.ink}
              strokeWidth={2.2}
              strokeLinecap="round"
              fill="none"
            />
          </>
        )}

        {/* Cheeks — only for happy mood */}
        {mood === 'happy' && (
          <>
            <Circle cx={18} cy={36} r={2.2} fill="rgba(255,200,200,0.7)" />
            <Circle cx={46} cy={36} r={2.2} fill="rgba(255,200,200,0.7)" />
          </>
        )}
      </Svg>
    </View>
  );
}
