import 'dart:async';

import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:stampy/core/auth/auth.dart';
import 'package:stampy/features/map/data/fake_map_repository.dart';
import 'package:stampy/features/map/data/map_providers.dart';
import 'package:stampy/features/map/domain/map_models.dart';
import 'package:stampy/features/map/domain/map_repository.dart';

void main() {
  test('signed-out state keeps the map repository unavailable', () async {
    final container = ProviderContainer();
    addTearDown(container.dispose);
    _listen(container);

    await container.read(currentAuthUserProvider.future);
    expect(container.read(readyMapRepositoryProvider).isLoading, isTrue);
  });

  test('reselecting the same content id increases the request revision', () {
    final container = ProviderContainer();
    addTearDown(container.dispose);
    final controller = container.read(mapSelectionRequestProvider.notifier);

    controller.select('tour-126508');
    final first = container.read(mapSelectionRequestProvider)!;
    controller.select('tour-126508');
    final second = container.read(mapSelectionRequestProvider)!;

    expect(first.contentId, 'tour-126508');
    expect(first.revision, 1);
    expect(second.contentId, first.contentId);
    expect(second.revision, 2);
  });

  test('clears a map selection when the member signs out', () async {
    final auth = _PendingAuthRepository(
      currentUser: AuthUser.session(id: 'member-a', isAnonymous: false),
    );
    addTearDown(auth.dispose);
    final container = ProviderContainer(
      overrides: [authRepositoryProvider.overrideWithValue(auth)],
    );
    addTearDown(container.dispose);
    await container.read(currentAuthUserProvider.future);
    container.read(mapSelectionRequestProvider.notifier).select('tour-126508');

    await auth.signOut();
    await Future<void>.delayed(Duration.zero);

    expect(container.read(mapSelectionRequestProvider), isNull);
  });

  test(
    'keeps a selection for the same member and clears it for another',
    () async {
      final auth = _PendingAuthRepository(
        currentUser: AuthUser.session(id: 'member-a', isAnonymous: false),
      );
      addTearDown(auth.dispose);
      final container = ProviderContainer(
        overrides: [authRepositoryProvider.overrideWithValue(auth)],
      );
      addTearDown(container.dispose);
      await container.read(currentAuthUserProvider.future);
      container
          .read(mapSelectionRequestProvider.notifier)
          .select('tour-126508');

      auth.complete(AuthUser.session(id: 'member-a', isAnonymous: false));
      await Future<void>.delayed(Duration.zero);

      final sameMemberSelection = container.read(mapSelectionRequestProvider);
      expect(sameMemberSelection?.contentId, 'tour-126508');
      expect(sameMemberSelection?.revision, 1);

      auth.complete(AuthUser.session(id: 'member-b', isAnonymous: false));
      await Future<void>.delayed(Duration.zero);

      expect(container.read(mapSelectionRequestProvider), isNull);
    },
  );

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

    await container.read(currentAuthUserProvider.future);

    expect(container.read(readyMapRepositoryProvider).isLoading, isTrue);
    expect(repository.loadCalls, 0);

    auth.complete(AuthUser.session(id: 'member', isAnonymous: false));

    await Future<void>.delayed(Duration.zero);
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

  test('stays unavailable after sign-out until a new member arrives', () async {
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
    await auth.signOut();
    await Future<void>.delayed(Duration.zero);
    expect(
      container.read(currentAuthUserProvider).requireValue.isSignedOut,
      isTrue,
    );

    _listen(container);
    expect(container.read(readyMapRepositoryProvider).isLoading, isTrue);
    expect(repository.loadCalls, 0);

    auth.complete(AuthUser.session(id: 'replacement-user', isAnonymous: false));

    await Future<void>.delayed(Duration.zero);
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

  final StreamController<AuthUser?> _changes = StreamController<AuthUser?>();

  @override
  AuthUser? currentUser;

  @override
  Stream<AuthUser?> get authStateChanges => _changes.stream;

  @override
  Future<void> signInWithKakao() async {}

  void complete(AuthUser user) {
    currentUser = user;
    _changes.add(user);
  }

  @override
  Future<void> signOut() async {
    currentUser = null;
    _changes.add(null);
  }

  Future<void> dispose() => _changes.close();
}

final class _ErrorAuthRepository implements AuthRepository {
  const _ErrorAuthRepository(this.error);

  final Object error;

  @override
  AuthUser? get currentUser => throw error;

  @override
  Stream<AuthUser?> get authStateChanges => const Stream<AuthUser?>.empty();

  @override
  Future<void> signInWithKakao() => Future<void>.error(error);

  @override
  Future<void> signOut() => Future<void>.error(error);
}

final class _SpyMapRepository implements MapRepository {
  int loadCalls = 0;

  @override
  Future<MapSnapshot> loadSnapshot() {
    loadCalls += 1;
    return const FakeMapRepository().loadSnapshot();
  }
}
