import 'dart:async';

import 'package:flutter_test/flutter_test.dart';
import 'package:stampy/core/auth/auth.dart';
import 'package:supabase_flutter/supabase_flutter.dart' hide AuthUser;

void main() {
  test('maps the current Supabase user without signing in again', () {
    final client = _FakeGoTrueClient(
      currentUser: _supabaseUser(id: 'existing-user', isAnonymous: true),
    );
    addTearDown(client.dispose);
    final repository = SupabaseAuthRepository(client);

    final user = repository.currentUser;

    expect(user?.id, 'existing-user');
    expect(user?.isAnonymous, isTrue);
    expect(client.signInCalls, 0);
  });

  test('maps a newly created anonymous session', () async {
    final anonymousUser = _supabaseUser(
      id: 'anonymous-user',
      isAnonymous: true,
    );
    final client = _FakeGoTrueClient(
      signInResponse: AuthResponse(session: _session(anonymousUser)),
    );
    addTearDown(client.dispose);
    final repository = SupabaseAuthRepository(client);

    final user = await repository.signInAnonymously();

    expect(user.id, 'anonymous-user');
    expect(user.isAnonymous, isTrue);
    expect(client.signInCalls, 1);
  });

  test('rejects a malformed anonymous sign-in response', () async {
    const privateId = 'private-malformed-user-id';
    final client = _FakeGoTrueClient(
      signInResponse: AuthResponse(
        user: _supabaseUser(id: privateId, isAnonymous: true),
      ),
    );
    addTearDown(client.dispose);
    final repository = SupabaseAuthRepository(client);

    await expectLater(
      repository.signInAnonymously(),
      throwsA(
        isA<AuthRepositoryException>().having(
          (error) => error.toString(),
          'message',
          isNot(contains(privateId)),
        ),
      ),
    );
  });

  test('rejects a non-anonymous sign-in response', () async {
    final permanentUser = _supabaseUser(
      id: 'permanent-user',
      isAnonymous: false,
    );
    final client = _FakeGoTrueClient(
      signInResponse: AuthResponse(session: _session(permanentUser)),
    );
    addTearDown(client.dispose);
    final repository = SupabaseAuthRepository(client);

    await expectLater(
      repository.signInAnonymously(),
      throwsA(isA<AuthRepositoryException>()),
    );
  });

  test('maps auth state changes including signed out', () async {
    final changes = StreamController<AuthState>();
    addTearDown(changes.close);
    final client = _FakeGoTrueClient(authStateChanges: changes.stream);
    addTearDown(client.dispose);
    final repository = SupabaseAuthRepository(client);

    final signedOut = repository.authStateChanges.first;
    changes.add(const AuthState(AuthChangeEvent.signedOut, null));

    expect(await signedOut, isNull);
  });
}

final class _FakeGoTrueClient extends GoTrueClient {
  _FakeGoTrueClient({
    this.currentUser,
    AuthResponse? signInResponse,
    this.authStateChanges = const Stream<AuthState>.empty(),
  }) : _signInResponse = signInResponse ?? AuthResponse(),
       super(autoRefreshToken: false);

  @override
  final User? currentUser;

  final Stream<AuthState> authStateChanges;

  @override
  Stream<AuthState> get onAuthStateChange => authStateChanges;

  final AuthResponse _signInResponse;
  int signInCalls = 0;

  @override
  Future<AuthResponse> signInAnonymously({
    Map<String, dynamic>? data,
    String? captchaToken,
  }) async {
    signInCalls += 1;
    return _signInResponse;
  }
}

User _supabaseUser({required String id, required bool isAnonymous}) => User(
  id: id,
  appMetadata: const <String, dynamic>{},
  userMetadata: const <String, dynamic>{},
  aud: 'authenticated',
  createdAt: '2026-07-13T00:00:00Z',
  isAnonymous: isAnonymous,
);

Session _session(User user) => Session(
  accessToken: 'test-access-token',
  refreshToken: 'test-refresh-token',
  tokenType: 'bearer',
  user: user,
);
