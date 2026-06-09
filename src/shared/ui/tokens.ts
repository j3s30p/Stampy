export const colors = {
  ink: '#112033',
  inkSoft: '#344357',
  inkMuted: '#66758C',
  inkSubtle: '#98A2B3',
  canvas: '#F3F6FB',
  surface: '#FFFFFF',
  surfaceSink: '#F7F9FD',
  surfaceTint: '#FFF3EC',
  border: '#D8E1EF',
  borderStrong: '#C5D2E5',
  brand: '#FF7A45',
  brandSoft: '#FFF1EA',
  brandInk: '#EA5C25',
  reward: '#FFCC49',
  rewardSoft: '#FFF4C7',
  stamp: '#18A968',
  stampInk: '#0B6F43',
  locationDot: '#2F6BFF',
  locationSoft: '#EAF2FF',
  mapLand: '#EAF5DF',
  overlay: 'rgba(17,32,51,0.58)',
} as const;

export type Color = keyof typeof colors;

export const typography = {
  display: { size: 32, lineHeight: 40, weight: '800' as const, letterSpacing: 0 },
  title: { size: 26, lineHeight: 34, weight: '800' as const, letterSpacing: 0 },
  h1: { size: 22, lineHeight: 30, weight: '700' as const, letterSpacing: 0 },
  h2: { size: 18, lineHeight: 26, weight: '700' as const, letterSpacing: 0 },
  h3: { size: 16, lineHeight: 24, weight: '700' as const, letterSpacing: 0 },
  body: { size: 14, lineHeight: 22, weight: '500' as const, letterSpacing: 0 },
  bodyBold: { size: 14, lineHeight: 22, weight: '700' as const, letterSpacing: 0 },
  caption: { size: 12, lineHeight: 18, weight: '500' as const, letterSpacing: 0 },
  captionBold: { size: 12, lineHeight: 18, weight: '700' as const, letterSpacing: 0 },
  micro: { size: 11, lineHeight: 15, weight: '700' as const, letterSpacing: 0 },
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
  xs: 4,
  sm: 8,
  md: 12,
  lg: 20,
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
