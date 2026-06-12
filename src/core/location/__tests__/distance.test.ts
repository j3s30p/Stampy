import { distanceMetersBetween } from '@core/location/distance';
import { STAMP_RADIUS_METERS } from '@shared/config';
import { asLatitude, asLongitude, type Coordinates } from '@shared/types';

const coord = (lat: number, lon: number): Coordinates => ({
  latitude: asLatitude(lat),
  longitude: asLongitude(lon),
});

describe('distanceMetersBetween', () => {
  it('같은 좌표는 0m', () => {
    const seoul = coord(37.5665, 126.978);
    expect(distanceMetersBetween(seoul, seoul)).toBe(0);
  });

  it('적도에서 위도 0.001° 차이는 약 111m', () => {
    expect(distanceMetersBetween(coord(0, 0), coord(0.001, 0))).toBe(111);
  });

  it('위도 60° 에서 경도 0.001° 차이는 적도의 절반 (~56m)', () => {
    expect(distanceMetersBetween(coord(60, 0), coord(60, 0.001))).toBe(56);
  });

  it('방향을 바꿔도 거리가 같다 (대칭성)', () => {
    const a = coord(37.5665, 126.978);
    const b = coord(37.5796, 126.977);
    expect(distanceMetersBetween(a, b)).toBe(distanceMetersBetween(b, a));
  });

  it('도장 인증 반경 100m 경계: 약 99m 는 반경 안, 약 101m 는 반경 밖', () => {
    const spot = coord(37.5665, 126.978);
    const inside = coord(37.5665 + 0.00089, 126.978);
    const outside = coord(37.5665 + 0.00091, 126.978);

    expect(distanceMetersBetween(spot, inside)).toBeLessThanOrEqual(STAMP_RADIUS_METERS);
    expect(distanceMetersBetween(spot, outside)).toBeGreaterThan(STAMP_RADIUS_METERS);
  });

  it('도장 인증 반경 invariant — 100m 고정 (AGENTS.md)', () => {
    expect(STAMP_RADIUS_METERS).toBe(100);
  });
});
