import '../../../core/geo/geo.dart';

enum StampCandidateKind { spot, event }

final class StampCandidate {
  const StampCandidate({
    required this.kind,
    required this.contentId,
    required this.isCollected,
  });

  final StampCandidateKind kind;
  final String contentId;
  final bool isCollected;
}

final class StampTarget {
  const StampTarget({required this.location});

  final Coordinates location;
}

final class CollectEligibilityInput {
  const CollectEligibilityInput({
    required this.currentLocation,
    required this.accuracyMeters,
    required this.candidate,
    required this.target,
  });

  final Coordinates? currentLocation;
  final double? accuracyMeters;
  final StampCandidate? candidate;
  final StampTarget? target;
}

enum CollectBlockReason {
  locationUnavailable,
  accuracyUnavailable,
  accuracyInsufficient,
  candidateUnavailable,
  alreadyCollected,
  targetUnavailable,
  outOfRange,
}

final class CollectEligibility {
  const CollectEligibility.eligible() : canCollect = true, blockReason = null;

  const CollectEligibility.blocked(CollectBlockReason reason)
    : canCollect = false,
      blockReason = reason;

  final bool canCollect;
  final CollectBlockReason? blockReason;
}

CollectEligibility evaluateCollectEligibility(CollectEligibilityInput input) {
  final currentLocation = input.currentLocation;
  if (currentLocation == null) {
    return const CollectEligibility.blocked(
      CollectBlockReason.locationUnavailable,
    );
  }

  final accuracyMeters = input.accuracyMeters;
  if (accuracyMeters == null ||
      !accuracyMeters.isFinite ||
      accuracyMeters < 0) {
    return const CollectEligibility.blocked(
      CollectBlockReason.accuracyUnavailable,
    );
  }

  if (accuracyMeters > stampRadiusMeters) {
    return const CollectEligibility.blocked(
      CollectBlockReason.accuracyInsufficient,
    );
  }

  final candidate = input.candidate;
  if (candidate == null) {
    return const CollectEligibility.blocked(
      CollectBlockReason.candidateUnavailable,
    );
  }

  if (candidate.isCollected) {
    return const CollectEligibility.blocked(
      CollectBlockReason.alreadyCollected,
    );
  }

  final target = input.target;
  if (target == null) {
    return const CollectEligibility.blocked(
      CollectBlockReason.targetUnavailable,
    );
  }

  if (distanceMetersBetween(currentLocation, target.location) >
      stampRadiusMeters) {
    return const CollectEligibility.blocked(CollectBlockReason.outOfRange);
  }

  return const CollectEligibility.eligible();
}

bool canCollectCandidate(CollectEligibilityInput input) =>
    evaluateCollectEligibility(input).canCollect;
