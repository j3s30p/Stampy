import 'dart:async';

import 'package:flutter_test/flutter_test.dart';
import 'package:stampy/core/auth/auth.dart';
import 'package:supabase_flutter/supabase_flutter.dart' hide AuthUser;

void main() {
  test('maps a restored permanent Supabase user', () {
    final client = _FakeGoTrueClient(
      currentUser: _supabaseUser(id: 'existing-user', isAnonymous: false),
    );
    addTearDown(client.dispose);
    final repository = SupabaseAuthRepository(client);

    final user = repository.currentUser;

    expect(user?.id, 'existing-user');
    expect(user?.isAnonymous, isFalse);
  });

  test('does not expose a legacy anonymous session as a member', () {
    final client = _FakeGoTrueClient(
      currentUser: _supabaseUser(id: 'anonymous-user', isAnonymous: true),
    );
    addTearDown(client.dispose);
    final repository = SupabaseAuthRepository(client);

    expect(repository.currentUser, isNull);
  });

  test('launches Kakao OAuth with the app callback', () async {
    final client = _FakeGoTrueClient();
    addTearDown(client.dispose);
    OAuthProvider? provider;
    final repository = SupabaseAuthRepository(
      client,
      launchOAuth: (selectedProvider, {String? redirectTo}) async {
        provider = selectedProvider;
        // Capture the named parameter without shadowing the outer variable.
        final callback = redirectTo;
        expect(callback, kakaoAuthRedirectUrl);
        return true;
      },
    );

    await repository.signInWithKakao();

    expect(provider, OAuthProvider.kakao);
  });

  test('clears a legacy anonymous session before Kakao OAuth', () async {
    final client = _FakeGoTrueClient(
      currentUser: _supabaseUser(id: 'anonymous-user', isAnonymous: true),
    );
    addTearDown(client.dispose);
    final repository = SupabaseAuthRepository(
      client,
      launchOAuth: (_, {redirectTo}) async => true,
    );

    await repository.signInWithKakao();

    expect(client.signOutCalls, 1);
    expect(client.currentUser, isNull);
  });

  test('rejects a Kakao OAuth screen that could not be opened', () async {
    final client = _FakeGoTrueClient();
    addTearDown(client.dispose);
    final repository = SupabaseAuthRepository(
      client,
      launchOAuth: (_, {redirectTo}) async => false,
    );

    await expectLater(
      repository.signInWithKakao(),
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

  test('delegates sign out to Supabase Auth', () async {
    final client = _FakeGoTrueClient(
      currentUser: _supabaseUser(id: 'member', isAnonymous: false),
    );
    addTearDown(client.dispose);
    final repository = SupabaseAuthRepository(client);

    await repository.signOut();

    expect(client.signOutCalls, 1);
    expect(client.currentUser, isNull);
  });
}

final class _FakeGoTrueClient extends GoTrueClient {
  _FakeGoTrueClient({
    this.currentUser,
    this.authStateChanges = const Stream<AuthState>.empty(),
  }) : super(autoRefreshToken: false);

  @override
  User? currentUser;

  final Stream<AuthState> authStateChanges;

  @override
  Stream<AuthState> get onAuthStateChange => authStateChanges;

  int signOutCalls = 0;

  @override
  Future<void> signOut({SignOutScope scope = SignOutScope.local}) async {
    signOutCalls += 1;
    currentUser = null;
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
