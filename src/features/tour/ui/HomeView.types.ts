export type HomeContentMode = 'event' | 'spot';

export type RecommendedHomeItem = {
  readonly kind: HomeContentMode;
  readonly contentId: string;
  readonly title: string;
  readonly distanceMeters: number;
  readonly verificationDistanceMeters: number | null;
  readonly collected: boolean;
  readonly thumbnailUrl?: string;
};
