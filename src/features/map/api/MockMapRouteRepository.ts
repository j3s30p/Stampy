import { buildStraightLineRoutePayload } from '../model';
import type { KakaoMapRoutePayload } from '../model';
import type { MapRouteRepository, MapRouteRequest } from './MapRouteRepository';

export class MockMapRouteRepository implements MapRouteRepository {
  async directionsRoute(request: MapRouteRequest): Promise<KakaoMapRoutePayload> {
    const route = buildStraightLineRoutePayload(request.origin, request.destination);

    if (!route) {
      throw new Error('Route origin and destination are required.');
    }

    return route;
  }
}
