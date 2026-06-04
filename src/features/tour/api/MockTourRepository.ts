import type { Coordinates } from '@shared/types';
import type { TourSpot } from '../model';
import type { TourRepository } from './TourRepository';

export class MockTourRepository implements TourRepository {
  async searchNearby(_center: Coordinates, _radiusMeters: number): Promise<TourSpot[]> {
    return [];
  }

  async byId(_contentId: string): Promise<TourSpot | null> {
    return null;
  }

  async search(_query: string): Promise<TourSpot[]> {
    return [];
  }
}
