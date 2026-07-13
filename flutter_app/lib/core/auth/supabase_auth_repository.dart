import 'package:supabase_flutter/supabase_flutter.dart' hide AuthUser;

import 'auth_repository.dart';
import 'auth_user.dart';

final class SupabaseAuthRepository implements AuthRepository {
  SupabaseAuthRepository(GoTrueClient auth) : _auth = auth;

  final GoTrueClient _auth;

  @override
  AuthUser? get currentUser {
    final user = _auth.currentUser;
    return user == null ? null : _toDomainUser(user);
  }

  @override
  Stream<AuthUser?> get authStateChanges =>
      _auth.onAuthStateChange.map((state) {
        final user = state.session?.user;
        return user == null ? null : _toDomainUser(user);
      });

  @override
  Future<AuthUser> signInAnonymously() async {
    final response = await _auth.signInAnonymously();
    final user = response.user;
    if (response.session == null || user == null || !user.isAnonymous) {
      throw const AuthRepositoryException(
        'Supabase did not return a valid anonymous session.',
      );
    }

    return _toDomainUser(user);
  }
}

AuthUser _toDomainUser(User user) =>
    AuthUser.session(id: user.id, isAnonymous: user.isAnonymous);
