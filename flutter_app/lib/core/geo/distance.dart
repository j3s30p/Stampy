import 'dart:math' as math;

import 'coordinates.dart';
import 'geo_constants.dart';

double distanceMetersBetween(Coordinates from, Coordinates to) {
  final latitudeDelta = _toRadians(to.latitude.value - from.latitude.value);
  final longitudeDelta = _toRadians(to.longitude.value - from.longitude.value);
  final fromLatitude = _toRadians(from.latitude.value);
  final toLatitude = _toRadians(to.latitude.value);

  final halfChordLength =
      math.sin(latitudeDelta / 2) * math.sin(latitudeDelta / 2) +
      math.cos(fromLatitude) *
          math.cos(toLatitude) *
          math.sin(longitudeDelta / 2) *
          math.sin(longitudeDelta / 2);
  final safeHalfChordLength = halfChordLength.clamp(0.0, 1.0).toDouble();
  final angularDistance =
      2 *
      math.atan2(
        math.sqrt(safeHalfChordLength),
        math.sqrt(1 - safeHalfChordLength),
      );

  return earthRadiusMeters * angularDistance;
}

double _toRadians(double degrees) => degrees * math.pi / 180;
