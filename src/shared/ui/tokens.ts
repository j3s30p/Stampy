export const colors = {
  ink: '#0A0A0A',
  inkSoft: '#3F3F46',
  inkMuted: '#71717A',
  inkSubtle: '#A1A1AA',
  canvas: '#FAFAFA',
  surface: '#FFFFFF',
  surfaceSink: '#F4F4F5',
  border: '#E4E4E7',
  borderStrong: '#D4D4D8',
  brand: '#E63946',
  brandSoft: '#FEE2E5',
  brandInk: '#A8202D',
  reward: '#FFD60A',
  rewardSoft: '#FFF8C5',
  locationDot: '#3B82F6',
  overlay: 'rgba(10,10,10,0.55)',
} as const;

export type Color = keyof typeof colors;

export const typography = {
  display: { size: 44, lineHeight: 52, weight: '800' as const, letterSpacing: -1.2 },
  title: { size: 28, lineHeight: 36, weight: '800' as const, letterSpacing: -0.8 },
  h1: { size: 22, lineHeight: 30, weight: '700' as const, letterSpacing: -0.3 },
  h2: { size: 18, lineHeight: 26, weight: '700' as const, letterSpacing: -0.2 },
  h3: { size: 16, lineHeight: 22, weight: '700' as const, letterSpacing: -0.1 },
  body: { size: 15, lineHeight: 24, weight: '500' as const, letterSpacing: 0 },
  bodyBold: { size: 15, lineHeight: 24, weight: '700' as const, letterSpacing: 0 },
  caption: { size: 13, lineHeight: 18, weight: '500' as const, letterSpacing: 0 },
  captionBold: { size: 13, lineHeight: 18, weight: '700' as const, letterSpacing: 0 },
  micro: { size: 11, lineHeight: 14, weight: '700' as const, letterSpacing: 0.5 },
} as const;

export type TypographyVariant = keyof typeof typography;

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  xxxl: 32,
  xxxxl: 40,
} as const;

export type Spacing = keyof typeof spacing;

export const radius = {
  xs: 6,
  sm: 10,
  md: 14,
  lg: 16,
  xl: 24,
  full: 9999,
} as const;

export type Radius = keyof typeof radius;

export const shadow = {
  e1: {
    shadowColor: '#0A0A0A',
    shadowOpacity: 0.03,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 1 },
    elevation: 1,
  },
  e2: {
    shadowColor: '#0A0A0A',
    shadowOpacity: 0.06,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 2,
  },
  e3: {
    shadowColor: '#0A0A0A',
    shadowOpacity: 0.1,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 10 },
    elevation: 4,
  },
} as const;

export type ShadowLevel = keyof typeof shadow;
