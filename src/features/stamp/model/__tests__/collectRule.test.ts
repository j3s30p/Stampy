import { canCollectCandidate, type StampCandidate } from '@features/stamp/model';
import { STAMP_RADIUS_METERS } from '@shared/config';
import { asLatitude, asLongitude, type Coordinates } from '@shared/types';

const METERS_PER_LATITUDE_DEGREE = 111_000;

const coord = (lat: number, lon: number): Coordinates => ({
  latitude: asLatitude(lat),
  longitude: asLongitude(lon),
});

const candidate = (overrides: Partial<StampCandidate> = {}): StampCandidate => ({
  kind: 'spot',
  contentId: 'spot-1',
  title: '테스트 관광지',
  address: '서울 중구 세종대로',
  distanceMeters: STAMP_RADIUS_METERS,
  verificationDistanceMeters: STAMP_RADIUS_METERS,
  collected: false,
  ...overrides,
});

const offsetByMeters = (origin: Coordinates, meters: number): Coordinates =>
  coord(origin.latitude + meters / METERS_PER_LATITUDE_DEGREE, origin.longitude);

describe('canCollectCandidate', () => {
  const targetLocation = coord(37.5665, 126.978);
  const target = { location: targetLocation };

  it('도장 반경 안의 약 99m 후보는 수집 가능하고 약 101m 후보는 거부한다', () => {
    const insideLocation = offsetByMeters(targetLocation, STAMP_RADIUS_METERS * 0.99);
    const outsideLocation = offsetByMeters(targetLocation, STAMP_RADIUS_METERS * 1.01);

    expect(
      canCollectCandidate({
        currentLocation: insideLocation,
        accuracyMeters: STAMP_RADIUS_METERS,
        candidate: candidate(),
        target,
      }),
    ).toBe(true);

    expect(
      canCollectCandidate({
        currentLocation: outsideLocation,
        accuracyMeters: STAMP_RADIUS_METERS,
        candidate: candidate(),
        target,
      }),
    ).toBe(false);
  });

  it('GPS accuracy가 null이면 거부한다', () => {
    expect(
      canCollectCandidate({
        currentLocation: targetLocation,
        accuracyMeters: null,
        candidate: candidate(),
        target,
      }),
    ).toBe(false);
  });

  it('GPS accuracy가 도장 반경보다 크면 거부한다', () => {
    expect(
      canCollectCandidate({
        currentLocation: targetLocation,
        accuracyMeters: STAMP_RADIUS_METERS + 1,
        candidate: candidate(),
        target,
      }),
    ).toBe(false);
  });

  it('이미 수집한 candidate면 거부한다', () => {
    expect(
      canCollectCandidate({
        currentLocation: targetLocation,
        accuracyMeters: STAMP_RADIUS_METERS,
        candidate: candidate({ collected: true }),
        target,
      }),
    ).toBe(false);
  });

  it('currentLocation이 null이면 거부한다', () => {
    expect(
      canCollectCandidate({
        currentLocation: null,
        accuracyMeters: STAMP_RADIUS_METERS,
        candidate: candidate(),
        target,
      }),
    ).toBe(false);
  });
});
