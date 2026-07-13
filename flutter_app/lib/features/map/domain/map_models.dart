import 'package:stampy/core/geo/coordinates.dart';

const int stampVerificationRadiusMeters = 100;

enum MapPinKind { place, event }

final class MapPin {
  MapPin({
    required String contentId,
    required String title,
    required this.kind,
    required this.location,
    this.collected = false,
  }) : contentId = _nonEmpty(contentId, 'contentId'),
       title = _nonEmpty(title, 'title');

  final String contentId;
  final String title;
  final MapPinKind kind;
  final Coordinates location;
  final bool collected;
}

final class MapSnapshot {
  MapSnapshot({
    required this.center,
    required this.currentLocation,
    required List<MapPin> pins,
    required this.selectedContentId,
  }) : pins = List<MapPin>.unmodifiable(pins) {
    final selectedId = selectedContentId;
    if (selectedId != null && pinByContentId(selectedId) == null) {
      throw ArgumentError.value(
        selectedId,
        'selectedContentId',
        'must match a pin in this snapshot',
      );
    }
  }

  final Coordinates center;
  final Coordinates? currentLocation;
  final List<MapPin> pins;
  final String? selectedContentId;

  MapPin? pinByContentId(String contentId) {
    for (final pin in pins) {
      if (pin.contentId == contentId) {
        return pin;
      }
    }

    return null;
  }

  MapPin? get selectedPin {
    final selectedId = selectedContentId;
    return selectedId == null ? null : pinByContentId(selectedId);
  }

  MapSnapshot withSelection(String? contentId) => MapSnapshot(
    center: center,
    currentLocation: currentLocation,
    pins: pins,
    selectedContentId: contentId,
  );
}

String _nonEmpty(String value, String name) {
  final trimmed = value.trim();
  if (trimmed.isEmpty) {
    throw ArgumentError.value(value, name, 'must not be empty');
  }

  return trimmed;
}
