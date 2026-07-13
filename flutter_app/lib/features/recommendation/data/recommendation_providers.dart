import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:stampy/core/auth/auth_providers.dart';
import 'package:stampy/core/location/location_providers.dart';

import '../domain/recommendation_domain.dart';
import 'fake_recommendation_repository.dart';

final recommendationRepositoryProvider = Provider<RecommendationRepository>(
  (ref) => const FakeRecommendationRepository(),
);

final nearbyRecommendationProvider =
    FutureProvider.autoDispose<Recommendation?>((ref) {
      final authGate = ref.watch(
        currentAuthUserProvider.select(
          (authUser) => authUser.whenData((user) => user.id ?? ''),
        ),
      );
      if (authGate.isLoading) {
        return ref
            .watch(currentAuthUserProvider.future)
            .then<Recommendation?>((_) => null);
      }
      if (authGate.hasError) {
        return Future<Recommendation?>.error(
          authGate.error!,
          authGate.stackTrace,
        );
      }
      if (authGate.requireValue.isEmpty) {
        return Future<Recommendation?>.value();
      }

      final repository = ref.watch(recommendationRepositoryProvider);
      final coordinatesReady = ref.watch(
        currentLocationProvider.selectAsync(
          (location) => location.fix?.coordinates,
        ),
      );
      var isCurrent = true;
      ref.onDispose(() => isCurrent = false);

      return coordinatesReady.then<Recommendation?>((coordinates) {
        if (!isCurrent || coordinates == null) {
          return null;
        }

        return repository.loadRecommendation(coordinates);
      });
    }, retry: (_, _) => null);
