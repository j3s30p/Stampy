import 'auth_repository.dart';
import 'auth_user.dart';

final class FakeAuthRepository implements AuthRepository {
  const FakeAuthRepository({this.currentUser = const AuthUser.guest()});

  @override
  final AuthUser currentUser;

  @override
  Stream<AuthUser?> get authStateChanges => const Stream<AuthUser?>.empty();

  @override
  Future<AuthUser> signInAnonymously() => Future<AuthUser>.value(currentUser);
}
