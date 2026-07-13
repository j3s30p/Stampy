import 'package:flutter/material.dart';
import 'package:stampy/app/theme/app_colors.dart';
import 'package:stampy/core/widgets/field_journal.dart';

class StampCollectionScreen extends StatelessWidget {
  const StampCollectionScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return FieldJournalPage(
      eyebrow: '나의 여행 기록',
      title: '모은 도장을\n한눈에 펼쳐보세요',
      description: '방문한 장소의 이름과 날짜가 쌓일수록 나만의 한국 여행 도감이 완성됩니다.',
      trailing: const JournalBadge(label: '0 / 24'),
      children: [
        JournalSection(
          index: '01',
          title: '도장 컬렉션',
          child: GridView.builder(
            shrinkWrap: true,
            physics: const NeverScrollableScrollPhysics(),
            gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
              crossAxisCount: 2,
              mainAxisSpacing: 12,
              crossAxisSpacing: 12,
              childAspectRatio: 1.1,
            ),
            itemCount: 4,
            itemBuilder: (context, index) {
              return _EmptyStamp(index: index + 1);
            },
          ),
        ),
      ],
    );
  }
}

class _EmptyStamp extends StatelessWidget {
  const _EmptyStamp({required this.index});

  final int index;

  @override
  Widget build(BuildContext context) {
    return DecoratedBox(
      decoration: BoxDecoration(
        color: StampyColors.paper,
        border: Border.all(color: StampyColors.hairline),
        borderRadius: BorderRadius.circular(16),
      ),
      child: Padding(
        padding: const EdgeInsets.all(14),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              index.toString().padLeft(2, '0'),
              style: Theme.of(context).textTheme.labelMedium,
            ),
            const Spacer(),
            Align(
              child: Container(
                width: 54,
                height: 54,
                decoration: BoxDecoration(
                  shape: BoxShape.circle,
                  border: Border.all(color: StampyColors.hairline, width: 1.5),
                ),
                child: const Icon(
                  Icons.add_location_alt_outlined,
                  color: StampyColors.hairline,
                  size: 23,
                ),
              ),
            ),
            const Spacer(),
            Text('아직 비어 있음', style: Theme.of(context).textTheme.bodySmall),
          ],
        ),
      ),
    );
  }
}
