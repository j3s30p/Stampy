import 'package:flutter/widgets.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:stampy/app/app.dart';
import 'package:stampy/app/app_dependencies.dart';
import 'package:stampy/core/auth/auth.dart';
import 'package:stampy/core/config/app_config.dart';
import 'package:stampy/features/map/data/map_providers.dart';
import 'package:stampy/features/recommendation/data/recommendation_providers.dart';
import 'package:stampy/features/ranking/data/ranking_providers.dart';
import 'package:stampy/features/stamp/presentation/stamp_session.dart';
import 'package:supabase_flutter/supabase_flutter.dart';

Future<void> main() async {
  WidgetsFlutterBinding.ensureInitialized();

  final repositories = await createAppDependencies(
    loadConfig: AppConfig.fromEnvironment,
    initializeSupabase: (credentials) async {
      final supabase = await Supabase.initialize(
        url: credentials.url,
        publishableKey: credentials.publishableKey,
      );
      return supabase.client;
    },
    reportError: _reportBootstrapError,
  );

  runApp(
    ProviderScope(
      overrides: [
        authRepositoryProvider.overrideWithValue(repositories.auth),
        mapRepositoryProvider.overrideWithValue(repositories.map),
        recommendationRepositoryProvider.overrideWithValue(
          repositories.recommendation,
        ),
        rankingRepositoryProvider.overrideWithValue(repositories.ranking),
        stampRepositoryProvider.overrideWithValue(repositories.stamp),
      ],
      child: const StampyApp(),
    ),
  );
}

void _reportBootstrapError(Object error, StackTrace stackTrace) {
  FlutterError.reportError(
    FlutterErrorDetails(
      exception: error,
      stack: stackTrace,
      library: 'stampy bootstrap',
    ),
  );
}
