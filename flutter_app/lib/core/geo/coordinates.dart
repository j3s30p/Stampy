final class Latitude {
  factory Latitude(double value) {
    if (!value.isFinite || value < -90 || value > 90) {
      throw RangeError.range(value, -90, 90, 'value', 'Invalid latitude');
    }

    return Latitude._(value);
  }

  const Latitude._(this.value);

  final double value;

  @override
  bool operator ==(Object other) =>
      identical(this, other) || other is Latitude && value == other.value;

  @override
  int get hashCode => value.hashCode;

  @override
  String toString() => 'Latitude($value)';
}

final class Longitude {
  factory Longitude(double value) {
    if (!value.isFinite || value < -180 || value > 180) {
      throw RangeError.range(value, -180, 180, 'value', 'Invalid longitude');
    }

    return Longitude._(value);
  }

  const Longitude._(this.value);

  final double value;

  @override
  bool operator ==(Object other) =>
      identical(this, other) || other is Longitude && value == other.value;

  @override
  int get hashCode => value.hashCode;

  @override
  String toString() => 'Longitude($value)';
}

final class Coordinates {
  const Coordinates({required this.latitude, required this.longitude});

  final Latitude latitude;
  final Longitude longitude;

  @override
  bool operator ==(Object other) =>
      identical(this, other) ||
      other is Coordinates &&
          latitude == other.latitude &&
          longitude == other.longitude;

  @override
  int get hashCode => Object.hash(latitude, longitude);

  @override
  String toString() =>
      'Coordinates(latitude: $latitude, longitude: $longitude)';
}
