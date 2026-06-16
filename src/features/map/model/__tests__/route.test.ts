import { asLatitude, asLongitude, type Coordinates } from '@shared/types';
import { buildStraightLineRoutePayload, type MapRouteTarget } from '../route';

const coord = (latitude: number, longitude: number): Coordinates => ({
  latitude: asLatitude(latitude),
  longitude: asLongitude(longitude),
});

describe('buildStraightLineRoutePayload', () => {
  const currentLocation = coord(37.5665, 126.978);
  const target: MapRouteTarget = {
    kind: 'spot',
    contentId: 'spot-1',
    title: '서울도서관',
    location: coord(37.5669, 126.9779),
  };

  it('returns null until current location and target are both available', () => {
    expect(buildStraightLineRoutePayload(null, target)).toBeNull();
    expect(buildStraightLineRoutePayload(currentLocation, null)).toBeNull();
  });

  it('builds a straight-line route payload from current location to a spot', () => {
    const route = buildStraightLineRoutePayload(currentLocation, target);

    expect(route).toEqual({
      mode: 'straight-line',
      targetContentId: 'spot-1',
      targetKind: 'spot',
      targetTitle: '서울도서관',
      distanceMeters: 45,
      source: 'straight-line-fallback',
      summaryLabel: '현재 위치 기준 직선 거리 45m',
      points: [
        { lat: currentLocation.latitude, lng: currentLocation.longitude },
        { lat: target.location.latitude, lng: target.location.longitude },
      ],
    });
  });

  it('uses the same route contract for event targets', () => {
    const route = buildStraightLineRoutePayload(currentLocation, {
      ...target,
      kind: 'event',
      contentId: 'event-1',
      title: '서울 축제',
    });

    expect(route?.targetKind).toBe('event');
    expect(route?.targetContentId).toBe('event-1');
    expect(route?.summaryLabel).toContain('직선 거리');
  });
});
