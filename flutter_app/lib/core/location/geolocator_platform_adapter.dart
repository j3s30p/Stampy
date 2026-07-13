import 'package:geolocator/geolocator.dart';

import 'location_platform_adapter.dart';

final class GeolocatorPlatformAdapter implements LocationPlatformAdapter {
  const GeolocatorPlatformAdapter({
    this.positionTimeout = const Duration(seconds: 15),
  });

  final Duration positionTimeout;

  @override
  Future<LocationPlatformPermission> checkPermission() async =>
      _mapPermission(await Geolocator.checkPermission());

  @override
  Future<RawLocationPosition> getCurrentPosition() async {
    try {
      final position = await Geolocator.getCurrentPosition(
        locationSettings: LocationSettings(
          accuracy: LocationAccuracy.high,
          timeLimit: positionTimeout,
        ),
      );

      return RawLocationPosition(
        latitude: position.latitude,
        longitude: position.longitude,
        accuracyMeters: position.accuracy,
        timestamp: position.timestamp,
      );
    } on LocationServiceDisabledException {
      throw const LocationPlatformServiceDisabledException();
    } on PermissionDeniedException {
      throw const LocationPlatformPermissionDeniedException();
    }
  }

  @override
  Future<bool> isLocationServiceEnabled() =>
      Geolocator.isLocationServiceEnabled();

  @override
  Future<LocationPlatformPermission> requestPermission() async =>
      _mapPermission(await Geolocator.requestPermission());
}

LocationPlatformPermission _mapPermission(LocationPermission permission) =>
    switch (permission) {
      LocationPermission.denied => LocationPlatformPermission.denied,
      LocationPermission.deniedForever =>
        LocationPlatformPermission.deniedForever,
      LocationPermission.whileInUse => LocationPlatformPermission.whileInUse,
      LocationPermission.always => LocationPlatformPermission.always,
      LocationPermission.unableToDetermine =>
        LocationPlatformPermission.unableToDetermine,
    };
