import 'package:stampy/core/auth/auth.dart';
import 'package:stampy/core/config/app_config.dart';
import 'package:stampy/features/map/data/fake_map_repository.dart';
import 'package:stampy/features/map/data/supabase_map_repository.dart';
import 'package:stampy/features/map/domain/map_repository.dart';
import 'package:stampy/features/recommendation/data/fake_recommendation_repository.dart';
import 'package:stampy/features/recommendation/data/supabase_recommendation_repository.dart';
import 'package:stampy/features/recommendation/domain/recommendation_repository.dart';
import 'package:stampy/features/ranking/data/fake_ranking_repository.dart';
import 'package:stampy/features/ranking/data/supabase_ranking_repository.dart';
import 'package:stampy/features/ranking/domain/ranking_repository.dart';
import 'package:stampy/features/stamp/data/fake_stamp_repository.dart';
import 'package:stampy/features/stamp/data/supabase_stamp_repository.dart';
import 'package:stampy/features/stamp/domain/stamp_repository.dart';
import 'package:supabase_flutter/supabase_flutter.dart';

typedef AppConfigLoader = AppConfig Function();
typedef SupabaseClientInitializer =
    Future<SupabaseClient> Function(SupabaseCredentials credentials);
typedef BootstrapErrorReporter =
    void Function(Object error, StackTrace stackTrace);

final class AppDependencies {
  AppDependencies({
    required this.auth,
    required this.map,
    required this.recommendation,
    required this.ranking,
    required this.stamp,
  });

  final AuthRepository auth;
  final MapRepository map;
  final RecommendationRepository recommendation;
  final RankingRepository ranking;
  final StampRepository stamp;
}

Future<AppDependencies> createAppDependencies({
  required AppConfigLoader loadConfig,
  required SupabaseClientInitializer initializeSupabase,
  required BootstrapErrorReporter reportError,
}) async {
  try {
    final credentials = loadConfig().supabaseCredentials;
    if (credentials == null) {
      return AppDependencies(
        auth: const UnavailableAuthRepository(),
        map: const FakeMapRepository(),
        recommendation: const FakeRecommendationRepository(),
        ranking: const FakeRankingRepository(),
        stamp: FakeStampRepository(),
      );
    }

    final client = await initializeSupabase(credentials);
    return AppDependencies(
      auth: SupabaseAuthRepository(client.auth),
      map: SupabaseMapRepository(client),
      recommendation: SupabaseRecommendationRepository(client),
      ranking: SupabaseRankingRepository(client),
      stamp: SupabaseStampRepository(client),
    );
  } on AppConfigException catch (error, stackTrace) {
    reportError(error, stackTrace);
    return AppDependencies(
      auth: const UnavailableAuthRepository(),
      map: const FakeMapRepository(),
      recommendation: const FakeRecommendationRepository(),
      ranking: const FakeRankingRepository(),
      stamp: FakeStampRepository(),
    );
  } on Exception catch (_, stackTrace) {
    const error = AuthRepositoryException('Supabase could not be initialized.');
    reportError(error, stackTrace);
    return AppDependencies(
      auth: const UnavailableAuthRepository(),
      map: const FakeMapRepository(),
      recommendation: const FakeRecommendationRepository(),
      ranking: const FakeRankingRepository(),
      stamp: FakeStampRepository(),
    );
  }
}
