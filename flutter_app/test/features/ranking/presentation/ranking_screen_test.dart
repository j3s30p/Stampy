import 'dart:async';

import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:stampy/core/auth/auth.dart';
import 'package:stampy/core/geo/coordinates.dart';
import 'package:stampy/core/location/location.dart';
import 'package:stampy/features/ranking/data/ranking_providers.dart';
import 'package:stampy/features/ranking/domain/ranking_domain.dart';
import 'package:stampy/features/ranking/presentation/ranking_screen.dart';
import 'package:stampy/features/stamp/data/fake_stamp_repository.dart';
import 'package:stampy/features/stamp/domain/stamp_domain.dart';
import 'package:stampy/features/stamp/presentation/stamp_session.dart';

void main() {
  testWidgets('shows an honest empty weekly ranking', (tester) async {
    await _pumpRankingState(
      tester,
      StampSessionState(loadStatus: StampSessionLoadStatus.loaded),
    );

    expect(find.text('기록 없음'), findsOneWidget);
    expect(find.text('이번 주 첫 도장을\n기다리고 있어요'), findsOneWidget);
    expect(find.text('나의 기록'), findsOneWidget);
    expect(find.text('첫 도장을 모으면\n기록이 시작돼요'), findsOneWidget);
    expect(find.textContaining('준비 중'), findsNothing);
  });

  testWidgets('shows loading while the weekly ranking is pending', (
    tester,
  ) async {
    final pending = Completer<List<WeeklyRankingEntry>>();
    await _pumpRankingState(
      tester,
      StampSessionState(loadStatus: StampSessionLoadStatus.loaded),
      weeklyRanking: () => pending.future,
    );

    expect(find.text('집계 중'), findsOneWidget);
    expect(find.text('이번 주 기록을\n집계하고 있어요'), findsOneWidget);

    pending.complete(const <WeeklyRankingEntry>[]);
    await tester.pumpAndSettle();
  });

  testWidgets('shows a safe weekly ranking failure', (tester) async {
    await _pumpRankingState(
      tester,
      StampSessionState(loadStatus: StampSessionLoadStatus.loaded),
      weeklyRanking: () => Future<List<WeeklyRankingEntry>>.error(
        StateError('private-ranking-error'),
      ),
    );

    expect(find.text('연결 실패'), findsOneWidget);
    expect(find.text('주간 랭킹을\n불러오지 못했어요'), findsOneWidget);
    expect(find.text('다시 시도'), findsOneWidget);
    expect(find.textContaining('private-ranking-error'), findsNothing);
  });

  testWidgets('shows real anonymous and current-user rows with semantics', (
    tester,
  ) async {
    final semanticsHandle = tester.ensureSemantics();
    await _pumpRankingState(
      tester,
      StampSessionState(
        collectedStamps: <CollectedStamp>[_stamp('a')],
        loadStatus: StampSessionLoadStatus.loaded,
      ),
      weeklyRanking: () =>
          Future<List<WeeklyRankingEntry>>.value(<WeeklyRankingEntry>[
            _rankingEntry(rank: 1, stampCount: 3, isCurrentUser: false),
            _rankingEntry(rank: 2, stampCount: 1, isCurrentUser: true),
          ]),
    );

    expect(find.text('이번 주'), findsOneWidget);
    expect(find.text('익명 여행자'), findsOneWidget);
    expect(find.text('나'), findsOneWidget);
    expect(find.text('도장 3개'), findsOneWidget);
    expect(find.text('도장 1개'), findsOneWidget);
    expect(find.bySemanticsLabel('1위, 익명 여행자, 도장 3개'), findsOneWidget);
    expect(find.bySemanticsLabel('2위, 나, 도장 1개'), findsOneWidget);
    expect(find.textContaining('준비 중'), findsNothing);
    semanticsHandle.dispose();
  });

  testWidgets(
    'keeps ranking rows readable at maximum accessibility text size',
    (tester) async {
      await _pumpRankingState(
        tester,
        StampSessionState(loadStatus: StampSessionLoadStatus.loaded),
        textScaler: const TextScaler.linear(3),
        weeklyRanking: () =>
            Future<List<WeeklyRankingEntry>>.value(<WeeklyRankingEntry>[
              _rankingEntry(rank: 1, stampCount: 3, isCurrentUser: false),
              _rankingEntry(rank: 2, stampCount: 1, isCurrentUser: true),
            ]),
      );

      await tester.drag(find.byType(ListView), const Offset(0, -800));
      await tester.pumpAndSettle();

      expect(tester.takeException(), isNull);
      expect(find.text('익명 여행자'), findsOneWidget);
      expect(find.text('도장 3개'), findsOneWidget);
    },
  );

  testWidgets('shows the loaded personal stamp count without claiming a rank', (
    tester,
  ) async {
    await _pumpRankingState(
      tester,
      StampSessionState(
        collectedStamps: <CollectedStamp>[_stamp('a'), _stamp('b')],
        loadStatus: StampSessionLoadStatus.loaded,
      ),
    );

    expect(find.text('지금까지 도장\n2개를 모았어요'), findsOneWidget);
    expect(find.textContaining('현재 순위'), findsNothing);
    expect(find.textContaining('지난주 대비'), findsNothing);
  });

  testWidgets('shows a loading message while an empty collection is loading', (
    tester,
  ) async {
    await _pumpRankingState(tester, StampSessionState());

    expect(find.text('여행 기록을\n불러오고 있어요'), findsOneWidget);
    expect(find.text('수집한 도장을 확인하고 있습니다.'), findsOneWidget);
    expect(find.text('첫 도장을 모으면\n기록이 시작돼요'), findsNothing);
  });

  testWidgets('shows a safe failure message when an empty load fails', (
    tester,
  ) async {
    await _pumpRankingState(
      tester,
      StampSessionState(
        loadStatus: StampSessionLoadStatus.failed,
        error: StateError('private-stamp-error'),
      ),
    );

    expect(find.text('여행 기록을\n불러오지 못했어요'), findsOneWidget);
    expect(find.text('연결 상태를 확인한 뒤 프로필에서 다시 불러와 주세요.'), findsOneWidget);
    expect(find.textContaining('private-stamp-error'), findsNothing);
  });

  for (final (loadStatus, description) in <(StampSessionLoadStatus, String)>[
    (StampSessionLoadStatus.loading, '전체 기록 동기화가 끝나지 않아 현재 확인된 도장만 보여드려요.'),
    (
      StampSessionLoadStatus.failed,
      '전체 기록 동기화에 실패해 현재 확인된 도장만 보여드려요. 프로필에서 다시 불러와 주세요.',
    ),
  ]) {
    testWidgets('shows the known count while the load is ${loadStatus.name}', (
      tester,
    ) async {
      await _pumpRankingState(
        tester,
        StampSessionState(
          collectedStamps: <CollectedStamp>[_stamp('a'), _stamp('b')],
          loadStatus: loadStatus,
          error: loadStatus == StampSessionLoadStatus.failed
              ? StateError('private-stamp-error')
              : null,
        ),
      );

      expect(find.text('확인된 도장\n2개가 있어요'), findsOneWidget);
      expect(find.text(description), findsOneWidget);
      expect(find.textContaining('private-stamp-error'), findsNothing);
    });
  }

  testWidgets('updates the personal stamp count immediately after collection', (
    tester,
  ) async {
    final repository = FakeStampRepository(
      initialStamps: <CollectedStamp>[_stamp('a')],
      clock: () => DateTime.utc(2026, 7, 13, 13),
    );
    await _pumpRanking(tester, repository);

    final container = ProviderScope.containerOf(
      tester.element(find.byType(RankingScreen)),
    );
    await container
        .read(stampSessionProvider.notifier)
        .collect(
          CollectStampRequest(
            contentId: 'b',
            title: '도장 b',
            kind: StampCandidateKind.spot,
            verificationFix: _locationFix(),
          ),
        );
    await tester.pump();

    expect(find.text('지금까지 도장\n2개를 모았어요'), findsOneWidget);
  });
}

