import 'package:flutter/material.dart';
import 'package:stampy/app/theme/app_colors.dart';
import 'package:stampy/core/widgets/field_journal.dart';

class HomeScreen extends StatelessWidget {
  const HomeScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return FieldJournalPage(
      eyebrow: '오늘의 탐험',
      title: '오늘은 어디에\n도장을 남겨볼까요?',
      description: '가까운 관광지와 진행 중인 행사를 살펴보고, 실제 방문을 한 장의 기록으로 남겨보세요.',
      trailing: const JournalBadge(label: 'GPS 준비 중'),
      children: [
        JournalSection(
          index: '01',
          title: '가장 가까운 미수집 도장',
          trailing: const JournalBadge(label: '추천 예정', emphasized: true),
          child: const JournalNotice(
            number: 'A–01',
            badge: '지금 가기 좋아요',
            title: '위치를 연결하면\n오늘의 장소를 보여드려요',
            description: '거리, 수집 이력, 관심 행동을 바탕으로 한 가지 추천 이유만 선명하게 표시합니다.',
          ),
        ),
        JournalSection(
          index: '02',
          title: '여행 기록',
          child: Row(
            children: [
              const Expanded(
                child: JournalStat(value: '0', suffix: '개', label: '수집한 도장'),
              ),
              Container(width: 1, height: 52, color: StampyColors.hairline),
              const SizedBox(width: 20),
              const Expanded(
                child: JournalStat(value: '0', suffix: '곳', label: '방문한 지역'),
              ),
              Container(width: 1, height: 52, color: StampyColors.hairline),
              const SizedBox(width: 20),
              const Expanded(
                child: JournalStat(value: '—', label: '이번 주 순위'),
              ),
            ],
          ),
        ),
      ],
    );
  }
}
