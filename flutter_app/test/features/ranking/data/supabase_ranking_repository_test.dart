import 'dart:convert';

import 'package:flutter_test/flutter_test.dart';
import 'package:http/http.dart' as http;
import 'package:http/testing.dart';
import 'package:stampy/features/ranking/data/supabase_ranking_repository.dart';
import 'package:stampy/features/ranking/domain/ranking_domain.dart';
import 'package:supabase_flutter/supabase_flutter.dart';

void main() {
  test(
    'calls the authenticated weekly ranking RPC and maps ordered rows',
    () async {
      final client = _client((request) async {
        expect(request.method, 'POST');
        expect(
          request.url,
          Uri.parse(
            'https://example.supabase.co/rest/v1/rpc/list_weekly_ranking',
          ),
        );
        expect(request.headers['authorization'], 'Bearer user-access-token');
        expect(request.headers['apikey'], 'publishable-key');

        return _jsonResponse(<Map<String, Object>>[
          _row(rank: 1, stampCount: 4, isCurrentUser: false),
          _row(rank: 2, stampCount: 2, isCurrentUser: true),
          _row(rank: 2, stampCount: 2, isCurrentUser: false),
        ], request);
      });
      addTearDown(client.dispose);

      final ranking = await SupabaseRankingRepository(
        client,
      ).loadWeeklyRanking();

      expect(ranking, hasLength(3));
      expect(ranking[0].rank, 1);
      expect(ranking[0].stampCount, 4);
      expect(ranking[0].isCurrentUser, isFalse);
      expect(ranking[1].rank, 2);
      expect(ranking[1].stampCount, 2);
      expect(ranking[1].isCurrentUser, isTrue);
    },
  );

  test('maps an empty week to an empty ranking', () async {
    final client = _client(
      (request) async => _jsonResponse(const <Object>[], request),
    );
    addTearDown(client.dispose);

    expect(
      await SupabaseRankingRepository(client).loadWeeklyRanking(),
      isEmpty,
    );
  });

  final malformedResponses = <String, Object>{
    'a non-list response': <String, Object>{'rank': 1},
    'a non-map row': <Object>['invalid'],
    'more than three rows': <Object>[
      _row(rank: 1, stampCount: 4, isCurrentUser: false),
      _row(rank: 2, stampCount: 3, isCurrentUser: false),
      _row(rank: 3, stampCount: 2, isCurrentUser: false),
      _row(rank: 3, stampCount: 1, isCurrentUser: true),
    ],
    'a missing rank': <Object>[_row()..remove('rank')],
    'a string stamp count': <Object>[_row()..['stamp_count'] = '1'],
    'an invalid current-user flag': <Object>[_row()..['is_current_user'] = 1],
    'a zero stamp count': <Object>[_row(stampCount: 0)],
    'a rank outside the top three': <Object>[_row(rank: 4)],
    'a ranking that does not start at one': <Object>[_row(rank: 2)],
    'two current-user rows': <Object>[
      _row(rank: 1, stampCount: 2, isCurrentUser: true),
      _row(rank: 2, stampCount: 1, isCurrentUser: true),
    ],
    'an increasing stamp count': <Object>[
      _row(rank: 1, stampCount: 1),
      _row(rank: 2, stampCount: 2),
    ],
    'an inconsistent tie': <Object>[
      _row(rank: 1, stampCount: 2),
      _row(rank: 2, stampCount: 2),
    ],
    'an invalid rank gap': <Object>[
      _row(rank: 1, stampCount: 2),
      _row(rank: 3, stampCount: 1),
    ],
  };

  for (final entry in malformedResponses.entries) {
    test('rejects ${entry.key}', () async {
      final client = _client(
        (request) async => _jsonResponse(entry.value, request),
      );
      addTearDown(client.dispose);

      await expectLater(
        SupabaseRankingRepository(client).loadWeeklyRanking(),
        throwsA(isA<RankingRepositoryException>()),
      );
    });
  }

  test('sanitizes transport details', () async {
    final client = _client(
      (request) async => http.Response(
        jsonEncode(<String, Object>{
          'message': 'private ranking database detail',
          'code': 'PGRST500',
        }),
        500,
        headers: const <String, String>{'content-type': 'application/json'},
        request: request,
      ),
    );
    addTearDown(client.dispose);

    await expectLater(
      SupabaseRankingRepository(client).loadWeeklyRanking(),
      throwsA(
        isA<RankingRepositoryException>().having(
          (error) => error.toString(),
          'message',
          allOf(contains('could not be loaded'), isNot(contains('private'))),
        ),
      ),
    );
  });
}

Map<String, Object> _row({
  int rank = 1,
  int stampCount = 1,
  bool isCurrentUser = false,
}) => <String, Object>{
  'rank': rank,
  'stamp_count': stampCount,
  'is_current_user': isCurrentUser,
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