Future<void> _pumpRankingState(
  WidgetTester tester,
  StampSessionState state, {
  TextScaler? textScaler,
  Future<List<WeeklyRankingEntry>> Function()? weeklyRanking,
}) async {
  await tester.pumpWidget(
    ProviderScope(
      overrides: [
        stampSessionProvider.overrideWithBuild((ref, notifier) => state),
        weeklyRankingProvider.overrideWith(
          (ref) =>
              weeklyRanking?.call() ??
              Future<List<WeeklyRankingEntry>>.value(
                const <WeeklyRankingEntry>[],
              ),
        ),
      ],
      child: MaterialApp(
        builder: textScaler == null
            ? null
            : (context, child) => MediaQuery(
                data: MediaQuery.of(context).copyWith(textScaler: textScaler),
                child: child!,
              ),
        home: const RankingScreen(),
      ),
    ),
  );
  await tester.pump();
  await tester.pump();
}

Future<void> _pumpRanking(
  WidgetTester tester,
  FakeStampRepository repository,
) async {
  await tester.pumpWidget(
    ProviderScope(
      overrides: [
        authRepositoryProvider.overrideWithValue(
          FakeAuthRepository(
            currentUser: AuthUser.session(
              id: 'ranking-test-user',
              isAnonymous: true,
            ),
          ),
        ),
        stampRepositoryProvider.overrideWithValue(repository),
      ],
      child: const MaterialApp(home: RankingScreen()),
    ),
  );
  await tester.pumpAndSettle();
}

CollectedStamp _stamp(String contentId) => CollectedStamp(
  contentId: contentId,
  title: '도장 $contentId',
  kind: StampCandidateKind.spot,
  verificationFix: _locationFix(),
  collectedAt: DateTime.utc(2026, 7, 13, 12),
);

LocationFix _locationFix() => LocationFix(
  coordinates: Coordinates(
    latitude: Latitude(37.579617),
    longitude: Longitude(126.977041),
  ),
  accuracyMeters: 5,
  timestamp: DateTime.utc(2026, 7, 13, 12),
);

WeeklyRankingEntry _rankingEntry({
  required int rank,
  required int stampCount,
  required bool isCurrentUser,
}) => WeeklyRankingEntry(
  rank: rank,
  stampCount: stampCount,
  isCurrentUser: isCurrentUser,
);
