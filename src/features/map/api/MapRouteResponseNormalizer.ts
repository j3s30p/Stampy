import type { KakaoMapPointPayload, KakaoMapRoutePayload } from '../model';
import type { MapRouteRequest } from './MapRouteRepository';

interface KakaoDirectionsRouteResponse {
  readonly routes?: readonly KakaoDirectionsRoute[];
}

interface KakaoDirectionsRoute {
  readonly result_code?: number;
  readonly result_msg?: string;
  readonly summary?: {
    readonly distance?: number;
    readonly duration?: number;
  };
  readonly sections?: readonly {
    readonly roads?: readonly {
      readonly vertexes?: readonly number[];
    }[];
  }[];
}

const ROUTE_MODES = new Set(['straight-line', 'walking-api', 'driving-api']);
const ROUTE_SOURCES = new Set(['kakao-driving-api', 'kakao-walking-api', 'straight-line-fallback']);

export const normalizeMapRouteProxyResponse = (
  response: unknown,
  request: MapRouteRequest,
): KakaoMapRoutePayload => {
  if (isKakaoMapRoutePayload(response)) {
    return response;
  }

  return normalizeKakaoDrivingRouteResponse(response as KakaoDirectionsRouteResponse, request);
};

export const normalizeKakaoDrivingRouteResponse = (
  response: KakaoDirectionsRouteResponse,
  request: MapRouteRequest,
): KakaoMapRoutePayload => {
  const route = response.routes?.[0];

  if (!route) {
    throw new Error('Map route response did not include a route.');
  }

  if (route.result_code !== 0) {
    throw new Error(`Map route failed: ${route.result_code ?? 'UNKNOWN'}`);
  }

  const points = toRoutePoints(route);

  if (points.length < 2) {
    throw new Error('Map route response did not include enough vertexes.');
  }

  const distanceMeters = toRequiredFiniteNumber(route.summary?.distance, 'distance');
  const durationSeconds = toRequiredFiniteNumber(route.summary?.duration, 'duration');

  return {
    mode: 'driving-api',
    targetContentId: request.destination.contentId,
    targetKind: request.destination.kind,
    targetTitle: request.destination.title,
    distanceMeters,
    durationSeconds,
    source: 'kakao-driving-api',
    summaryLabel: `차량 기준 경로 ${formatDistance(distanceMeters)} · 약 ${formatDuration(
      durationSeconds,
    )}`,
    points,
  };
};

const isKakaoMapRoutePayload = (value: unknown): value is KakaoMapRoutePayload => {
  if (!value || typeof value !== 'object') {
    return false;
  }

  const candidate = value as Partial<KakaoMapRoutePayload>;

  return (
    typeof candidate.targetContentId === 'string' &&
    (candidate.targetKind === 'spot' || candidate.targetKind === 'event') &&
    typeof candidate.targetTitle === 'string' &&
    isFiniteNumber(candidate.distanceMeters) &&
    (candidate.durationSeconds === undefined || isFiniteNumber(candidate.durationSeconds)) &&
    (candidate.source === undefined || ROUTE_SOURCES.has(candidate.source)) &&
    typeof candidate.summaryLabel === 'string' &&
    typeof candidate.mode === 'string' &&
    ROUTE_MODES.has(candidate.mode) &&
    Array.isArray(candidate.points) &&
    candidate.points.length >= 2 &&
    candidate.points.every(isKakaoMapPointPayload)
  );
};

const isKakaoMapPointPayload = (value: unknown): value is KakaoMapPointPayload => {
  if (!value || typeof value !== 'object') {
    return false;
  }

  const candidate = value as Partial<KakaoMapPointPayload>;

  return isFiniteNumber(candidate.lat) && isFiniteNumber(candidate.lng);
};

const isFiniteNumber = (value: unknown): value is number =>
  typeof value === 'number' && Number.isFinite(value);

const toRoutePoints = (route: KakaoDirectionsRoute): readonly KakaoMapPointPayload[] => {
  const points: KakaoMapPointPayload[] = [];

  route.sections?.forEach((section) => {
    section.roads?.forEach((road) => {
      const vertexes = road.vertexes ?? [];

      for (let index = 0; index < vertexes.length - 1; index += 2) {
        const lng = vertexes[index];
        const lat = vertexes[index + 1];

        if (typeof lat === 'number' && typeof lng === 'number') {
          points.push({ lat, lng });
        }
      }
    });
  });

  return points;
};

const toRequiredFiniteNumber = (value: number | undefined, label: string): number => {
  if (typeof value !== 'number' || !Number.isFinite(value)) {
    throw new Error(`Map route response did not include ${label}.`);
  }

  return Math.round(value);
};

const formatDistance = (distanceMeters: number) => {
  if (distanceMeters < 1000) {
    return `${distanceMeters}m`;
  }

  return `${(distanceMeters / 1000).toFixed(1)}km`;
};

const formatDuration = (durationSeconds: number) => {
  const minutes = Math.max(1, Math.round(durationSeconds / 60));

  return `${minutes}분`;
};
