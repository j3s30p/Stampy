import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:stampy/core/auth/auth_providers.dart';

import '../domain/map_repository.dart';
import '../domain/map_selection.dart';
import 'fake_map_repository.dart';

final mapRepositoryProvider = Provider<MapRepository>(
  (ref) => const FakeMapRepository(),
);

final readyMapRepositoryProvider = Provider<AsyncValue<MapRepository>>((ref) {
  final authUser = ref.watch(currentAuthUserProvider);
  if (authUser case AsyncData(:final value) when value.isSignedOut) {
    return const AsyncLoading<MapRepository>();
  }
  return authUser.whenData((_) => ref.watch(mapRepositoryProvider));
});

final mapSelectionRequestProvider =
    NotifierProvider<MapSelectionRequestController, MapSelectionRequest?>(
      MapSelectionRequestController.new,
    );

final class MapSelectionRequestController
    extends Notifier<MapSelectionRequest?> {
  @override
  MapSelectionRequest? build() {
    ref.watch(
      currentAuthUserProvider.select(
        (authUser) => switch (authUser) {
          AsyncData(:final value) => value.isSignedOut ? null : value.id,
          _ => null,
        },
      ),
    );
    return null;
  }

  void select(String contentId) {
    state = MapSelectionRequest(
      contentId: contentId,
      revision: (state?.revision ?? 0) + 1,
    );
  }
}
