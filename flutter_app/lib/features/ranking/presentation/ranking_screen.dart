import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:stampy/app/theme/app_colors.dart';
import 'package:stampy/core/widgets/field_journal.dart';
import 'package:stampy/features/ranking/data/ranking_providers.dart';
import 'package:stampy/features/ranking/domain/ranking_domain.dart';
import 'package:stampy/features/stamp/presentation/stamp_session.dart';

class RankingScreen extends ConsumerWidget {
  const RankingScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final (:collectedStampCount, :loadStatus) = ref.watch(
      stampSessionProvider.select(
        (session) => (
          collectedStampCount: session.collectedStamps.length,
          loadStatus: session.loadStatus,
        ),
      ),
    );
    final personalRecord = _personalRecordPresentation(
      loadStatus,
      collectedStampCount,
    );
    final weeklyRanking = ref.watch(weeklyRankingProvider);

    return FieldJournalPage(
      eyebrow: '여행자 기록',
      title: '도시를 걷는\n여행자들의 순위',
      description: '경쟁보다 꾸준한 탐험에 집중할 수 있도록 이번 주 수집한 도장 수를 비교합니다.',
      trailing: JournalBadge(label: _weeklyRankingBadge(weeklyRanking)),
      children: [
        JournalSection(
          index: '01',
          title: '주간 랭킹',
          child: _weeklyRankingContent(weeklyRanking, ref),
        ),
        JournalSection(
          index: '02',
          title: '나의 기록',
          child: JournalNotice(
            number: 'ME',
            title: personalRecord.title,
            description: personalRecord.description,
          ),
        ),
      ],
    );
  }
}

String _weeklyRankingBadge(
  AsyncValue<List<WeeklyRankingEntry>> weeklyRanking,
) => switch (weeklyRanking) {
  AsyncData(:final value) => value.isEmpty ? '기록 없음' : '이번 주',
  AsyncError() => '연결 실패',
  _ => '집계 중',
};

Widget _weeklyRankingContent(
  AsyncValue<List<WeeklyRankingEntry>> weeklyRanking,
  WidgetRef ref,
) => switch (weeklyRanking) {
  AsyncData(:final value) when value.isEmpty => const JournalNotice(
    number: 'RANK',
    title: '이번 주 첫 도장을\n기다리고 있어요',
    description: '아직 수집 기록이 없어요. 첫 도장을 모으면 주간 랭킹이 시작됩니다.',
  ),
  AsyncData(:final value) => _WeeklyRankingList(entries: value),
  AsyncError() => Column(
    crossAxisAlignment: CrossAxisAlignment.stretch,
    children: [
      const JournalNotice(
        number: 'RANK',
        title: '주간 랭킹을\n불러오지 못했어요',
        description: '연결 상태를 확인한 뒤 다시 시도해 주세요.',
      ),
      const SizedBox(height: 12),
      OutlinedButton.icon(
        onPressed: () => ref.invalidate(weeklyRankingProvider),
        icon: const Icon(Icons.refresh),
        label: const Text('다시 시도'),
      ),
    ],
  ),
  _ => const JournalNotice(
    number: 'RANK',
    title: '이번 주 기록을\n집계하고 있어요',
    description: '여행자들이 수집한 도장 수를 확인하고 있습니다.',
  ),
};

class _WeeklyRankingList extends StatelessWidget {
  const _WeeklyRankingList({required this.entries});

  final List<WeeklyRankingEntry> entries;

  @override
  Widget build(BuildContext context) {
    return DecoratedBox(
      decoration: const BoxDecoration(
        border: Border(
          top: BorderSide(color: StampyColors.hairline),
          bottom: BorderSide(color: StampyColors.hairline),
        ),
      ),
      child: Column(
        children: [
          for (var index = 0; index < entries.length; index += 1) ...[
            if (index > 0) const Divider(height: 1),
            _RankingRow(entry: entries[index]),
          ],
        ],
      ),
    );
  }
}

