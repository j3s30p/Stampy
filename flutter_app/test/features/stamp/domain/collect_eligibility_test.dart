import 'package:flutter_test/flutter_test.dart';
import 'package:stampy/core/geo/geo.dart';
import 'package:stampy/features/stamp/domain/stamp_domain.dart';

const metersPerLatitudeDegree = 111000;

Coordinates coordinates(double latitude, double longitude) =>
    Coordinates(latitude: Latitude(latitude), longitude: Longitude(longitude));

StampCandidate candidate({bool isCollected = false}) => StampCandidate(
  kind: StampCandidateKind.spot,
  contentId: 'spot-1',
  isCollected: isCollected,
);

Coordinates offsetByMeters(Coordinates origin, double meters) => Coordinates(
  latitude: Latitude(origin.latitude.value + meters / metersPerLatitudeDegree),
  longitude: origin.longitude,
);

CollectEligibility evaluate({
  Coordinates? currentLocation,
  double? accuracyMeters = 100,
  StampCandidate? stampCandidate,
  StampTarget? target,
}) => evaluateCollectEligibility(
  CollectEligibilityInput(
    currentLocation: currentLocation,
    accuracyMeters: accuracyMeters,
    candidate: stampCandidate,
    target: target,
  ),
);

void main() {
  final targetLocation = coordinates(37.5665, 126.978);
  final target = StampTarget(location: targetLocation);

  test('allows about 99m and rejects about 101m', () {
    final inside = evaluate(
      currentLocation: offsetByMeters(targetLocation, stampRadiusMeters * 0.99),
      stampCandidate: candidate(),
      target: target,
    );
    final outside = evaluate(
      currentLocation: offsetByMeters(targetLocation, stampRadiusMeters * 1.01),
      stampCandidate: candidate(),
      target: target,
    );

    expect(inside.canCollect, isTrue);
    expect(inside.blockReason, isNull);
    expect(outside.canCollect, isFalse);
    expect(outside.blockReason, CollectBlockReason.outOfRange);
  });

  test('requires a current location', () {
    final result = evaluate(stampCandidate: candidate(), target: target);

    expect(result.blockReason, CollectBlockReason.locationUnavailable);
  });

  test('rejects missing, negative, and non-finite accuracy', () {
    for (final accuracy in <double?>[null, -1, double.nan, double.infinity]) {
      final result = evaluate(
        currentLocation: targetLocation,
        accuracyMeters: accuracy,
        stampCandidate: candidate(),
        target: target,
      );

      expect(result.blockReason, CollectBlockReason.accuracyUnavailable);
    }
  });

  test('rejects accuracy above the fixed stamp radius', () {
    final result = evaluate(
      currentLocation: targetLocation,
      accuracyMeters: stampRadiusMeters + 1,
      stampCandidate: candidate(),
      target: target,
    );

    expect(result.blockReason, CollectBlockReason.accuracyInsufficient);
  });

  test('requires an uncollected candidate', () {
    final missingCandidate = evaluate(
      currentLocation: targetLocation,
      target: target,
    );
    final collectedCandidate = evaluate(
      currentLocation: targetLocation,
      stampCandidate: candidate(isCollected: true),
      target: target,
    );

    expect(
      missingCandidate.blockReason,
      CollectBlockReason.candidateUnavailable,
    );
    expect(collectedCandidate.blockReason, CollectBlockReason.alreadyCollected);
  });

  test('requires a stamp target', () {
    final result = evaluate(
      currentLocation: targetLocation,
      stampCandidate: candidate(),
    );

    expect(result.blockReason, CollectBlockReason.targetUnavailable);
  });

  test('boolean helper mirrors detailed eligibility', () {
    final input = CollectEligibilityInput(
      currentLocation: targetLocation,
      accuracyMeters: stampRadiusMeters.toDouble(),
      candidate: candidate(),
      target: target,
    );

    expect(canCollectCandidate(input), isTrue);
  });
}
