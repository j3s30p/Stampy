import 'package:stampy/core/geo/coordinates.dart';
import 'package:stampy/core/geo/geo_constants.dart';
import 'package:stampy/core/location/heading_degrees.dart';

const int stampVerificationRadiusMeters = stampRadiusMeters;

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

  MapPin withCollected(bool value) => MapPin(
    contentId: contentId,
    title: title,
    kind: kind,
    location: location,
    collected: value,
  );
}

final class MapSnapshot {
  MapSnapshot({
    required this.center,
    required this.currentLocation,
    required List<MapPin> pins,
    required this.selectedContentId,
    this.currentHeading,
  }) : pins = List<MapPin>.unmodifiable(pins) {
    if (currentLocation == null && currentHeading != null) {
      throw ArgumentError.value(
        currentHeading,
        'currentHeading',
        'requires a current location',
      );
    }

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
  final HeadingDegrees? currentHeading;
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
    currentHeading: currentHeading,
    pins: pins,
    selectedContentId: contentId,
  );

  MapSnapshot withCurrentLocation(Coordinates? location) => MapSnapshot(
    center: location ?? center,
    currentLocation: location,
    currentHeading: location == null ? null : currentHeading,
    pins: pins,
    selectedContentId: selectedContentId,
  );

  MapSnapshot withCurrentHeading(HeadingDegrees? heading) => MapSnapshot(
    center: center,
    currentLocation: currentLocation,
    currentHeading: heading,
    pins: pins,
    selectedContentId: selectedContentId,
  );

  MapSnapshot withCollectedPin(String contentId) {
    if (pinByContentId(contentId) == null) {
      throw ArgumentError.value(
        contentId,
        'contentId',
        'must match a pin in this snapshot',
      );
    }

    return MapSnapshot(
      center: center,
      currentLocation: currentLocation,
      currentHeading: currentHeading,
      pins: <MapPin>[
        for (final pin in pins)
          if (pin.contentId == contentId) pin.withCollected(true) else pin,
      ],
      selectedContentId: selectedContentId,
    );
  }

  MapSnapshot withCollectedContentIds(Set<String> contentIds) => MapSnapshot(
    center: center,
    currentLocation: currentLocation,
    currentHeading: currentHeading,
    pins: <MapPin>[
      for (final pin in pins)
        if (pin.collected == contentIds.contains(pin.contentId))
          pin
        else
          pin.withCollected(contentIds.contains(pin.contentId)),
    ],
    selectedContentId: selectedContentId,
  );
}

String _nonEmpty(String value, String name) {
  final trimmed = value.trim();
  if (trimmed.isEmpty) {
    throw ArgumentError.value(value, name, 'must not be empty');
  }

  return trimmed;
}
