import 'location_state.dart';

abstract interface class LocationRepository {
  Future<LocationState> getCurrentLocation();
}
