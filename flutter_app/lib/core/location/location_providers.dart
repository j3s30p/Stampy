import 'package:flutter_riverpod/flutter_riverpod.dart';

import 'geolocator_location_repository.dart';
import 'heading_degrees.dart';
import 'heading_repository.dart';
import 'location_repository.dart';
import 'location_state.dart';
import 'platform_heading_repository.dart';

final headingRepositoryProvider = Provider<HeadingRepository>(
  (ref) => PlatformHeadingRepository(),
);

final currentHeadingProvider = StreamProvider.autoDispose<HeadingDegrees?>(
  (ref) => ref.watch(headingRepositoryProvider).watchHeading(),
);

final locationRepositoryProvider = Provider<LocationRepository>(
  (ref) => GeolocatorLocationRepository(),
);

final currentLocationProvider = FutureProvider.autoDispose<LocationState>(
  (ref) => ref.watch(locationRepositoryProvider).getCurrentLocation(),
);
