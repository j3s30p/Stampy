import 'package:flutter/foundation.dart';

final class AppConfig {
  const AppConfig._({required this.supabaseCredentials});

  static const kakaoJavaScriptKey = String.fromEnvironment('KAKAO_JS_KEY');

  factory AppConfig.fromEnvironment() => AppConfig.fromValues(
    supabaseUrl: const String.fromEnvironment('SUPABASE_URL'),
    supabasePublishableKey: const String.fromEnvironment(
      'SUPABASE_PUBLISHABLE_KEY',
    ),
    kakaoJavaScriptKey: kakaoJavaScriptKey,
    allowMissingServices: !kReleaseMode,
  );

  factory AppConfig.fromValues({
    String supabaseUrl = '',
    String supabasePublishableKey = '',
    String kakaoJavaScriptKey = '',
    bool allowMissingServices = true,
  }) {
    final url = supabaseUrl.trim();
    final publishableKey = supabasePublishableKey.trim();
    final kakaoKey = kakaoJavaScriptKey.trim();

    if (!allowMissingServices) {
      final missingNames = <String>[
        if (url.isEmpty) 'SUPABASE_URL',
        if (publishableKey.isEmpty) 'SUPABASE_PUBLISHABLE_KEY',
        if (kakaoKey.isEmpty) 'KAKAO_JS_KEY',
      ];
      if (missingNames.isNotEmpty) {
        throw AppConfigException(
          'Required release settings are missing: ${missingNames.join(', ')}.',
        );
      }
    }

    if (url.isEmpty && publishableKey.isEmpty) {
      return const AppConfig._(supabaseCredentials: null);
    }

    if (url.isEmpty || publishableKey.isEmpty) {
      final missingName = url.isEmpty
          ? 'SUPABASE_URL'
          : 'SUPABASE_PUBLISHABLE_KEY';
      throw AppConfigException(
        '$missingName must be provided with the other Supabase setting.',
      );
    }

    return AppConfig._(
      supabaseCredentials: SupabaseCredentials(
        url: url,
        publishableKey: publishableKey,
      ),
    );
  }

  final SupabaseCredentials? supabaseCredentials;
}

final class SupabaseCredentials {
  const SupabaseCredentials({required this.url, required this.publishableKey});

  final String url;
  final String publishableKey;
}

final class AppConfigException implements Exception {
  const AppConfigException(this.message);

  final String message;

  @override
  String toString() => 'AppConfigException: $message';
}
