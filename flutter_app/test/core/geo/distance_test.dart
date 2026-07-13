import 'package:flutter_test/flutter_test.dart';
import 'package:stampy/core/geo/geo.dart';

Coordinates coordinates(double latitude, double longitude) =>
    Coordinates(latitude: Latitude(latitude), longitude: Longitude(longitude));

void main() {
  group('distanceMetersBetween', () {
    test('returns zero for the same coordinates', () {
      final seoul = coordinates(37.5665, 126.978);

      expect(distanceMetersBetween(seoul, seoul), 0);
    });

    test('measures about 111m for 0.001 latitude degrees at equator', () {
      expect(
        distanceMetersBetween(coordinates(0, 0), coordinates(0.001, 0)),
        111,
      );
    });

    test('accounts for longitude shrinking at high latitudes', () {
      expect(
        distanceMetersBetween(coordinates(60, 0), coordinates(60, 0.001)),
        56,
      );
    });

    test('is symmetric', () {
      final first = coordinates(37.5665, 126.978);
      final second = coordinates(37.5796, 126.977);

      expect(
        distanceMetersBetween(first, second),
        distanceMetersBetween(second, first),
      );
    });

    test('keeps the 100m stamp boundary separate from discovery radius', () {
      final target = coordinates(37.5665, 126.978);
      final inside = coordinates(37.5665 + 0.00089, 126.978);
      final outside = coordinates(37.5665 + 0.00091, 126.978);

      expect(distanceMetersBetween(target, inside), lessThanOrEqualTo(100));
      expect(distanceMetersBetween(target, outside), greaterThan(100));
      expect(stampRadiusMeters, 100);
      expect(tourDiscoveryRadiusMeters, 1000);
    });
  });
}
