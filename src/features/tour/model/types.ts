import type { Coordinates } from '@shared/types';

export interface TourSpot {
  readonly contentId: string;
  readonly title: string;
  readonly address: string;
  readonly location: Coordinates;
  readonly thumbnailUrl?: string;
  readonly imageUrls: readonly string[];
  readonly overview?: string;
  readonly homepage?: string;
  readonly telephone?: string;
  readonly contentTypeId: string;
}
