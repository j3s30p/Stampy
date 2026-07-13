import 'package:stampy/core/location/location_state.dart';

import 'map_models.dart';

enum MapCollectBlockReason {
  notConfigured,
  locationUnavailable,
  accuracyUnavailable,
  accuracyInsufficient,
  alreadyCollected,
  outOfRange,
  rejected,
}

final class MapCollectAvailability {
  factory MapCollectAvailability.eligible({
    required double distanceMeters,
    required String statusLabel,
  }) => MapCollectAvailability._(
    canCollect: true,
    distanceMeters: _validEligibleDistance(distanceMeters),
    blockReason: null,
    statusLabel: _nonEmpty(statusLabel, 'statusLabel'),
  );

  factory MapCollectAvailability.blocked({
    required MapCollectBlockReason reason,
    required String statusLabel,
    double? distanceMeters,
  }) => MapCollectAvailability._(
    canCollect: false,
    distanceMeters: distanceMeters == null
        ? null
        : _validDistance(distanceMeters),
    blockReason: reason,
    statusLabel: _nonEmpty(statusLabel, 'statusLabel'),
  );

  const MapCollectAvailability._({
    required this.canCollect,
    required this.distanceMeters,
    required this.blockReason,
    required this.statusLabel,
  });

  final bool canCollect;
  final double? distanceMeters;
  final MapCollectBlockReason? blockReason;
  final String statusLabel;
}

sealed class MapCollectResult {
  const MapCollectResult();
}

final class MapCollectSucceeded extends MapCollectResult {
  MapCollectSucceeded({required double distanceMeters})
    : distanceMeters = _validEligibleDistance(distanceMeters);

  final double distanceMeters;
}

final class MapCollectBlocked extends MapCollectResult {
  MapCollectBlocked(this.availability) {
    if (availability.canCollect) {
      throw ArgumentError.value(
        availability,
        'availability',
        'must describe a blocked collection attempt',
      );
    }
  }

  final MapCollectAvailability availability;
}

final class MapCollectFailed extends MapCollectResult {
  MapCollectFailed(String message) : message = _nonEmpty(message, 'message');

  final String message;
}

typedef MapCollectAvailabilityResolver =
    MapCollectAvailability Function(MapPin pin, LocationState locationState);

/// Runs at the app composition boundary.
///
/// Implementations must request a fresh location fix before deciding whether
/// to write a collection result; the location used by the resolver is display
/// state and must not be treated as final verification.
typedef MapCollectRequest = Future<MapCollectResult> Function(MapPin pin);
typedef MapCollectSuccessCallback = void Function(MapPin collectedPin);

double _validDistance(double value) {
  if (!value.isFinite || value < 0) {
    throw RangeError.value(
      value,
      'distanceMeters',
      'must be finite and non-negative',
    );
  }

  return value;
}

double _validEligibleDistance(double value) {
  final distance = _validDistance(value);
  if (distance > stampVerificationRadiusMeters.toDouble()) {
    throw RangeError.range(
      distance,
      0,
      stampVerificationRadiusMeters,
      'distanceMeters',
      'an eligible collection must be inside the fixed radius',
    );
  }

  return distance;
}

String _nonEmpty(String value, String name) {
  final trimmed = value.trim();
  if (trimmed.isEmpty) {
    throw ArgumentError.value(value, name, 'must not be empty');
  }

  return trimmed;
}
