import 'dart:convert';

import 'package:flutter_test/flutter_test.dart';
import 'package:http/http.dart' as http;
import 'package:http/testing.dart';
import 'package:stampy/features/map/data/supabase_map_repository.dart';
import 'package:stampy/features/map/domain/map_models.dart';
import 'package:supabase_flutter/supabase_flutter.dart';

void main() {
  test('calls list_stamp_spots and maps scalar coordinates', () async {
    final client = _client((request) async {
      expect(request.method, 'POST');
      expect(
        request.url,
        Uri.parse('https://example.supabase.co/rest/v1/rpc/list_stamp_spots'),
      );
      expect(request.headers['authorization'], 'Bearer user-access-token');
      expect(request.headers['apikey'], 'publishable-key');

      return _jsonResponse(<Map<String, Object>>[
        <String, Object>{
          'content_id': '12',
          'title': '경복궁',
          'kind': 'spot',
          'latitude': 37.579617,
          'longitude': 126.977041,
        },
        <String, Object>{
          'content_id': '15',
          'title': '서울거리예술축제',
          'kind': 'event',
          'latitude': 37,
          'longitude': 127,
        },
      ], request);
    });
    addTearDown(client.dispose);

    final snapshot = await SupabaseMapRepository(client).loadSnapshot();

    expect(snapshot.pins, hasLength(2));
    expect(snapshot.selectedContentId, isNull);
    expect(snapshot.currentLocation, isNull);
    expect(snapshot.center, same(snapshot.pins.first.location));
    expect(snapshot.pins.first.contentId, '12');
    expect(snapshot.pins.first.title, '경복궁');
    expect(snapshot.pins.first.kind, MapPinKind.place);
    expect(snapshot.pins.first.location.latitude.value, 37.579617);
    expect(snapshot.pins.first.location.longitude.value, 126.977041);
    expect(snapshot.pins.last.kind, MapPinKind.event);
    expect(snapshot.pins.last.location.latitude.value, isA<double>());
    expect(snapshot.pins.last.location.longitude.value, isA<double>());
  });

  test('uses the existing map center for an empty catalog', () async {
    final client = _client((request) async => _jsonResponse(const [], request));
    addTearDown(client.dispose);

    final snapshot = await SupabaseMapRepository(client).loadSnapshot();

    expect(snapshot.pins, isEmpty);
    expect(snapshot.center.latitude.value, 37.579617);
    expect(snapshot.center.longitude.value, 126.977041);
  });

  final malformedRows = <String, Object>{
    'a non-list response': <String, Object>{'content_id': '12'},
    'an unknown kind': <Object>[
      <String, Object>{
        'content_id': '12',
        'title': '경복궁',
        'kind': 'unknown',
        'latitude': 37.579617,
        'longitude': 126.977041,
      },
    ],
    'a missing field': <Object>[
      <String, Object>{
        'content_id': '12',
        'kind': 'spot',
        'latitude': 37.579617,
        'longitude': 126.977041,
      },
    ],
    'an out-of-range coordinate': <Object>[
      <String, Object>{
        'content_id': '12',
        'title': '경복궁',
        'kind': 'spot',
        'latitude': 91,
        'longitude': 126.977041,
      },
    ],
  };

  for (final entry in malformedRows.entries) {
    test('rejects ${entry.key}', () async {
      final client = _client(
        (request) async => _jsonResponse(entry.value, request),
      );
      addTearDown(client.dispose);

      await expectLater(
        SupabaseMapRepository(client).loadSnapshot(),
        throwsA(isA<FormatException>()),
      );
    });
  }
}

SupabaseClient _client(
  Future<http.Response> Function(http.Request request) handler,
) => SupabaseClient(
  'https://example.supabase.co',
  'publishable-key',
  accessToken: () async => 'user-access-token',
  httpClient: MockClient(handler),
);

http.Response _jsonResponse(Object value, http.Request request) =>
    http.Response(
      jsonEncode(value),
      200,
      headers: const <String, String>{'content-type': 'application/json'},
      request: request,
    );
