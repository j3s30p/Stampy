import type { Coordinates } from '@shared/types';
import type { KakaoMapRoutePayload, MapRouteTarget } from '../model';

export interface MapRouteRequest {
  readonly origin: Coordinates;
  readonly destination: MapRouteTarget;
}

export interface MapRouteRepository {
  directionsRoute(request: MapRouteRequest): Promise<KakaoMapRoutePayload>;
}
