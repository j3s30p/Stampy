import 'package:flutter_riverpod/flutter_riverpod.dart';

import 'geolocator_location_repository.dart';
import 'location_repository.dart';
import 'location_state.dart';

final locationRepositoryProvider = Provider<LocationRepository>(
  (ref) => GeolocatorLocationRepository(),
);

final currentLocationProvider = FutureProvider.autoDispose<LocationState>(
  (ref) => ref.watch(locationRepositoryProvider).getCurrentLocation(),
);
