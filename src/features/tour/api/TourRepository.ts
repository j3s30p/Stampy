import type { Coordinates } from '@shared/types';
import type { TourSpot } from '../model';

export interface TourRepository {
  searchNearby(center: Coordinates, radiusMeters: number): Promise<TourSpot[]>;
  byId(contentId: string): Promise<TourSpot | null>;
  search(query: string): Promise<TourSpot[]>;
}
