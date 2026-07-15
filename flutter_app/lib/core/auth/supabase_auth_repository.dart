import 'package:supabase_flutter/supabase_flutter.dart' hide AuthUser;

import 'auth_repository.dart';
import 'auth_user.dart';

const kakaoAuthRedirectUrl = 'com.stampy.app://login-callback/';

typedef OAuthSignInLauncher =
    Future<bool> Function(OAuthProvider provider, {String? redirectTo});

final class SupabaseAuthRepository implements AuthRepository {
  SupabaseAuthRepository(GoTrueClient auth, {OAuthSignInLauncher? launchOAuth})
    : _auth = auth,
      _launchOAuth =
          launchOAuth ??
          ((provider, {redirectTo}) =>
              auth.signInWithOAuth(provider, redirectTo: redirectTo));

  final GoTrueClient _auth;
  final OAuthSignInLauncher _launchOAuth;

  @override
  AuthUser? get currentUser => _toDomainUser(_auth.currentUser);

  @override
  Stream<AuthUser?> get authStateChanges => _auth.onAuthStateChange.map(
    (state) => _toDomainUser(state.session?.user),
  );

  @override
  Future<void> signInWithKakao() async {
    try {
      if (_auth.currentUser?.isAnonymous ?? false) {
        await _auth.signOut(scope: SignOutScope.local);
      }

      final launched = await _launchOAuth(
        OAuthProvider.kakao,
        redirectTo: kakaoAuthRedirectUrl,
      );
      if (!launched) {
        throw const AuthRepositoryException(
          'Kakao sign-in screen could not be opened.',
        );
      }
    } on AuthRepositoryException {
      rethrow;
    } on Object {
      throw const AuthRepositoryException('Kakao sign-in could not start.');
    }
  }

  @override
  Future<void> signOut() async {
    try {
      await _auth.signOut(scope: SignOutScope.local);
    } on Object {
      throw const AuthRepositoryException('Sign out failed.');
    }
  }
}

AuthUser? _toDomainUser(User? user) {
  if (user == null || user.isAnonymous) {
    return null;
  }

  return AuthUser.session(id: user.id, isAnonymous: false);
}
