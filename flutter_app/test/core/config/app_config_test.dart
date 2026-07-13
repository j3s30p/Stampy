import 'package:flutter_test/flutter_test.dart';
import 'package:stampy/core/config/app_config.dart';

void main() {
  group('AppConfig', () {
    test('uses guest mode when both Supabase settings are blank', () {
      final config = AppConfig.fromValues(
        supabaseUrl: '  ',
        supabasePublishableKey: '',
      );

      expect(config.supabaseCredentials, isNull);
    });

    test('trims a complete Supabase configuration', () {
      final config = AppConfig.fromValues(
        supabaseUrl: ' https://example.supabase.co ',
        supabasePublishableKey: ' sb_publishable_example ',
      );

      expect(config.supabaseCredentials?.url, 'https://example.supabase.co');
      expect(
        config.supabaseCredentials?.publishableKey,
        'sb_publishable_example',
      );
    });

    test('rejects URL-only configuration without exposing the URL', () {
      const secretUrl = 'https://private-project.supabase.co';

      expect(
        () => AppConfig.fromValues(supabaseUrl: secretUrl),
        throwsA(
          isA<AppConfigException>().having(
            (error) => error.toString(),
            'message',
            allOf(
              contains('SUPABASE_PUBLISHABLE_KEY'),
              isNot(contains(secretUrl)),
            ),
          ),
        ),
      );
    });

    test('rejects key-only configuration without exposing the key', () {
      const secretKey = 'sb_publishable_private';

      expect(
        () => AppConfig.fromValues(supabasePublishableKey: secretKey),
        throwsA(
          isA<AppConfigException>().having(
            (error) => error.toString(),
            'message',
            allOf(contains('SUPABASE_URL'), isNot(contains(secretKey))),
          ),
        ),
      );
    });
  });
}
