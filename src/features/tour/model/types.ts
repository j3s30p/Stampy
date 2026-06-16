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

export interface HomeTourSpot {
  readonly contentId: string;
  readonly title: string;
  readonly address: string;
  readonly theme: string;
  readonly distanceMeters: number;
  readonly verificationDistanceMeters: number | null;
  readonly collected: boolean;
  readonly location: Coordinates;
  readonly thumbnailUrl?: string;
  readonly imageUrls: readonly string[];
  readonly overview?: string;
  readonly homepage?: string;
  readonly telephone?: string;
  readonly contentTypeId?: string;
}

export interface HomeTourEvent {
  readonly contentId: string;
  readonly title: string;
  readonly address: string;
  readonly distanceMeters: number;
  readonly verificationDistanceMeters: number | null;
  readonly collected: boolean;
  readonly location: Coordinates;
  readonly startDate: string;
  readonly endDate: string;
  readonly thumbnailUrl?: string;
  readonly imageUrls: readonly string[];
  readonly overview?: string;
  readonly homepage?: string;
  readonly telephone?: string;
  readonly contentTypeId?: string;
}
