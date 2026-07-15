import 'dart:async';

import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:stampy/core/auth/auth.dart';
import 'package:stampy/core/geo/coordinates.dart';
import 'package:stampy/core/location/location.dart';
import 'package:stampy/features/recommendation/data/recommendation_providers.dart';
import 'package:stampy/features/recommendation/domain/recommendation_domain.dart';

void main() {
  test(
    'signed-out state never reaches the recommendation repository',
    () async {
      final location = FakeLocationRepository(state: _availableLocation());
      final recommendation = _ControlledRecommendationRepository();
      final container = _container(
        location: location,
        recommendation: recommendation,
      );
      addTearDown(container.dispose);
      _listen(container);

      expect(await container.read(nearbyRecommendationProvider.future), isNull);
      expect(location.requestCount, 0);
      expect(recommendation.loadCalls, 0);
    },
  );

  test('waits for authenticated user and current GPS before loading', () async {
    final auth = _ControlledAuthRepository();
    final location = _PendingLocationRepository();
    final recommendation = _ControlledRecommendationRepository();
    final pendingRecommendation = recommendation.queueLoad();
    final container = _container(
      auth: auth,
      location: location,
      recommendation: recommendation,
    );
    addTearDown(auth.dispose);
    addTearDown(container.dispose);
    _listen(container);

    await _flush();
    expect(location.requestCount, 0);
    expect(recommendation.loadCalls, 0);

    auth.emit(AuthUser.session(id: 'user-a', isAnonymous: false));
    await location.started.future;
    expect(recommendation.loadCalls, 0);

    location.result.complete(_availableLocation());
    expect(await pendingRecommendation.started.future, _coordinates());
    pendingRecommendation.result.complete(_recommendation('spot-a', '경복궁'));

    expect(
      (await container.read(nearbyRecommendationProvider.future))?.contentId,
      'spot-a',
    );
    expect(recommendation.loadCalls, 1);
  });

  test('unavailable GPS does not call the recommendation repository', () async {
    final recommendation = _ControlledRecommendationRepository();
    final container = _container(
      auth: _ControlledAuthRepository(
        currentUser: AuthUser.session(id: 'user-a', isAnonymous: true),
      ),
      location: FakeLocationRepository(
        state: const LocationState.permissionDenied(),
      ),
      recommendation: recommendation,
    );
    addTearDown(container.dispose);
    _listen(container);

    expect(await container.read(nearbyRecommendationProvider.future), isNull);
    expect(recommendation.loadCalls, 0);
  });

  test('auth failure stays ahead of GPS and recommendation loading', () async {
    final location = FakeLocationRepository(state: _availableLocation());
    final recommendation = _ControlledRecommendationRepository();
    final container = _container(
      auth: _ErrorAuthRepository(StateError('offline')),
      location: location,
      recommendation: recommendation,
    );
    addTearDown(container.dispose);
    _listen(container);

    await expectLater(
      container.read(nearbyRecommendationProvider.future),
      throwsStateError,
    );
    expect(location.requestCount, 0);
    expect(recommendation.loadCalls, 0);
  });

  test('same user auth refresh does not reload a recommendation', () async {
    final auth = _ControlledAuthRepository(
      currentUser: AuthUser.session(id: 'user-a', isAnonymous: true),
    );
    final recommendation = _ControlledRecommendationRepository();
    recommendation.queueLoad().result.complete(
      _recommendation('spot-a', '경복궁'),
    );
    final container = _container(
      auth: auth,
      location: FakeLocationRepository(state: _availableLocation()),
      recommendation: recommendation,
    );
    addTearDown(auth.dispose);
    addTearDown(container.dispose);
    _listen(container);

    await container.read(nearbyRecommendationProvider.future);
    auth.emit(AuthUser.session(id: 'user-a', isAnonymous: true));
    await _flush();

    expect(recommendation.loadCalls, 1);
    expect(
      container.read(nearbyRecommendationProvider).requireValue?.contentId,
      'spot-a',
    );
  });

  test('user transition ignores the previous recommendation result', () async {
    final auth = _ControlledAuthRepository(
      currentUser: AuthUser.session(id: 'user-a', isAnonymous: true),
    );
    final recommendation = _ControlledRecommendationRepository();
    final userALoad = recommendation.queueLoad();
    final userBLoad = recommendation.queueLoad();
    final container = _container(
      auth: auth,
      location: FakeLocationRepository(state: _availableLocation()),
      recommendation: recommendation,
    );
    addTearDown(auth.dispose);
    addTearDown(container.dispose);
    _listen(container);

    await userALoad.started.future;
    auth.emit(AuthUser.session(id: 'user-b', isAnonymous: true));
    await userBLoad.started.future;
    userBLoad.result.complete(_recommendation('spot-b', '창덕궁'));
    await _flush();

    expect(
      container.read(nearbyRecommendationProvider).requireValue?.contentId,
      'spot-b',
    );

    userALoad.result.complete(_recommendation('spot-a', '경복궁'));
    await _flush();

    expect(
      container.read(nearbyRecommendationProvider).requireValue?.contentId,
      'spot-b',
    );
    expect(recommendation.loadCalls, 2);
  });

  test('signed-out state clears the previous user recommendation', () async {
    final auth = _ControlledAuthRepository(
      currentUser: AuthUser.session(id: 'user-a', isAnonymous: true),
    );
    final recommendation = _ControlledRecommendationRepository();
    final userALoad = recommendation.queueLoad();
    final userBLoad = recommendation.queueLoad();
    final container = _container(
      auth: auth,
      location: FakeLocationRepository(state: _availableLocation()),
      recommendation: recommendation,
    );
    addTearDown(auth.dispose);
    addTearDown(container.dispose);
    _listen(container);

    await userALoad.started.future;
    await auth.signOut();
    await _flush();

    expect(
      container.read(currentAuthUserProvider).requireValue.isSignedOut,
      isTrue,
    );
    expect(container.read(nearbyRecommendationProvider).requireValue, isNull);

    userALoad.result.complete(_recommendation('spot-a', '경복궁'));
    await _flush();
    expect(container.read(nearbyRecommendationProvider).requireValue, isNull);

    auth.emit(AuthUser.session(id: 'user-b', isAnonymous: false));
    await userBLoad.started.future;
    userBLoad.result.complete(_recommendation('spot-b', '창덕궁'));
    await _flush();

    expect(
      container.read(nearbyRecommendationProvider).requireValue?.contentId,
      'spot-b',
    );
    expect(recommendation.loadCalls, 2);
  });

  test('explicit collection refresh reloads at the same location', () async {
    final auth = _ControlledAuthRepository(
      currentUser: AuthUser.session(id: 'user-a', isAnonymous: true),
    );
    final location = FakeLocationRepository(state: _availableLocation());
    final recommendation = _ControlledRecommendationRepository();
    recommendation.queueLoad().result.complete(
      _recommendation('spot-a', '경복궁'),
    );
    final secondLoad = recommendation.queueLoad()
      ..result.complete(_recommendation('spot-b', '창덕궁'));
    final container = _container(
      auth: auth,
      location: location,
      recommendation: recommendation,
    );
    addTearDown(auth.dispose);
    addTearDown(container.dispose);
    _listen(container);

    await container.read(nearbyRecommendationProvider.future);
    container.invalidate(nearbyRecommendationProvider);

    await secondLoad.started.future;
    await _flush();

    expect(recommendation.loadCalls, 2);
    expect(
      container.read(nearbyRecommendationProvider).requireValue?.contentId,
      'spot-b',
    );
  });

  test('pending recommendation is safe after provider disposal', () async {
    final auth = _ControlledAuthRepository(
      currentUser: AuthUser.session(id: 'user-a', isAnonymous: true),
    );
    final recommendation = _ControlledRecommendationRepository();
    final pending = recommendation.queueLoad();
    final container = _container(
      auth: auth,
      location: FakeLocationRepository(state: _availableLocation()),
      recommendation: recommendation,
    );
    addTearDown(auth.dispose);
    final subscription = container.listen<AsyncValue<Recommendation?>>(
      nearbyRecommendationProvider,
      (previous, next) {},
      fireImmediately: true,
    );

    await pending.started.future;
    subscription.close();
    container.dispose();
    pending.result.complete(_recommendation('spot-a', '경복궁'));

    await _flush();
  });

  test('does not start a recommendation after GPS wait is disposed', () async {
    final auth = _ControlledAuthRepository(
      currentUser: AuthUser.session(id: 'user-a', isAnonymous: true),
    );
    final location = _PendingLocationRepository();
    final recommendation = _ControlledRecommendationRepository();
    final container = _container(
      auth: auth,
      location: location,
      recommendation: recommendation,
    );
    addTearDown(auth.dispose);
    final subscription = container.listen<AsyncValue<Recommendation?>>(
      nearbyRecommendationProvider,
      (previous, next) {},
      fireImmediately: true,
    );

    await location.started.future;
    subscription.close();
    container.dispose();
    location.result.complete(_availableLocation());

    await _flush();
    expect(recommendation.loadCalls, 0);
  });
}

