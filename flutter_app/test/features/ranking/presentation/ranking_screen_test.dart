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
  testWidgets('shows a first-stamp prompt when the collection is empty', (
    tester,
  ) async {
    await _pumpRanking(tester, FakeStampRepository());

    expect(find.text('나의 기록'), findsOneWidget);
    expect(find.text('첫 도장을 모으면\n기록이 시작돼요'), findsOneWidget);
    expect(find.text('— 도장'), findsNWidgets(3));
  });

  testWidgets('shows the loaded personal stamp count without claiming a rank', (
    tester,
  ) async {
    await _pumpRanking(
      tester,
      FakeStampRepository(
        initialStamps: <CollectedStamp>[_stamp('a'), _stamp('b')],
      ),
    );

    expect(find.text('지금까지 도장\n2개를 모았어요'), findsOneWidget);
    expect(find.textContaining('현재 순위'), findsNothing);
    expect(find.textContaining('지난주 대비'), findsNothing);
  });

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
