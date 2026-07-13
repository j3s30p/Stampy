import 'dart:async';

import 'package:flutter_riverpod/flutter_riverpod.dart';

import 'auth_repository.dart';
import 'auth_user.dart';
import 'fake_auth_repository.dart';

final authRepositoryProvider = Provider<AuthRepository>(
  (ref) => const FakeAuthRepository(),
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
  bool _isReplacingUser = false;

  @override
  Future<AuthUser> build() async {
    final generation = ++_generation;
    _isReplacingUser = false;
    _repository = ref.watch(authRepositoryProvider);
    unawaited(_authStateSubscription?.cancel());

    final user =
        _repository.currentUser ?? await _repository.signInAnonymously();
    if (generation != _generation) {
      return user;
    }

    _authStateSubscription = _repository.authStateChanges.listen(
      (changedUser) => _handleAuthChange(changedUser, generation),
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
    return user;
  }

  void _handleAuthChange(AuthUser? user, int generation) {
    if (generation != _generation) {
      return;
    }
    if (user != null) {
      state = AsyncData<AuthUser>(user);
      return;
    }
    if (_isReplacingUser) {
      return;
    }

    _isReplacingUser = true;
    state = const AsyncLoading<AuthUser>();
    unawaited(_replaceSignedOutUser(generation));
  }

  Future<void> _replaceSignedOutUser(int generation) async {
    try {
      final user =
          _repository.currentUser ?? await _repository.signInAnonymously();
      if (generation == _generation) {
        state = AsyncData<AuthUser>(user);
      }
    } on Object catch (error, stackTrace) {
      if (generation == _generation) {
        state = AsyncError<AuthUser>(error, stackTrace);
      }
    } finally {
      if (generation == _generation) {
        _isReplacingUser = false;
      }
    }
  }
}