ProviderContainer _container({
  AuthRepository? auth,
  required LocationRepository location,
  required RecommendationRepository recommendation,
}) => ProviderContainer(
  overrides: [
    if (auth != null) authRepositoryProvider.overrideWithValue(auth),
    locationRepositoryProvider.overrideWithValue(location),
    recommendationRepositoryProvider.overrideWithValue(recommendation),
  ],
);

void _listen(ProviderContainer container) {
  final subscription = container.listen<AsyncValue<Recommendation?>>(
    nearbyRecommendationProvider,
    (previous, next) {},
    fireImmediately: true,
  );
  addTearDown(subscription.close);
}

Future<void> _flush() async {
  await Future<void>.delayed(Duration.zero);
  await Future<void>.delayed(Duration.zero);
}

LocationState _availableLocation() => LocationState.available(
  LocationFix(
    coordinates: _coordinates(),
    accuracyMeters: 5,
    timestamp: DateTime.utc(2026, 7, 13, 12),
  ),
);

Coordinates _coordinates() => Coordinates(
  latitude: Latitude(37.579617),
  longitude: Longitude(126.977041),
);

Recommendation _recommendation(String contentId, String title) =>
    Recommendation(
      contentId: contentId,
      title: title,
      contentKind: RecommendationContentKind.spot,
      location: _coordinates(),
      distanceMeters: 218.5,
      score: 78.15,
      reason: RecommendationReason.nearbyUncollected,
      generatedAt: DateTime.utc(2026, 7, 13, 12),
    );

