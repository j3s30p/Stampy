import 'dart:async';

import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:stampy/core/auth/auth.dart';
import 'package:stampy/core/geo/coordinates.dart';
import 'package:stampy/core/location/location.dart';
import 'package:stampy/features/profile/presentation/profile_screen.dart';
import 'package:stampy/features/stamp/data/fake_stamp_repository.dart';
import 'package:stampy/features/stamp/domain/stamp_domain.dart';
import 'package:stampy/features/stamp/presentation/stamp_session.dart';

void main() {
  testWidgets('shows the development guest state and read-only app status', (
    tester,
  ) async {
    final semanticsHandle = tester.ensureSemantics();

    await _pumpProfile(
      tester,
      const FakeAuthRepository(currentUser: AuthUser.guest()),
    );

    expect(find.text('GUEST'), findsOneWidget);
    expect(find.text('개발용 게스트 모드'), findsOneWidget);
    expect(find.text('나의 탐험 정보를\n확인하세요'), findsOneWidget);
    expect(find.text('계정과 위치 권한 등 현재 앱 상태를 한곳에서 확인할 수 있습니다.'), findsOneWidget);
    expect(find.text('앱 상태'), findsOneWidget);
    expect(find.text('위치 권한'), findsOneWidget);
    expect(find.text('알림'), findsOneWidget);
    expect(find.text('개인정보'), findsOneWidget);
    expect(find.text('준비 중'), findsOneWidget);
    expect(find.text('나의 탐험 정보를\n관리하세요'), findsNothing);
    expect(find.text('앱 설정'), findsNothing);
    expect(find.text('보기'), findsNothing);
    expect(find.byIcon(Icons.chevron_right), findsNothing);

    for (final label in <String>['위치 권한', '알림', '개인정보']) {
      expect(
        tester.getSemantics(find.text(label)),
        isSemantics(hasTapAction: false),
      );
    }
    semanticsHandle.dispose();
  });

  testWidgets('shows an anonymous session without exposing its user id', (
    tester,
  ) async {
    const privateId = 'private-anonymous-user-id';
    await _pumpProfile(
      tester,
      FakeAuthRepository(
        currentUser: AuthUser.session(id: privateId, isAnonymous: true),
      ),
      stamp: FakeStampRepository(
        initialStamps: <CollectedStamp>[_stamp('a'), _stamp('b')],
      ),
    );

    expect(find.text('ANONYMOUS'), findsOneWidget);
    expect(find.text('익명 세션 연결'), findsOneWidget);
    expect(find.text('여행 기록이 연결됐습니다. 수집한 도장 2개를 불러왔습니다.'), findsOneWidget);
    expect(find.textContaining('동기화는 준비 중'), findsNothing);
    expect(find.textContaining(privateId), findsNothing);
  });

  testWidgets('shows a connected member without exposing its user id', (
    tester,
  ) async {
    const privateId = 'private-member-user-id';
    await _pumpProfile(
      tester,
      FakeAuthRepository(
        currentUser: AuthUser.session(id: privateId, isAnonymous: false),
      ),
    );

    expect(find.text('MEMBER'), findsOneWidget);
    expect(find.text('계정 연결'), findsOneWidget);
    expect(find.text('여행 기록이 연결됐습니다. 수집한 도장 0개를 불러왔습니다.'), findsOneWidget);
    expect(find.textContaining(privateId), findsNothing);
  });

  testWidgets('moves from stamp sync loading to the loaded count', (
    tester,
  ) async {
    final repository = _ControlledStampRepository();
    final load = repository.queueLoad();
    await _pumpProfile(
      tester,
      FakeAuthRepository(
        currentUser: AuthUser.session(
          id: 'pending-stamp-user',
          isAnonymous: true,
        ),
      ),
      stamp: repository,
      settle: false,
    );
    await load.started.future;

    expect(find.text('여행 기록을 동기화하고 있습니다.'), findsOneWidget);

    load.result.complete(<CollectedStamp>[_stamp('a')]);
    await tester.pumpAndSettle();

    expect(find.text('여행 기록이 연결됐습니다. 수집한 도장 1개를 불러왔습니다.'), findsOneWidget);
  });

  testWidgets('retries only the failed stamp sync without exposing its error', (
    tester,
  ) async {
    final repository = _ControlledStampRepository();
    final failedLoad = repository.queueLoad();
    final retryLoad = repository.queueLoad();
    await _pumpProfile(
      tester,
      FakeAuthRepository(
        currentUser: AuthUser.session(
          id: 'retry-stamp-user',
          isAnonymous: true,
        ),
      ),
      stamp: repository,
      settle: false,
    );
    await failedLoad.started.future;
    failedLoad.result.completeError(StateError('private-stamp-error'));
    await tester.pumpAndSettle();

    expect(
      find.text('여행 기록 동기화에 실패했습니다. 연결 상태를 확인한 뒤 다시 시도해 주세요.'),
      findsOneWidget,
    );
    expect(find.textContaining('private-stamp-error'), findsNothing);

    await tester.tap(find.text('여행 기록 다시 불러오기'));
    await tester.pump();
    await retryLoad.started.future;

    expect(find.text('여행 기록을 동기화하고 있습니다.'), findsOneWidget);

    retryLoad.result.complete(<CollectedStamp>[_stamp('a'), _stamp('b')]);
    await tester.pumpAndSettle();

    expect(repository.loadCalls, 2);
    expect(find.text('여행 기록이 연결됐습니다. 수집한 도장 2개를 불러왔습니다.'), findsOneWidget);
    expect(find.text('여행 기록 다시 불러오기'), findsNothing);
  });

  testWidgets('shows a sanitized error state', (tester) async {
    const privateError = 'private-auth-error';
    await _pumpProfile(
      tester,
      _StubAuthRepository(
        signIn: () => Future<AuthUser>.error(StateError(privateError)),
      ),
    );

    expect(find.text('OFFLINE'), findsOneWidget);
    expect(find.text('세션 연결 실패'), findsOneWidget);
    expect(find.text('다시 시도'), findsOneWidget);
    expect(find.textContaining(privateError), findsNothing);
  });

  testWidgets('retries a failed session connection on request', (tester) async {
    var attempts = 0;
    await _pumpProfile(
      tester,
      _StubAuthRepository(
        signIn: () {
          attempts += 1;
          if (attempts == 1) {
            return Future<AuthUser>.error(StateError('offline'));
          }
          return Future<AuthUser>.value(const AuthUser.guest());
        },
      ),
    );

    await tester.tap(find.text('다시 시도'));
    await tester.pumpAndSettle();

    expect(find.text('GUEST'), findsOneWidget);
    expect(find.text('다시 시도'), findsNothing);
    expect(attempts, 2);
  });

  testWidgets('does not offer retry for a bootstrap configuration failure', (
    tester,
  ) async {
    await _pumpProfile(tester, const UnavailableAuthRepository());

    expect(find.text('OFFLINE'), findsOneWidget);
    expect(find.text('Supabase 설정을 확인한 뒤 앱을 다시 실행해 주세요.'), findsOneWidget);
    expect(find.text('다시 시도'), findsNothing);
  });

  testWidgets('shows a session loading state', (tester) async {
    final pending = Completer<AuthUser>();
    await tester.pumpWidget(
      ProviderScope(
        overrides: [
          authRepositoryProvider.overrideWithValue(
            _StubAuthRepository(signIn: () => pending.future),
          ),
          locationRepositoryProvider.overrideWithValue(
            FakeLocationRepository(state: const LocationState.unavailable()),
          ),
        ],
        child: const MaterialApp(home: ProfileScreen()),
      ),
    );
    await tester.pump();

    expect(find.text('SESSION'), findsOneWidget);
    expect(find.text('세션 준비 중'), findsOneWidget);

    pending.complete(const AuthUser.guest());
    await tester.pumpAndSettle();
  });

  testWidgets('shows each resolved GPS status without exposing coordinates', (
    tester,
  ) async {
    for (final (state, label) in <(LocationState, String)>[
      (_availableLocation(), '연결됨'),
      (const LocationState.serviceDisabled(), '서비스 꺼짐'),
      (const LocationState.permissionDenied(), '권한 필요'),
      (const LocationState.permissionDeniedForever(), '설정 필요'),
      (const LocationState.unavailable(), '확인 불가'),
    ]) {
      await _pumpProfile(
        tester,
        const FakeAuthRepository(currentUser: AuthUser.guest()),
        location: FakeLocationRepository(state: state),
      );

      expect(find.text(label), findsOneWidget);
      expect(find.textContaining('37.579617'), findsNothing);
      expect(find.textContaining('126.977041'), findsNothing);
    }
  });

  testWidgets('moves from GPS loading to connected', (tester) async {
    final location = _PendingLocationRepository();
    await tester.pumpWidget(
      ProviderScope(
        overrides: [
          authRepositoryProvider.overrideWithValue(
            const FakeAuthRepository(currentUser: AuthUser.guest()),
          ),
          locationRepositoryProvider.overrideWithValue(location),
        ],
        child: const MaterialApp(home: ProfileScreen()),
      ),
    );
    await tester.pump();

    expect(find.text('확인 중'), findsOneWidget);

    location.result.complete(_availableLocation());
    await tester.pumpAndSettle();
    expect(find.text('연결됨'), findsOneWidget);
  });

  testWidgets('sanitizes an unexpected GPS error', (tester) async {
    await _pumpProfile(
      tester,
      const FakeAuthRepository(currentUser: AuthUser.guest()),
      location: const _ErrorLocationRepository(),
    );

    expect(find.text('확인 불가'), findsOneWidget);
    expect(find.textContaining('private-location-error'), findsNothing);
  });
}

