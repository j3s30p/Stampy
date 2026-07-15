import 'package:supabase_flutter/supabase_flutter.dart';

import '../domain/ranking_domain.dart';

final class SupabaseRankingRepository implements RankingRepository {
  const SupabaseRankingRepository(SupabaseClient client) : _client = client;

  final SupabaseClient _client;

  @override
  Future<List<WeeklyRankingEntry>> loadWeeklyRanking() => _guard(() async {
    final response = await _client.rpc('list_weekly_ranking');
    final rows = _rows(response);
    if (rows.length > 3) {
      throw const RankingRepositoryException(
        'The weekly ranking response was invalid.',
      );
    }

    final entries = rows.map(_entryFromRow).toList(growable: false);
    _validateRanking(entries);
    return List<WeeklyRankingEntry>.unmodifiable(entries);
  });
}

Future<T> _guard<T>(Future<T> Function() action) async {
  try {
    return await action();
  } on RankingRepositoryException {
    rethrow;
  } on Object {
    throw const RankingRepositoryException(
      'The weekly ranking could not be loaded.',
    );
  }
}

List<Map<String, dynamic>> _rows(Object? response) {
  if (response is! List<dynamic>) {
    throw const RankingRepositoryException(
      'The weekly ranking response was invalid.',
    );
  }

  return response
      .map((row) {
        if (row is! Map<String, dynamic>) {
          throw const RankingRepositoryException(
            'The weekly ranking row was invalid.',
          );
        }
        return row;
      })
      .toList(growable: false);
}

WeeklyRankingEntry _entryFromRow(Map<String, dynamic> row) {
  try {
    return WeeklyRankingEntry(
      rank: _requiredInt(row, 'rank'),
      stampCount: _requiredInt(row, 'stamp_count'),
      isCurrentUser: _requiredBool(row, 'is_current_user'),
    );
  } on ArgumentError {
    throw const RankingRepositoryException(
      'The weekly ranking fields were invalid.',
    );
  }
}

int _requiredInt(Map<String, dynamic> row, String key) {
  final value = row[key];
  if (value is! int) {
    throw RankingRepositoryException('The weekly ranking $key was invalid.');
  }
  return value;
}

bool _requiredBool(Map<String, dynamic> row, String key) {
  final value = row[key];
  if (value is! bool) {
    throw RankingRepositoryException('The weekly ranking $key was invalid.');
  }
  return value;
}

void _validateRanking(List<WeeklyRankingEntry> entries) {
  if (entries.isEmpty) {
    return;
  }
  if (entries.first.rank != 1 ||
      entries.where((entry) => entry.isCurrentUser).length > 1) {
    throw const RankingRepositoryException(
      'The weekly ranking order was invalid.',
    );
  }

  for (var index = 1; index < entries.length; index += 1) {
    final previous = entries[index - 1];
    final current = entries[index];
    final sameCount = current.stampCount == previous.stampCount;
    final expectedRank = sameCount ? previous.rank : index + 1;
    if (current.stampCount > previous.stampCount ||
        current.rank != expectedRank) {
      throw const RankingRepositoryException(
        'The weekly ranking order was invalid.',
      );
    }
  }
}
