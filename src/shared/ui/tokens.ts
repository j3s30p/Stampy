export const colors = {
  brand: '#0E7C66',
  brandDeep: '#0A5C4D',
  brandSoft: '#15A98C',
  ink: '#0F1729',
  inkSoft: '#5A6779',
  inkMuted: '#94A3B8',
  surface: '#FFFFFF',
  surfaceAlt: '#F6F8FB',
  surfaceSink: '#EEF1F6',
  border: '#E6EAF1',
  mintSoft: '#F3FBF8',
  gold: '#F0B33A',
  goldSoft: '#FFF1CF',
  coral: '#FF7A59',
  coralSoft: '#FFE0D6',
  success: '#1FAE7C',
  successSoft: '#DDF6EC',
  warning: '#E0A21A',
  warningSoft: '#FFF3D5',
  overlay: 'rgba(15,23,41,0.55)',
  onDarkMuted: 'rgba(255,255,255,0.7)',
  mapEdge: '#C7D9E4',
  locationDot: '#6EA8FF',
  thumbPeach: '#EFC9A3',
  thumbPink: '#FFD0DA',
} as const;

export type Color = keyof typeof colors;

export const typography = {
  display: { size: 28, lineHeight: 36, weight: '800' as const, letterSpacing: -0.6 },
  h1: { size: 22, lineHeight: 30, weight: '800' as const, letterSpacing: -0.4 },
  h2: { size: 18, lineHeight: 26, weight: '800' as const, letterSpacing: -0.2 },
  h3: { size: 16, lineHeight: 22, weight: '700' as const, letterSpacing: -0.1 },
  body: { size: 14, lineHeight: 22, weight: '500' as const, letterSpacing: 0 },
  bodyBold: { size: 14, lineHeight: 22, weight: '700' as const, letterSpacing: 0 },
  caption: { size: 12, lineHeight: 18, weight: '600' as const, letterSpacing: 0 },
  micro: { size: 11, lineHeight: 16, weight: '700' as const, letterSpacing: 0.4 },
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
} as const;

export type Spacing = keyof typeof spacing;

export const radius = {
  xs: 8,
  sm: 10,
  md: 14,
  lg: 20,
  xl: 28,
  pill: 999,
} as const;

export type Radius = keyof typeof radius;

export const shadow = {
  e1: {
    shadowColor: '#0F1729',
    shadowOpacity: 0.04,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 1,
  },
  e2: {
    shadowColor: '#0F1729',
    shadowOpacity: 0.08,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 8 },
    elevation: 3,
  },
  e3: {
    shadowColor: '#0F1729',
    shadowOpacity: 0.14,
    shadowRadius: 24,
    shadowOffset: { width: 0, height: 14 },
    elevation: 6,
  },
} as const;

export type ShadowLevel = keyof typeof shadow;

export const gradient = {
  brand: {
    colors: ['#0F8A72', '#15A98C'] as readonly [string, string],
    start: { x: 0, y: 0 },
    end: { x: 1, y: 1 },
  },
  gold: {
    colors: ['#F4A93A', '#F7C66A'] as readonly [string, string],
    start: { x: 0, y: 0 },
    end: { x: 1, y: 1 },
  },
  coral: {
    colors: ['#FF7A59', '#FF9F7A'] as readonly [string, string],
    start: { x: 0, y: 0 },
    end: { x: 1, y: 1 },
  },
  indigo: {
    colors: ['#3C4F8F', '#5A75BD'] as readonly [string, string],
    start: { x: 0, y: 0 },
    end: { x: 1, y: 1 },
  },
  splash: {
    colors: ['#0A5C4D', '#0E7C66', '#15A98C'] as readonly [string, string, string],
    start: { x: 0, y: 0 },
    end: { x: 1, y: 1 },
  },
  mapSky: {
    colors: ['#E8F1F8', '#D7E7EE'] as readonly [string, string],
    start: { x: 0, y: 0 },
    end: { x: 0, y: 1 },
  },
} as const;

export type GradientVariant = keyof typeof gradient;
