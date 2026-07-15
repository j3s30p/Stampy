import 'dart:async';

import 'package:flutter_riverpod/flutter_riverpod.dart';

import 'auth_repository.dart';
import 'auth_user.dart';
import 'fake_auth_repository.dart';

final authRepositoryProvider = Provider<AuthRepository>(
  (ref) => FakeAuthRepository(),
);

final currentAuthUserProvider =
    AsyncNotifierProvider<CurrentAuthUserController, AuthUser>(
      CurrentAuthUserController.new,
      retry: (_, _) => null,
    );

final class CurrentAuthUserController extends AsyncNotifier<AuthUser> {
  StreamSubscription<AuthUser?>? _authStateSubscription;
  late AuthRepository _repository;
  int _generation = 0;

  @override
  Future<AuthUser> build() async {
    final generation = ++_generation;
    _repository = ref.watch(authRepositoryProvider);
    unawaited(_authStateSubscription?.cancel());

    _authStateSubscription = _repository.authStateChanges.listen(
      (user) => _handleAuthChange(user, generation),
      onError: (Object error, StackTrace stackTrace) {
        if (generation == _generation) {
          state = AsyncError<AuthUser>(error, stackTrace);
        }
      },
    );
    ref.onDispose(() {
      _generation += 1;
      unawaited(_authStateSubscription?.cancel());
    });

    return _repository.currentUser ?? const AuthUser.signedOut();
  }

  Future<void> signInWithKakao() async {
    state = const AsyncLoading<AuthUser>();
    try {
      await _repository.signInWithKakao();
      state = AsyncData<AuthUser>(
        _repository.currentUser ?? const AuthUser.signedOut(),
      );
    } on Object catch (error, stackTrace) {
      state = AsyncError<AuthUser>(error, stackTrace);
    }
  }

  Future<void> signOut() async {
    state = const AsyncLoading<AuthUser>();
    try {
      await _repository.signOut();
      state = const AsyncData<AuthUser>(AuthUser.signedOut());
    } on Object {
      state = const AsyncData<AuthUser>(AuthUser.signedOut());
      rethrow;
    }
  }

  void _handleAuthChange(AuthUser? user, int generation) {
    if (generation != _generation) {
      return;
    }
    state = AsyncData<AuthUser>(user ?? const AuthUser.signedOut());
  }
}
