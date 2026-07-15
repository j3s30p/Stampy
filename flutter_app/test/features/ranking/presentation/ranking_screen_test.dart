import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:stampy/core/auth/auth.dart';
import 'package:stampy/core/geo/coordinates.dart';
import 'package:stampy/core/location/location.dart';
import 'package:stampy/features/ranking/presentation/ranking_screen.dart';
import 'package:stampy/features/stamp/data/fake_stamp_repository.dart';
import 'package:stampy/features/stamp/domain/stamp_domain.dart';
import 'package:stampy/features/stamp/presentation/stamp_session.dart';

void main() {
  testWidgets('shows an honest ranking preparation state', (tester) async {
    await _pumpRankingState(
      tester,
      StampSessionState(loadStatus: StampSessionLoadStatus.loaded),
    );

    expect(find.text('준비 중'), findsOneWidget);
    expect(find.text('여행자들의 도장 기록을 비교하는 기능을 준비하고 있습니다.'), findsOneWidget);
    expect(find.text('주간 랭킹을\n준비하고 있어요'), findsOneWidget);
    expect(find.text('여행자들의 도장 기록을 비교하는 기능은 아직 준비 중이에요.'), findsOneWidget);
    expect(find.text('나의 기록'), findsOneWidget);
    expect(find.text('첫 도장을 모으면\n기록이 시작돼요'), findsOneWidget);
    expect(find.text('이번 주'), findsNothing);
    expect(find.text('첫 번째 여행자'), findsNothing);
    expect(find.text('두 번째 여행자'), findsNothing);
    expect(find.text('세 번째 여행자'), findsNothing);
    expect(find.text('— 도장'), findsNothing);
  });

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
    expect(find.textContaining('첫 도장'), findsNothing);
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
  StampSessionState state,
) async {
  await tester.pumpWidget(
    ProviderScope(
      overrides: [
        stampSessionProvider.overrideWithBuild((ref, notifier) => state),
      ],
      child: const MaterialApp(home: RankingScreen()),
    ),
  );
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
