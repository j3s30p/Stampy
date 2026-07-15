import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:stampy/app/app.dart';
import 'package:stampy/core/auth/auth.dart';

void main() {
  testWidgets('signed-out launch shows Kakao login instead of the app shell', (
    tester,
  ) async {
    await tester.pumpWidget(const ProviderScope(child: StampyApp()));
    await tester.pumpAndSettle();

    expect(find.text('카카오로 시작하기'), findsOneWidget);
    expect(find.text('오늘의 탐험'), findsNothing);
    expect(find.text('홈'), findsNothing);
  });

  testWidgets('Kakao login opens the Stampy home shell', (tester) async {
    await tester.pumpWidget(const ProviderScope(child: StampyApp()));
    await tester.pumpAndSettle();

    await tester.tap(find.text('카카오로 시작하기'));
    await tester.pumpAndSettle();

    expect(find.text('오늘의 탐험'), findsOneWidget);
    expect(find.text('홈'), findsOneWidget);
    expect(find.text('지도'), findsOneWidget);
    expect(find.text('도장'), findsOneWidget);
    expect(find.text('랭킹'), findsOneWidget);
    expect(find.text('마이'), findsOneWidget);
  });

  testWidgets('restored member session skips the login screen', (tester) async {
    await tester.pumpWidget(
      ProviderScope(
        overrides: [
          authRepositoryProvider.overrideWithValue(
            FakeAuthRepository(
              currentUser: AuthUser.session(
                id: 'restored-member',
                isAnonymous: false,
              ),
            ),
          ),
        ],
        child: const StampyApp(),
      ),
    );
    await tester.pumpAndSettle();

    expect(find.text('오늘의 탐험'), findsOneWidget);
    expect(find.text('카카오로 시작하기'), findsNothing);
  });

  testWidgets('non-retryable auth failure blocks the app shell', (
    tester,
  ) async {
    await tester.pumpWidget(
      ProviderScope(
        overrides: [
          authRepositoryProvider.overrideWithValue(
            const UnavailableAuthRepository(),
          ),
        ],
        child: const StampyApp(),
      ),
    );
    await tester.pumpAndSettle();

    expect(find.text('앱을 시작하지\n못했어요'), findsOneWidget);
    expect(find.text('오늘의 탐험'), findsNothing);
    expect(find.text('카카오로 시작하기'), findsNothing);
  });

  testWidgets('logout returns to the Kakao login screen', (tester) async {
    await tester.binding.setSurfaceSize(const Size(800, 1000));
    addTearDown(() => tester.binding.setSurfaceSize(null));
    final repository = FakeAuthRepository(
      currentUser: AuthUser.session(id: 'member', isAnonymous: false),
    );
    await tester.pumpWidget(
      ProviderScope(
        overrides: [authRepositoryProvider.overrideWithValue(repository)],
        child: const StampyApp(),
      ),
    );
    await tester.pumpAndSettle();

    await tester.tap(find.text('마이'));
    await tester.pumpAndSettle();
    await tester.tap(find.text('로그아웃'));
    await tester.pumpAndSettle();

    expect(find.text('카카오로 시작하기'), findsOneWidget);
    expect(find.text('오늘의 탐험'), findsNothing);
  });
}
