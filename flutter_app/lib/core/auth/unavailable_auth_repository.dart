import 'auth_repository.dart';
import 'auth_user.dart';

final class UnavailableAuthRepository implements AuthRepository {
  const UnavailableAuthRepository();

  @override
  AuthUser? get currentUser => throw const AuthRepositoryException(
    'Authentication is unavailable.',
    isRetryable: false,
  );

  @override
  Stream<AuthUser?> get authStateChanges => const Stream<AuthUser?>.empty();

  @override
  Future<void> signInWithKakao() => Future<void>.error(
    const AuthRepositoryException(
      'Authentication is unavailable.',
      isRetryable: false,
    ),
  );

  @override
  Future<void> signOut() => Future<void>.error(
    const AuthRepositoryException(
      'Authentication is unavailable.',
      isRetryable: false,
    ),
  );
}
