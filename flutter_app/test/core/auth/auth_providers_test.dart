import 'dart:async';

import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:stampy/core/auth/auth.dart';

void main() {
  test('default provider exposes the guest user', () async {
    final container = ProviderContainer();
    addTearDown(container.dispose);
    _listenToCurrentUser(container);

    final user = await container.read(currentAuthUserProvider.future);

    expect(user.isGuest, isTrue);
    expect(user.id, isNull);
  });

  test('restored user skips anonymous sign-in', () async {
    final existing = AuthUser.session(id: 'restored-user', isAnonymous: true);
    final repository = _SpyAuthRepository(currentUser: existing);
    final container = ProviderContainer(
      overrides: [authRepositoryProvider.overrideWithValue(repository)],
    );
    addTearDown(container.dispose);
    _listenToCurrentUser(container);

    final user = await container.read(currentAuthUserProvider.future);

    expect(user.id, 'restored-user');
    expect(repository.signInCalls, 0);
  });

  test('concurrent and repeated reads create one anonymous session', () async {
    final signedIn = AuthUser.session(
      id: 'new-anonymous-user',
      isAnonymous: true,
    );
    final repository = _SpyAuthRepository(signedInUser: signedIn);
    final container = ProviderContainer(
      overrides: [authRepositoryProvider.overrideWithValue(repository)],
    );
    addTearDown(container.dispose);
    _listenToCurrentUser(container);

    final first = container.read(currentAuthUserProvider.future);
    final second = container.read(currentAuthUserProvider.future);
    final users = await Future.wait(<Future<AuthUser>>[first, second]);
    final third = await container.read(currentAuthUserProvider.future);

    expect(users.map((user) => user.id), everyElement('new-anonymous-user'));
    expect(third.id, 'new-anonymous-user');
    expect(repository.signInCalls, 1);
  });

  test('provider does not retry a failed anonymous sign-in', () async {
    final repository = _SpyAuthRepository(error: StateError('offline'));
    final container = ProviderContainer(
      overrides: [authRepositoryProvider.overrideWithValue(repository)],
    );
    addTearDown(container.dispose);
    _listenToCurrentUser(container);

    await expectLater(
      container.read(currentAuthUserProvider.future),
      throwsStateError,
    );
    await Future<void>.delayed(const Duration(milliseconds: 350));

    expect(repository.signInCalls, 1);
  });

  test(
    'signed-out auth state creates one replacement anonymous user',
    () async {
      final changes = StreamController<AuthUser?>();
      addTearDown(changes.close);
      final repository = _SpyAuthRepository(
        currentUser: AuthUser.session(
          id: 'expired-anonymous-user',
          isAnonymous: true,
        ),
        signedInUser: AuthUser.session(
          id: 'replacement-anonymous-user',
          isAnonymous: true,
        ),
        authStateChanges: changes.stream,
      );
      final container = ProviderContainer(
        overrides: [authRepositoryProvider.overrideWithValue(repository)],
      );
      addTearDown(container.dispose);

      final replacement = Completer<AuthUser>();
      final subscription = container.listen<AsyncValue<AuthUser>>(
        currentAuthUserProvider,
        (previous, next) {
          next.whenData((user) {
            if (user.id == 'replacement-anonymous-user' &&
                !replacement.isCompleted) {
              replacement.complete(user);
            }
          });
        },
        fireImmediately: true,
      );
      addTearDown(subscription.close);

      final initial = await container.read(currentAuthUserProvider.future);
      expect(initial.id, 'expired-anonymous-user');

      repository.currentUser = null;
      changes.add(null);
      changes.add(null);
      final updated = await replacement.future;
      await Future<void>.delayed(Duration.zero);

      expect(updated.id, 'replacement-anonymous-user');
      expect(repository.signInCalls, 1);
    },
  );
}

void _listenToCurrentUser(ProviderContainer container) {
  final subscription = container.listen<AsyncValue<AuthUser>>(
    currentAuthUserProvider,
    (_, _) {},
  );
  addTearDown(subscription.close);
}

final class _SpyAuthRepository implements AuthRepository {
  _SpyAuthRepository({
    this.currentUser,
    this.signedInUser,
    this.error,
    this.authStateChanges = const Stream<AuthUser?>.empty(),
  });

  @override
  AuthUser? currentUser;
  @override
  final Stream<AuthUser?> authStateChanges;
  final AuthUser? signedInUser;
  final Object? error;
  int signInCalls = 0;

  @override
  Future<AuthUser> signInAnonymously() async {
    signInCalls += 1;
    final failure = error;
    if (failure != null) {
      return Future<AuthUser>.error(failure);
    }

    final user =
        signedInUser ??
        AuthUser.session(id: 'fallback-anonymous', isAnonymous: true);
    currentUser = user;
    return user;
  }
}
