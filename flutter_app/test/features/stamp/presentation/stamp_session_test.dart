import 'dart:async';

import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:stampy/core/auth/auth.dart';
import 'package:stampy/core/geo/geo.dart';
import 'package:stampy/core/location/location_state.dart';
import 'package:stampy/features/stamp/data/fake_stamp_repository.dart';
import 'package:stampy/features/stamp/domain/stamp_domain.dart';
import 'package:stampy/features/stamp/presentation/stamp_session.dart';

void main() {
  final collectedAt = DateTime.utc(2026, 7, 13, 12);
  final request = _request('tour-126508', '경복궁');

  test('retrying a failed load preserves stamps collected afterward', () async {
    final auth = _ControlledAuthRepository(
      currentUser: AuthUser.session(id: 'user-a', isAnonymous: true),
    );
    final repository = _ControlledStampRepository();
    final load = repository.queueLoad();
    final retryLoad = repository.queueLoad();
    final collection = repository.queueCollect();
    final container = _container(auth: auth, stamp: repository);
    addTearDown(auth.dispose);
    addTearDown(container.dispose);
    _listenToStampSession(container);
    await _waitForAuth(container);
    await load.started.future;

    load.result.completeError(StateError('offline'));
    await _flush();

    _expectLoadStatus(container, StampSessionLoadStatus.failed);
    expect(container.read(stampSessionProvider).error, isA<StateError>());

    final controller = container.read(stampSessionProvider.notifier);
    final collectionResult = controller.collect(request);
    await collection.started.future;
    collection.result.complete(
      CollectStampResult.success(_stamp(request.contentId, request.title)),
    );
    await collectionResult;

    _expectLoadStatus(container, StampSessionLoadStatus.failed);
    expect(container.read(stampSessionProvider).collectedStamps, hasLength(1));

    final retry = controller.retryLoad();
    await retryLoad.started.future;

    _expectLoadStatus(container, StampSessionLoadStatus.loading);
    expect(container.read(stampSessionProvider).collectedStamps, hasLength(1));

    retryLoad.result.completeError(StateError('still offline'));
    await retry;

    _expectLoadStatus(container, StampSessionLoadStatus.failed);
    expect(container.read(stampSessionProvider).collectedStamps, hasLength(1));
  });

  test('collection failures do not change the session load status', () async {
    final auth = _ControlledAuthRepository(
      currentUser: AuthUser.session(id: 'user-a', isAnonymous: true),
    );
    final repository = _ControlledStampRepository();
    final load = repository.queueLoad();
    final collection = repository.queueCollect();
    final container = _container(auth: auth, stamp: repository);
    addTearDown(auth.dispose);
    addTearDown(container.dispose);
    _listenToStampSession(container);
    await _waitForAuth(container);
    await load.started.future;
    load.result.complete(const <CollectedStamp>[]);
    await _flush();

    final result = container
        .read(stampSessionProvider.notifier)
        .collect(request);
    await collection.started.future;
    final expectation = expectLater(result, throwsStateError);
    collection.result.completeError(StateError('offline'));
    await expectation;

    _expectLoadStatus(container, StampSessionLoadStatus.loaded);
    expect(container.read(stampSessionProvider).error, isA<StateError>());
  });

  test(
    'collect updates session state and duplicate remains one record',
    () async {
      final repository = FakeStampRepository(clock: () => collectedAt);
      final container = ProviderContainer(
        overrides: [stampRepositoryProvider.overrideWithValue(repository)],
      );
      addTearDown(container.dispose);
      _listenToStampSession(container);
      await _waitForAuth(container);

      final controller = container.read(stampSessionProvider.notifier);
      final first = await controller.collect(request);
      final second = await controller.collect(request);

      expect(first, isA<CollectStampSuccess>());
      expect(second, isA<CollectStampDuplicate>());
      expect(controller.isCollected(request.contentId), isTrue);
      expect(
        container.read(stampSessionProvider).collectedStamps,
        hasLength(1),
      );
      expect(
        () => container.read(stampSessionProvider).collectedStamps.clear(),
        throwsUnsupportedError,
      );
      expect(container.read(stampSessionProvider).isCollecting, isFalse);
      expect(container.read(stampSessionProvider).error, isNull);
    },
  );

  test(
    'keeps collected state when a tab unsubscribes and subscribes again',
    () async {
      final repository = FakeStampRepository(clock: () => collectedAt);
      final container = ProviderContainer(
        overrides: [stampRepositoryProvider.overrideWithValue(repository)],
      );
      addTearDown(container.dispose);

      final firstTab = container.listen<StampSessionState>(
        stampSessionProvider,
        (previous, next) {},
        fireImmediately: true,
      );
      await _waitForAuth(container);
      await container.read(stampSessionProvider.notifier).collect(request);
      firstTab.close();
      await _flush();

      final secondTab = container.listen<StampSessionState>(
        stampSessionProvider,
        (previous, next) {},
        fireImmediately: true,
      );
      addTearDown(secondTab.close);

      expect(
        container.read(stampSessionProvider).collectedStamps,
        hasLength(1),
      );
      expect(
        container
            .read(stampSessionProvider.notifier)
            .isCollected(' tour-126508 '),
        isTrue,
      );
    },
  );

  test('waits for auth before loading or collecting', () async {
    final signIn = Completer<AuthUser>();
    final auth = _ControlledAuthRepository(signInFuture: signIn.future);
    final repository = _ControlledStampRepository();
    final load = repository.queueLoad();
    final container = _container(auth: auth, stamp: repository);
    addTearDown(auth.dispose);
    addTearDown(container.dispose);
    _listenToStampSession(container);

    await _flush();

    expect(repository.loadCalls, 0);
    _expectLoadStatus(container, StampSessionLoadStatus.loading);
    await expectLater(
      container.read(stampSessionProvider.notifier).collect(request),
      throwsA(isA<StampRepositoryException>()),
    );
    expect(repository.collectCalls, 0);

    signIn.complete(AuthUser.session(id: 'anonymous-user', isAnonymous: true));
    await _waitForAuth(container);
    await load.started.future;
    _expectLoadStatus(container, StampSessionLoadStatus.loading);
    load.result.complete(const <CollectedStamp>[]);
    await _flush();

    expect(repository.loadCalls, 1);
    _expectLoadStatus(container, StampSessionLoadStatus.loaded);
  });

  test('does not reload for a new auth value with the same user id', () async {
    final auth = _ControlledAuthRepository(
      currentUser: AuthUser.session(id: 'user-a', isAnonymous: true),
    );
    final repository = _ControlledStampRepository();
    final load = repository.queueLoad();
    final container = _container(auth: auth, stamp: repository);
    addTearDown(auth.dispose);
    addTearDown(container.dispose);
    _listenToStampSession(container);
    await _waitForAuth(container);
    await load.started.future;
    load.result.complete(<CollectedStamp>[_stamp('stamp-a', 'A')]);
    await _flush();

    auth.emitUser(AuthUser.session(id: 'user-a', isAnonymous: true));
    await _flush();

    expect(repository.loadCalls, 1);
    _expectLoadStatus(container, StampSessionLoadStatus.loaded);
    expect(
      container.read(stampSessionProvider).collectedStamps.single.contentId,
      'stamp-a',
    );
  });

  test('clears signed-out state and ignores the previous user load', () async {
    final replacement = Completer<AuthUser>();
    final auth = _ControlledAuthRepository(
      currentUser: AuthUser.session(id: 'user-a', isAnonymous: true),
      signInFuture: replacement.future,
    );
    final repository = _ControlledStampRepository();
    final userALoad = repository.queueLoad();
    final userBLoad = repository.queueLoad();
    final container = _container(auth: auth, stamp: repository);
    addTearDown(auth.dispose);
    addTearDown(container.dispose);
    _listenToStampSession(container);
    await _waitForAuth(container);
    await userALoad.started.future;

    auth.signOut();
    await _flush();

    expect(container.read(currentAuthUserProvider).isLoading, isTrue);
    expect(container.read(stampSessionProvider).collectedStamps, isEmpty);
    _expectLoadStatus(container, StampSessionLoadStatus.loading);
    userALoad.result.complete(<CollectedStamp>[_stamp('stamp-a', 'A')]);
    await _flush();
    expect(container.read(stampSessionProvider).collectedStamps, isEmpty);
    _expectLoadStatus(container, StampSessionLoadStatus.loading);

    final replacementUser = container.read(currentAuthUserProvider.future);
    replacement.complete(AuthUser.session(id: 'user-b', isAnonymous: true));
    expect((await replacementUser).id, 'user-b');
    await userBLoad.started.future;
    _expectLoadStatus(container, StampSessionLoadStatus.loading);
    userBLoad.result.complete(<CollectedStamp>[_stamp('stamp-b', 'B')]);
    await _flush();

    expect(
      container.read(stampSessionProvider).collectedStamps.single.contentId,
      'stamp-b',
    );
    _expectLoadStatus(container, StampSessionLoadStatus.loaded);
    expect(repository.loadCalls, 2);
  });

  test(
    'isolates stale collection and the new user collecting counter',
    () async {
      final auth = _ControlledAuthRepository(
        currentUser: AuthUser.session(id: 'user-a', isAnonymous: true),
      );
      final repository = _ControlledStampRepository();
      final userALoad = repository.queueLoad();
      final userBLoad = repository.queueLoad();
      final userACollect = repository.queueCollect();
      final userBCollect = repository.queueCollect();
      final container = _container(auth: auth, stamp: repository);
      addTearDown(auth.dispose);
      addTearDown(container.dispose);
      _listenToStampSession(container);
      await _waitForAuth(container);
      await userALoad.started.future;
      userALoad.result.complete(const <CollectedStamp>[]);
      await _flush();

      final controller = container.read(stampSessionProvider.notifier);
      final oldCollection = controller.collect(_request('stamp-a', 'A'));
      await userACollect.started.future;

      auth.emitUser(AuthUser.session(id: 'user-b', isAnonymous: true));
      await userBLoad.started.future;
      userBLoad.result.complete(const <CollectedStamp>[]);
      await _flush();

      final newCollection = controller.collect(_request('stamp-b', 'B'));
      await userBCollect.started.future;
      expect(container.read(stampSessionProvider).isCollecting, isTrue);

      final oldExpectation = expectLater(
        oldCollection,
        throwsA(isA<StampRepositoryException>()),
      );
      userACollect.result.complete(
        CollectStampResult.success(_stamp('stamp-a', 'A')),
      );
      await oldExpectation;

      expect(container.read(stampSessionProvider).collectedStamps, isEmpty);
      expect(container.read(stampSessionProvider).isCollecting, isTrue);

      userBCollect.result.complete(
        CollectStampResult.success(_stamp('stamp-b', 'B')),
      );
      await newCollection;

      expect(
        container.read(stampSessionProvider).collectedStamps.single.contentId,
        'stamp-b',
      );
      expect(container.read(stampSessionProvider).isCollecting, isFalse);
    },
  );

  test('keeps auth failures ahead of stamp RPCs', () async {
    final auth = _ErrorAuthRepository(StateError('offline'));
    final repository = _ControlledStampRepository();
    final container = _container(auth: auth, stamp: repository);
    addTearDown(container.dispose);
    _listenToStampSession(container);

    await expectLater(
      container.read(currentAuthUserProvider.future),
      throwsStateError,
    );
    await _flush();

    expect(repository.loadCalls, 0);
    expect(container.read(stampSessionProvider).collectedStamps, isEmpty);
    await expectLater(
      container.read(stampSessionProvider.notifier).collect(request),
      throwsA(isA<StampRepositoryException>()),
    );
    expect(repository.collectCalls, 0);
  });

  test('ignores pending work after the provider is disposed', () async {
    final auth = _ControlledAuthRepository(
      currentUser: AuthUser.session(id: 'user-a', isAnonymous: true),
    );
    final repository = _ControlledStampRepository();
    final load = repository.queueLoad();
    final collect = repository.queueCollect();
    final container = _container(auth: auth, stamp: repository);
    addTearDown(auth.dispose);
    final subscription = container.listen<StampSessionState>(
      stampSessionProvider,
      (previous, next) {},
      fireImmediately: true,
    );
    await _waitForAuth(container);
    await load.started.future;

    final collection = container
        .read(stampSessionProvider.notifier)
        .collect(_request('stamp-a', 'A'));
    await collect.started.future;
    subscription.close();
    container.dispose();

    load.result.complete(<CollectedStamp>[_stamp('loaded-a', 'Loaded A')]);
    final collectionExpectation = expectLater(
      collection,
      throwsA(isA<StampRepositoryException>()),
    );
    collect.result.complete(CollectStampResult.success(_stamp('stamp-a', 'A')));

    await collectionExpectation;
    await _flush();
  });
}

