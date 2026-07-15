import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:stampy/app/theme/app_theme.dart';
import 'package:stampy/core/auth/auth.dart';
import 'package:stampy/core/geo/geo.dart';
import 'package:stampy/core/location/location_state.dart';
import 'package:stampy/features/stamp/data/fake_stamp_repository.dart';
import 'package:stampy/features/stamp/domain/stamp_domain.dart';
import 'package:stampy/features/stamp/presentation/stamp_collection_screen.dart';
import 'package:stampy/features/stamp/presentation/stamp_session.dart';

void main() {
  testWidgets('does not render an empty collection while stamps are loading', (
    tester,
  ) async {
    await _pumpCollectionState(tester, StampSessionState());

    expect(find.text('동기화 중'), findsOneWidget);
    expect(find.text('도장 기록을\n불러오고 있어요'), findsOneWidget);
    expect(find.text('0 / 24'), findsNothing);
    expect(find.text('아직 비어 있음'), findsNothing);
  });

  for (final (loadStatus, badge, title)
      in <(StampSessionLoadStatus, String, String)>[
        (StampSessionLoadStatus.loading, '동기화 중', '도장 기록을\n불러오고 있어요'),
        (StampSessionLoadStatus.failed, '동기화 실패', '도장 기록을\n불러오지 못했어요'),
      ]) {
    testWidgets('keeps known cards while ${loadStatus.name}', (tester) async {
      await _pumpCollectionState(
        tester,
        StampSessionState(
          collectedStamps: <CollectedStamp>[_knownStamp()],
          loadStatus: loadStatus,
          error: loadStatus == StampSessionLoadStatus.failed
              ? StateError('private-stamp-error')
              : null,
        ),
      );

      expect(find.text(badge), findsOneWidget);
      expect(find.text(title), findsOneWidget);
      expect(find.text('확인된 도장'), findsOneWidget);
      expect(find.text('아직 비어 있음'), findsNothing);
      expect(find.textContaining('private-stamp-error'), findsNothing);
    });
  }

  testWidgets('reflects a newly collected stamp and keeps 24 journal slots', (
    tester,
  ) async {
    final repository = FakeStampRepository(
      clock: () => DateTime.utc(2026, 7, 13, 12),
    );

    await tester.pumpWidget(
      ProviderScope(
        overrides: [
          authRepositoryProvider.overrideWithValue(_memberAuth()),
          stampRepositoryProvider.overrideWithValue(repository),
        ],
        child: MaterialApp(
          theme: StampyTheme.light(),
          home: const Scaffold(body: StampCollectionScreen()),
        ),
      ),
    );
    await tester.pumpAndSettle();

    expect(find.text('0 / 24'), findsOneWidget);
    expect(find.text('아직 비어 있음'), findsNWidgets(24));

    final container = ProviderScope.containerOf(
      tester.element(find.byType(StampCollectionScreen)),
    );
    await container
        .read(stampSessionProvider.notifier)
        .collect(
          CollectStampRequest(
            contentId: 'tour-126508',
            title: '경복궁',
            kind: StampCandidateKind.spot,
            verificationFix: LocationFix(
              coordinates: Coordinates(
                latitude: Latitude(37.579617),
                longitude: Longitude(126.977041),
              ),
              accuracyMeters: 5,
              timestamp: DateTime.utc(2026, 7, 13, 11, 59),
            ),
          ),
        );
    await tester.pump();

    expect(find.text('1 / 24'), findsOneWidget);
    expect(find.text('경복궁'), findsOneWidget);
    expect(find.text('2026.07.13'), findsOneWidget);
    expect(find.text('37.5796° N · 126.9770° E'), findsOneWidget);
    expect(find.text('GPS ±5m · 11:59 UTC'), findsOneWidget);
    expect(find.text('아직 비어 있음'), findsNWidgets(23));
  });

  testWidgets('scales one-column cards at maximum accessibility text size', (
    tester,
  ) async {
    tester.view.physicalSize = const Size(320, 800);
    tester.view.devicePixelRatio = 1;
    addTearDown(tester.view.resetPhysicalSize);
    addTearDown(tester.view.resetDevicePixelRatio);
    final repository = FakeStampRepository(
      initialStamps: <CollectedStamp>[
        CollectedStamp(
          contentId: 'tour-long-title',
          title: '아주 긴 이름을 가진 한국의 아름다운 관광지',
          kind: StampCandidateKind.spot,
          verificationFix: LocationFix(
            coordinates: Coordinates(
              latitude: Latitude(37.579617),
              longitude: Longitude(126.977041),
            ),
            accuracyMeters: 7.5,
            timestamp: DateTime.utc(2026, 7, 13, 11, 59),
          ),
          collectedAt: DateTime.utc(2026, 7, 13, 12),
        ),
      ],
    );

    await tester.pumpWidget(
      ProviderScope(
        overrides: [
          authRepositoryProvider.overrideWithValue(_memberAuth()),
          stampRepositoryProvider.overrideWithValue(repository),
        ],
        child: MaterialApp(
          theme: StampyTheme.light(),
          builder: (context, child) => MediaQuery(
            data: MediaQuery.of(
              context,
            ).copyWith(textScaler: const TextScaler.linear(3)),
            child: child!,
          ),
          home: const Scaffold(body: StampCollectionScreen()),
        ),
      ),
    );
    await tester.pumpAndSettle();
    await tester.drag(find.byType(ListView), const Offset(0, -800));
    await tester.pumpAndSettle();

    final grid = tester.widget<GridView>(find.byType(GridView));
    final delegate =
        grid.gridDelegate as SliverGridDelegateWithFixedCrossAxisCount;
    expect(delegate.crossAxisCount, 1);
    expect(delegate.mainAxisExtent, 438);
    expect(find.text('아주 긴 이름을 가진 한국의 아름다운 관광지'), findsOneWidget);
    expect(tester.takeException(), isNull);
  });
}

FakeAuthRepository _memberAuth() => FakeAuthRepository(
  currentUser: AuthUser.session(id: 'member', isAnonymous: false),
);

Future<void> _pumpCollectionState(
  WidgetTester tester,
  StampSessionState state,
) async {
  await tester.pumpWidget(
    ProviderScope(
      overrides: [
        stampSessionProvider.overrideWithBuild((ref, notifier) => state),
      ],
      child: MaterialApp(
        theme: StampyTheme.light(),
        home: const Scaffold(body: StampCollectionScreen()),
      ),
    ),
  );
  await tester.pump();
}

CollectedStamp _knownStamp() => CollectedStamp(
  contentId: 'known-partial-record',
  title: '확인된 도장',
  kind: StampCandidateKind.spot,
  verificationFix: LocationFix(
    coordinates: Coordinates(
      latitude: Latitude(37.579617),
      longitude: Longitude(126.977041),
    ),
    accuracyMeters: 5,
    timestamp: DateTime.utc(2026, 7, 13, 11, 59),
  ),
  collectedAt: DateTime.utc(2026, 7, 13, 12),
);
