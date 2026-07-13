import 'dart:async';

import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:stampy/core/auth/auth.dart';
import 'package:stampy/features/profile/presentation/profile_screen.dart';

void main() {
  testWidgets('shows the development guest state and keeps app settings', (
    tester,
  ) async {
    await _pumpProfile(
      tester,
      const FakeAuthRepository(currentUser: AuthUser.guest()),
    );

    expect(find.text('GUEST'), findsOneWidget);
    expect(find.text('개발용 게스트 모드'), findsOneWidget);
    expect(find.text('위치 권한'), findsOneWidget);
    expect(find.text('알림'), findsOneWidget);
    expect(find.text('개인정보'), findsOneWidget);
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
    );

    expect(find.text('ANONYMOUS'), findsOneWidget);
    expect(find.text('익명 세션 연결'), findsOneWidget);
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
    expect(find.textContaining(privateId), findsNothing);
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
}

Future<void> _pumpProfile(
  WidgetTester tester,
  AuthRepository repository,
) async {
  await tester.pumpWidget(
    ProviderScope(
      overrides: [authRepositoryProvider.overrideWithValue(repository)],
      child: const MaterialApp(home: ProfileScreen()),
    ),
  );
  await tester.pumpAndSettle();
}

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
