import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:stampy/core/auth/auth_providers.dart';

import '../domain/map_repository.dart';
import 'fake_map_repository.dart';

final mapRepositoryProvider = Provider<MapRepository>(
  (ref) => const FakeMapRepository(),
);

final readyMapRepositoryProvider = Provider<AsyncValue<MapRepository>>((ref) {
  final authUser = ref.watch(currentAuthUserProvider);
  return authUser.whenData((_) => ref.watch(mapRepositoryProvider));
});
