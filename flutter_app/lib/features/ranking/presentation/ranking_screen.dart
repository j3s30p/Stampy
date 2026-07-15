import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
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
      description: '여행자들의 도장 기록을 비교하는 기능을 준비하고 있습니다.',
      trailing: const JournalBadge(label: '준비 중'),
      children: [
        JournalSection(
          index: '01',
          title: '주간 랭킹',
          child: const JournalNotice(
            number: 'RANK',
            title: '주간 랭킹을\n준비하고 있어요',
            description: '여행자들의 도장 기록을 비교하는 기능은 아직 준비 중이에요.',
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
