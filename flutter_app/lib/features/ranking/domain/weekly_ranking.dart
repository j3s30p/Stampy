final class WeeklyRankingEntry {
  factory WeeklyRankingEntry({
    required int rank,
    required int stampCount,
    required bool isCurrentUser,
  }) {
    if (rank < 1 || rank > 3) {
      throw RangeError.range(rank, 1, 3, 'rank');
    }
    if (stampCount < 1) {
      throw RangeError.value(stampCount, 'stampCount', 'Must be positive');
    }

    return WeeklyRankingEntry._(
      rank: rank,
      stampCount: stampCount,
      isCurrentUser: isCurrentUser,
    );
  }

  const WeeklyRankingEntry._({
    required this.rank,
    required this.stampCount,
    required this.isCurrentUser,
  });

  final int rank;
  final int stampCount;
  final bool isCurrentUser;
}
