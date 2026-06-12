import type { Coordinates } from '@shared/types';

export interface TourEvent {
  readonly contentId: string;
  readonly title: string;
  readonly address: string;
  readonly location: Coordinates;
  readonly startDate: string;
  readonly endDate: string;
  readonly thumbnailUrl?: string;
  readonly imageUrls: readonly string[];
  readonly overview?: string;
  readonly homepage?: string;
  readonly telephone?: string;
  readonly contentTypeId: string;
}
