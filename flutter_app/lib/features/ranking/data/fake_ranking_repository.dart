import '../domain/ranking_domain.dart';

final class FakeRankingRepository implements RankingRepository {
  const FakeRankingRepository({this.entries = const <WeeklyRankingEntry>[]});

  final List<WeeklyRankingEntry> entries;

  @override
  Future<List<WeeklyRankingEntry>> loadWeeklyRanking() =>
      Future<List<WeeklyRankingEntry>>.value(
        List<WeeklyRankingEntry>.unmodifiable(entries),
      );
}
