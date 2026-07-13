import 'package:stampy/core/geo/coordinates.dart';

enum LocationStatus {
  loading,
  available,
  serviceDisabled,
  permissionDenied,
  permissionDeniedForever,
  unavailable,
}

final class LocationFix {
  factory LocationFix({
    required Coordinates coordinates,
    required double accuracyMeters,
    required DateTime timestamp,
  }) {
    if (!accuracyMeters.isFinite || accuracyMeters < 0) {
      throw RangeError.value(
        accuracyMeters,
        'accuracyMeters',
        'Location accuracy must be a finite, non-negative value',
      );
    }

    return LocationFix._(
      coordinates: coordinates,
      accuracyMeters: accuracyMeters,
      timestamp: timestamp,
    );
  }

  const LocationFix._({
    required this.coordinates,
    required this.accuracyMeters,
    required this.timestamp,
  });

  final Coordinates coordinates;
  final double accuracyMeters;
  final DateTime timestamp;

  @override
  bool operator ==(Object other) =>
      identical(this, other) ||
      other is LocationFix &&
          coordinates == other.coordinates &&
          accuracyMeters == other.accuracyMeters &&
          timestamp == other.timestamp;

  @override
  int get hashCode => Object.hash(coordinates, accuracyMeters, timestamp);

  @override
  String toString() =>
      'LocationFix(coordinates: $coordinates, '
      'accuracyMeters: $accuracyMeters, timestamp: $timestamp)';
}

final class LocationState {
  const LocationState.loading()
    : this._(status: LocationStatus.loading, fix: null);

  const LocationState.available(LocationFix fix)
    : this._(status: LocationStatus.available, fix: fix);

  const LocationState.serviceDisabled()
    : this._(status: LocationStatus.serviceDisabled, fix: null);

  const LocationState.permissionDenied()
    : this._(status: LocationStatus.permissionDenied, fix: null);

  const LocationState.permissionDeniedForever()
    : this._(status: LocationStatus.permissionDeniedForever, fix: null);

  const LocationState.unavailable()
    : this._(status: LocationStatus.unavailable, fix: null);

  const LocationState._({required this.status, required this.fix});

  final LocationStatus status;
  final LocationFix? fix;

  bool get isAvailable => status == LocationStatus.available;

  @override
  bool operator ==(Object other) =>
      identical(this, other) ||
      other is LocationState && status == other.status && fix == other.fix;

  @override
  int get hashCode => Object.hash(status, fix);

  @override
  String toString() => 'LocationState(status: $status, fix: $fix)';
}
