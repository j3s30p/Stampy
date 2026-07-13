import 'package:flutter_test/flutter_test.dart';
import 'package:stampy/features/map/domain/map_collect.dart';

void main() {
  test('eligible availability keeps the precise non-rounded distance', () {
    final availability = MapCollectAvailability.eligible(
      distanceMeters: 99.999,
      statusLabel: '수집 가능',
    );

    expect(availability.canCollect, isTrue);
    expect(availability.distanceMeters, 99.999);
    expect(availability.blockReason, isNull);
  });

  test('eligible availability accepts 100m exactly but not 100.0001m', () {
    expect(
      MapCollectAvailability.eligible(
        distanceMeters: 100,
        statusLabel: '수집 가능',
      ).distanceMeters,
      100,
    );
    expect(
      () => MapCollectAvailability.eligible(
        distanceMeters: 100.0001,
        statusLabel: '수집 가능',
      ),
      throwsRangeError,
    );
  });

  test('availability rejects invalid distance and empty status text', () {
    expect(
      () => MapCollectAvailability.eligible(
        distanceMeters: double.nan,
        statusLabel: '수집 가능',
      ),
      throwsRangeError,
    );
    expect(
      () => MapCollectAvailability.blocked(
        reason: MapCollectBlockReason.outOfRange,
        statusLabel: '   ',
      ),
      throwsArgumentError,
    );
  });

  test('blocked result refuses an eligible availability', () {
    final eligible = MapCollectAvailability.eligible(
      distanceMeters: 42.25,
      statusLabel: '수집 가능',
    );

    expect(() => MapCollectBlocked(eligible), throwsArgumentError);
  });

  test('success keeps the latest precise distance when supplied', () {
    final result = MapCollectSucceeded(distanceMeters: 42.25);

    expect(result.distanceMeters, 42.25);
  });
}
