import 'dart:async';

import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:stampy/core/auth/auth.dart';
import 'package:stampy/core/geo/coordinates.dart';
import 'package:stampy/core/location/location.dart';
import 'package:stampy/core/widgets/field_journal.dart';
import 'package:stampy/features/home/presentation/home_screen.dart';
import 'package:stampy/features/recommendation/data/fake_recommendation_repository.dart';
import 'package:stampy/features/recommendation/data/recommendation_providers.dart';
import 'package:stampy/features/recommendation/domain/recommendation_domain.dart';
import 'package:stampy/features/stamp/data/fake_stamp_repository.dart';
import 'package:stampy/features/stamp/domain/stamp_domain.dart';
import 'package:stampy/features/stamp/presentation/stamp_session.dart';

void main() {
  testWidgets(
    'shows one nearby uncollected badge and selects the exact recommendation',
    (tester) async {
      final semanticsHandle = tester.ensureSemantics();
      final recommendation = _recommendation();
      Recommendation? selectedRecommendation;
      await _pumpHome(
        tester,
        location: FakeLocationRepository(state: _availableLocation()),
        recommendation: FakeRecommendationRepository(
          recommendation: recommendation,
        ),
        onRecommendationSelected: (selected) {
          selectedRecommendation = selected;
        },
      );
      await tester.pumpAndSettle();

      expect(find.text('GPS 연결됨'), findsOneWidget);
      expect(find.text('추천 1곳'), findsOneWidget);
      expect(find.text('가까운 미수집'), findsOneWidget);
      expect(find.text('경복궁'), findsOneWidget);
      expect(find.text('현재 위치에서 219m · 아직 수집하지 않은 도장이에요.'), findsOneWidget);
      expect(find.text('추천 예정'), findsNothing);
      expect(find.textContaining('78.15'), findsNothing);

      final notice = tester.widget<JournalNotice>(find.byType(JournalNotice));
      expect(notice.onTap, isNotNull);
      expect(
        tester.getSemantics(find.text('경복궁')),
        isSemantics(isButton: true, hasTapAction: true),
      );
      await tester.tap(find.text('경복궁'));
      expect(selectedRecommendation, same(recommendation));
      semanticsHandle.dispose();
    },
  );

  testWidgets('distinguishes missing GPS from an empty recommendation', (
    tester,
  ) async {
    await _pumpHome(
      tester,
      location: FakeLocationRepository(
        state: const LocationState.permissionDenied(),
      ),
      recommendation: const FakeRecommendationRepository(),
    );
    await tester.pumpAndSettle();

    expect(find.text('GPS 필요'), findsNWidgets(2));
    expect(find.text('위치 권한이 필요해요'), findsOneWidget);
    expect(find.text('추천 없음'), findsNothing);
    expect(
      tester.widget<JournalNotice>(find.byType(JournalNotice)).onTap,
      isNull,
    );

    await _pumpHome(
      tester,
      location: FakeLocationRepository(state: _availableLocation()),
      recommendation: const FakeRecommendationRepository(),
    );
    await tester.pumpAndSettle();

    expect(find.text('GPS 연결됨'), findsOneWidget);
    expect(find.text('추천 없음'), findsOneWidget);
    expect(find.text('1km 안의 미수집 도장을 모두 모았어요'), findsOneWidget);
    expect(
      tester.widget<JournalNotice>(find.byType(JournalNotice)).onTap,
      isNull,
    );
  });

  testWidgets('shows a safe recommendation error without transport details', (
    tester,
  ) async {
    await _pumpHome(
      tester,
      location: FakeLocationRepository(state: _availableLocation()),
      recommendation: const _ErrorRecommendationRepository(),
    );
    await tester.pumpAndSettle();

    expect(find.text('연결 실패'), findsOneWidget);
    expect(find.text('추천을 불러오지 못했어요'), findsOneWidget);
    expect(find.textContaining('private transport detail'), findsNothing);
  });

  testWidgets('does not describe an unqueried guest result as all collected', (
    tester,
  ) async {
    await _pumpHome(
      tester,
      auth: const FakeAuthRepository(),
      location: FakeLocationRepository(state: _availableLocation()),
      recommendation: const FakeRecommendationRepository(),
      stamp: FakeStampRepository(initialStamps: <CollectedStamp>[_stamp('a')]),
    );
    await tester.pumpAndSettle();

    expect(find.text('게스트 모드'), findsOneWidget);
    expect(find.text('추천 데이터 연결이 필요해요'), findsOneWidget);
    expect(find.text('1km 안의 미수집 도장을 모두 모았어요'), findsNothing);
    expect(find.text('1'), findsOneWidget);
  });

  testWidgets('shows loaded stamps and updates immediately after collection', (
    tester,
  ) async {
    final repository = FakeStampRepository(
      initialStamps: <CollectedStamp>[_stamp('a'), _stamp('b')],
      clock: () => DateTime.utc(2026, 7, 13, 13),
    );
    await _pumpHome(
      tester,
      location: FakeLocationRepository(state: _availableLocation()),
      recommendation: const FakeRecommendationRepository(),
      stamp: repository,
    );
    await tester.pumpAndSettle();

    expect(find.text('2'), findsOneWidget);

    final container = ProviderScope.containerOf(
      tester.element(find.byType(HomeScreen)),
    );
    await container
        .read(stampSessionProvider.notifier)
        .collect(
          CollectStampRequest(
            contentId: 'c',
            title: '도장 c',
            kind: StampCandidateKind.spot,
            verificationFix: _locationFix(),
          ),
        );
    await tester.pump();

    expect(find.text('3'), findsOneWidget);
  });

  testWidgets('shows loading while the current GPS request is pending', (
    tester,
  ) async {
    final location = _PendingLocationRepository();
    await _pumpHome(
      tester,
      location: location,
      recommendation: const FakeRecommendationRepository(),
    );
    await tester.pump();

    expect(find.text('GPS 확인 중'), findsOneWidget);
    expect(find.text('추천 계산 중'), findsOneWidget);
    expect(find.text('가까운 미수집 도장을 찾고 있어요'), findsOneWidget);

    location.result.complete(const LocationState.unavailable());
    await tester.pumpAndSettle();
  });
}

