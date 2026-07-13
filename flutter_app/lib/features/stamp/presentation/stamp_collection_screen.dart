import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:intl/intl.dart';
import 'package:stampy/app/theme/app_colors.dart';
import 'package:stampy/core/widgets/field_journal.dart';

import '../domain/stamp.dart';
import 'stamp_session.dart';

const _collectionGoal = 24;

class StampCollectionScreen extends ConsumerWidget {
  const StampCollectionScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final collectedStamps = ref.watch(
      stampSessionProvider.select((state) => state.collectedStamps),
    );
    final textScale = MediaQuery.textScalerOf(context).scale(1);
    final useSingleColumn =
        MediaQuery.sizeOf(context).width < 360 || textScale > 1.3;
    final scaledCardExtent =
        270.0 + (textScale - 1).clamp(0.0, 3.0).toDouble() * 84.0;
    final slotCount = collectedStamps.length > _collectionGoal
        ? collectedStamps.length
        : _collectionGoal;

    return FieldJournalPage(
      eyebrow: '나의 여행 기록',
      title: '모은 도장을\n한눈에 펼쳐보세요',
      description: '방문한 장소의 이름과 날짜가 쌓일수록 나만의 한국 여행 도감이 완성됩니다.',
      trailing: JournalBadge(
        label: '${collectedStamps.length} / $_collectionGoal',
        emphasized: collectedStamps.isNotEmpty,
      ),
      children: [
        JournalSection(
          index: '01',
          title: '도장 컬렉션',
          child: GridView.builder(
            shrinkWrap: true,
            physics: const NeverScrollableScrollPhysics(),
            gridDelegate: SliverGridDelegateWithFixedCrossAxisCount(
              crossAxisCount: useSingleColumn ? 1 : 2,
              mainAxisSpacing: 12,
              crossAxisSpacing: 12,
              mainAxisExtent: useSingleColumn ? scaledCardExtent : 238,
            ),
            itemCount: slotCount,
            itemBuilder: (context, index) {
              if (index < collectedStamps.length) {
                return _CollectedStampCard(
                  index: index + 1,
                  stamp: collectedStamps[index],
                );
              }
              return _EmptyStamp(index: index + 1);
            },
          ),
        ),
      ],
    );
  }
}

class _CollectedStampCard extends StatelessWidget {
  const _CollectedStampCard({required this.index, required this.stamp});

  final int index;
  final CollectedStamp stamp;

  @override
  Widget build(BuildContext context) {
    final collectedDate = _formatDate(stamp.collectedAt);
    final coordinates = _formatCoordinates(stamp);
    final verification = _formatVerification(stamp);

    return Semantics(
      label: '${stamp.title} 도장, $collectedDate, $coordinates, $verification',
      container: true,
      child: DecoratedBox(
        decoration: BoxDecoration(
          color: StampyColors.paper,
          border: Border.all(color: StampyColors.paleAccent),
          borderRadius: BorderRadius.circular(16),
        ),
        child: Padding(
          padding: const EdgeInsets.all(14),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                children: [
                  Text(
                    index.toString().padLeft(2, '0'),
                    style: Theme.of(context).textTheme.labelMedium?.copyWith(
                      color: StampyColors.accent,
                    ),
                  ),
                  const Spacer(),
                  const Icon(
                    Icons.check_circle_outline,
                    size: 18,
                    color: StampyColors.accent,
                  ),
                ],
              ),
              const Spacer(),
              const Align(child: _MiniStamp()),
              const Spacer(),
              Text(
                stamp.title,
                maxLines: 2,
                overflow: TextOverflow.ellipsis,
                style: Theme.of(context).textTheme.titleMedium,
              ),
              const SizedBox(height: 5),
              Text(
                collectedDate,
                style: Theme.of(context).textTheme.labelMedium?.copyWith(
                  color: StampyColors.accent,
                  letterSpacing: 0.5,
                ),
              ),
              const SizedBox(height: 5),
              Text(
                coordinates,
                maxLines: 1,
                overflow: TextOverflow.ellipsis,
                style: Theme.of(context).textTheme.bodySmall?.copyWith(
                  fontSize: 10,
                  letterSpacing: 0.2,
                ),
              ),
              const SizedBox(height: 3),
              Text(
                verification,
                maxLines: 1,
                overflow: TextOverflow.ellipsis,
                style: Theme.of(context).textTheme.bodySmall?.copyWith(
                  fontSize: 9,
                  color: StampyColors.mutedInk,
                  letterSpacing: 0.1,
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

class _MiniStamp extends StatelessWidget {
  const _MiniStamp();

  @override
  Widget build(BuildContext context) {
    return Transform.rotate(
      angle: -0.05,
      child: Container(
        width: 58,
        height: 58,
        decoration: BoxDecoration(
          shape: BoxShape.circle,
          border: Border.all(color: StampyColors.accent, width: 2.5),
        ),
        child: const Icon(
          Icons.location_on_outlined,
          color: StampyColors.accent,
          size: 30,
        ),
      ),
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

String _formatCoordinates(CollectedStamp stamp) {
  final latitude = stamp.location.latitude.value;
  final longitude = stamp.location.longitude.value;
  return '${latitude.abs().toStringAsFixed(4)}° ${latitude < 0 ? 'S' : 'N'}'
      ' · '
      '${longitude.abs().toStringAsFixed(4)}° ${longitude < 0 ? 'W' : 'E'}';
}

String _formatVerification(CollectedStamp stamp) {
  final accuracy = stamp.verificationFix.accuracyMeters;
  final accuracyLabel = accuracy == accuracy.roundToDouble()
      ? accuracy.toStringAsFixed(0)
      : accuracy.toStringAsFixed(1);
  final measuredAt = DateFormat(
    'HH:mm',
  ).format(stamp.verificationFix.timestamp.toUtc());
  return 'GPS ±${accuracyLabel}m · $measuredAt UTC';
}

String _formatDate(DateTime value) =>
    DateFormat('yyyy.MM.dd').format(value.toLocal());
