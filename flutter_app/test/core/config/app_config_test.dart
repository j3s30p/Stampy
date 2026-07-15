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

    test('rejects each missing release setting without exposing values', () {
      const privateUrl = 'https://private-project.supabase.co';
      const privatePublishableKey = 'sb_publishable_private';
      const privateKakaoKey = 'private-kakao-key';
      final cases =
          <({String missingName, String url, String key, String kakao})>[
            (
              missingName: 'SUPABASE_URL',
              url: '',
              key: privatePublishableKey,
              kakao: privateKakaoKey,
            ),
            (
              missingName: 'SUPABASE_PUBLISHABLE_KEY',
              url: privateUrl,
              key: '',
              kakao: privateKakaoKey,
            ),
            (
              missingName: 'KAKAO_JS_KEY',
              url: privateUrl,
              key: privatePublishableKey,
              kakao: '',
            ),
          ];

      for (final entry in cases) {
        expect(
          () => AppConfig.fromValues(
            supabaseUrl: entry.url,
            supabasePublishableKey: entry.key,
            kakaoJavaScriptKey: entry.kakao,
            allowGuestMode: false,
          ),
          throwsA(
            isA<AppConfigException>().having(
              (error) => error.toString(),
              'message',
              allOf(
                contains(entry.missingName),
                isNot(contains(privateUrl)),
                isNot(contains(privatePublishableKey)),
                isNot(contains(privateKakaoKey)),
              ),
            ),
          ),
          reason: entry.missingName,
        );
      }
    });

    test('reports every missing release setting together', () {
      expect(
        () => AppConfig.fromValues(
          supabaseUrl: ' ',
          supabasePublishableKey: '',
          kakaoJavaScriptKey: '\n',
          allowGuestMode: false,
        ),
        throwsA(
          isA<AppConfigException>().having(
            (error) => error.toString(),
            'message',
            allOf(
              contains('SUPABASE_URL'),
              contains('SUPABASE_PUBLISHABLE_KEY'),
              contains('KAKAO_JS_KEY'),
            ),
          ),
        ),
      );
    });

    test('accepts a complete release configuration', () {
      final config = AppConfig.fromValues(
        supabaseUrl: ' https://example.supabase.co ',
        supabasePublishableKey: ' publishable-key ',
        kakaoJavaScriptKey: ' kakao-key ',
        allowGuestMode: false,
      );

      expect(config.supabaseCredentials?.url, 'https://example.supabase.co');
      expect(config.supabaseCredentials?.publishableKey, 'publishable-key');
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
