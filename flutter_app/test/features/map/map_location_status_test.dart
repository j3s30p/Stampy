import 'package:flutter_test/flutter_test.dart';
import 'package:stampy/core/geo/coordinates.dart';
import 'package:stampy/core/location/location_state.dart';
import 'package:stampy/features/map/presentation/map_location_status.dart';

LocationState _available(double accuracyMeters) => LocationState.available(
  LocationFix(
    coordinates: Coordinates(
      latitude: Latitude(37.579302),
      longitude: Longitude(126.976932),
    ),
    accuracyMeters: accuracyMeters,
    timestamp: DateTime.utc(2026, 7, 13),
  ),
);

void main() {
  group('describeMapLocation', () {
    test('maps every unavailable state to its user-facing recovery state', () {
      const cases = <(LocationState, String, MapLocationTone, bool)>[
        (LocationState.loading(), '현재 위치 찾는 중', MapLocationTone.neutral, false),
        (
          LocationState.serviceDisabled(),
          '위치 서비스가 꺼져 있어요',
          MapLocationTone.warning,
          true,
        ),
        (
          LocationState.permissionDenied(),
          '위치 권한이 필요해요',
          MapLocationTone.warning,
          true,
        ),
        (
          LocationState.permissionDeniedForever(),
          '위치 권한이 차단됐어요',
          MapLocationTone.error,
          false,
        ),
        (
          LocationState.unavailable(),
          '현재 위치를 가져오지 못했어요',
          MapLocationTone.error,
          true,
        ),
      ];

      for (final (state, label, tone, canRetry) in cases) {
        final status = describeMapLocation(state);

        expect(status.label, label, reason: state.status.name);
        expect(status.tone, tone, reason: state.status.name);
        expect(status.canRetry, canRetry, reason: state.status.name);
      }
    });

    test('treats exactly 100m accuracy as connected', () {
      final status = describeMapLocation(_available(100));

      expect(status.label, 'GPS 연결됨 · ±100m');
      expect(status.tone, MapLocationTone.available);
      expect(status.canRetry, isTrue);
    });

    test('warns as soon as accuracy exceeds 100m', () {
      final status = describeMapLocation(_available(100.0001));

      expect(status.label, 'GPS 정확도 낮음 · ±101m');
      expect(status.tone, MapLocationTone.warning);
      expect(status.canRetry, isTrue);
    });

    test('rounds displayed accuracy up to whole meters', () {
      expect(describeMapLocation(_available(7.6)).label, 'GPS 연결됨 · ±8m');
      expect(
        describeMapLocation(_available(100.6)).label,
        'GPS 정확도 낮음 · ±101m',
      );
    });
  });
}
