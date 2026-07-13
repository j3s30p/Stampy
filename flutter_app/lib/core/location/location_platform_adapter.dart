enum LocationPlatformPermission {
  denied,
  deniedForever,
  whileInUse,
  always,
  unableToDetermine,
}

final class RawLocationPosition {
  const RawLocationPosition({
    required this.latitude,
    required this.longitude,
    required this.accuracyMeters,
    required this.timestamp,
  });

  final double latitude;
  final double longitude;
  final double accuracyMeters;
  final DateTime timestamp;
}

abstract interface class LocationPlatformAdapter {
  Future<bool> isLocationServiceEnabled();

  Future<LocationPlatformPermission> checkPermission();

  Future<LocationPlatformPermission> requestPermission();

  Future<RawLocationPosition> getCurrentPosition();
}

sealed class LocationPlatformException implements Exception {
  const LocationPlatformException();
}

final class LocationPlatformServiceDisabledException
    extends LocationPlatformException {
  const LocationPlatformServiceDisabledException();
}

final class LocationPlatformPermissionDeniedException
    extends LocationPlatformException {
  const LocationPlatformPermissionDeniedException({this.permanently = false});

  final bool permanently;
}
