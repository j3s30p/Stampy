import 'package:flutter_test/flutter_test.dart';
import 'package:stampy/core/geo/coordinates.dart';
import 'package:stampy/core/location/heading_degrees.dart';
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

  test('selection and location updates preserve a valid heading', () {
    final pin = MapPin(
      contentId: 'tour-1',
      title: '광화문',
      kind: MapPinKind.place,
      location: _coordinates(37.5760, 126.9769),
    );
    final snapshot = MapSnapshot(
      center: pin.location,
      currentLocation: _coordinates(37.579302, 126.976932),
      currentHeading: HeadingDegrees(45),
      pins: <MapPin>[pin],
      selectedContentId: null,
    );

    final selected = snapshot.withSelection(pin.contentId);
    final moved = selected.withCurrentLocation(
      _coordinates(37.580001, 126.977001),
    );

    expect(selected.currentHeading?.value, 45);
    expect(moved.currentHeading?.value, 45);
    expect(moved.selectedPin, same(pin));
  });

  test('focused selection selects and centers an existing pin', () {
    final first = MapPin(
      contentId: 'tour-1',
      title: '광화문',
      kind: MapPinKind.place,
      location: _coordinates(37.5760, 126.9769),
    );
    final second = MapPin(
      contentId: 'tour-2',
      title: '경복궁',
      kind: MapPinKind.place,
      location: _coordinates(37.5796, 126.9770),
    );
    final snapshot = MapSnapshot(
      center: first.location,
      currentLocation: _coordinates(37.5800, 126.9800),
      currentHeading: HeadingDegrees(20),
      pins: <MapPin>[first, second],
      selectedContentId: first.contentId,
    );

    final focused = snapshot.withFocusedSelection(second.contentId);

    expect(focused.center, same(second.location));
    expect(focused.selectedContentId, second.contentId);
    expect(focused.currentLocation, same(snapshot.currentLocation));
    expect(focused.currentHeading, same(snapshot.currentHeading));
    expect(focused.pins, orderedEquals(<MapPin>[first, second]));
  });

  test('focused selection clears a stale card when the pin is missing', () {
    final pin = MapPin(
      contentId: 'tour-1',
      title: '광화문',
      kind: MapPinKind.place,
      location: _coordinates(37.5760, 126.9769),
    );
    final snapshot = MapSnapshot(
      center: pin.location,
      currentLocation: null,
      pins: <MapPin>[pin],
      selectedContentId: pin.contentId,
    );

    final focused = snapshot.withFocusedSelection('missing');

    expect(focused.center, same(snapshot.center));
    expect(focused.selectedContentId, isNull);
    expect(focused.pins.single, same(pin));
  });

  test('heading can be updated only while current location exists', () {
    final location = _coordinates(37.579302, 126.976932);
    final snapshot = MapSnapshot(
      center: location,
      currentLocation: location,
      pins: const <MapPin>[],
      selectedContentId: null,
    );

    final headed = snapshot.withCurrentHeading(HeadingDegrees(359.9));
    final cleared = headed.withCurrentHeading(null);

    expect(headed.currentHeading?.value, 359.9);
    expect(cleared.currentHeading, isNull);
    expect(
      () => MapSnapshot(
        center: location,
        currentLocation: null,
        currentHeading: HeadingDegrees(10),
        pins: const <MapPin>[],
        selectedContentId: null,
      ),
      throwsArgumentError,
    );
  });

  test('clearing current location also clears heading', () {
    final location = _coordinates(37.579302, 126.976932);
    final snapshot = MapSnapshot(
      center: location,
      currentLocation: location,
      currentHeading: HeadingDegrees(90),
      pins: const <MapPin>[],
      selectedContentId: null,
    );

    final cleared = snapshot.withCurrentLocation(null);

    expect(cleared.currentLocation, isNull);
    expect(cleared.currentHeading, isNull);
  });

  test('collecting a pin preserves every other snapshot field', () {
    final center = _coordinates(37.5796, 126.9770);
    final currentLocation = _coordinates(37.5793, 126.9769);
    final selectedPin = MapPin(
      contentId: 'tour-1',
      title: '경복궁',
      kind: MapPinKind.place,
      location: center,
    );
    final otherPin = MapPin(
      contentId: 'tour-2',
      title: '북촌한옥마을',
      kind: MapPinKind.place,
      location: _coordinates(37.5826, 126.9837),
    );
    final snapshot = MapSnapshot(
      center: center,
      currentLocation: currentLocation,
      currentHeading: HeadingDegrees(123),
      pins: <MapPin>[selectedPin, otherPin],
      selectedContentId: selectedPin.contentId,
    );

    final updated = snapshot.withCollectedPin(selectedPin.contentId);

    expect(updated, isNot(same(snapshot)));
    expect(updated.center, same(center));
    expect(updated.currentLocation, same(currentLocation));
    expect(updated.currentHeading, same(snapshot.currentHeading));
    expect(updated.selectedContentId, selectedPin.contentId);
    expect(updated.selectedPin?.collected, isTrue);
    expect(snapshot.selectedPin?.collected, isFalse);
    expect(updated.pinByContentId(otherPin.contentId), same(otherPin));
  });

  test('collecting rejects a content id outside the snapshot', () {
    final snapshot = MapSnapshot(
      center: _coordinates(37.5796, 126.9770),
      currentLocation: null,
      pins: const <MapPin>[],
      selectedContentId: null,
    );

    expect(() => snapshot.withCollectedPin('missing'), throwsArgumentError);
  });

  test('collected content ids replace seed flags and preserve map state', () {
    final center = _coordinates(37.5796, 126.9770);
    final currentLocation = _coordinates(37.5793, 126.9769);
    final first = MapPin(
      contentId: 'tour-1',
      title: '경복궁',
      kind: MapPinKind.place,
      location: center,
      collected: true,
    );
    final second = MapPin(
      contentId: 'tour-2',
      title: '북촌한옥마을',
      kind: MapPinKind.place,
      location: _coordinates(37.5826, 126.9837),
    );
    final snapshot = MapSnapshot(
      center: center,
      currentLocation: currentLocation,
      currentHeading: HeadingDegrees(75),
      pins: <MapPin>[first, second],
      selectedContentId: second.contentId,
    );

    final updated = snapshot.withCollectedContentIds(<String>{
      second.contentId,
      'not-in-this-snapshot',
    });

    expect(updated.pinByContentId(first.contentId)?.collected, isFalse);
    expect(updated.pinByContentId(second.contentId)?.collected, isTrue);
    expect(updated.center, same(center));
    expect(updated.currentLocation, same(currentLocation));
    expect(updated.currentHeading, same(snapshot.currentHeading));
    expect(updated.selectedContentId, second.contentId);
    expect(snapshot.pinByContentId(first.contentId)?.collected, isTrue);
    expect(snapshot.pinByContentId(second.contentId)?.collected, isFalse);
  });
}
