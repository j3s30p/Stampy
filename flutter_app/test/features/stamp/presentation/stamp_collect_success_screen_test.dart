import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:stampy/app/theme/app_theme.dart';
import 'package:stampy/core/geo/geo.dart';
import 'package:stampy/core/location/location_state.dart';
import 'package:stampy/features/stamp/domain/stamp_domain.dart';
import 'package:stampy/features/stamp/presentation/stamp_collect_success_screen.dart';

void main() {
  final stamp = CollectedStamp(
    contentId: 'tour-126508',
    title: '경복궁',
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
  );

  testWidgets('shows the collected stamp metadata and journal progress', (
    tester,
  ) async {
    await tester.pumpWidget(
      MaterialApp(
        theme: StampyTheme.light(),
        home: StampCollectSuccessScreen(
          stamp: stamp,
          collectedCount: 9,
          onViewCollection: () {},
          onContinueTravel: () {},
        ),
      ),
    );

    final animation = tester.widget<ScaleTransition>(
      find.byKey(const Key('vermilion-stamp-animation')),
    );
    expect(animation.scale.value, greaterThan(1));

    await tester.pumpAndSettle();

    expect(find.text('경복궁'), findsOneWidget);
    expect(find.text('경복궁 도장을 수집했어요'), findsOneWidget);
    expect(find.text('37.5796° N · 126.9770° E'), findsOneWidget);
    expect(find.text('GPS ±7.5m · 11:59:00 UTC'), findsOneWidget);
    expect(find.text('KOREA · 2026.07.13'), findsOneWidget);
    expect(find.text('9 / 24'), findsOneWidget);
    expect(find.text('도장 컬렉션 보기'), findsOneWidget);
    expect(find.text('여행 계속하기'), findsOneWidget);
  });

  testWidgets('scrolls on a compact screen and invokes both callbacks', (
    tester,
  ) async {
    tester.view.physicalSize = const Size(320, 568);
    tester.view.devicePixelRatio = 1;
    addTearDown(tester.view.resetPhysicalSize);
    addTearDown(tester.view.resetDevicePixelRatio);
    var collectionTapCount = 0;
    var continueTapCount = 0;

    await tester.pumpWidget(
      MaterialApp(
        theme: StampyTheme.light(),
        builder: (context, child) => MediaQuery(
          data: MediaQuery.of(
            context,
          ).copyWith(textScaler: const TextScaler.linear(2)),
          child: child!,
        ),
        home: StampCollectSuccessScreen(
          stamp: stamp,
          collectedCount: 9,
          onViewCollection: () => collectionTapCount += 1,
          onContinueTravel: () => continueTapCount += 1,
        ),
      ),
    );
    await tester.pumpAndSettle();

    expect(find.byType(SingleChildScrollView), findsOneWidget);
    await tester.ensureVisible(find.bySemanticsLabel('도장 컬렉션 보기'));
    await tester.pumpAndSettle();
    final semantics = tester.ensureSemantics();
    expect(
      tester.getSemantics(find.bySemanticsLabel('도장 컬렉션 보기')),
      matchesSemantics(label: '도장 컬렉션 보기', isButton: true, hasTapAction: true),
    );
    tester.semantics.tap(find.semantics.byLabel('도장 컬렉션 보기'));
    await tester.pump(const Duration(milliseconds: 120));
    semantics.dispose();
    await tester.ensureVisible(find.text('여행 계속하기'));
    await tester.tap(find.text('여행 계속하기'));
    await tester.pump(const Duration(milliseconds: 120));

    expect(collectionTapCount, 1);
    expect(continueTapCount, 1);
    expect(tester.takeException(), isNull);
  });
}
