import 'package:stampy/core/geo/coordinates.dart';

import 'geolocator_platform_adapter.dart';
import 'location_platform_adapter.dart';
import 'location_repository.dart';
import 'location_state.dart';

final class GeolocatorLocationRepository implements LocationRepository {
  GeolocatorLocationRepository({LocationPlatformAdapter? platformAdapter})
    : _platformAdapter = platformAdapter ?? const GeolocatorPlatformAdapter();

  final LocationPlatformAdapter _platformAdapter;

  @override
  Future<LocationState> getCurrentLocation() async {
    try {
      if (!await _platformAdapter.isLocationServiceEnabled()) {
        return const LocationState.serviceDisabled();
      }

      var permission = await _platformAdapter.checkPermission();
      if (permission == LocationPlatformPermission.denied) {
        permission = await _platformAdapter.requestPermission();
      }

      final permissionFailure = _stateForPermissionFailure(permission);
      if (permissionFailure != null) {
        return permissionFailure;
      }

      final rawPosition = await _platformAdapter.getCurrentPosition();
      final fix = LocationFix(
        coordinates: Coordinates(
          latitude: Latitude(rawPosition.latitude),
          longitude: Longitude(rawPosition.longitude),
        ),
        accuracyMeters: rawPosition.accuracyMeters,
        timestamp: rawPosition.timestamp,
      );

      return LocationState.available(fix);
    } on LocationPlatformServiceDisabledException {
      return const LocationState.serviceDisabled();
    } on LocationPlatformPermissionDeniedException catch (error) {
      return error.permanently
          ? const LocationState.permissionDeniedForever()
          : const LocationState.permissionDenied();
    } on Object {
      return const LocationState.unavailable();
    }
  }
}

LocationState? _stateForPermissionFailure(
  LocationPlatformPermission permission,
) => switch (permission) {
  LocationPlatformPermission.denied => const LocationState.permissionDenied(),
  LocationPlatformPermission.deniedForever =>
    const LocationState.permissionDeniedForever(),
  LocationPlatformPermission.unableToDetermine =>
    const LocationState.unavailable(),
  LocationPlatformPermission.whileInUse ||
  LocationPlatformPermission.always => null,
};
