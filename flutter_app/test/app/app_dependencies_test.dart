import 'dart:convert';

import 'package:flutter_test/flutter_test.dart';
import 'package:http/http.dart' as http;
import 'package:http/testing.dart';
import 'package:stampy/app/app_dependencies.dart';
import 'package:stampy/core/auth/auth.dart';
import 'package:stampy/core/config/app_config.dart';
import 'package:stampy/features/map/data/fake_map_repository.dart';
import 'package:stampy/features/map/data/supabase_map_repository.dart';
import 'package:supabase_flutter/supabase_flutter.dart';

void main() {
  test('uses fake repositories when Supabase is not configured', () async {
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

    expect(dependencies.auth, isA<FakeAuthRepository>());
    expect(dependencies.map, isA<FakeMapRepository>());
    expect(initializeCalls, 0);
    expect(reportedErrors, isEmpty);
  });

  test('uses one initialized client for Supabase auth and map', () async {
    late http.Request rpcRequest;
    final client = SupabaseClient(
      'https://example.supabase.co',
      'publishable-key',
      httpClient: MockClient((request) async {
        rpcRequest = request;
        return http.Response(
          jsonEncode(const <Object>[]),
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
    expect(initializeCalls, 1);

    await dependencies.map.loadSnapshot();
    expect(rpcRequest.url.path, '/rest/v1/rpc/list_stamp_spots');
  });

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
    expect(reportedErrors.single, isA<AuthRepositoryException>());
    expect(reportedErrors.single.toString(), isNot(contains('private')));
  });
}
