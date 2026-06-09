import { FetchHttpClient } from '@core/network';
import { HttpTourRepository, MockTourRepository, type TourRepository } from '@features/tour/api';
import { TOUR_API_BASE_URL, env } from '@shared/config';

const createTourRepository = (): TourRepository => {
  if (!env.useRealApi) {
    return new MockTourRepository();
  }

  if (!env.tourApiKey) {
    throw new Error('EXPO_PUBLIC_TOUR_API_KEY is required when EXPO_PUBLIC_USE_REAL_API=true');
  }

  return new HttpTourRepository(new FetchHttpClient(TOUR_API_BASE_URL), env.tourApiKey);
};

export const tourRepository: TourRepository = createTourRepository();
