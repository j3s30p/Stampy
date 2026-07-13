import 'auth_user.dart';

abstract interface class AuthRepository {
  AuthUser? get currentUser;

  Stream<AuthUser?> get authStateChanges;

  Future<AuthUser> signInAnonymously();
}

final class AuthRepositoryException implements Exception {
  const AuthRepositoryException(this.message, {this.isRetryable = true});

  final String message;
  final bool isRetryable;

  @override
  String toString() => 'AuthRepositoryException: $message';
}