class _RankingRow extends StatelessWidget {
  const _RankingRow({required this.entry});

  final WeeklyRankingEntry entry;

  @override
  Widget build(BuildContext context) {
    final name = entry.isCurrentUser ? '나' : '익명 여행자';
    final useStackedLayout = MediaQuery.textScalerOf(context).scale(1) > 1.3;
    return Semantics(
      container: true,
      label: '${entry.rank}위, $name, 도장 ${entry.stampCount}개',
      child: ExcludeSemantics(
        child: ConstrainedBox(
          constraints: const BoxConstraints(minHeight: 62),
          child: Padding(
            padding: const EdgeInsets.symmetric(vertical: 10),
            child: Row(
              crossAxisAlignment: CrossAxisAlignment.center,
              children: [
                SizedBox(
                  width: 48,
                  child: Text(
                    entry.rank.toString().padLeft(2, '0'),
                    style: Theme.of(context).textTheme.labelMedium?.copyWith(
                      color: StampyColors.accent,
                    ),
                  ),
                ),
                Expanded(
                  child: useStackedLayout
                      ? Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          mainAxisSize: MainAxisSize.min,
                          children: [
                            _RankingName(
                              name: name,
                              emphasized: entry.isCurrentUser,
                            ),
                            const SizedBox(height: 4),
                            Text(
                              '도장 ${entry.stampCount}개',
                              style: Theme.of(context).textTheme.bodySmall,
                            ),
                          ],
                        )
                      : Row(
                          children: [
                            Expanded(
                              child: _RankingName(
                                name: name,
                                emphasized: entry.isCurrentUser,
                              ),
                            ),
                            Text(
                              '도장 ${entry.stampCount}개',
                              style: Theme.of(context).textTheme.bodySmall,
                            ),
                          ],
                        ),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}

class _RankingName extends StatelessWidget {
  const _RankingName({required this.name, required this.emphasized});

  final String name;
  final bool emphasized;

  @override
  Widget build(BuildContext context) => Text(
    name,
    style: Theme.of(context).textTheme.bodyMedium?.copyWith(
      fontWeight: emphasized ? FontWeight.w600 : null,
    ),
  );
}

({String title, String description}) _personalRecordPresentation(
  StampSessionLoadStatus loadStatus,
  int collectedStampCount,
) {
  final partialTitle = '확인된 도장\n$collectedStampCount개가 있어요';
  if (loadStatus == StampSessionLoadStatus.loading && collectedStampCount > 0) {
    return (
      title: partialTitle,
      description: '전체 기록 동기화가 끝나지 않아 현재 확인된 도장만 보여드려요.',
    );
  }
  if (loadStatus == StampSessionLoadStatus.failed && collectedStampCount > 0) {
    return (
      title: partialTitle,
      description: '전체 기록 동기화에 실패해 현재 확인된 도장만 보여드려요. 프로필에서 다시 불러와 주세요.',
    );
  }

  return switch (loadStatus) {
    StampSessionLoadStatus.loading => (
      title: '여행 기록을\n불러오고 있어요',
      description: '수집한 도장을 확인하고 있습니다.',
    ),
    StampSessionLoadStatus.failed => (
      title: '여행 기록을\n불러오지 못했어요',
      description: '연결 상태를 확인한 뒤 프로필에서 다시 불러와 주세요.',
    ),
    StampSessionLoadStatus.loaded =>
      collectedStampCount == 0
          ? (
              title: '첫 도장을 모으면\n기록이 시작돼요',
              description: '관광지에 직접 방문해 첫 도장을 수집하고 나만의 여행 기록을 시작해 보세요.',
            )
          : (
              title: '지금까지 도장\n$collectedStampCount개를 모았어요',
              description: '지금까지 수집한 전체 도장 기록입니다. 새로운 장소에서 다음 도장을 이어가 보세요.',
            ),
  };
}
