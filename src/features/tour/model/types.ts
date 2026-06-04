import type { Coordinates } from '@shared/types';

export interface TourSpot {
  readonly contentId: string;
  readonly title: string;
  readonly address: string;
  readonly location: Coordinates;
  readonly thumbnailUrl?: string;
  readonly contentTypeId: string;
}