Future<void> _pumpHome(
  WidgetTester tester, {
  AuthRepository? auth,
  required LocationRepository location,
  required RecommendationRepository recommendation,
  StampRepository? stamp,
  ValueChanged<Recommendation>? onRecommendationSelected,
}) => tester.pumpWidget(
  ProviderScope(
    overrides: [
      authRepositoryProvider.overrideWithValue(
        auth ??
            FakeAuthRepository(
              currentUser: AuthUser.session(
                id: 'home-test-user',
                isAnonymous: true,
              ),
            ),
      ),
      locationRepositoryProvider.overrideWithValue(location),
      recommendationRepositoryProvider.overrideWithValue(recommendation),
      if (stamp != null) stampRepositoryProvider.overrideWithValue(stamp),
    ],
    child: MaterialApp(
      home: HomeScreen(onRecommendationSelected: onRecommendationSelected),
    ),
  ),
);

LocationState _availableLocation() => LocationState.available(_locationFix());

LocationFix _locationFix() => LocationFix(
  coordinates: _coordinates(),
  accuracyMeters: 5,
  timestamp: DateTime.utc(2026, 7, 13, 12),
);

CollectedStamp _stamp(String contentId) => CollectedStamp(
  contentId: contentId,
  title: '도장 $contentId',
  kind: StampCandidateKind.spot,
  verificationFix: _locationFix(),
  collectedAt: DateTime.utc(2026, 7, 13, 12),
);

Coordinates _coordinates() => Coordinates(
  latitude: Latitude(37.579617),
  longitude: Longitude(126.977041),
);

Recommendation _recommendation() => Recommendation(
  contentId: 'tour-126508',
  title: '경복궁',
  contentKind: RecommendationContentKind.spot,
  location: _coordinates(),
  distanceMeters: 218.5,
  score: 78.15,
  reason: RecommendationReason.nearbyUncollected,
  generatedAt: DateTime.utc(2026, 7, 13, 12),
);

final class _ErrorRecommendationRepository implements RecommendationRepository {
  const _ErrorRecommendationRepository();

  @override
  Future<Recommendation?> loadRecommendation(Coordinates currentLocation) =>
      Future<Recommendation?>.error(Exception('private transport detail'));
}

final class _PendingLocationRepository implements LocationRepository {
  final Completer<LocationState> result = Completer<LocationState>();

  @override
  Future<LocationState> getCurrentLocation() => result.future;
}
