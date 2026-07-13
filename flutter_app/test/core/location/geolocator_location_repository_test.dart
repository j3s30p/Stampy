import 'package:flutter_test/flutter_test.dart';
import 'package:stampy/core/location/geolocator_location_repository.dart';
import 'package:stampy/core/location/location_platform_adapter.dart';
import 'package:stampy/core/location/location_state.dart';

void main() {
  group('GeolocatorLocationRepository', () {
    test('returns serviceDisabled before inspecting permission', () async {
      final adapter = _TestLocationPlatformAdapter(serviceEnabled: false);
      final repository = GeolocatorLocationRepository(platformAdapter: adapter);

      expect(
        await repository.getCurrentLocation(),
        const LocationState.serviceDisabled(),
      );
      expect(adapter.checkPermissionCalls, 0);
      expect(adapter.requestPermissionCalls, 0);
      expect(adapter.getCurrentPositionCalls, 0);
    });

    test('requests permission once when initially denied', () async {
      final adapter = _TestLocationPlatformAdapter(
        checkedPermission: LocationPlatformPermission.denied,
        requestedPermission: LocationPlatformPermission.whileInUse,
      );
      final repository = GeolocatorLocationRepository(platformAdapter: adapter);

      final state = await repository.getCurrentLocation();

      expect(state.status, LocationStatus.available);
      expect(adapter.checkPermissionCalls, 1);
      expect(adapter.requestPermissionCalls, 1);
      expect(adapter.getCurrentPositionCalls, 1);
    });

    test('returns permissionDenied when request remains denied', () async {
      final adapter = _TestLocationPlatformAdapter(
        checkedPermission: LocationPlatformPermission.denied,
        requestedPermission: LocationPlatformPermission.denied,
      );
      final repository = GeolocatorLocationRepository(platformAdapter: adapter);

      expect(
        await repository.getCurrentLocation(),
        const LocationState.permissionDenied(),
      );
      expect(adapter.requestPermissionCalls, 1);
      expect(adapter.getCurrentPositionCalls, 0);
    });

    test('does not request permission when denied forever', () async {
      final adapter = _TestLocationPlatformAdapter(
        checkedPermission: LocationPlatformPermission.deniedForever,
      );
      final repository = GeolocatorLocationRepository(platformAdapter: adapter);

      expect(
        await repository.getCurrentLocation(),
        const LocationState.permissionDeniedForever(),
      );
      expect(adapter.requestPermissionCalls, 0);
      expect(adapter.getCurrentPositionCalls, 0);
    });

    test('maps an indeterminate permission to unavailable', () async {
      final adapter = _TestLocationPlatformAdapter(
        checkedPermission: LocationPlatformPermission.unableToDetermine,
      );
      final repository = GeolocatorLocationRepository(platformAdapter: adapter);

      expect(
        await repository.getCurrentLocation(),
        const LocationState.unavailable(),
      );
      expect(adapter.requestPermissionCalls, 0);
      expect(adapter.getCurrentPositionCalls, 0);
    });

    test('accepts existing while-in-use and always permissions', () async {
      for (final permission in <LocationPlatformPermission>[
        LocationPlatformPermission.whileInUse,
        LocationPlatformPermission.always,
      ]) {
        final adapter = _TestLocationPlatformAdapter(
          checkedPermission: permission,
        );
        final repository = GeolocatorLocationRepository(
          platformAdapter: adapter,
        );

        expect(
          (await repository.getCurrentLocation()).status,
          LocationStatus.available,
        );
        expect(adapter.requestPermissionCalls, 0);
        expect(adapter.getCurrentPositionCalls, 1);
      }
    });

    test('converts raw values once without swapping coordinates', () async {
      final timestamp = DateTime.utc(2026, 7, 13, 2, 40, 12);
      final adapter = _TestLocationPlatformAdapter(
        position: RawLocationPosition(
          latitude: 37.579617,
          longitude: 126.977041,
          accuracyMeters: 8.75,
          timestamp: timestamp,
        ),
      );
      final repository = GeolocatorLocationRepository(platformAdapter: adapter);

      final state = await repository.getCurrentLocation();
      final fix = state.fix!;

      expect(fix.coordinates.latitude.value, 37.579617);
      expect(fix.coordinates.longitude.value, 126.977041);
      expect(fix.accuracyMeters, 8.75);
      expect(fix.timestamp, same(timestamp));
    });

    test('maps invalid raw position values to unavailable', () async {
      final timestamp = DateTime.utc(2026, 7, 13);
      final positions = <RawLocationPosition>[
        RawLocationPosition(
          latitude: 90.01,
          longitude: 126.977041,
          accuracyMeters: 5,
          timestamp: timestamp,
        ),
        RawLocationPosition(
          latitude: 37.579617,
          longitude: 180.01,
          accuracyMeters: 5,
          timestamp: timestamp,
        ),
        RawLocationPosition(
          latitude: 37.579617,
          longitude: 126.977041,
          accuracyMeters: -1,
          timestamp: timestamp,
        ),
        RawLocationPosition(
          latitude: double.nan,
          longitude: 126.977041,
          accuracyMeters: 5,
          timestamp: timestamp,
        ),
      ];

      for (final position in positions) {
        final repository = GeolocatorLocationRepository(
          platformAdapter: _TestLocationPlatformAdapter(position: position),
        );

        expect(
          await repository.getCurrentLocation(),
          const LocationState.unavailable(),
        );
      }
    });

    test('maps platform service failure after preflight check', () async {
      final adapter = _TestLocationPlatformAdapter(
        positionError: const LocationPlatformServiceDisabledException(),
      );
      final repository = GeolocatorLocationRepository(platformAdapter: adapter);

      expect(
        await repository.getCurrentLocation(),
        const LocationState.serviceDisabled(),
      );
    });

    test('maps platform permission failures after preflight check', () async {
      for (final permanently in <bool>[false, true]) {
        final adapter = _TestLocationPlatformAdapter(
          positionError: LocationPlatformPermissionDeniedException(
            permanently: permanently,
          ),
        );
        final repository = GeolocatorLocationRepository(
          platformAdapter: adapter,
        );

        expect(
          await repository.getCurrentLocation(),
          permanently
              ? const LocationState.permissionDeniedForever()
              : const LocationState.permissionDenied(),
        );
      }
    });

    test('maps unexpected plugin failures to unavailable', () async {
      final adapters = <_TestLocationPlatformAdapter>[
        _TestLocationPlatformAdapter(serviceError: StateError('service')),
        _TestLocationPlatformAdapter(permissionError: StateError('check')),
        _TestLocationPlatformAdapter(
          checkedPermission: LocationPlatformPermission.denied,
          requestError: StateError('request'),
        ),
        _TestLocationPlatformAdapter(positionError: StateError('position')),
      ];

      for (final adapter in adapters) {
        final repository = GeolocatorLocationRepository(
          platformAdapter: adapter,
        );

        expect(
          await repository.getCurrentLocation(),
          const LocationState.unavailable(),
        );
      }
    });
  });
}

