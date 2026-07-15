import 'dart:async';

import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:stampy/core/auth/auth.dart';

void main() {
  test('default provider starts signed out without automatic login', () async {
    final container = ProviderContainer();
    addTearDown(container.dispose);
    _listenToCurrentUser(container);

    final user = await container.read(currentAuthUserProvider.future);

    expect(user.isSignedOut, isTrue);
  });

  test('restores an existing member session', () async {
    final existing = AuthUser.session(id: 'restored-user', isAnonymous: false);
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

  test('signs in only after an explicit Kakao action', () async {
    final signedIn = AuthUser.session(id: 'kakao-member', isAnonymous: false);
    final repository = _SpyAuthRepository(signedInUser: signedIn);
    final container = ProviderContainer(
      overrides: [authRepositoryProvider.overrideWithValue(repository)],
    );
    addTearDown(container.dispose);
    _listenToCurrentUser(container);
    await container.read(currentAuthUserProvider.future);

    await container.read(currentAuthUserProvider.notifier).signInWithKakao();

    expect(
      container.read(currentAuthUserProvider).requireValue.id,
      'kakao-member',
    );
    expect(repository.signInCalls, 1);
  });

  test(
    'exposes a Kakao launch failure without retrying automatically',
    () async {
      final repository = _SpyAuthRepository(error: StateError('offline'));
      final container = ProviderContainer(
        overrides: [authRepositoryProvider.overrideWithValue(repository)],
      );
      addTearDown(container.dispose);
      _listenToCurrentUser(container);
      await container.read(currentAuthUserProvider.future);

      await container.read(currentAuthUserProvider.notifier).signInWithKakao();

      expect(
        container.read(currentAuthUserProvider),
        isA<AsyncError<AuthUser>>(),
      );
      expect(repository.signInCalls, 1);
    },
  );

  test('signed-out auth state stays signed out', () async {
    final changes = StreamController<AuthUser?>();
    addTearDown(changes.close);
    final repository = _SpyAuthRepository(
      currentUser: AuthUser.session(id: 'member', isAnonymous: false),
      authStateChanges: changes.stream,
    );
    final container = ProviderContainer(
      overrides: [authRepositoryProvider.overrideWithValue(repository)],
    );
    addTearDown(container.dispose);
    _listenToCurrentUser(container);
    await container.read(currentAuthUserProvider.future);

    repository.currentUser = null;
    changes.add(null);
    await Future<void>.delayed(Duration.zero);

    expect(
      container.read(currentAuthUserProvider).requireValue.isSignedOut,
      isTrue,
    );
    expect(repository.signInCalls, 0);
  });

  test('sign out clears the current member session', () async {
    final repository = _SpyAuthRepository(
      currentUser: AuthUser.session(id: 'member', isAnonymous: false),
    );
    final container = ProviderContainer(
      overrides: [authRepositoryProvider.overrideWithValue(repository)],
    );
    addTearDown(container.dispose);
    _listenToCurrentUser(container);
    await container.read(currentAuthUserProvider.future);

    await container.read(currentAuthUserProvider.notifier).signOut();

    expect(
      container.read(currentAuthUserProvider).requireValue.isSignedOut,
      isTrue,
    );
    expect(repository.signOutCalls, 1);
  });

  test(
    'sign out stays closed when local session clearing reports an error',
    () async {
      final repository = _SpyAuthRepository(
        currentUser: AuthUser.session(id: 'member', isAnonymous: false),
        signOutError: StateError('remote sign-out failed'),
      );
      final container = ProviderContainer(
        overrides: [authRepositoryProvider.overrideWithValue(repository)],
      );
      addTearDown(container.dispose);
      _listenToCurrentUser(container);
      await container.read(currentAuthUserProvider.future);

      await expectLater(
        container.read(currentAuthUserProvider.notifier).signOut(),
        throwsStateError,
      );

      expect(
        container.read(currentAuthUserProvider).requireValue.isSignedOut,
        isTrue,
      );
      expect(repository.currentUser, isNull);
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
    this.signOutError,
    this.authStateChanges = const Stream<AuthUser?>.empty(),
  });

  @override
  AuthUser? currentUser;

  @override
  final Stream<AuthUser?> authStateChanges;

  final AuthUser? signedInUser;
  final Object? error;
  final Object? signOutError;
  int signInCalls = 0;
  int signOutCalls = 0;

  @override
  Future<void> signInWithKakao() async {
    signInCalls += 1;
    final failure = error;
    if (failure != null) {
      throw failure;
    }
    currentUser =
        signedInUser ??
        AuthUser.session(id: 'fallback-member', isAnonymous: false);
  }

  @override
  Future<void> signOut() async {
    signOutCalls += 1;
    currentUser = null;
    final failure = signOutError;
    if (failure != null) {
      throw failure;
    }
  }
}
