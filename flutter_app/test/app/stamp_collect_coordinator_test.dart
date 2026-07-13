import 'dart:math' as math;

import 'package:flutter_test/flutter_test.dart';
import 'package:stampy/app/stamp_collect_coordinator.dart';
import 'package:stampy/core/geo/geo.dart';
import 'package:stampy/core/location/location.dart';
import 'package:stampy/features/map/domain/map_collect.dart';
import 'package:stampy/features/map/domain/map_models.dart';
import 'package:stampy/features/stamp/domain/stamp_domain.dart';

void main() {
  final target = _coordinates(0, 0);
  final pin = MapPin(
    contentId: 'tour-126508',
    title: '경복궁',
    kind: MapPinKind.place,
    location: target,
  );

  group('resolveStampCollectAvailability', () {
    test('keeps the inclusive 100m boundary eligible with exact distance', () {
      final current = _offsetByMeters(target, stampRadiusMeters.toDouble());
      final availability = resolveStampCollectAvailability(
        pin: pin,
        locationState: _available(current),
        isSessionCollected: false,
      );

      expect(availability.canCollect, isTrue);
      expect(
        availability.distanceMeters,
        closeTo(stampRadiusMeters, 0.0000001),
      );
    });

    test('rejects an exact distance that only rounds down to 100m', () {
      final current = _offsetByMeters(target, 100.1);
      final availability = resolveStampCollectAvailability(
        pin: pin,
        locationState: _available(current),
        isSessionCollected: false,
      );

      expect(availability.distanceMeters!.round(), stampRadiusMeters);
      expect(availability.canCollect, isFalse);
      expect(availability.blockReason, MapCollectBlockReason.outOfRange);
    });

    test(
      'maps permission, accuracy, and session duplicate to Korean blocks',
      () {
        final permission = resolveStampCollectAvailability(
          pin: pin,
          locationState: const LocationState.permissionDeniedForever(),
          isSessionCollected: false,
        );
        final accuracy = resolveStampCollectAvailability(
          pin: pin,
          locationState: _available(target, accuracyMeters: 101),
          isSessionCollected: false,
        );
        final duplicate = resolveStampCollectAvailability(
          pin: pin,
          locationState: _available(target),
          isSessionCollected: true,
        );

        expect(permission.canCollect, isFalse);
        expect(permission.statusLabel, '설정에서 위치 권한을 허용해 주세요');
        expect(
          accuracy.blockReason,
          MapCollectBlockReason.accuracyInsufficient,
        );
        expect(accuracy.statusLabel, contains('위치 정확도'));
        expect(duplicate.blockReason, MapCollectBlockReason.alreadyCollected);
        expect(duplicate.statusLabel, '이미 수집한 도장이에요');
      },
    );
  });

  group('StampCollectCoordinator', () {
    test(
      'rechecks fresh location before writing and returns exact distance',
      () async {
        final verificationFix = LocationFix(
          coordinates: _offsetByMeters(target, 12.5),
          accuracyMeters: 7.25,
          timestamp: DateTime.utc(2026, 7, 13, 11, 58, 30),
        );
        final repository = FakeLocationRepository(
          state: LocationState.available(verificationFix),
        );
        var collectCalls = 0;
        CollectStampRequest? receivedRequest;
        final coordinator = StampCollectCoordinator(
          locationRepository: repository,
          isCollected: (_) => false,
          collect: (request) async {
            collectCalls += 1;
            receivedRequest = request;
            return CollectStampResult.success(
              _recordFor(request, DateTime.utc(2026, 7, 13)),
            );
          },
        );

        final result = await coordinator.request(pin);

        expect(repository.requestCount, 1);
        expect(collectCalls, 1);
        expect(receivedRequest?.contentId, pin.contentId);
        expect(receivedRequest?.verificationFix, verificationFix);
        expect(
          receivedRequest?.verificationFix.coordinates,
          verificationFix.coordinates,
        );
        expect(
          receivedRequest?.verificationFix.accuracyMeters,
          verificationFix.accuracyMeters,
        );
        expect(
          receivedRequest?.verificationFix.timestamp,
          verificationFix.timestamp,
        );
        expect(result, isA<MapCollectSucceeded>());
        expect(
          (result as MapCollectSucceeded).distanceMeters,
          closeTo(12.5, 0.0000001),
        );
      },
    );

    test(
      'fresh permission, accuracy, range, and duplicate blocks never write',
      () async {
        final cases =
            <
              ({
                LocationState state,
                bool isCollected,
                MapCollectBlockReason reason,
              })
            >[
              (
                state: const LocationState.permissionDenied(),
                isCollected: false,
                reason: MapCollectBlockReason.locationUnavailable,
              ),
              (
                state: _available(target, accuracyMeters: 101),
                isCollected: false,
                reason: MapCollectBlockReason.accuracyInsufficient,
              ),
              (
                state: _available(_offsetByMeters(target, 101)),
                isCollected: false,
                reason: MapCollectBlockReason.outOfRange,
              ),
              (
                state: _available(target),
                isCollected: true,
                reason: MapCollectBlockReason.alreadyCollected,
              ),
            ];
        var collectCalls = 0;

        for (final blockedCase in cases) {
          final repository = FakeLocationRepository(state: blockedCase.state);
          final coordinator = StampCollectCoordinator(
            locationRepository: repository,
            isCollected: (_) => blockedCase.isCollected,
            collect: (request) async {
              collectCalls += 1;
              throw StateError('must not write');
            },
          );

          final result = await coordinator.request(pin);

          expect(repository.requestCount, 1);
          expect(
            (result as MapCollectBlocked).availability.blockReason,
            blockedCase.reason,
          );
        }

        expect(collectCalls, 0);
      },
    );

    test(
      'maps repository duplicate and failure without reporting success',
      () async {
        final existing = CollectedStamp(
          contentId: pin.contentId,
          title: pin.title,
          kind: StampCandidateKind.spot,
          verificationFix: _available(pin.location).fix!,
          collectedAt: DateTime.utc(2026, 7, 12),
        );
        final duplicate = StampCollectCoordinator(
          locationRepository: FakeLocationRepository(state: _available(target)),
          isCollected: (_) => false,
          collect: (_) async => CollectStampResult.duplicate(existing),
        );
        final failure = StampCollectCoordinator(
          locationRepository: FakeLocationRepository(state: _available(target)),
          isCollected: (_) => false,
          collect: (_) async => throw StateError('write failed'),
        );

        final duplicateResult = await duplicate.request(pin);
        final failureResult = await failure.request(pin);

        expect(
          (duplicateResult as MapCollectBlocked).availability.blockReason,
          MapCollectBlockReason.alreadyCollected,
        );
        expect(failureResult, isA<MapCollectFailed>());
      },
    );
  });
}

Coordinates _coordinates(double latitude, double longitude) =>
    Coordinates(latitude: Latitude(latitude), longitude: Longitude(longitude));

Coordinates _offsetByMeters(Coordinates origin, double meters) => Coordinates(
  latitude: Latitude(
    origin.latitude.value + meters / earthRadiusMeters * 180 / math.pi,
  ),
  longitude: origin.longitude,
);

LocationState _available(
  Coordinates coordinates, {
  double accuracyMeters = 5,
}) => LocationState.available(
  LocationFix(
    coordinates: coordinates,
    accuracyMeters: accuracyMeters,
    timestamp: DateTime.utc(2026, 7, 13),
  ),
);

CollectedStamp _recordFor(CollectStampRequest request, DateTime collectedAt) =>
    CollectedStamp(
      contentId: request.contentId,
      title: request.title,
      kind: request.kind,
      verificationFix: request.verificationFix,
      collectedAt: collectedAt,
    );
