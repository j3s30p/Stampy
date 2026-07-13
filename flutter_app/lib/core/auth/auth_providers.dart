import 'package:flutter_riverpod/flutter_riverpod.dart';

import 'auth_repository.dart';
import 'auth_user.dart';
import 'fake_auth_repository.dart';

final authRepositoryProvider = Provider<AuthRepository>(
  (ref) => const FakeAuthRepository(),
);

final currentAuthUserProvider = StreamProvider<AuthUser>((ref) async* {
  final repository = ref.watch(authRepositoryProvider);
  final currentUser = repository.currentUser;
  if (currentUser != null) {
    yield currentUser;
  } else {
    yield await repository.signInAnonymously();
  }

  await for (final changedUser in repository.authStateChanges) {
    if (changedUser != null) {
      yield changedUser;
    } else {
      yield repository.currentUser ?? await repository.signInAnonymously();
    }
  }
}, retry: (_, _) => null);
