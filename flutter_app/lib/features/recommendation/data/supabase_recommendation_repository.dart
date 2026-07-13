import 'package:stampy/core/geo/coordinates.dart';
import 'package:supabase_flutter/supabase_flutter.dart';

import '../domain/recommendation_domain.dart';

final class SupabaseRecommendationRepository
    implements RecommendationRepository {
  const SupabaseRecommendationRepository(SupabaseClient client)
    : _client = client;

  final SupabaseClient _client;

  @override
  Future<Recommendation?> loadRecommendation(Coordinates currentLocation) =>
      _guard(() async {
        final response = await _client.rpc(
          'get_stamp_recommendation',
          params: <String, Object>{
            'p_latitude': currentLocation.latitude.value,
            'p_longitude': currentLocation.longitude.value,
          },
        );
        final rows = _rows(response);
        if (rows.isEmpty) {
          return null;
        }
        if (rows.length != 1) {
          throw const RecommendationRepositoryException(
            'The recommendation response was invalid.',
          );
        }
        return _recommendationFromRow(rows.single);
      });
}

Future<T> _guard<T>(Future<T> Function() action) async {
  try {
    return await action();
  } on RecommendationRepositoryException {
    rethrow;
  } on Object {
    throw const RecommendationRepositoryException(
      'The recommendation could not be loaded.',
    );
  }
}

List<Map<String, dynamic>> _rows(Object? response) {
  if (response is! List<dynamic>) {
    throw const RecommendationRepositoryException(
      'The recommendation response was invalid.',
    );
  }

  return response
      .map((row) {
        if (row is! Map<String, dynamic>) {
          throw const RecommendationRepositoryException(
            'The recommendation row was invalid.',
          );
        }
        return row;
      })
      .toList(growable: false);
}

Recommendation _recommendationFromRow(Map<String, dynamic> row) {
  final kind = switch (_requiredString(row, 'kind')) {
    'spot' => RecommendationContentKind.spot,
    'event' => RecommendationContentKind.event,
    _ => throw const RecommendationRepositoryException(
      'The recommendation kind was invalid.',
    ),
  };
  final reason = switch (_requiredString(row, 'reason')) {
    'nearby_uncollected' => RecommendationReason.nearbyUncollected,
    _ => throw const RecommendationRepositoryException(
      'The recommendation reason was invalid.',
    ),
  };

  try {
    return Recommendation(
      contentId: _requiredString(row, 'content_id'),
      title: _requiredString(row, 'title'),
      contentKind: kind,
      location: Coordinates(
        latitude: Latitude(_requiredNumber(row, 'latitude')),
        longitude: Longitude(_requiredNumber(row, 'longitude')),
      ),
      distanceMeters: _requiredNumber(row, 'distance_meters'),
      score: _requiredNumber(row, 'score'),
      reason: reason,
      generatedAt: _requiredTimestamp(row, 'generated_at'),
    );
  } on ArgumentError {
    throw const RecommendationRepositoryException(
      'The recommendation fields were invalid.',
    );
  }
}

String _requiredString(Map<String, dynamic> row, String key) {
  final value = row[key];
  if (value is! String || value.trim().isEmpty) {
    throw RecommendationRepositoryException(
      'The recommendation $key was invalid.',
    );
  }
  return value;
}

double _requiredNumber(Map<String, dynamic> row, String key) {
  final value = row[key];
  if (value is! num) {
    throw RecommendationRepositoryException(
      'The recommendation $key was invalid.',
    );
  }
  final normalized = value.toDouble();
  if (!normalized.isFinite) {
    throw RecommendationRepositoryException(
      'The recommendation $key was invalid.',
    );
  }
  return normalized;
}

DateTime _requiredTimestamp(Map<String, dynamic> row, String key) {
  final value = row[key];
  final parsed = value is String ? DateTime.tryParse(value) : null;
  if (parsed == null || !parsed.isUtc) {
    throw RecommendationRepositoryException(
      'The recommendation $key was invalid.',
    );
  }
  return parsed;
}