ProviderContainer _container({
  required AuthRepository auth,
  required StampRepository stamp,
}) => ProviderContainer(
  overrides: [
    authRepositoryProvider.overrideWithValue(auth),
    stampRepositoryProvider.overrideWithValue(stamp),
  ],
);

void _listenToStampSession(ProviderContainer container) {
  final subscription = container.listen<StampSessionState>(
    stampSessionProvider,
    (previous, next) {},
    fireImmediately: true,
  );
  addTearDown(subscription.close);
}

void _expectLoadStatus(
  ProviderContainer container,
  StampSessionLoadStatus status,
) => expect(container.read(stampSessionProvider).loadStatus, status);

Future<void> _waitForAuth(ProviderContainer container) async {
  await container.read(currentAuthUserProvider.future);
  await _flush();
}

Future<void> _flush() async {
  await Future<void>.delayed(Duration.zero);
  await Future<void>.delayed(Duration.zero);
}

CollectStampRequest _request(String contentId, String title) =>
    CollectStampRequest(
      contentId: contentId,
      title: title,
      kind: StampCandidateKind.spot,
      verificationFix: _fix(),
    );

CollectedStamp _stamp(String contentId, String title) => CollectedStamp(
  contentId: contentId,
  title: title,
  kind: StampCandidateKind.spot,
  verificationFix: _fix(),
  collectedAt: DateTime.utc(2026, 7, 13, 12),
);

