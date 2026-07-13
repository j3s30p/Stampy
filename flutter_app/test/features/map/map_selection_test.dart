import 'package:flutter_test/flutter_test.dart';
import 'package:stampy/core/geo/coordinates.dart';
import 'package:stampy/features/map/domain/map_models.dart';
import 'package:stampy/features/map/domain/map_selection.dart';

void main() {
  test('applies the latest request to a loaded map snapshot', () {
    final first = _pin('tour-1', 37.5760, 126.9769);
    final second = _pin('tour-2', 37.5796, 126.9770);
    final snapshot = MapSnapshot(
      center: first.location,
      currentLocation: null,
      pins: <MapPin>[first, second],
      selectedContentId: first.contentId,
    );

    final applied = applyMapSelectionRequest(
      snapshot,
      MapSelectionRequest(contentId: second.contentId, revision: 3),
    );

    expect(applied.selectedContentId, second.contentId);
    expect(applied.center, same(second.location));
  });

  test('clears a previous selection when the requested pin is absent', () {
    final pin = _pin('tour-1', 37.5760, 126.9769);
    final snapshot = MapSnapshot(
      center: pin.location,
      currentLocation: null,
      pins: <MapPin>[pin],
      selectedContentId: pin.contentId,
    );

    final applied = applyMapSelectionRequest(
      snapshot,
      MapSelectionRequest(contentId: 'missing', revision: 4),
    );

    expect(applied.selectedContentId, isNull);
    expect(applied.center, same(snapshot.center));
  });

  test('keeps a preloaded snapshot unchanged without a request', () {
    final pin = _pin('tour-1', 37.5760, 126.9769);
    final snapshot = MapSnapshot(
      center: pin.location,
      currentLocation: null,
      pins: <MapPin>[pin],
      selectedContentId: null,
    );

    expect(applyMapSelectionRequest(snapshot, null), same(snapshot));
  });
}

MapPin _pin(String contentId, double latitude, double longitude) => MapPin(
  contentId: contentId,
  title: contentId,
  kind: MapPinKind.place,
  location: Coordinates(
    latitude: Latitude(latitude),
    longitude: Longitude(longitude),
  ),
);
