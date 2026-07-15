import 'weekly_ranking.dart';

abstract interface class RankingRepository {
  Future<List<WeeklyRankingEntry>> loadWeeklyRanking();
}

final class RankingRepositoryException implements Exception {
  const RankingRepositoryException(this.message);

  final String message;

  @override
  String toString() => 'RankingRepositoryException: $message';
}
