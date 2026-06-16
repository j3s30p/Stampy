import type { KakaoMapRoutePayload } from '../model';
import type { MapRouteRepository, MapRouteRequest } from './MapRouteRepository';
import { normalizeMapRouteProxyResponse } from './MapRouteResponseNormalizer';

type RouteFetch = (
  input: string,
  init?: {
    readonly method?: string;
    readonly headers?: Record<string, string>;
    readonly body?: string;
  },
) => Promise<{
  readonly ok: boolean;
  readonly status: number;
  readonly statusText: string;
  text(): Promise<string>;
}>;

export class HttpMapRouteProxyRepository implements MapRouteRepository {
  constructor(
    private readonly proxyUrl: string,
    private readonly routeFetch: RouteFetch = fetch,
  ) {}

  async directionsRoute(request: MapRouteRequest): Promise<KakaoMapRoutePayload> {
    const response = await this.routeFetch(this.proxyUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        origin: {
          latitude: request.origin.latitude,
          longitude: request.origin.longitude,
        },
        destination: {
          kind: request.destination.kind,
          contentId: request.destination.contentId,
          title: request.destination.title,
          location: {
            latitude: request.destination.location.latitude,
            longitude: request.destination.location.longitude,
          },
        },
      }),
    });
    const bodyText = await response.text();

    if (!response.ok) {
      throw new Error(`Map route proxy HTTP ${response.status} ${response.statusText}`);
    }

    return normalizeMapRouteProxyResponse(JSON.parse(bodyText), request);
  }
}
