import 'package:stampy/core/auth/auth.dart';
import 'package:stampy/core/config/app_config.dart';
import 'package:stampy/features/map/data/fake_map_repository.dart';
import 'package:stampy/features/map/data/supabase_map_repository.dart';
import 'package:stampy/features/map/domain/map_repository.dart';
import 'package:supabase_flutter/supabase_flutter.dart';

typedef AppConfigLoader = AppConfig Function();
typedef SupabaseClientInitializer =
    Future<SupabaseClient> Function(SupabaseCredentials credentials);
typedef BootstrapErrorReporter =
    void Function(Object error, StackTrace stackTrace);

final class AppDependencies {
  const AppDependencies({required this.auth, required this.map});

  final AuthRepository auth;
  final MapRepository map;
}

Future<AppDependencies> createAppDependencies({
  required AppConfigLoader loadConfig,
  required SupabaseClientInitializer initializeSupabase,
  required BootstrapErrorReporter reportError,
}) async {
  try {
    final credentials = loadConfig().supabaseCredentials;
    if (credentials == null) {
      return const AppDependencies(
        auth: FakeAuthRepository(),
        map: FakeMapRepository(),
      );
    }

    final client = await initializeSupabase(credentials);
    return AppDependencies(
      auth: SupabaseAuthRepository(client.auth),
      map: SupabaseMapRepository(client),
    );
  } on AppConfigException catch (error, stackTrace) {
    reportError(error, stackTrace);
    return const AppDependencies(
      auth: UnavailableAuthRepository(),
      map: FakeMapRepository(),
    );
  } on Exception catch (_, stackTrace) {
    const error = AuthRepositoryException('Supabase could not be initialized.');
    reportError(error, stackTrace);
    return const AppDependencies(
      auth: UnavailableAuthRepository(),
      map: FakeMapRepository(),
    );
  }
}
