import { distanceMetersBetween } from '@core/location';
import { tourSpotFixtures } from '@shared/mocks';
import type { Coordinates } from '@shared/types';
import type { TourSpot } from '../model';
import type { TourRepository } from './TourRepository';

const normalizeQuery = (query: string): string => query.trim().toLowerCase();

const matchesQuery = (spot: TourSpot, query: string): boolean => {
  const normalizedQuery = normalizeQuery(query);

  if (!normalizedQuery) {
    return true;
  }

  return [spot.title, spot.address, spot.overview]
    .filter((value): value is string => typeof value === 'string')
    .some((value) => value.toLowerCase().includes(normalizedQuery));
};

export class MockTourRepository implements TourRepository {
  async searchNearby(center: Coordinates, radiusMeters: number): Promise<TourSpot[]> {
    return tourSpotFixtures.filter(
      (spot) => distanceMetersBetween(center, spot.location) <= radiusMeters,
    );
  }

  async byId(contentId: string): Promise<TourSpot | null> {
    return tourSpotFixtures.find((spot) => spot.contentId === contentId) ?? null;
  }

  async search(query: string): Promise<TourSpot[]> {
    return tourSpotFixtures.filter((spot) => matchesQuery(spot, query));
  }
}
