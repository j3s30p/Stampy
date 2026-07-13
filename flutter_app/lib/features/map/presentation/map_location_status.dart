import 'package:stampy/core/geo/geo_constants.dart';
import 'package:stampy/core/location/location_state.dart';

enum MapLocationTone { neutral, available, warning, error }

final class MapLocationStatus {
  const MapLocationStatus({
    required this.label,
    required this.tone,
    required this.canRetry,
  });

  final String label;
  final MapLocationTone tone;
  final bool canRetry;
}

MapLocationStatus describeMapLocation(LocationState state) {
  final fix = state.fix;
  if (fix != null) {
    final displayedAccuracy = fix.accuracyMeters.ceil();
    if (fix.accuracyMeters > stampRadiusMeters) {
      return MapLocationStatus(
        label: 'GPS 정확도 낮음 · ±${displayedAccuracy}m',
        tone: MapLocationTone.warning,
        canRetry: true,
      );
    }

    return MapLocationStatus(
      label: 'GPS 연결됨 · ±${displayedAccuracy}m',
      tone: MapLocationTone.available,
      canRetry: true,
    );
  }

  return switch (state.status) {
    LocationStatus.loading => const MapLocationStatus(
      label: '현재 위치 찾는 중',
      tone: MapLocationTone.neutral,
      canRetry: false,
    ),
    LocationStatus.serviceDisabled => const MapLocationStatus(
      label: '위치 서비스가 꺼져 있어요',
      tone: MapLocationTone.warning,
      canRetry: true,
    ),
    LocationStatus.permissionDenied => const MapLocationStatus(
      label: '위치 권한이 필요해요',
      tone: MapLocationTone.warning,
      canRetry: true,
    ),
    LocationStatus.permissionDeniedForever => const MapLocationStatus(
      label: '위치 권한이 차단됐어요',
      tone: MapLocationTone.error,
      canRetry: false,
    ),
    LocationStatus.unavailable => const MapLocationStatus(
      label: '현재 위치를 가져오지 못했어요',
      tone: MapLocationTone.error,
      canRetry: true,
    ),
    LocationStatus.available => const MapLocationStatus(
      label: '현재 위치를 가져오지 못했어요',
      tone: MapLocationTone.error,
      canRetry: true,
    ),
  };
}