Future<void> _pumpProfile(
  WidgetTester tester,
  AuthRepository repository, {
  LocationRepository? location,
  StampRepository? stamp,
  bool settle = true,
}) async {
  await tester.pumpWidget(
    ProviderScope(
      overrides: [
        authRepositoryProvider.overrideWithValue(repository),
        locationRepositoryProvider.overrideWithValue(
          location ??
              FakeLocationRepository(state: const LocationState.unavailable()),
        ),
        if (stamp != null) stampRepositoryProvider.overrideWithValue(stamp),
      ],
      child: const MaterialApp(home: ProfileScreen()),
    ),
  );
  if (settle) {
    await tester.pumpAndSettle();
  } else {
    await tester.pump();
    await tester.pump();
  }
}

LocationState _availableLocation() => LocationState.available(
  LocationFix(
    coordinates: Coordinates(
      latitude: Latitude(37.579617),
      longitude: Longitude(126.977041),
    ),
    accuracyMeters: 5,
    timestamp: DateTime.utc(2026, 7, 13, 12),
  ),
);

CollectedStamp _stamp(String contentId) => CollectedStamp(
  contentId: contentId,
  title: '도장 $contentId',
  kind: StampCandidateKind.spot,
  verificationFix: _availableLocation().fix!,
  collectedAt: DateTime.utc(2026, 7, 13, 12),
);

