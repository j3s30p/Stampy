import 'package:flutter/widgets.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:stampy/app/app.dart';
import 'package:stampy/core/auth/auth.dart';
import 'package:stampy/core/config/app_config.dart';
import 'package:supabase_flutter/supabase_flutter.dart';

Future<void> main() async {
  WidgetsFlutterBinding.ensureInitialized();

  final authRepository = await _createAuthRepository();

  runApp(
    ProviderScope(
      overrides: [authRepositoryProvider.overrideWithValue(authRepository)],
      child: const StampyApp(),
    ),
  );
}

Future<AuthRepository> _createAuthRepository() async {
  try {
    final config = AppConfig.fromEnvironment();
    final credentials = config.supabaseCredentials;
    if (credentials == null) {
      return const FakeAuthRepository();
    }

    final supabase = await Supabase.initialize(
      url: credentials.url,
      publishableKey: credentials.publishableKey,
    );
    return SupabaseAuthRepository(supabase.client.auth);
  } on AppConfigException catch (error, stackTrace) {
    _reportBootstrapError(error, stackTrace);
    return const UnavailableAuthRepository();
  } on Exception catch (_, stackTrace) {
    const error = AuthRepositoryException(
      'Supabase authentication could not be initialized.',
    );
    _reportBootstrapError(error, stackTrace);
    return const UnavailableAuthRepository();
  }
}

void _reportBootstrapError(Object error, StackTrace stackTrace) {
  FlutterError.reportError(
    FlutterErrorDetails(
      exception: error,
      stack: stackTrace,
      library: 'stampy auth bootstrap',
    ),
  );
}
