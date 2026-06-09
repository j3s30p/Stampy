import { View } from 'react-native';
import type { StyleProp, ViewStyle } from 'react-native';
import { Circle, Ellipse, Path, Svg } from 'react-native-svg';

type MascotMood = 'happy' | 'sad' | 'sleeping';

interface MascotProps {
  readonly size?: number;
  readonly mood?: MascotMood;
  readonly style?: StyleProp<ViewStyle>;
}

const mascotColors = {
  body: '#B7E24C',
  outline: '#1E5D28',
  eye: '#1A1A1A',
  blush: '#F6B8A6',
  pin: '#FF7A45',
  pinDeep: '#EA5C25',
  feet: '#FFD84B',
  highlight: 'rgba(255,255,255,0.2)',
} as const;

export function Mascot({ size = 64, mood = 'happy', style }: MascotProps) {
  return (
    <View style={style}>
      <Svg width={size} height={size} viewBox="0 0 160 160">
        <Path
          d="M38 44C38 31.2 48.2 21 61 21H99C111.8 21 122 31.2 122 44V48C130.2 48.3 136.5 55.2 136.5 63.4V100.6C136.5 108.8 130.2 115.7 122 116V124C122 136.8 111.8 147 99 147H61C48.2 147 38 136.8 38 124V116C29.8 115.7 23.5 108.8 23.5 100.6V63.4C23.5 55.2 29.8 48.3 38 48V44Z"
          fill={mascotColors.body}
          stroke={mascotColors.outline}
          strokeWidth={8}
          strokeLinejoin="round"
        />

        <Path
          d="M34 53C34 44.7 40.7 38 49 38C57.3 38 61 44.6 61 49.5C61 55.2 57.4 59 52.2 61.2C49.1 62.5 46.8 65.2 46.2 68.5"
          fill="none"
          stroke={mascotColors.outline}
          strokeWidth={8}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <Path
          d="M126 53C126 44.7 119.3 38 111 38C102.7 38 99 44.6 99 49.5C99 55.2 102.6 59 107.8 61.2C110.9 62.5 113.2 65.2 113.8 68.5"
          fill="none"
          stroke={mascotColors.outline}
          strokeWidth={8}
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        <Ellipse
          cx={66}
          cy={20}
          rx={10}
          ry={8}
          fill={mascotColors.body}
          stroke={mascotColors.outline}
          strokeWidth={8}
        />
        <Ellipse
          cx={94}
          cy={20}
          rx={10}
          ry={8}
          fill={mascotColors.body}
          stroke={mascotColors.outline}
          strokeWidth={8}
        />

        <Ellipse
          cx={80}
          cy={20}
          rx={10}
          ry={8}
          fill={mascotColors.body}
          stroke={mascotColors.outline}
          strokeWidth={8}
        />

        <Ellipse
          cx={53}
          cy={101}
          rx={14}
          ry={20}
          fill={mascotColors.body}
          stroke={mascotColors.outline}
          strokeWidth={8}
        />
        <Ellipse
          cx={107}
          cy={101}
          rx={14}
          ry={20}
          fill={mascotColors.body}
          stroke={mascotColors.outline}
          strokeWidth={8}
        />

        <Ellipse
          cx={58}
          cy={136}
          rx={14}
          ry={11}
          fill={mascotColors.feet}
          stroke={mascotColors.outline}
          strokeWidth={8}
        />
        <Ellipse
          cx={102}
          cy={136}
          rx={14}
          ry={11}
          fill={mascotColors.feet}
          stroke={mascotColors.outline}
          strokeWidth={8}
        />

        <Circle cx={64} cy={78} r={7} fill={mascotColors.eye} />
        <Circle cx={96} cy={78} r={7} fill={mascotColors.eye} />

        {mood === 'sleeping' ? (
          <>
            <Path d="M56 79h14" stroke={mascotColors.eye} strokeWidth={5} strokeLinecap="round" />
            <Path d="M88 79h14" stroke={mascotColors.eye} strokeWidth={5} strokeLinecap="round" />
            <Path
              d="M111 52l8 0l-6 7h8"
              fill="none"
              stroke={mascotColors.eye}
              strokeWidth={2}
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </>
        ) : (
          <Path
            d={
              mood === 'sad'
                ? 'M63 96C69 90 71 90 80 90C89 90 91 90 97 96'
                : 'M63 94C69 100 71 100 80 100C89 100 91 100 97 94'
            }
            fill="none"
            stroke={mascotColors.eye}
            strokeWidth={5}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        )}

        {mood === 'happy' ? (
          <>
            <Circle cx={55} cy={91} r={3.2} fill={mascotColors.blush} opacity={0.7} />
            <Circle cx={105} cy={91} r={3.2} fill={mascotColors.blush} opacity={0.7} />
          </>
        ) : null}

        <Path
          d="M80 101c0 4.4 0 7.3 0 7.3"
          stroke={mascotColors.pinDeep}
          strokeWidth={5}
          strokeLinecap="round"
          opacity={0.12}
        />
        <Path
          d="M80 103c-10.8 0-19.5 8.8-19.5 19.5C60.5 136.4 80 149 80 149s19.5-12.6 19.5-26.5C99.5 111.8 90.8 103 80 103Z"
          fill={mascotColors.pin}
          stroke={mascotColors.outline}
          strokeWidth={8}
          strokeLinejoin="round"
        />
        <Circle cx={80} cy={123} r={7.2} fill="#FFFFFF" />
        <Path
          d="M78 104c-5.3 0-9.5 4.2-9.5 9.5"
          fill="none"
          stroke={mascotColors.highlight}
          strokeWidth={4}
          strokeLinecap="round"
          opacity={0.65}
        />
      </Svg>
    </View>
  );
}
