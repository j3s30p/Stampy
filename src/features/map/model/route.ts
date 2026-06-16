import { distanceMetersBetween } from '@core/location';
import type { Coordinates } from '@shared/types';
import type { KakaoMapRoutePayload } from './types';

export interface MapRouteTarget {
  readonly kind: 'spot' | 'event';
  readonly contentId: string;
  readonly title: string;
  readonly location: Coordinates;
}

export const buildStraightLineRoutePayload = (
  currentLocation: Coordinates | null,
  target: MapRouteTarget | null,
): KakaoMapRoutePayload | null => {
  if (!currentLocation || !target) {
    return null;
  }

  const distanceMeters = distanceMetersBetween(currentLocation, target.location);

  return {
    mode: 'straight-line',
    targetContentId: target.contentId,
    targetKind: target.kind,
    targetTitle: target.title,
    distanceMeters,
    source: 'straight-line-fallback',
    summaryLabel: `현재 위치 기준 직선 거리 ${formatRouteDistance(distanceMeters)}`,
    points: [
      {
        lat: currentLocation.latitude,
        lng: currentLocation.longitude,
      },
      {
        lat: target.location.latitude,
        lng: target.location.longitude,
      },
    ],
  };
};

const formatRouteDistance = (distanceMeters: number) => {
  if (distanceMeters < 1000) {
    return `${distanceMeters}m`;
  }

  return `${(distanceMeters / 1000).toFixed(1)}km`;
};
