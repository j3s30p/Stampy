import 'package:stampy/core/geo/geo.dart';
import 'package:stampy/core/location/location.dart';
import 'package:stampy/features/map/domain/map_collect.dart';
import 'package:stampy/features/map/domain/map_models.dart';
import 'package:stampy/features/stamp/domain/stamp_domain.dart';

typedef StampCollectedLookup = bool Function(String contentId);
typedef StampCollectAction =
    Future<CollectStampResult> Function(CollectStampRequest request);

final class StampCollectCoordinator {
  const StampCollectCoordinator({
    required LocationRepository locationRepository,
    required StampCollectedLookup isCollected,
    required StampCollectAction collect,
  }) : this._(locationRepository, isCollected, collect);

  const StampCollectCoordinator._(
    this._locationRepository,
    this._isCollected,
    this._collect,
  );

  final LocationRepository _locationRepository;
  final StampCollectedLookup _isCollected;
  final StampCollectAction _collect;

  Future<MapCollectResult> request(MapPin pin) async {
    try {
      final freshLocation = await _locationRepository.getCurrentLocation();
      final availability = resolveStampCollectAvailability(
        pin: pin,
        locationState: freshLocation,
        isSessionCollected: _isCollected(pin.contentId),
      );
      if (!availability.canCollect) {
        return MapCollectBlocked(availability);
      }

      final verificationFix = freshLocation.fix;
      if (verificationFix == null) {
        return MapCollectFailed('현재 위치를 확인하지 못했어요. 다시 시도해 주세요.');
      }

      final result = await _collect(_requestFor(pin, verificationFix));
      return switch (result) {
        CollectStampSuccess() => MapCollectSucceeded(
          distanceMeters: availability.distanceMeters!,
        ),
        CollectStampDuplicate() => MapCollectBlocked(
          MapCollectAvailability.blocked(
            reason: MapCollectBlockReason.alreadyCollected,
            statusLabel: '이미 수집한 도장이에요',
            distanceMeters: availability.distanceMeters,
          ),
        ),
      };
    } on Object {
      return MapCollectFailed('도장을 수집하지 못했어요. 다시 시도해 주세요.');
    }
  }
}

MapCollectAvailability resolveStampCollectAvailability({
  required MapPin pin,
  required LocationState locationState,
  required bool isSessionCollected,
}) {
  final fix = locationState.fix;
  final distanceMeters = fix == null
      ? null
      : distanceMetersBetween(fix.coordinates, pin.location);
  final eligibility = evaluateCollectEligibility(
    CollectEligibilityInput(
      currentLocation: fix?.coordinates,
      accuracyMeters: fix?.accuracyMeters,
      candidate: StampCandidate(
        kind: _stampKindFor(pin.kind),
        contentId: pin.contentId,
        isCollected: pin.collected || isSessionCollected,
      ),
      target: StampTarget(location: pin.location),
    ),
  );

  if (eligibility.canCollect) {
    return MapCollectAvailability.eligible(
      distanceMeters: distanceMeters!,
      statusLabel: '100m 이내 · 도장 수집 가능',
    );
  }

  return MapCollectAvailability.blocked(
    reason: _mapBlockReason(eligibility.blockReason!),
    statusLabel: _blockedStatusLabel(eligibility.blockReason!, locationState),
    distanceMeters: distanceMeters,
  );
}

CollectStampRequest _requestFor(MapPin pin, LocationFix verificationFix) =>
    CollectStampRequest(
      contentId: pin.contentId,
      title: pin.title,
      kind: _stampKindFor(pin.kind),
      verificationFix: verificationFix,
    );

StampCandidateKind _stampKindFor(MapPinKind kind) => switch (kind) {
  MapPinKind.place => StampCandidateKind.spot,
  MapPinKind.event => StampCandidateKind.event,
};

MapCollectBlockReason _mapBlockReason(CollectBlockReason reason) =>
    switch (reason) {
      CollectBlockReason.locationUnavailable =>
        MapCollectBlockReason.locationUnavailable,
      CollectBlockReason.accuracyUnavailable =>
        MapCollectBlockReason.accuracyUnavailable,
      CollectBlockReason.accuracyInsufficient =>
        MapCollectBlockReason.accuracyInsufficient,
      CollectBlockReason.alreadyCollected =>
        MapCollectBlockReason.alreadyCollected,
      CollectBlockReason.outOfRange => MapCollectBlockReason.outOfRange,
      CollectBlockReason.candidateUnavailable ||
      CollectBlockReason.targetUnavailable => MapCollectBlockReason.rejected,
    };

String _blockedStatusLabel(
  CollectBlockReason reason,
  LocationState locationState,
) => switch (reason) {
  CollectBlockReason.locationUnavailable => switch (locationState.status) {
    LocationStatus.loading => '현재 위치를 확인하고 있어요',
    LocationStatus.serviceDisabled => '위치 서비스를 켜 주세요',
    LocationStatus.permissionDenied => '도장 수집에 위치 권한이 필요해요',
    LocationStatus.permissionDeniedForever => '설정에서 위치 권한을 허용해 주세요',
    LocationStatus.available ||
    LocationStatus.unavailable => '현재 위치를 확인할 수 없어요',
  },
  CollectBlockReason.accuracyUnavailable => '위치 정확도를 확인할 수 없어요',
  CollectBlockReason.accuracyInsufficient => '위치 정확도가 낮아요. 잠시 후 다시 시도해 주세요',
  CollectBlockReason.alreadyCollected => '이미 수집한 도장이에요',
  CollectBlockReason.outOfRange => '인증 장소 100m 안으로 이동해 주세요',
  CollectBlockReason.candidateUnavailable ||
  CollectBlockReason.targetUnavailable => '이 장소에서는 도장을 수집할 수 없어요',
};
