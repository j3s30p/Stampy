import 'package:stampy/core/geo/coordinates.dart';
import 'package:stampy/core/location/location_state.dart';
import 'package:supabase_flutter/supabase_flutter.dart';

import '../domain/stamp_domain.dart';

final class SupabaseStampRepository implements StampRepository {
  const SupabaseStampRepository(SupabaseClient client) : _client = client;

  final SupabaseClient _client;

  @override
  Future<List<CollectedStamp>> loadCollected() => _guard(
    message: 'Collected stamps could not be loaded.',
    action: () async {
      final response = await _client.rpc('list_collected_stamps');
      return List<CollectedStamp>.unmodifiable(
        _rows(response).map(_stampFromRow),
      );
    },
  );

  @override
  Future<int> loadCollectedSigunguCount() => _guard(
    message: 'The collected district count could not be loaded.',
    action: () async {
      final response = await _client.rpc('get_collected_sigungu_count');
      if (response is! int || response < 0) {
        throw const StampRepositoryException(
          'The collected district count response was invalid.',
        );
      }
      return response;
    },
  );

  @override
  Future<CollectStampResult> collect(CollectStampRequest request) => _guard(
    message: 'The stamp could not be collected.',
    action: () async {
      final response = await _client.rpc(
        'collect_stamp',
        params: <String, Object>{
          'p_content_id': request.contentId,
          'p_latitude': request.verificationFix.coordinates.latitude.value,
          'p_longitude': request.verificationFix.coordinates.longitude.value,
          'p_accuracy_meters': request.verificationFix.accuracyMeters,
          'p_verification_timestamp': request.verificationFix.timestamp
              .toUtc()
              .toIso8601String(),
        },
      );
      final rows = _rows(response);
      if (rows.length != 1) {
        throw const StampRepositoryException(
          'The collect response was invalid.',
        );
      }

      final row = rows.single;
      final stamp = _stampFromRow(row);
      return switch (_requiredString(row, 'result')) {
        'success' => CollectStampResult.success(stamp),
        'duplicate' => CollectStampResult.duplicate(stamp),
        _ => throw const StampRepositoryException(
          'The collect result was invalid.',
        ),
      };
    },
  );
}

Future<T> _guard<T>({
  required String message,
  required Future<T> Function() action,
}) async {
  try {
    return await action();
  } on StampRepositoryException {
    rethrow;
  } on Object {
    throw StampRepositoryException(message);
  }
}

List<Map<String, dynamic>> _rows(Object? response) {
  if (response is! List<dynamic>) {
    throw const StampRepositoryException('The stamp response was invalid.');
  }

  return response
      .map((row) {
        if (row is! Map<String, dynamic>) {
          throw const StampRepositoryException('The stamp row was invalid.');
        }
        return row;
      })
      .toList(growable: false);
}

CollectedStamp _stampFromRow(Map<String, dynamic> row) {
  final kind = switch (_requiredString(row, 'kind')) {
    'spot' => StampCandidateKind.spot,
    'event' => StampCandidateKind.event,
    _ => throw const StampRepositoryException('The stamp kind was invalid.'),
  };
  final accuracy = _requiredNumber(row, 'verification_accuracy_meters');
  if (accuracy < 0 || accuracy > 100) {
    throw const StampRepositoryException('The stamp accuracy was invalid.');
  }

  try {
    return CollectedStamp(
      contentId: _requiredString(row, 'content_id'),
      title: _requiredString(row, 'title'),
      kind: kind,
      verificationFix: LocationFix(
        coordinates: Coordinates(
          latitude: Latitude(_requiredNumber(row, 'verification_latitude')),
          longitude: Longitude(_requiredNumber(row, 'verification_longitude')),
        ),
        accuracyMeters: accuracy,
        timestamp: _requiredTimestamp(row, 'verification_timestamp'),
      ),
      collectedAt: _requiredTimestamp(row, 'collected_at'),
    );
  } on ArgumentError {
    throw const StampRepositoryException('The stamp fields were invalid.');
  }
}

String _requiredString(Map<String, dynamic> row, String key) {
  final value = row[key];
  if (value is! String || value.trim().isEmpty) {
    throw StampRepositoryException('The stamp $key was invalid.');
  }
  return value;
}

double _requiredNumber(Map<String, dynamic> row, String key) {
  final value = row[key];
  if (value is! num) {
    throw StampRepositoryException('The stamp $key was invalid.');
  }
  final normalized = value.toDouble();
  if (!normalized.isFinite) {
    throw StampRepositoryException('The stamp $key was invalid.');
  }
  return normalized;
}

DateTime _requiredTimestamp(Map<String, dynamic> row, String key) {
  final value = row[key];
  final parsed = value is String ? DateTime.tryParse(value) : null;
  if (parsed == null || !parsed.isUtc) {
    throw StampRepositoryException('The stamp $key was invalid.');
  }
  return parsed;
}
