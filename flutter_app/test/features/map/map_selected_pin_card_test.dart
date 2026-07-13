import 'dart:async';

import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:stampy/core/geo/coordinates.dart';
import 'package:stampy/features/map/domain/map_collect.dart';
import 'package:stampy/features/map/domain/map_models.dart';
import 'package:stampy/features/map/presentation/map_screen.dart';

MapPin _pin({bool collected = false}) => MapPin(
  contentId: 'tour-126508',
  title: '경복궁',
  kind: MapPinKind.place,
  location: Coordinates(
    latitude: Latitude(37.579617),
    longitude: Longitude(126.977041),
  ),
  collected: collected,
);

Widget _card({
  required MapPin pin,
  required MapCollectAvailability availability,
  Future<void> Function()? onCollect,
  String? failureMessage,
}) => MaterialApp(
  home: Scaffold(
    body: Center(
      child: MapSelectedPinCard(
        pin: pin,
        availability: availability,
        onCollect: onCollect,
        failureMessage: failureMessage,
      ),
    ),
  ),
);

void main() {
  testWidgets('shows precise distance, status, and an explicit collect CTA', (
    tester,
  ) async {
    await tester.pumpWidget(
      _card(
        pin: _pin(),
        availability: MapCollectAvailability.eligible(
          distanceMeters: 42.25,
          statusLabel: '100m 안에 있어요',
        ),
        onCollect: () async {},
      ),
    );

    expect(find.text('경복궁'), findsOneWidget);
    expect(find.text('42.3 m'), findsOneWidget);
    expect(find.text('100m 안에 있어요'), findsOneWidget);
    expect(find.text('도장 수집하기'), findsOneWidget);
  });

  testWidgets('out-of-range state offers a fresh location check', (
    tester,
  ) async {
    var requestCount = 0;
    await tester.pumpWidget(
      _card(
        pin: _pin(),
        availability: MapCollectAvailability.blocked(
          reason: MapCollectBlockReason.outOfRange,
          statusLabel: '인증 반경 100m 밖이에요',
          distanceMeters: 100.4,
        ),
        onCollect: () async {
          requestCount += 1;
        },
      ),
    );

    expect(find.text('100.4 m'), findsOneWidget);
    expect(find.text('인증 반경 100m 밖이에요'), findsOneWidget);
    expect(find.text('현재 위치 다시 확인'), findsOneWidget);
    final button = tester.widget<FilledButton>(find.byType(FilledButton));
    expect(button.onPressed, isNotNull);

    await tester.tap(find.byType(FilledButton));
    await tester.pumpAndSettle();
    expect(requestCount, 1);
  });

  testWidgets('terminal block reasons keep the CTA disabled', (tester) async {
    for (final reason in <MapCollectBlockReason>[
      MapCollectBlockReason.notConfigured,
      MapCollectBlockReason.rejected,
    ]) {
      await tester.pumpWidget(
        _card(
          pin: _pin(),
          availability: MapCollectAvailability.blocked(
            reason: reason,
            statusLabel: '수집할 수 없어요',
          ),
          onCollect: () async {},
        ),
      );

      expect(find.text('지금은 수집할 수 없어요'), findsOneWidget);
      final button = tester.widget<FilledButton>(find.byType(FilledButton));
      expect(button.onPressed, isNull, reason: reason.name);
    }
  });

  testWidgets('initial collected pin cannot be collected again', (
    tester,
  ) async {
    await tester.pumpWidget(
      _card(
        pin: _pin(),
        availability: MapCollectAvailability.blocked(
          reason: MapCollectBlockReason.alreadyCollected,
          statusLabel: '이미 수집한 도장이에요',
          distanceMeters: 4.2,
        ),
      ),
    );

    expect(find.text('수집 완료'), findsOneWidget);
    final button = tester.widget<FilledButton>(find.byType(FilledButton));
    expect(button.onPressed, isNull);
  });

  testWidgets('ignores duplicate taps while a collect request is pending', (
    tester,
  ) async {
    final completer = Completer<void>();
    var requestCount = 0;
    await tester.pumpWidget(
      _card(
        pin: _pin(),
        availability: MapCollectAvailability.eligible(
          distanceMeters: 8.5,
          statusLabel: '수집 가능',
        ),
        onCollect: () {
          requestCount += 1;
          return completer.future;
        },
      ),
    );

    final button = find.byKey(const ValueKey<String>('map-collect-button'));
    await tester.tap(button);
    await tester.pump();
    await tester.tap(button);
    await tester.pump();

    expect(requestCount, 1);
    expect(find.text('최신 위치 확인 중…'), findsOneWidget);

    completer.complete();
    await tester.pumpAndSettle();
    expect(find.text('도장 수집하기'), findsOneWidget);
  });

  testWidgets('renders an app-provided failure message', (tester) async {
    await tester.pumpWidget(
      _card(
        pin: _pin(),
        availability: MapCollectAvailability.eligible(
          distanceMeters: 7,
          statusLabel: '수집 가능',
        ),
        onCollect: () async {},
        failureMessage: '서버 확인 중 문제가 발생했어요.',
      ),
    );

    expect(find.text('서버 확인 중 문제가 발생했어요.'), findsOneWidget);
    expect(
      tester.getSemantics(find.text('수집 가능')),
      matchesSemantics(label: '수집 가능\n7.0 m', isLiveRegion: true),
    );
    expect(
      tester.getSemantics(find.text('서버 확인 중 문제가 발생했어요.')),
      matchesSemantics(label: '서버 확인 중 문제가 발생했어요.', isLiveRegion: true),
    );
  });
}
