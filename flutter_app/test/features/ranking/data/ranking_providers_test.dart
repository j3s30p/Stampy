import 'dart:async';

import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:stampy/core/auth/auth.dart';
import 'package:stampy/core/geo/coordinates.dart';
import 'package:stampy/core/location/location.dart';
import 'package:stampy/features/ranking/data/ranking_providers.dart';
import 'package:stampy/features/ranking/domain/ranking_domain.dart';
import 'package:stampy/features/stamp/data/fake_stamp_repository.dart';
import 'package:stampy/features/stamp/domain/stamp_domain.dart';
import 'package:stampy/features/stamp/presentation/stamp_session.dart';

void main() {
  test('signed-out state never reaches the ranking repository', () async {
    final ranking = _ControlledRankingRepository();
    final container = ProviderContainer(
      overrides: [rankingRepositoryProvider.overrideWithValue(ranking)],
    );
    addTearDown(container.dispose);
    _listen(container);

    expect(await container.read(weeklyRankingProvider.future), isEmpty);
    expect(ranking.loadCalls, 0);
  });

  test('loads the weekly ranking for the authenticated member', () async {
    final ranking = _ControlledRankingRepository();
    ranking.queueLoad().result.complete(<WeeklyRankingEntry>[
      _rankingEntry(rank: 1, stampCount: 2, isCurrentUser: true),
    ]);
    final container = _container(ranking: ranking);
    addTearDown(container.dispose);
    _listen(container);

    final result = await container.read(weeklyRankingProvider.future);

    expect(result.single.rank, 1);
    expect(result.single.isCurrentUser, isTrue);
    expect(ranking.loadCalls, 1);
  });

  test('reloads after a newly collected stamp changes the session', () async {
    final ranking = _ControlledRankingRepository();
    ranking.queueLoad().result.complete(<WeeklyRankingEntry>[
      _rankingEntry(rank: 2, stampCount: 1, isCurrentUser: true),
    ]);
    final refreshedLoad = ranking.queueLoad();
    final stamp = FakeStampRepository(
      clock: () => DateTime.utc(2026, 7, 15, 9),
    );
    final container = _container(ranking: ranking, stamp: stamp);
    addTearDown(container.dispose);
    _listen(container);

    await container.read(weeklyRankingProvider.future);
    await container
        .read(stampSessionProvider.notifier)
        .collect(
          CollectStampRequest(
            contentId: 'new-stamp',
            title: '새 도장',
            kind: StampCandidateKind.spot,
            verificationFix: _locationFix(),
          ),
        );
    await refreshedLoad.started.future;
    refreshedLoad.result.complete(<WeeklyRankingEntry>[
      _rankingEntry(rank: 1, stampCount: 2, isCurrentUser: true),
    ]);

    final refreshed = await container.read(weeklyRankingProvider.future);

    expect(refreshed.single.rank, 1);
    expect(refreshed.single.stampCount, 2);
    expect(ranking.loadCalls, 2);
  });
}

ProviderContainer _container({
  required RankingRepository ranking,
  StampRepository? stamp,
}) => ProviderContainer(
  overrides: [
    authRepositoryProvider.overrideWithValue(
      FakeAuthRepository(
        currentUser: AuthUser.session(
          id: 'ranking-test-user',
          isAnonymous: false,
        ),
      ),
    ),
    rankingRepositoryProvider.overrideWithValue(ranking),
    stampRepositoryProvider.overrideWithValue(stamp ?? FakeStampRepository()),
  ],
);

void _listen(ProviderContainer container) {
  final subscription = container.listen<AsyncValue<List<WeeklyRankingEntry>>>(
    weeklyRankingProvider,
    (previous, next) {},
    fireImmediately: true,
  );
  addTearDown(subscription.close);
}

WeeklyRankingEntry _rankingEntry({
  required int rank,
  required int stampCount,
  required bool isCurrentUser,
}) => WeeklyRankingEntry(
  rank: rank,
  stampCount: stampCount,
  isCurrentUser: isCurrentUser,
);

LocationFix _locationFix() => LocationFix(
  coordinates: Coordinates(
    latitude: Latitude(37.579617),
    longitude: Longitude(126.977041),
  ),
  accuracyMeters: 5,
  timestamp: DateTime.utc(2026, 7, 15, 9),
);

final class _ControlledRankingRepository implements RankingRepository {
  final List<_PendingRankingLoad> _loads = <_PendingRankingLoad>[];
  int loadCalls = 0;

  _PendingRankingLoad queueLoad() {
    final pending = _PendingRankingLoad();
    _loads.add(pending);
    return pending;
  }

  @override
  Future<List<WeeklyRankingEntry>> loadWeeklyRanking() {
    final pending = _loads[loadCalls];
    loadCalls += 1;
    pending.started.complete();
    return pending.result.future;
  }
}

final class _PendingRankingLoad {
  final Completer<void> started = Completer<void>();
  final Completer<List<WeeklyRankingEntry>> result =
      Completer<List<WeeklyRankingEntry>>();
}
