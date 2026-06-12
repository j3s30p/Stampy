import { FetchHttpClient } from '@core/network';
import type { EventRepository } from '@features/event/api';
import { MockEventRepository } from '@features/event/api';
import {
  HttpEventRepository,
  HttpTourRepository,
  MockTourRepository,
  type TourRepository,
} from '@features/tour/api';
import { TOUR_API_BASE_URL, env } from '@shared/config';

const createTourRepository = (): TourRepository => {
  if (!env.useRealApi) {
    return new MockTourRepository();
  }

  if (!env.tourApiKey) {
    throw new Error('EXPO_PUBLIC_USE_REAL_API=true requires EXPO_PUBLIC_TOUR_API_KEY');
  }

  return new HttpTourRepository(new FetchHttpClient(TOUR_API_BASE_URL), env.tourApiKey);
};

const createEventRepository = (): EventRepository => {
  if (!env.useRealApi) {
    return new MockEventRepository();
  }

  if (!env.tourApiKey) {
    throw new Error('EXPO_PUBLIC_USE_REAL_API=true requires EXPO_PUBLIC_TOUR_API_KEY');
  }

  return new HttpEventRepository(new FetchHttpClient(TOUR_API_BASE_URL), env.tourApiKey);
};

export const tourRepository: TourRepository = createTourRepository();
export const eventRepository: EventRepository = createEventRepository();