final class _StubAuthRepository implements AuthRepository {
  const _StubAuthRepository({required this.signIn});

  final Future<AuthUser> Function() signIn;

  @override
  AuthUser? get currentUser => null;

  @override
  Stream<AuthUser?> get authStateChanges => const Stream<AuthUser?>.empty();

  @override
  Future<AuthUser> signInAnonymously() => signIn();
}

final class _PendingLocationRepository implements LocationRepository {
  final Completer<LocationState> result = Completer<LocationState>();

  @override
  Future<LocationState> getCurrentLocation() => result.future;
}

final class _ErrorLocationRepository implements LocationRepository {
  const _ErrorLocationRepository();

  @override
  Future<LocationState> getCurrentLocation() =>
      Future<LocationState>.error(StateError('private-location-error'));
}

final class _ControlledStampRepository implements StampRepository {
  final List<_PendingStampLoad> _loads = <_PendingStampLoad>[];

  int loadCalls = 0;

  _PendingStampLoad queueLoad() {
    final pending = _PendingStampLoad();
    _loads.add(pending);
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
  Future<CollectStampResult> collect(CollectStampRequest request) =>
      Future<CollectStampResult>.error(
        const StampRepositoryException('Collection is not used in this test.'),
      );
}

final class _PendingStampLoad {
  final Completer<void> started = Completer<void>();
  final Completer<List<CollectedStamp>> result =
      Completer<List<CollectedStamp>>();
}
