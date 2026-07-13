import 'package:flutter_test/flutter_test.dart';
import 'package:stampy/app/stamp_collect_refresh_policy.dart';
import 'package:stampy/features/map/domain/map_collect.dart';

void main() {
  test('refreshes location and recommendation after collection success', () {
    var locationRefreshes = 0;
    var recommendationRefreshes = 0;

    refreshAfterStampCollect(
      result: MapCollectSucceeded(distanceMeters: 12),
      refreshLocation: () => locationRefreshes += 1,
      refreshRecommendation: () => recommendationRefreshes += 1,
    );

    expect(locationRefreshes, 1);
    expect(recommendationRefreshes, 1);
  });

  test(
    'does not refresh recommendation after blocked, failed, or no result',
    () {
      for (final result in <MapCollectResult?>[
        MapCollectBlocked(
          MapCollectAvailability.blocked(
            reason: MapCollectBlockReason.outOfRange,
            statusLabel: '100m 밖이에요',
            distanceMeters: 120,
          ),
        ),
        MapCollectFailed('다시 시도해 주세요.'),
        null,
      ]) {
        var locationRefreshes = 0;
        var recommendationRefreshes = 0;

        refreshAfterStampCollect(
          result: result,
          refreshLocation: () => locationRefreshes += 1,
          refreshRecommendation: () => recommendationRefreshes += 1,
        );

        expect(locationRefreshes, 1);
        expect(recommendationRefreshes, 0);
      }
    },
  );
}
