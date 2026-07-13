import 'dart:convert';

import 'package:flutter_test/flutter_test.dart';
import 'package:http/http.dart' as http;
import 'package:http/testing.dart';
import 'package:stampy/core/geo/coordinates.dart';
import 'package:stampy/core/location/location_state.dart';
import 'package:stampy/features/stamp/data/supabase_stamp_repository.dart';
import 'package:stampy/features/stamp/domain/stamp_domain.dart';
import 'package:supabase_flutter/supabase_flutter.dart';

void main() {
  test(
    'lists collected stamps with authenticated scalar RPC mapping',
    () async {
      final client = _client((request) async {
        expect(request.method, 'POST');
        expect(
          request.url,
          Uri.parse(
            'https://example.supabase.co/rest/v1/rpc/list_collected_stamps',
          ),
        );
        expect(request.headers['authorization'], 'Bearer user-access-token');
        expect(request.headers['apikey'], 'publishable-key');

        return _jsonResponse(<Map<String, Object>>[
          _row(
            contentId: 'spot-12',
            title: '경복궁',
            kind: 'spot',
            latitude: 37.579617,
            longitude: 126.977041,
            accuracy: 6,
            verifiedAt: '2026-07-13T02:59:00Z',
            collectedAt: '2026-07-13T03:00:00Z',
          ),
          _row(
            contentId: 'event-15',
            title: '서울거리예술축제',
            kind: 'event',
            latitude: 37,
            longitude: 127,
            accuracy: 8.5,
            verifiedAt: '2026-07-13T04:00:00+00:00',
            collectedAt: '2026-07-13T04:01:00+00:00',
          ),
        ], request);
      });
      addTearDown(client.dispose);

      final stamps = await SupabaseStampRepository(client).loadCollected();

      expect(stamps, hasLength(2));
      expect(stamps.map((stamp) => stamp.contentId), ['spot-12', 'event-15']);
      expect(stamps.first.title, '경복궁');
      expect(stamps.first.kind, StampCandidateKind.spot);
      expect(
        stamps.first.verificationFix.coordinates.latitude.value,
        37.579617,
      );
      expect(
        stamps.first.verificationFix.coordinates.longitude.value,
        126.977041,
      );
      expect(stamps.first.verificationFix.accuracyMeters, 6.0);
      expect(
        stamps.first.verificationFix.timestamp,
        DateTime.utc(2026, 7, 13, 2, 59),
      );
      expect(stamps.first.collectedAt, DateTime.utc(2026, 7, 13, 3));
      expect(stamps.last.kind, StampCandidateKind.event);
      expect(stamps.last.verificationFix.accuracyMeters, 8.5);
      expect(() => stamps.clear(), throwsUnsupportedError);
    },
  );

  test(
    'collect sends exact RPC parameters and trusts server stamp fields',
    () async {
      final client = _client((request) async {
        expect(request.method, 'POST');
        expect(request.url.path, '/rest/v1/rpc/collect_stamp');
        expect(request.headers['authorization'], 'Bearer user-access-token');
        expect(jsonDecode(request.body), <String, Object>{
          'p_content_id': 'tour-126508',
          'p_latitude': 37.579617,
          'p_longitude': 126.977041,
          'p_accuracy_meters': 6.0,
          'p_verification_timestamp': '2026-07-13T02:59:00.000Z',
        });

        return _jsonResponse(<Map<String, Object>>[
          <String, Object>{
            ..._row(
              contentId: 'tour-126508',
              title: '서버 경복궁',
              kind: 'event',
              latitude: 37.579617,
              longitude: 126.977041,
              accuracy: 6,
              verifiedAt: '2026-07-13T02:59:00Z',
              collectedAt: '2026-07-13T03:00:00Z',
            ),
            'result': 'success',
          },
        ], request);
      });
      addTearDown(client.dispose);

      final result = await SupabaseStampRepository(client).collect(_request());

      expect(result, isA<CollectStampSuccess>());
      final stamp = (result as CollectStampSuccess).record;
      expect(stamp.title, '서버 경복궁');
      expect(stamp.kind, StampCandidateKind.event);
    },
  );

  test('maps the duplicate result to its existing server record', () async {
    final client = _client(
      (request) async => _jsonResponse(<Map<String, Object>>[
        <String, Object>{
          ..._row(
            contentId: 'tour-126508',
            title: '경복궁',
            kind: 'spot',
            latitude: 37.579617,
            longitude: 126.977041,
            accuracy: 6,
            verifiedAt: '2026-07-13T02:59:00Z',
            collectedAt: '2026-07-13T03:00:00Z',
          ),
          'result': 'duplicate',
        },
      ], request),
    );
    addTearDown(client.dispose);

    final result = await SupabaseStampRepository(client).collect(_request());

    expect(result, isA<CollectStampDuplicate>());
    expect((result as CollectStampDuplicate).existing.contentId, 'tour-126508');
  });

  final malformedListResponses = <String, Object>{
    'a non-list response': <String, Object>{'content_id': 'tour-126508'},
    'a non-map row': <Object>['invalid'],
    'an unknown kind': <Object>[
      _row(
        contentId: 'tour-126508',
        title: '경복궁',
        kind: 'unknown',
        latitude: 37.579617,
        longitude: 126.977041,
        accuracy: 6,
        verifiedAt: '2026-07-13T02:59:00Z',
        collectedAt: '2026-07-13T03:00:00Z',
      ),
    ],
    'a missing field': <Object>[
      <String, Object>{
        'content_id': 'tour-126508',
        'kind': 'spot',
        'verification_latitude': 37.579617,
        'verification_longitude': 126.977041,
        'verification_accuracy_meters': 6,
        'verification_timestamp': '2026-07-13T02:59:00Z',
        'collected_at': '2026-07-13T03:00:00Z',
      },
    ],
    'an out-of-range coordinate': <Object>[
      _row(
        contentId: 'tour-126508',
        title: '경복궁',
        kind: 'spot',
        latitude: 91,
        longitude: 126.977041,
        accuracy: 6,
        verifiedAt: '2026-07-13T02:59:00Z',
        collectedAt: '2026-07-13T03:00:00Z',
      ),
    ],
    'an invalid accuracy': <Object>[
      _row(
        contentId: 'tour-126508',
        title: '경복궁',
        kind: 'spot',
        latitude: 37.579617,
        longitude: 126.977041,
        accuracy: 101,
        verifiedAt: '2026-07-13T02:59:00Z',
        collectedAt: '2026-07-13T03:00:00Z',
      ),
    ],
    'a local timestamp without a zone': <Object>[
      _row(
        contentId: 'tour-126508',
        title: '경복궁',
        kind: 'spot',
        latitude: 37.579617,
        longitude: 126.977041,
        accuracy: 6,
        verifiedAt: '2026-07-13T02:59:00',
        collectedAt: '2026-07-13T03:00:00Z',
      ),
    ],
  };

  for (final entry in malformedListResponses.entries) {
    test('rejects ${entry.key}', () async {
      final client = _client(
        (request) async => _jsonResponse(entry.value, request),
      );
      addTearDown(client.dispose);

      await expectLater(
        SupabaseStampRepository(client).loadCollected(),
        throwsA(isA<StampRepositoryException>()),
      );
    });
  }

  for (final rowCount in <int>[0, 2]) {
    test('rejects a collect response with $rowCount rows', () async {
      final row = <String, Object>{
        ..._row(
          contentId: 'tour-126508',
          title: '경복궁',
          kind: 'spot',
          latitude: 37.579617,
          longitude: 126.977041,
          accuracy: 6,
          verifiedAt: '2026-07-13T02:59:00Z',
          collectedAt: '2026-07-13T03:00:00Z',
        ),
        'result': 'success',
      };
      final client = _client(
        (request) async => _jsonResponse(
          List<Map<String, Object>>.filled(rowCount, row),
          request,
        ),
      );
      addTearDown(client.dispose);

      await expectLater(
        SupabaseStampRepository(client).collect(_request()),
        throwsA(isA<StampRepositoryException>()),
      );
    });
  }

  test('rejects an unknown collect result', () async {
    final client = _client(
      (request) async => _jsonResponse(<Map<String, Object>>[
        <String, Object>{
          ..._row(
            contentId: 'tour-126508',
            title: '경복궁',
            kind: 'spot',
            latitude: 37.579617,
            longitude: 126.977041,
            accuracy: 6,
            verifiedAt: '2026-07-13T02:59:00Z',
            collectedAt: '2026-07-13T03:00:00Z',
          ),
          'result': 'unexpected',
        },
      ], request),
    );
    addTearDown(client.dispose);

    await expectLater(
      SupabaseStampRepository(client).collect(_request()),
      throwsA(isA<StampRepositoryException>()),
    );
  });

  test('sanitizes transport details', () async {
    final client = _client(
      (request) async => http.Response(
        jsonEncode(<String, Object>{
          'message': 'private database detail',
          'code': 'PGRST500',
        }),
        500,
        headers: const <String, String>{'content-type': 'application/json'},
        request: request,
      ),
    );
    addTearDown(client.dispose);

    await expectLater(
      SupabaseStampRepository(client).loadCollected(),
      throwsA(
        isA<StampRepositoryException>().having(
          (error) => error.toString(),
          'message',
          allOf(
            contains('could not be loaded'),
            isNot(contains('private database detail')),
          ),
        ),
      ),
    );
  });
}

CollectStampRequest _request() => CollectStampRequest(
  contentId: 'tour-126508',
  title: '클라이언트 제목',
  kind: StampCandidateKind.spot,
  verificationFix: LocationFix(
    coordinates: Coordinates(
      latitude: Latitude(37.579617),
      longitude: Longitude(126.977041),
    ),
    accuracyMeters: 6,
    timestamp: DateTime.utc(2026, 7, 13, 2, 59),
  ),
);

Map<String, Object> _row({
  required String contentId,
  required String title,
  required String kind,
  required num latitude,
  required num longitude,
  required num accuracy,
  required String verifiedAt,
  required String collectedAt,
}) => <String, Object>{
  'content_id': contentId,
  'title': title,
  'kind': kind,
  'verification_latitude': latitude,
  'verification_longitude': longitude,
  'verification_accuracy_meters': accuracy,
  'verification_timestamp': verifiedAt,
  'verified_distance_meters': 3.2,
  'collected_at': collectedAt,
};

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
