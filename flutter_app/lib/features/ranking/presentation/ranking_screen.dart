import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:stampy/app/theme/app_colors.dart';
import 'package:stampy/core/widgets/field_journal.dart';
import 'package:stampy/features/stamp/presentation/stamp_session.dart';

class RankingScreen extends ConsumerWidget {
  const RankingScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final collectedStampCount = ref.watch(
      stampSessionProvider.select((session) => session.collectedStamps.length),
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
            title: _personalRecordTitle(collectedStampCount),
            description: _personalRecordDescription(collectedStampCount),
          ),
        ),
      ],
    );
  }
}

String _personalRecordTitle(int collectedStampCount) => collectedStampCount == 0
    ? '첫 도장을 모으면\n기록이 시작돼요'
    : '지금까지 도장\n$collectedStampCount개를 모았어요';

String _personalRecordDescription(int collectedStampCount) =>
    collectedStampCount == 0
    ? '관광지에 직접 방문해 첫 도장을 수집하고 나만의 여행 기록을 시작해 보세요.'
    : '지금까지 수집한 전체 도장 기록입니다. 새로운 장소에서 다음 도장을 이어가 보세요.';

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
