import 'auth_repository.dart';
import 'auth_user.dart';

final class UnavailableAuthRepository implements AuthRepository {
  const UnavailableAuthRepository();

  @override
  AuthUser? get currentUser => null;

  @override
  Stream<AuthUser?> get authStateChanges => const Stream<AuthUser?>.empty();

  @override
  Future<AuthUser> signInAnonymously() => Future<AuthUser>.error(
    const AuthRepositoryException(
      'Authentication is unavailable.',
      isRetryable: false,
    ),
  );
}
