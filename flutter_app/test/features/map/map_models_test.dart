import 'package:flutter_test/flutter_test.dart';
import 'package:stampy/core/geo/coordinates.dart';
import 'package:stampy/features/map/domain/map_models.dart';

Coordinates _coordinates(double latitude, double longitude) =>
    Coordinates(latitude: Latitude(latitude), longitude: Longitude(longitude));

void main() {
  test(
    'withCurrentLocation recenters the snapshot without changing map content',
    () {
      final pin = MapPin(
        contentId: 'tour-1',
        title: '광화문',
        kind: MapPinKind.place,
        location: _coordinates(37.5760, 126.9769),
      );
      final snapshot = MapSnapshot(
        center: _coordinates(37.5796, 126.9770),
        currentLocation: null,
        pins: <MapPin>[pin],
        selectedContentId: pin.contentId,
      );
      final currentLocation = _coordinates(37.579302, 126.976932);

      final updated = snapshot.withCurrentLocation(currentLocation);

      expect(updated.center, currentLocation);
      expect(updated.currentLocation, currentLocation);
      expect(updated.pins, hasLength(1));
      expect(updated.pins.single, same(pin));
      expect(updated.selectedContentId, pin.contentId);
      expect(updated.selectedPin, same(pin));
    },
  );

  test(
    'withCurrentLocation clears only the location marker when given null',
    () {
      final center = _coordinates(37.579302, 126.976932);
      final snapshot = MapSnapshot(
        center: center,
        currentLocation: center,
        pins: const <MapPin>[],
        selectedContentId: null,
      );

      final updated = snapshot.withCurrentLocation(null);

      expect(updated.center, center);
      expect(updated.currentLocation, isNull);
    },
  );
}
