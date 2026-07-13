import 'package:flutter_test/flutter_test.dart';
import 'package:stampy/core/geo/geo.dart';

void main() {
  group('Latitude', () {
    test('accepts values inside the inclusive range', () {
      expect(Latitude(-90).value, -90);
      expect(Latitude(37.5665).value, 37.5665);
      expect(Latitude(90).value, 90);
    });

    test('rejects out-of-range and non-finite values', () {
      expect(() => Latitude(-90.0001), throwsRangeError);
      expect(() => Latitude(90.0001), throwsRangeError);
      expect(() => Latitude(double.nan), throwsRangeError);
      expect(() => Latitude(double.infinity), throwsRangeError);
      expect(() => Latitude(double.negativeInfinity), throwsRangeError);
    });
  });

  group('Longitude', () {
    test('accepts values inside the inclusive range', () {
      expect(Longitude(-180).value, -180);
      expect(Longitude(126.978).value, 126.978);
      expect(Longitude(180).value, 180);
    });

    test('rejects out-of-range and non-finite values', () {
      expect(() => Longitude(-180.0001), throwsRangeError);
      expect(() => Longitude(180.0001), throwsRangeError);
      expect(() => Longitude(double.nan), throwsRangeError);
      expect(() => Longitude(double.infinity), throwsRangeError);
      expect(() => Longitude(double.negativeInfinity), throwsRangeError);
    });
  });

  test('Coordinates compares latitude and longitude value objects', () {
    final first = Coordinates(
      latitude: Latitude(37.5665),
      longitude: Longitude(126.978),
    );
    final second = Coordinates(
      latitude: Latitude(37.5665),
      longitude: Longitude(126.978),
    );

    expect(first, second);
    expect(first.hashCode, second.hashCode);
  });
}
