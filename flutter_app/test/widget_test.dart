import 'package:flutter/foundation.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:stampy/app/app.dart';
import 'package:stampy/core/auth/auth.dart';

void main() {
  testWidgets('shows the Stampy home shell', (tester) async {
    await tester.pumpWidget(const ProviderScope(child: StampyApp()));
    await tester.pumpAndSettle();

    expect(find.text('오늘의 탐험'), findsOneWidget);
    expect(find.text('홈'), findsOneWidget);
    expect(find.text('지도'), findsOneWidget);
    expect(find.text('도장'), findsOneWidget);
    expect(find.text('랭킹'), findsOneWidget);
    expect(find.text('마이'), findsOneWidget);
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
    expect(find.text('필수 서비스 연결 설정을 확인한 뒤 앱을 다시 실행해 주세요.'), findsOneWidget);
    expect(find.text('오늘의 탐험'), findsNothing);
    expect(find.text('홈'), findsNothing);
    expect(find.text('지도'), findsNothing);
    expect(find.text('도장'), findsNothing);
    expect(find.text('랭킹'), findsNothing);
    expect(find.text('마이'), findsNothing);
    expect(find.text('경복궁'), findsNothing);
    expect(find.text('0'), findsNothing);
    expect(find.text('수집한 도장'), findsNothing);
  });

  testWidgets('rebuild and profile tab reentry keep one anonymous sign-in', (
    tester,
  ) async {
    final repository = _CountingAuthRepository();

    await tester.pumpWidget(
      ProviderScope(
        overrides: [authRepositoryProvider.overrideWithValue(repository)],
        child: const StampyApp(key: ValueKey<int>(0)),
      ),
    );
    await tester.pumpAndSettle();

    expect(repository.signInCalls, 1);

    await tester.pumpWidget(
      ProviderScope(
        overrides: [authRepositoryProvider.overrideWithValue(repository)],
        child: const StampyApp(key: ValueKey<int>(1)),
      ),
    );
    await tester.pumpAndSettle();

    await tester.tap(find.text('마이'));
    await tester.pumpAndSettle();
    expect(find.text('ANONYMOUS'), findsOneWidget);

    await tester.tap(find.text('홈'));
    await tester.pumpAndSettle();
    await tester.tap(find.text('마이'));
    await tester.pumpAndSettle();

    expect(find.text('ANONYMOUS'), findsOneWidget);
    expect(repository.signInCalls, 1);
  });
}

final class _CountingAuthRepository implements AuthRepository {
  int signInCalls = 0;

  @override
  AuthUser? get currentUser => null;

  @override
  Stream<AuthUser?> get authStateChanges => const Stream<AuthUser?>.empty();

  @override
  Future<AuthUser> signInAnonymously() async {
    signInCalls += 1;
    return AuthUser.session(id: 'private-widget-user-id', isAnonymous: true);
  }
}
