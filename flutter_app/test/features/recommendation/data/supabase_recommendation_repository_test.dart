import 'dart:convert';

import 'package:flutter_test/flutter_test.dart';
import 'package:http/http.dart' as http;
import 'package:http/testing.dart';
import 'package:stampy/core/geo/coordinates.dart';
import 'package:stampy/features/recommendation/data/supabase_recommendation_repository.dart';
import 'package:stampy/features/recommendation/domain/recommendation_domain.dart';
import 'package:supabase_flutter/supabase_flutter.dart';

void main() {
  test(
    'calls the authenticated RPC with exact coordinates and maps a row',
    () async {
      final client = _client((request) async {
        expect(request.method, 'POST');
        expect(
          request.url,
          Uri.parse(
            'https://example.supabase.co/rest/v1/rpc/get_stamp_recommendation',
          ),
        );
        expect(request.headers['authorization'], 'Bearer user-access-token');
        expect(request.headers['apikey'], 'publishable-key');
        expect(jsonDecode(request.body), <String, Object>{
          'p_latitude': 37.579617,
          'p_longitude': 126.977041,
        });

        return _jsonResponse(<Map<String, Object>>[
          _row(
            contentId: 'tour-126508',
            title: '경복궁',
            kind: 'spot',
            latitude: 37.5797,
            longitude: 126.9771,
            distanceMeters: 250,
            score: 75,
            generatedAt: '2026-07-13T07:10:00+00:00',
          ),
        ], request);
      });
      addTearDown(client.dispose);

      final recommendation = await SupabaseRecommendationRepository(
        client,
      ).loadRecommendation(_location());

      expect(recommendation, isNotNull);
      expect(recommendation!.contentId, 'tour-126508');
      expect(recommendation.title, '경복궁');
      expect(recommendation.contentKind, RecommendationContentKind.spot);
      expect(recommendation.location.latitude.value, 37.5797);
      expect(recommendation.location.longitude.value, 126.9771);
      expect(recommendation.distanceMeters, 250.0);
      expect(recommendation.score, 75.0);
      expect(recommendation.reason, RecommendationReason.nearbyUncollected);
      expect(recommendation.generatedAt, DateTime.utc(2026, 7, 13, 7, 10));
    },
  );

  test('maps an event recommendation', () async {
    final client = _client(
      (request) async => _jsonResponse(<Map<String, Object>>[
        _row(
          contentId: 'event-1',
          title: '서울거리예술축제',
          kind: 'event',
          latitude: 37.566295,
          longitude: 126.977945,
          distanceMeters: 999.9,
          score: 0.01,
          generatedAt: '2026-07-13T07:10:00Z',
        ),
      ], request),
    );
    addTearDown(client.dispose);

    final recommendation = await SupabaseRecommendationRepository(
      client,
    ).loadRecommendation(_location());

    expect(recommendation?.contentKind, RecommendationContentKind.event);
  });

  test('maps an empty response to no recommendation', () async {
    final client = _client(
      (request) async => _jsonResponse(const <Object>[], request),
    );
    addTearDown(client.dispose);

    final recommendation = await SupabaseRecommendationRepository(
      client,
    ).loadRecommendation(_location());

    expect(recommendation, isNull);
  });

  test('rejects more than one recommendation row', () async {
    final row = _row(
      contentId: 'tour-126508',
      title: '경복궁',
      kind: 'spot',
      latitude: 37.5797,
      longitude: 126.9771,
      distanceMeters: 250,
      score: 75,
      generatedAt: '2026-07-13T07:10:00Z',
    );
    final client = _client(
      (request) async => _jsonResponse(<Object>[row, row], request),
    );
    addTearDown(client.dispose);

    await expectLater(
      SupabaseRecommendationRepository(client).loadRecommendation(_location()),
      throwsA(isA<RecommendationRepositoryException>()),
    );
  });

  final malformedResponses = <String, Object>{
    'a non-list response': <String, Object>{'content_id': 'tour-126508'},
    'a non-map row': <Object>['invalid'],
    'an unknown kind': <Object>[_validRow()..['kind'] = 'unknown'],
    'an unknown reason': <Object>[
      _validRow()..['reason'] = 'category_affinity',
    ],
    'a missing title': <Object>[_validRow()..remove('title')],
    'an out-of-range coordinate': <Object>[_validRow()..['latitude'] = 91],
    'a distance outside the recommendation radius': <Object>[
      _validRow()..['distance_meters'] = 1000.1,
    ],
    'a score outside 0–100': <Object>[_validRow()..['score'] = -0.1],
    'a local timestamp without a zone': <Object>[
      _validRow()..['generated_at'] = '2026-07-13T07:10:00',
    ],
  };

  for (final entry in malformedResponses.entries) {
    test('rejects ${entry.key}', () async {
      final client = _client(
        (request) async => _jsonResponse(entry.value, request),
      );
      addTearDown(client.dispose);

      await expectLater(
        SupabaseRecommendationRepository(
          client,
        ).loadRecommendation(_location()),
        throwsA(isA<RecommendationRepositoryException>()),
      );
    });
  }

  test('sanitizes transport details', () async {
    final client = _client(
      (request) async => http.Response(
        jsonEncode(<String, Object>{
          'message': 'private recommendation database detail',
          'code': 'PGRST500',
        }),
        500,
        headers: const <String, String>{'content-type': 'application/json'},
        request: request,
      ),
    );
    addTearDown(client.dispose);

    await expectLater(
      SupabaseRecommendationRepository(client).loadRecommendation(_location()),
      throwsA(
        isA<RecommendationRepositoryException>().having(
          (error) => error.toString(),
          'message',
          allOf(
            contains('could not be loaded'),
            isNot(contains('private recommendation database detail')),
          ),
        ),
      ),
    );
  });
}

Map<String, Object> _validRow() => _row(
  contentId: 'tour-126508',
  title: '경복궁',
  kind: 'spot',
  latitude: 37.5797,
  longitude: 126.9771,
  distanceMeters: 250,
  score: 75,
  generatedAt: '2026-07-13T07:10:00Z',
);

Map<String, Object> _row({
  required String contentId,
  required String title,
  required String kind,
  required num latitude,
  required num longitude,
  required num distanceMeters,
  required num score,
  required String generatedAt,
}) => <String, Object>{
  'content_id': contentId,
  'title': title,
  'kind': kind,
  'latitude': latitude,
  'longitude': longitude,
  'distance_meters': distanceMeters,
  'score': score,
  'reason': 'nearby_uncollected',
  'generated_at': generatedAt,
};

Coordinates _location() => Coordinates(
  latitude: Latitude(37.579617),
  longitude: Longitude(126.977041),
);

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