LocationFix _fix() => LocationFix(
  coordinates: Coordinates(
    latitude: Latitude(37.579617),
    longitude: Longitude(126.977041),
  ),
  accuracyMeters: 6,
  timestamp: DateTime.utc(2026, 7, 13, 11, 59),
);

final class _ControlledAuthRepository implements AuthRepository {
  _ControlledAuthRepository({this.currentUser, this.signInFuture});

  final StreamController<AuthUser?> _changes = StreamController<AuthUser?>();
  final Future<AuthUser>? signInFuture;

  @override
  AuthUser? currentUser;

  @override
  Stream<AuthUser?> get authStateChanges => _changes.stream;

  @override
  Future<AuthUser> signInAnonymously() async {
    final user =
        await (signInFuture ??
            Future<AuthUser>.value(
              AuthUser.session(id: 'fallback-user', isAnonymous: true),
            ));
    currentUser = user;
    return user;
  }

  void emitUser(AuthUser user) {
    currentUser = user;
    _changes.add(user);
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

final class _ControlledStampRepository implements StampRepository {
  final List<_Pending<List<CollectedStamp>>> _loads =
      <_Pending<List<CollectedStamp>>>[];
  final List<_Pending<CollectStampResult>> _collections =
      <_Pending<CollectStampResult>>[];

  int loadCalls = 0;
  int collectCalls = 0;

  _Pending<List<CollectedStamp>> queueLoad() {
    final pending = _Pending<List<CollectedStamp>>();
    _loads.add(pending);
    return pending;
  }

  _Pending<CollectStampResult> queueCollect() {
    final pending = _Pending<CollectStampResult>();
    _collections.add(pending);
    return pending;
  }

  @override
  Future<List<CollectedStamp>> loadCollected() {
    final pending = _loads[loadCalls];
    loadCalls += 1;
    pending.started.complete();
    return pending.result.future;
  }

  @override
  Future<CollectStampResult> collect(CollectStampRequest request) {
    final pending = _collections[collectCalls];
    collectCalls += 1;
    pending.started.complete();
    return pending.result.future;
  }
}

final class _Pending<T> {
  final Completer<void> started = Completer<void>();
  final Completer<T> result = Completer<T>();
}
