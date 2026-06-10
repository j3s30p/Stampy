import { tourSpotFixtures } from '@shared/mocks';
import type { Coordinates } from '@shared/types';
import type { TourSpot } from '../model';
import type { TourRepository } from './TourRepository';

export class MockTourRepository implements TourRepository {
  async searchNearby(_center: Coordinates, _radiusMeters: number): Promise<TourSpot[]> {
    return tourSpotFixtures.map(toTourSpot);
  }

  async byId(_contentId: string): Promise<TourSpot | null> {
    const spot = tourSpotFixtures.find((candidate) => candidate.contentId === _contentId);

    return spot ? toTourSpot(spot) : null;
  }

  async search(_query: string): Promise<TourSpot[]> {
    return tourSpotFixtures.map(toTourSpot);
  }
}

const toTourSpot = (spot: (typeof tourSpotFixtures)[number]): TourSpot => ({
  contentId: spot.contentId,
  title: spot.title,
  address: spot.address,
  location: spot.location,
  thumbnailUrl: spot.thumbnailUrl ?? spot.imageUrls[0],
  imageUrls: spot.imageUrls,
  overview: spot.overview,
  homepage: spot.homepage,
  telephone: spot.telephone,
  contentTypeId: spot.contentTypeId,
});
