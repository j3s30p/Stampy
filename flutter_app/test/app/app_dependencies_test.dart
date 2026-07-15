import 'dart:convert';

import 'package:flutter_test/flutter_test.dart';
import 'package:http/http.dart' as http;
import 'package:http/testing.dart';
import 'package:stampy/app/app_dependencies.dart';
import 'package:stampy/core/auth/auth.dart';
import 'package:stampy/core/config/app_config.dart';
import 'package:stampy/core/geo/coordinates.dart';
import 'package:stampy/features/map/data/fake_map_repository.dart';
import 'package:stampy/features/map/data/supabase_map_repository.dart';
import 'package:stampy/features/recommendation/data/fake_recommendation_repository.dart';
import 'package:stampy/features/recommendation/data/supabase_recommendation_repository.dart';
import 'package:stampy/features/ranking/data/fake_ranking_repository.dart';
import 'package:stampy/features/ranking/data/supabase_ranking_repository.dart';
import 'package:stampy/features/stamp/data/fake_stamp_repository.dart';
import 'package:stampy/features/stamp/data/supabase_stamp_repository.dart';
import 'package:supabase_flutter/supabase_flutter.dart';

void main() {
  test('blocks auth when Supabase is not configured', () async {
    var initializeCalls = 0;
    final reportedErrors = <Object>[];

    final dependencies = await createAppDependencies(
      loadConfig: AppConfig.fromEnvironment,
      initializeSupabase: (credentials) async {
        initializeCalls += 1;
        throw StateError('must not initialize');
      },
      reportError: (error, stackTrace) => reportedErrors.add(error),
    );

    expect(dependencies.auth, isA<UnavailableAuthRepository>());
    expect(dependencies.map, isA<FakeMapRepository>());
    expect(dependencies.recommendation, isA<FakeRecommendationRepository>());
    expect(dependencies.ranking, isA<FakeRankingRepository>());
    expect(dependencies.stamp, isA<FakeStampRepository>());
    expect(initializeCalls, 0);
    expect(reportedErrors, isEmpty);
  });

  test(
    'uses one initialized client for Supabase auth, map, recommendation, ranking, and stamps',
    () async {
      final rpcRequests = <http.Request>[];
      final client = SupabaseClient(
        'https://example.supabase.co',
        'publishable-key',
        httpClient: MockClient((request) async {
          rpcRequests.add(request);
          final responseBody =
              request.url.path.endsWith('/get_collected_sigungu_count')
              ? 0
              : const <Object>[];
          return http.Response(
            jsonEncode(responseBody),
            200,
            headers: const <String, String>{'content-type': 'application/json'},
            request: request,
          );
        }),
      );
      addTearDown(client.dispose);
      var initializeCalls = 0;

      final dependencies = await createAppDependencies(
        loadConfig: () => AppConfig.fromValues(
          supabaseUrl: 'https://example.supabase.co',
          supabasePublishableKey: 'publishable-key',
        ),
        initializeSupabase: (credentials) async {
          initializeCalls += 1;
          expect(credentials.url, 'https://example.supabase.co');
          expect(credentials.publishableKey, 'publishable-key');
          return client;
        },
        reportError: (error, stackTrace) => fail('unexpected bootstrap error'),
      );

      expect(dependencies.auth, isA<SupabaseAuthRepository>());
      expect(dependencies.map, isA<SupabaseMapRepository>());
      expect(
        dependencies.recommendation,
        isA<SupabaseRecommendationRepository>(),
      );
      expect(dependencies.ranking, isA<SupabaseRankingRepository>());
      expect(dependencies.stamp, isA<SupabaseStampRepository>());
      expect(initializeCalls, 1);

      await dependencies.map.loadSnapshot();
      await dependencies.stamp.loadCollected();
      await dependencies.stamp.loadCollectedSigunguCount();
      await dependencies.recommendation.loadRecommendation(
        Coordinates(
          latitude: Latitude(37.579617),
          longitude: Longitude(126.977041),
        ),
      );
      await dependencies.ranking.loadWeeklyRanking();
      expect(rpcRequests.map((request) => request.url.path), <String>[
        '/rest/v1/rpc/list_stamp_spots',
        '/rest/v1/rpc/list_collected_stamps',
        '/rest/v1/rpc/get_collected_sigungu_count',
        '/rest/v1/rpc/get_stamp_recommendation',
        '/rest/v1/rpc/list_weekly_ranking',
      ]);
    },
  );

  test(
    'reports invalid configuration and exposes no real repository',
    () async {
      final reportedErrors = <Object>[];

      final dependencies = await createAppDependencies(
        loadConfig: () => throw const AppConfigException('invalid config'),
        initializeSupabase: (credentials) async =>
            throw StateError('must not initialize'),
        reportError: (error, stackTrace) => reportedErrors.add(error),
      );

      expect(dependencies.auth, isA<UnavailableAuthRepository>());
      expect(dependencies.map, isA<FakeMapRepository>());
      expect(dependencies.recommendation, isA<FakeRecommendationRepository>());
      expect(dependencies.ranking, isA<FakeRankingRepository>());
      expect(dependencies.stamp, isA<FakeStampRepository>());
      expect(reportedErrors.single, isA<AppConfigException>());
    },
  );

  test('sanitizes initialization failures before reporting them', () async {
    final reportedErrors = <Object>[];

    final dependencies = await createAppDependencies(
      loadConfig: () => AppConfig.fromValues(
        supabaseUrl: 'https://example.supabase.co',
        supabasePublishableKey: 'publishable-key',
      ),
      initializeSupabase: (credentials) async =>
          throw Exception('private transport detail'),
      reportError: (error, stackTrace) => reportedErrors.add(error),
    );

    expect(dependencies.auth, isA<UnavailableAuthRepository>());
    expect(dependencies.map, isA<FakeMapRepository>());
    expect(dependencies.recommendation, isA<FakeRecommendationRepository>());
    expect(dependencies.ranking, isA<FakeRankingRepository>());
    expect(dependencies.stamp, isA<FakeStampRepository>());
    expect(reportedErrors.single, isA<AuthRepositoryException>());
    expect(reportedErrors.single.toString(), isNot(contains('private')));
  });
}