final class _ControlledAuthRepository implements AuthRepository {
  _ControlledAuthRepository({this.currentUser});

  final StreamController<AuthUser?> _changes = StreamController<AuthUser?>();

  @override
  AuthUser? currentUser;

  @override
  Stream<AuthUser?> get authStateChanges => _changes.stream;

  @override
  Future<void> signInWithKakao() async {
    emit(AuthUser.session(id: 'fallback-member', isAnonymous: false));
  }

  void emit(AuthUser user) {
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

final class _PendingLocationRepository implements LocationRepository {
  final Completer<void> started = Completer<void>();
  final Completer<LocationState> result = Completer<LocationState>();
  int requestCount = 0;

  @override
  Future<LocationState> getCurrentLocation() {
    requestCount += 1;
    started.complete();
    return result.future;
  }
}

final class _ControlledRecommendationRepository
    implements RecommendationRepository {
  final List<_PendingRecommendation> _pending = <_PendingRecommendation>[];
  int loadCalls = 0;

  _PendingRecommendation queueLoad() {
    final pending = _PendingRecommendation();
    _pending.add(pending);
    return pending;
  }

  @override
  Future<Recommendation?> loadRecommendation(Coordinates currentLocation) {
    loadCalls += 1;
    if (_pending.isEmpty) {
      throw StateError('No recommendation result was queued.');
    }
    final pending = _pending.removeAt(0);
    pending.started.complete(currentLocation);
    return pending.result.future;
  }
}

final class _PendingRecommendation {
  final Completer<Coordinates> started = Completer<Coordinates>();
  final Completer<Recommendation?> result = Completer<Recommendation?>();
}