final class _TestLocationPlatformAdapter implements LocationPlatformAdapter {
  _TestLocationPlatformAdapter({
    this.serviceEnabled = true,
    this.checkedPermission = LocationPlatformPermission.whileInUse,
    this.requestedPermission = LocationPlatformPermission.whileInUse,
    RawLocationPosition? position,
    this.serviceError,
    this.permissionError,
    this.requestError,
    this.positionError,
  }) : position =
           position ??
           RawLocationPosition(
             latitude: 37.579617,
             longitude: 126.977041,
             accuracyMeters: 5,
             timestamp: DateTime.utc(2026, 7, 13),
           );

  final bool serviceEnabled;
  final LocationPlatformPermission checkedPermission;
  final LocationPlatformPermission requestedPermission;
  final RawLocationPosition position;
  final Object? serviceError;
  final Object? permissionError;
  final Object? requestError;
  final Object? positionError;

  int checkPermissionCalls = 0;
  int requestPermissionCalls = 0;
  int getCurrentPositionCalls = 0;

  @override
  Future<LocationPlatformPermission> checkPermission() async {
    checkPermissionCalls += 1;
    if (permissionError case final error?) {
      throw error;
    }
    return checkedPermission;
  }

  @override
  Future<RawLocationPosition> getCurrentPosition() async {
    getCurrentPositionCalls += 1;
    if (positionError case final error?) {
      throw error;
    }
    return position;
  }

  @override
  Future<bool> isLocationServiceEnabled() async {
    if (serviceError case final error?) {
      throw error;
    }
    return serviceEnabled;
  }

  @override
  Future<LocationPlatformPermission> requestPermission() async {
    requestPermissionCalls += 1;
    if (requestError case final error?) {
      throw error;
    }
    return requestedPermission;
  }
}
