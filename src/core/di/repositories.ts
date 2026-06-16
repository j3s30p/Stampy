import { MockAuthRepository, type AuthRepository } from '@core/auth';
import { FetchHttpClient } from '@core/network';
import { MockStorageRepository, type StorageRepository } from '@core/storage';
import {
  HttpEventRepository,
  MockEventRepository,
  type EventRepository,
} from '@features/event/api';
import {
  HttpMapRouteProxyRepository,
  MockMapRouteRepository,
  type MapRouteRepository,
} from '@features/map/api';
import { MockStampRepository, type StampRepository } from '@features/stamp/api';
import { HttpTourRepository, MockTourRepository, type TourRepository } from '@features/tour/api';
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

const createMapRouteRepository = (): MapRouteRepository => {
  if (!env.mapRouteProxyUrl) {
    return new MockMapRouteRepository();
  }

  return new HttpMapRouteProxyRepository(env.mapRouteProxyUrl);
};

export const tourRepository: TourRepository = createTourRepository();
export const eventRepository: EventRepository = createEventRepository();
export const mapRouteRepository: MapRouteRepository = createMapRouteRepository();
export const storageRepository: StorageRepository = new MockStorageRepository();
export const authRepository: AuthRepository = new MockAuthRepository(storageRepository);
export const stampRepository: StampRepository = new MockStampRepository(storageRepository);
