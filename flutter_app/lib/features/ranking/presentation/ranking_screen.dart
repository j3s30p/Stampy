import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:stampy/app/theme/app_colors.dart';
import 'package:stampy/core/widgets/field_journal.dart';
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

    return FieldJournalPage(
      eyebrow: '여행자 기록',
      title: '도시를 걷는\n여행자들의 순위',
      description: '경쟁보다 꾸준한 탐험에 집중할 수 있도록 수집한 도장 수를 차분하게 비교합니다.',
      trailing: const JournalBadge(label: '이번 주'),
      children: [
        JournalSection(
          index: '01',
          title: '주간 랭킹',
          child: DecoratedBox(
            decoration: const BoxDecoration(
              border: Border(
                top: BorderSide(color: StampyColors.hairline),
                bottom: BorderSide(color: StampyColors.hairline),
              ),
            ),
            child: Column(
              children: const [
                _RankingRow(rank: '01', name: '첫 번째 여행자', stamps: '—'),
                _RankingRow(rank: '02', name: '두 번째 여행자', stamps: '—'),
                _RankingRow(rank: '03', name: '세 번째 여행자', stamps: '—'),
              ],
            ),
          ),
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

class _RankingRow extends StatelessWidget {
  const _RankingRow({
    required this.rank,
    required this.name,
    required this.stamps,
  });

  final String rank;
  final String name;
  final String stamps;

  @override
  Widget build(BuildContext context) {
    return Container(
      constraints: const BoxConstraints(minHeight: 62),
      decoration: const BoxDecoration(
        border: Border(bottom: BorderSide(color: StampyColors.hairline)),
      ),
      child: Row(
        children: [
          SizedBox(
            width: 48,
            child: Text(
              rank,
              style: Theme.of(
                context,
              ).textTheme.labelMedium?.copyWith(color: StampyColors.accent),
            ),
          ),
          Expanded(
            child: Text(name, style: Theme.of(context).textTheme.bodyMedium),
          ),
          Text('$stamps 도장', style: Theme.of(context).textTheme.bodySmall),
        ],
      ),
    );
  }
}
