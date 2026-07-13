import 'package:stampy/features/map/domain/map_collect.dart';

typedef StampCollectRefresh = void Function();

void refreshAfterStampCollect({
  required MapCollectResult? result,
  required StampCollectRefresh refreshLocation,
  required StampCollectRefresh refreshRecommendation,
}) {
  refreshLocation();
  if (result is MapCollectSucceeded) {
    refreshRecommendation();
  }
}
