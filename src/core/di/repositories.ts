import { FetchHttpClient } from '@core/network';
import { HttpEventRepository, type EventRepository } from '@features/event/api';
import { HttpTourRepository, type TourRepository } from '@features/tour/api';
import { TOUR_API_BASE_URL, env } from '@shared/config';

const requireTourApiKey = () => {
  if (!env.tourApiKey) {
    throw new Error('EXPO_PUBLIC_TOUR_API_KEY is required');
  }

  return env.tourApiKey;
};

const createTourRepository = (): TourRepository => {
  const tourApiKey = requireTourApiKey();

  return new HttpTourRepository(new FetchHttpClient(TOUR_API_BASE_URL), tourApiKey);
};

const createEventRepository = (): EventRepository => {
  const tourApiKey = requireTourApiKey();

  return new HttpEventRepository(new FetchHttpClient(TOUR_API_BASE_URL), tourApiKey);
};

export const tourRepository: TourRepository = createTourRepository();
export const eventRepository: EventRepository = createEventRepository();
