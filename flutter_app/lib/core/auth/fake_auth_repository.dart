import 'auth_repository.dart';
import 'auth_user.dart';

final class FakeAuthRepository implements AuthRepository {
  FakeAuthRepository({this.currentUser});

  @override
  AuthUser? currentUser;

  @override
  Stream<AuthUser?> get authStateChanges => const Stream<AuthUser?>.empty();

  @override
  Future<void> signInWithKakao() async {
    currentUser = AuthUser.session(id: 'fake-kakao-member', isAnonymous: false);
  }

  @override
  Future<void> signOut() async {
    currentUser = null;
  }
}
