import { StyleSheet, View } from 'react-native';
import type { StyleProp, ViewStyle } from 'react-native';
import { colors } from './tokens';

type MascotMood = 'happy' | 'sad' | 'sleeping';

interface MascotProps {
  readonly size?: number;
  readonly mood?: MascotMood;
  readonly style?: StyleProp<ViewStyle>;
}

export function Mascot({ size = 64, mood = 'happy', style }: MascotProps) {
  const bodyRadius = size * 0.28; // ~18 at size 64
  const eyeSize = size * 0.047; // ~3 at size 64
  const eyeRadius = eyeSize / 2;
  const eyeTop = size * 0.25;
  const leftEyeLeft = size * 0.27;
  const rightEyeLeft = size * 0.63;

  // Sleeping eyes: 2px-tall lines
  const sleepingEyeHeight = 2;

  // Mouth container
  const mouthWidth = size * 0.22; // ~14 at size 64
  const mouthHeight = size * 0.11; // ~7 at size 64
  const mouthTop = size * 0.55;
  const mouthLeft = (size - mouthWidth) / 2;

  return (
    <View
      style={[
        {
          width: size,
          height: size,
          borderRadius: bodyRadius,
          backgroundColor: colors.brand,
        },
        style,
      ]}
    >
      {/* Left eye */}
      <View
        style={[
          styles.eye,
          {
            width: eyeSize,
            height: mood === 'sleeping' ? sleepingEyeHeight : eyeSize,
            borderRadius: mood === 'sleeping' ? 1 : eyeRadius,
            top: mood === 'sleeping' ? eyeTop + eyeSize / 2 : eyeTop,
            left: leftEyeLeft,
          },
        ]}
      />
      {/* Right eye */}
      <View
        style={[
          styles.eye,
          {
            width: eyeSize,
            height: mood === 'sleeping' ? sleepingEyeHeight : eyeSize,
            borderRadius: mood === 'sleeping' ? 1 : eyeRadius,
            top: mood === 'sleeping' ? eyeTop + eyeSize / 2 : eyeTop,
            left: rightEyeLeft,
          },
        ]}
      />

      {/* Mouth */}
      {mood === 'happy' && (
        <View
          style={[
            styles.mouthHappy,
            {
              width: mouthWidth,
              height: mouthHeight,
              top: mouthTop,
              left: mouthLeft,
            },
          ]}
        />
      )}
      {mood === 'sad' && (
        <View
          style={[
            styles.mouthSad,
            {
              width: mouthWidth,
              height: mouthHeight,
              top: mouthTop + mouthHeight * 0.3,
              left: mouthLeft,
            },
          ]}
        />
      )}
      {mood === 'sleeping' && (
        <View
          style={[
            styles.mouthSleeping,
            {
              width: mouthWidth * 0.7,
              top: mouthTop,
              left: mouthLeft + mouthWidth * 0.15,
            },
          ]}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  eye: {
    position: 'absolute',
    backgroundColor: '#0A0A0A',
  },
  // Smile: bottom half of a circle using bottom border-radius trick
  mouthHappy: {
    position: 'absolute',
    borderBottomLeftRadius: 999,
    borderBottomRightRadius: 999,
    borderBottomWidth: 2,
    borderLeftWidth: 0,
    borderRightWidth: 0,
    borderTopWidth: 0,
    borderColor: '#0A0A0A',
    backgroundColor: 'transparent',
  },
  // Sad: top half of a circle (flipped smile)
  mouthSad: {
    position: 'absolute',
    borderTopLeftRadius: 999,
    borderTopRightRadius: 999,
    borderTopWidth: 2,
    borderLeftWidth: 0,
    borderRightWidth: 0,
    borderBottomWidth: 0,
    borderColor: '#0A0A0A',
    backgroundColor: 'transparent',
  },
  // Sleeping: small straight line
  mouthSleeping: {
    position: 'absolute',
    height: 2,
    backgroundColor: '#0A0A0A',
    borderRadius: 1,
  },
});
