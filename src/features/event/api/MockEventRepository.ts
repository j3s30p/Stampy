import { distanceMetersBetween } from '@core/location';
import { tourEventFixtures } from '@shared/mocks';
import type { Coordinates } from '@shared/types';
import type { TourEvent } from '../model';
import type { EventRepository } from './EventRepository';

const normalizeQuery = (query: string): string => query.trim().toLowerCase();

const matchesQuery = (event: TourEvent, query: string): boolean => {
  const normalizedQuery = normalizeQuery(query);

  if (!normalizedQuery) {
    return true;
  }

  return [event.title, event.address, event.overview]
    .filter((value): value is string => typeof value === 'string')
    .some((value) => value.toLowerCase().includes(normalizedQuery));
};

export class MockEventRepository implements EventRepository {
  async searchNearby(center: Coordinates, radiusMeters: number): Promise<TourEvent[]> {
    return tourEventFixtures.filter(
      (event) => distanceMetersBetween(center, event.location) <= radiusMeters,
    );
  }

  async byId(contentId: string): Promise<TourEvent | null> {
    return tourEventFixtures.find((event) => event.contentId === contentId) ?? null;
  }

  async search(query: string): Promise<TourEvent[]> {
    return tourEventFixtures.filter((event) => matchesQuery(event, query));
  }
}
