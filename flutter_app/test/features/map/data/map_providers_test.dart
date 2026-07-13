import 'dart:async';

import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:stampy/core/auth/auth.dart';
import 'package:stampy/features/map/data/fake_map_repository.dart';
import 'package:stampy/features/map/data/map_providers.dart';
import 'package:stampy/features/map/domain/map_models.dart';
import 'package:stampy/features/map/domain/map_repository.dart';

void main() {
  test('guest mode keeps the fake map repository', () async {
    final container = ProviderContainer();
    addTearDown(container.dispose);
    _listen(container);

    await container.read(currentAuthUserProvider.future);
    final repository = container.read(readyMapRepositoryProvider).requireValue;

    expect(repository, isA<FakeMapRepository>());
  });

  test('does not expose the real repository before auth is ready', () async {
    final auth = _PendingAuthRepository();
    addTearDown(auth.dispose);
    final repository = _SpyMapRepository();
    final container = ProviderContainer(
      overrides: [
        authRepositoryProvider.overrideWithValue(auth),
        mapRepositoryProvider.overrideWithValue(repository),
      ],
    );
    addTearDown(container.dispose);
    _listen(container);

    await Future<void>.delayed(Duration.zero);

    expect(container.read(readyMapRepositoryProvider).isLoading, isTrue);
    expect(repository.loadCalls, 0);

    auth.complete(AuthUser.session(id: 'anonymous-user', isAnonymous: true));

    await container.read(currentAuthUserProvider.future);
    expect(
      container.read(readyMapRepositoryProvider).requireValue,
      same(repository),
    );
  });

  test('keeps an auth failure ahead of the real repository', () async {
    final authError = StateError('offline');
    final auth = _ErrorAuthRepository(authError);
    final repository = _SpyMapRepository();
    final container = ProviderContainer(
      overrides: [
        authRepositoryProvider.overrideWithValue(auth),
        mapRepositoryProvider.overrideWithValue(repository),
      ],
    );
    addTearDown(container.dispose);
    final observedError = Completer<Object>();
    final subscription = container.listen<AsyncValue<MapRepository>>(
      readyMapRepositoryProvider,
      (previous, next) {
        final error = next.error;
        if (error != null && !observedError.isCompleted) {
          observedError.complete(error);
        }
      },
      fireImmediately: true,
    );
    addTearDown(subscription.close);

    expect(await observedError.future, same(authError));
    expect(container.read(readyMapRepositoryProvider).hasError, isTrue);
    expect(repository.loadCalls, 0);
  });

  test('waits again while a signed-out user is being replaced', () async {
    final auth = _PendingAuthRepository(
      currentUser: AuthUser.session(id: 'expired-user', isAnonymous: true),
    );
    addTearDown(auth.dispose);
    final repository = _SpyMapRepository();
    final container = ProviderContainer(
      overrides: [
        authRepositoryProvider.overrideWithValue(auth),
        mapRepositoryProvider.overrideWithValue(repository),
      ],
    );
    addTearDown(container.dispose);
    final authSubscription = container.listen<AsyncValue<AuthUser>>(
      currentAuthUserProvider,
      (previous, next) {},
      fireImmediately: true,
    );
    addTearDown(authSubscription.close);

    await container.read(currentAuthUserProvider.future);
    auth.signOut();
    await Future<void>.delayed(Duration.zero);
    expect(container.read(currentAuthUserProvider).isLoading, isTrue);

    _listen(container);
    expect(container.read(readyMapRepositoryProvider).isLoading, isTrue);
    expect(repository.loadCalls, 0);

    auth.complete(AuthUser.session(id: 'replacement-user', isAnonymous: true));

    await container.read(currentAuthUserProvider.future);
    expect(
      container.read(readyMapRepositoryProvider).requireValue,
      same(repository),
    );
  });
}

void _listen(ProviderContainer container) {
  final subscription = container.listen<AsyncValue<MapRepository>>(
    readyMapRepositoryProvider,
    (previous, next) {},
    fireImmediately: true,
  );
  addTearDown(subscription.close);
}

final class _PendingAuthRepository implements AuthRepository {
  _PendingAuthRepository({this.currentUser});

  final Completer<AuthUser> _signIn = Completer<AuthUser>();
  final StreamController<AuthUser?> _changes = StreamController<AuthUser?>();

  @override
  AuthUser? currentUser;

  @override
  Stream<AuthUser?> get authStateChanges => _changes.stream;

  @override
  Future<AuthUser> signInAnonymously() => _signIn.future;

  void complete(AuthUser user) {
    currentUser = user;
    _signIn.complete(user);
  }

  void signOut() {
    currentUser = null;
    _changes.add(null);
  }

  Future<void> dispose() => _changes.close();
}

final class _ErrorAuthRepository implements AuthRepository {
  const _ErrorAuthRepository(this.error);

  final Object error;

  @override
  AuthUser? get currentUser => null;

  @override
  Stream<AuthUser?> get authStateChanges => const Stream<AuthUser?>.empty();

  @override
  Future<AuthUser> signInAnonymously() => Future<AuthUser>.error(error);
}

final class _SpyMapRepository implements MapRepository {
  int loadCalls = 0;

  @override
  Future<MapSnapshot> loadSnapshot() {
    loadCalls += 1;
    return const FakeMapRepository().loadSnapshot();
  }
}
