import 'package:flutter_test/flutter_test.dart';
import 'package:stampy/core/geo/coordinates.dart';
import 'package:stampy/core/location/location_state.dart';

void main() {
  group('LocationFix', () {
    test('preserves typed coordinates, accuracy, and timestamp', () {
      final timestamp = DateTime.utc(2026, 7, 13, 2, 30);
      final fix = LocationFix(
        coordinates: Coordinates(
          latitude: Latitude(37.579617),
          longitude: Longitude(126.977041),
        ),
        accuracyMeters: 7.25,
        timestamp: timestamp,
      );

      expect(fix.coordinates.latitude, Latitude(37.579617));
      expect(fix.coordinates.longitude, Longitude(126.977041));
      expect(fix.accuracyMeters, 7.25);
      expect(fix.timestamp, same(timestamp));
    });

    test('rejects invalid accuracy values', () {
      final coordinates = Coordinates(
        latitude: Latitude(37.579617),
        longitude: Longitude(126.977041),
      );
      final timestamp = DateTime.utc(2026, 7, 13);

      for (final accuracy in <double>[
        -0.01,
        double.nan,
        double.infinity,
        double.negativeInfinity,
      ]) {
        expect(
          () => LocationFix(
            coordinates: coordinates,
            accuracyMeters: accuracy,
            timestamp: timestamp,
          ),
          throwsRangeError,
        );
      }
    });

    test('accepts zero accuracy', () {
      final fix = LocationFix(
        coordinates: Coordinates(
          latitude: Latitude(37.579617),
          longitude: Longitude(126.977041),
        ),
        accuracyMeters: 0,
        timestamp: DateTime.utc(2026, 7, 13),
      );

      expect(fix.accuracyMeters, 0);
    });
  });

  test('each non-available state has no location fix', () {
    const states = <LocationState>[
      LocationState.loading(),
      LocationState.serviceDisabled(),
      LocationState.permissionDenied(),
      LocationState.permissionDeniedForever(),
      LocationState.unavailable(),
    ];

    for (final state in states) {
      expect(state.fix, isNull);
      expect(state.isAvailable, isFalse);
    }
  });

  test('available state exposes its fix', () {
    final fix = LocationFix(
      coordinates: Coordinates(
        latitude: Latitude(37.579617),
        longitude: Longitude(126.977041),
      ),
      accuracyMeters: 5,
      timestamp: DateTime.utc(2026, 7, 13),
    );
    final state = LocationState.available(fix);

    expect(state.status, LocationStatus.available);
    expect(state.fix, same(fix));
    expect(state.isAvailable, isTrue);
  });
}
