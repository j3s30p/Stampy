import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:stampy/core/auth/auth_providers.dart';
import 'package:stampy/features/stamp/presentation/stamp_session.dart';

import '../domain/ranking_domain.dart';
import 'fake_ranking_repository.dart';

final rankingRepositoryProvider = Provider<RankingRepository>(
  (ref) => const FakeRankingRepository(),
);

final weeklyRankingProvider =
    FutureProvider.autoDispose<List<WeeklyRankingEntry>>((ref) {
      final authGate = ref.watch(
        currentAuthUserProvider.select(
          (authUser) => authUser.whenData((user) => user.id ?? ''),
        ),
      );
      if (authGate.isLoading) {
        return ref
            .watch(currentAuthUserProvider.future)
            .then<List<WeeklyRankingEntry>>(
              (_) => const <WeeklyRankingEntry>[],
            );
      }
      if (authGate.hasError) {
        return Future<List<WeeklyRankingEntry>>.error(
          authGate.error!,
          authGate.stackTrace,
        );
      }
      if (authGate.requireValue.isEmpty) {
        return Future<List<WeeklyRankingEntry>>.value(
          const <WeeklyRankingEntry>[],
        );
      }

      ref.watch(
        stampSessionProvider.select(
          (session) => session.collectedStamps.length,
        ),
      );
      return ref.watch(rankingRepositoryProvider).loadWeeklyRanking();
    }, retry: (_, _) => null);
