import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:stampy/app/theme/app_colors.dart';
import 'package:stampy/core/auth/auth.dart';
import 'package:stampy/core/location/location.dart';
import 'package:stampy/core/widgets/field_journal.dart';
import 'package:stampy/features/recommendation/data/recommendation_providers.dart';
import 'package:stampy/features/recommendation/domain/recommendation_domain.dart';

class HomeScreen extends ConsumerWidget {
  const HomeScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final authUser = ref.watch(currentAuthUserProvider);
    final location = ref.watch(currentLocationProvider);
    final recommendation = ref.watch(nearbyRecommendationProvider);
    final presentation = _recommendationPresentation(
      authUser,
      location,
      recommendation,
    );

    return FieldJournalPage(
      eyebrow: '오늘의 탐험',
      title: '오늘은 어디에\n도장을 남겨볼까요?',
      description: '가까운 관광지와 진행 중인 행사를 살펴보고, 실제 방문을 한 장의 기록으로 남겨보세요.',
      trailing: JournalBadge(label: _gpsLabel(location)),
      children: [
        JournalSection(
          index: '01',
          title: '가장 가까운 미수집 도장',
          trailing: JournalBadge(
            label: presentation.sectionLabel,
            emphasized: presentation.isAvailable,
          ),
          child: JournalNotice(
            number: 'A–01',
            badge: presentation.badge,
            title: presentation.title,
            description: presentation.description,
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

String _gpsLabel(AsyncValue<LocationState> location) => location.when(
  skipLoadingOnRefresh: false,
  skipLoadingOnReload: false,
  data: (state) => switch (state.status) {
    LocationStatus.loading => 'GPS 확인 중',
    LocationStatus.available => 'GPS 연결됨',
    _ => 'GPS 필요',
  },
  error: (error, stackTrace) => 'GPS 오류',
  loading: () => 'GPS 확인 중',
);

_RecommendationPresentation _recommendationPresentation(
  AsyncValue<AuthUser> authUser,
  AsyncValue<LocationState> location,
  AsyncValue<Recommendation?> recommendation,
) => location.when(
  skipLoadingOnRefresh: false,
  skipLoadingOnReload: false,
  data: (state) {
    if (state.fix == null) {
      return switch (state.status) {
        LocationStatus.loading => const _RecommendationPresentation.loading(),
        LocationStatus.serviceDisabled =>
          const _RecommendationPresentation.locationRequired(
            title: '위치 서비스를 켜주세요',
            description: '현재 위치를 확인하면 1km 안의 미수집 도장을 추천해 드려요.',
          ),
        LocationStatus.permissionDenied ||
        LocationStatus.permissionDeniedForever =>
          const _RecommendationPresentation.locationRequired(
            title: '위치 권한이 필요해요',
            description: '현재 위치는 추천 요청에만 사용하며 저장하지 않아요.',
          ),
        _ => const _RecommendationPresentation.locationRequired(
          title: '현재 위치를 확인하지 못했어요',
          description: 'GPS 상태를 확인한 뒤 다시 홈을 열어주세요.',
        ),
      };
    }
    if (authUser case AsyncData(:final value) when value.isGuest) {
      return const _RecommendationPresentation.guest();
    }

    return recommendation.when(
      skipLoadingOnRefresh: false,
      skipLoadingOnReload: false,
      data: (value) => value == null
          ? const _RecommendationPresentation.empty()
          : _RecommendationPresentation.available(value),
      error: (error, stackTrace) => const _RecommendationPresentation.error(),
      loading: _RecommendationPresentation.loading,
    );
  },
  error: (error, stackTrace) =>
      const _RecommendationPresentation.locationError(),
  loading: _RecommendationPresentation.loading,
);

final class _RecommendationPresentation {
  const _RecommendationPresentation._({
    required this.sectionLabel,
    required this.title,
    required this.description,
    this.badge,
    this.isAvailable = false,
  });

  const _RecommendationPresentation.loading()
    : this._(
        sectionLabel: '추천 계산 중',
        title: '가까운 미수집 도장을 찾고 있어요',
        description: '현재 위치와 수집 기록을 확인하고 있어요.',
      );

  const _RecommendationPresentation.locationRequired({
    required String title,
    required String description,
  }) : this._(sectionLabel: 'GPS 필요', title: title, description: description);

  const _RecommendationPresentation.locationError()
    : this._(
        sectionLabel: 'GPS 오류',
        title: '현재 위치를 확인하지 못했어요',
        description: '잠시 후 다시 홈을 열어주세요.',
      );

  const _RecommendationPresentation.guest()
    : this._(
        sectionLabel: '게스트 모드',
        title: '추천 데이터 연결이 필요해요',
        description: '앱 연결이 완료되면 현재 위치와 수집 기록으로 가까운 도장을 보여드려요.',
      );

  const _RecommendationPresentation.empty()
    : this._(
        sectionLabel: '추천 없음',
        title: '1km 안의 미수집 도장을 모두 모았어요',
        description: '새로운 지역에서 다시 확인해 보세요.',
      );

  const _RecommendationPresentation.error()
    : this._(
        sectionLabel: '연결 실패',
        title: '추천을 불러오지 못했어요',
        description: '잠시 후 다시 홈을 열어주세요.',
      );

  _RecommendationPresentation.available(Recommendation recommendation)
    : this._(
        sectionLabel: '추천 1곳',
        title: recommendation.title,
        description:
            '현재 위치에서 ${_formatDistance(recommendation.distanceMeters)} · '
            '아직 수집하지 않은 도장이에요.',
        badge: '가까운 미수집',
        isAvailable: true,
      );

  final String sectionLabel;
  final String title;
  final String description;
  final String? badge;
  final bool isAvailable;
}

String _formatDistance(double distanceMeters) {
  if (distanceMeters < 1000) {
    return '${distanceMeters.round()}m';
  }
  return '${(distanceMeters / 1000).toStringAsFixed(1)}km';
}
