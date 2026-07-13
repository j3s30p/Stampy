import 'location_repository.dart';
import 'location_state.dart';

final class FakeLocationRepository implements LocationRepository {
  factory FakeLocationRepository({required LocationState state}) =>
      FakeLocationRepository._(state);

  FakeLocationRepository._(this._state);

  LocationState _state;

  int requestCount = 0;

  void setState(LocationState state) {
    _state = state;
  }

  @override
  Future<LocationState> getCurrentLocation() async {
    requestCount += 1;
    return _state;
  }
}
