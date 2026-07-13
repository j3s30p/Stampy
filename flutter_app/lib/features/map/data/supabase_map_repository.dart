import 'package:stampy/core/geo/coordinates.dart';
import 'package:supabase_flutter/supabase_flutter.dart';

import '../domain/map_models.dart';
import '../domain/map_repository.dart';

final class SupabaseMapRepository implements MapRepository {
  const SupabaseMapRepository(SupabaseClient client) : _client = client;

  final SupabaseClient _client;

  @override
  Future<MapSnapshot> loadSnapshot() async {
    final response = await _client.rpc('list_stamp_spots');
    final rows = _rows(response);
    final pins = rows.map(_pinFromRow).toList(growable: false);

    return MapSnapshot(
      center: pins.isEmpty ? _fallbackCenter() : pins.first.location,
      currentLocation: null,
      pins: pins,
      selectedContentId: null,
    );
  }
}

List<Map<String, dynamic>> _rows(Object? response) {
  if (response is! List<dynamic>) {
    throw const FormatException('Invalid list_stamp_spots response.');
  }

  return response
      .map((row) {
        if (row is! Map<String, dynamic>) {
          throw const FormatException('Invalid list_stamp_spots row.');
        }
        return row;
      })
      .toList(growable: false);
}

MapPin _pinFromRow(Map<String, dynamic> row) {
  final kind = switch (_requiredString(row, 'kind')) {
    'spot' => MapPinKind.place,
    'event' => MapPinKind.event,
    _ => throw const FormatException('Invalid stamp spot kind.'),
  };

  try {
    return MapPin(
      contentId: _requiredString(row, 'content_id'),
      title: _requiredString(row, 'title'),
      kind: kind,
      location: Coordinates(
        latitude: Latitude(_requiredNumber(row, 'latitude')),
        longitude: Longitude(_requiredNumber(row, 'longitude')),
      ),
    );
  } on ArgumentError {
    throw const FormatException('Invalid stamp spot fields.');
  }
}

String _requiredString(Map<String, dynamic> row, String key) {
  final value = row[key];
  if (value is! String || value.trim().isEmpty) {
    throw FormatException('Invalid stamp spot $key.');
  }
  return value;
}

double _requiredNumber(Map<String, dynamic> row, String key) {
  final value = row[key];
  if (value is! num) {
    throw FormatException('Invalid stamp spot $key.');
  }
  return value.toDouble();
}

Coordinates _fallbackCenter() => Coordinates(
  latitude: Latitude(37.579617),
  longitude: Longitude(126.977041),
);
