import type { Coordinates } from '@shared/types';
import type { TourEvent } from '../model';

export interface EventRepository {
  searchNearby(center: Coordinates, radiusMeters: number): Promise<TourEvent[]>;
  byId(contentId: string): Promise<TourEvent | null>;
  search(query: string): Promise<TourEvent[]>;
}
