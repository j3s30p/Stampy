import { useFocusEffect } from 'expo-router';
import { useCallback, useMemo, useRef } from 'react';
import { Pressable, ScrollView, StyleSheet, View, useWindowDimensions } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';
import { STAMP_RADIUS_METERS } from '@shared/config';
import type { Coordinates } from '@shared/types';
import {
  AppText,
  Badge,
  Button,
  Gauge,
  Mascot,
  Surface,
  colors,
  radius,
  spacing,
} from '@shared/ui';

export interface HomeTourSpot {
  readonly contentId: string;
  readonly title: string;
  readonly address: string;
  readonly theme: string;
  readonly distanceMeters: number;
  readonly collected: boolean;
  readonly location: Coordinates;
}

interface HomeViewProps {
  readonly spots: readonly HomeTourSpot[];
  readonly collectedCount: number;
  readonly onSelectSpot?: (contentId: string) => void;
}

export function HomeView({ spots, collectedCount, onSelectSpot }: HomeViewProps) {
  const { width } = useWindowDimensions();
  const isCompactHero = width < 420;
  const isTightHero = width < 360;
  const heroMascotSize = isTightHero ? 88 : isCompactHero ? 100 : 110;
  const heroOpacity = useSharedValue(0);
  const heroTranslateY = useSharedValue(8);
  // eslint-disable-next-line react-hooks/immutability -- SharedValue refs for animation in useEffect
  const heroOpacityRef = useRef(heroOpacity);
  // eslint-disable-next-line react-hooks/immutability -- SharedValue refs for animation in useEffect
  const heroTranslateYRef = useRef(heroTranslateY);

  const heroAnimStyle = useAnimatedStyle(() => ({
    opacity: heroOpacityRef.current.value,
    transform: [{ translateY: heroTranslateYRef.current.value }],
  }));

  useFocusEffect(
    useCallback(() => {
      heroOpacityRef.current.value = 0;
      heroTranslateYRef.current.value = 8;
      heroOpacityRef.current.value = withTiming(1, { duration: 320 });
      heroTranslateYRef.current.value = withTiming(0, { duration: 320 });
    }, []),
  );

  const summary = useMemo(() => {
    const total = spots.length;
    const readyCount = spots.filter(
      (spot) => !spot.collected && spot.distanceMeters <= STAMP_RADIUS_METERS,
    ).length;
    const remaining = Math.max(0, total - collectedCount);

    return {
      total,
      readyCount,
      remaining,
      progressPercent: total > 0 ? Math.round((collectedCount / total) * 100) : 0,
    };
  }, [collectedCount, spots]);

  const nearbySpots = spots.slice(0, 3);
  const nextSpot = nearbySpots[0] ?? null;

  return (
    <SafeAreaView style={styles.root}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.topbar}>
          <View style={styles.brandBlock}>
            <AppText variant="micro" tone="brand">
              Stampy
            </AppText>
            <AppText variant="h1" tone="ink" numberOfLines={1}>
              오늘은 어디서 도장을 찍을까요?
            </AppText>
            <AppText variant="caption" tone="inkMuted" numberOfLines={2}>
              관광지 방문 인증과 수집 현황을 한 화면에서 확인하세요.
            </AppText>
          </View>
          <View style={styles.miniMascot}>
            <Mascot size={42} mood="happy" />
          </View>
        </View>

        <Animated.View
          style={[styles.heroCard, isCompactHero ? styles.heroCardCompact : null, heroAnimStyle]}
        >
          <View style={styles.heroCopy}>
            <Badge tone="brand" size="sm">
              실시간 방문 체크
            </Badge>
            <AppText
              variant="display"
              tone="ink"
              style={styles.heroTitle}
              numberOfLines={isCompactHero ? 3 : 2}
            >
              이번 여행{'\n'}
              남은 도장 {summary.remaining}곳
            </AppText>
            <AppText variant="body" tone="inkSoft" numberOfLines={isCompactHero ? 3 : 2}>
              가까운 관광지만 도장 후보로 열립니다. 반경 {STAMP_RADIUS_METERS}m 기준입니다.
            </AppText>
            <View style={styles.heroMetaRow}>
              <View style={styles.heroMetaItem}>
                <AppText variant="title" tone="ink">
                  {collectedCount}
                </AppText>
                <AppText variant="caption" tone="inkMuted" numberOfLines={1}>
                  이번 달 도장
                </AppText>
              </View>
              <View style={styles.heroMetaItem}>
                <AppText variant="title" tone="ink">
                  {summary.readyCount}
                </AppText>
                <AppText variant="caption" tone="inkMuted" numberOfLines={1}>
                  반경 안
                </AppText>
              </View>
              <View style={styles.heroMetaItem}>
                <AppText variant="title" tone="ink">
                  {summary.progressPercent}%
                </AppText>
                <AppText variant="caption" tone="inkMuted" numberOfLines={1}>
                  전체 완성도
                </AppText>
              </View>
            </View>
            <Gauge value={summary.progressPercent} tone="reward" />
          </View>

          <View
            style={[styles.heroMascotPanel, isCompactHero ? styles.heroMascotPanelCompact : null]}
          >
            <View
              style={[
                styles.heroMascotCircle,
                isCompactHero ? styles.heroMascotCircleCompact : null,
              ]}
            >
              <Mascot size={heroMascotSize} mood="happy" />
            </View>
            <View
              style={[styles.heroMascotNote, isCompactHero ? styles.heroMascotNoteCompact : null]}
            >
              <AppText variant="captionBold" tone="ink" numberOfLines={1}>
                스탬피
              </AppText>
              <AppText variant="micro" tone="inkMuted" numberOfLines={2}>
                도장 수집을 돕는 간단한 마스코트
              </AppText>
            </View>
          </View>
        </Animated.View>

        <View style={styles.sectionHead}>
          <AppText variant="h2" tone="ink" numberOfLines={1}>
            가까운 도장 후보
          </AppText>
          <Badge tone="neutral" size="sm">
            {summary.total}곳
          </Badge>
        </View>

        <View style={styles.spotList}>
          {nearbySpots.map((spot, index) => (
            <Pressable
              key={spot.contentId}
              accessibilityRole="button"
              accessibilityLabel={`${spot.title} 상세 보기`}
              onPress={() => onSelectSpot?.(spot.contentId)}
              style={({ pressed }) => [styles.spotPressable, pressed ? styles.pressed : null]}
            >
              <Surface elevation="e1" radius="lg" style={styles.spotCard}>
                <View style={[styles.indexChip, getIndexChipStyle(index)]}>
                  <AppText variant="micro" tone="onDark">
                    {String(index + 1).padStart(2, '0')}
                  </AppText>
                </View>
                <View style={styles.spotCopy}>
                  <View style={styles.spotTitleRow}>
                    <AppText variant="h3" tone="ink" numberOfLines={1}>
                      {spot.title}
                    </AppText>
                    <Badge tone={getStatusTone(spot)} size="sm">
                      {getStatusLabel(spot)}
                    </Badge>
                  </View>
                  <AppText variant="caption" tone="inkMuted" numberOfLines={1}>
                    {spot.address}
                  </AppText>
                  <View style={styles.spotMetaRow}>
                    <Badge tone="neutral" size="sm">
                      {spot.theme}
                    </Badge>
                    <Badge tone="neutral" size="sm">
                      {spot.distanceMeters}m
                    </Badge>
                  </View>
                </View>
              </Surface>
            </Pressable>
          ))}
        </View>

        <Surface elevation="e1" radius="lg" style={styles.collectionCard}>
          <View style={styles.sectionHead}>
            <AppText variant="h2" tone="ink" numberOfLines={1}>
              추천 컬렉션
            </AppText>
            <Badge tone="reward" size="sm">
              보상 +50EXP
            </Badge>
          </View>
          <AppText variant="h3" tone="ink" numberOfLines={1}>
            서울 5대 궁궐 컬렉션
          </AppText>
          <AppText variant="body" tone="inkSoft" numberOfLines={2}>
            대표 관광지 5곳을 모으면 여행 보상을 받을 수 있어요.
          </AppText>
          <Gauge value={summary.progressPercent} tone="reward" />
          <View style={styles.collectionBadges}>
            <Badge tone="neutral" size="sm">
              {Math.min(collectedCount, 5)} / 5 완료
            </Badge>
            <Badge tone={summary.readyCount > 0 ? 'ready' : 'neutral'} size="sm">
              {summary.readyCount > 0 ? '반경 안' : '가까이 이동 필요'}
            </Badge>
          </View>
        </Surface>

        <Surface elevation="e1" radius="lg" style={styles.goalCard}>
          <View style={styles.goalHeader}>
            <Badge tone="brand" size="sm">
              오늘의 목표
            </Badge>
            <AppText variant="micro" tone="inkMuted">
              반경 {STAMP_RADIUS_METERS}m 고정
            </AppText>
          </View>
          <AppText variant="h3" tone="ink" numberOfLines={2}>
            가까운 관광지 1곳을 먼저 열어보세요.
          </AppText>
          <AppText variant="body" tone="inkSoft" numberOfLines={2}>
            상세 화면에서 주소와 인증 상태를 확인하고, 도장 탭으로 이어갈 수 있어요.
          </AppText>
          <Button
            variant="secondary"
            size="md"
            fullWidth
            onPress={() => {
              if (nextSpot) {
                onSelectSpot?.(nextSpot.contentId);
              }
            }}
            accessibilityLabel="가장 가까운 스팟 열기"
          >
            가장 가까운 스팟 열기
          </Button>
        </Surface>
      </ScrollView>
    </SafeAreaView>
  );
}

const getIndexChipStyle = (index: number) => {
  if (index === 0) {
    return styles.indexChipPrimary;
  }

  if (index === 1) {
    return styles.indexChipSecondary;
  }

  return styles.indexChipNeutral;
};

const getStatusLabel = (spot: HomeTourSpot) => {
  if (spot.collected) {
    return '수집 완료';
  }

  if (spot.distanceMeters <= STAMP_RADIUS_METERS) {
    return '반경 안';
  }

  return '가까이 이동 필요';
};

const getStatusTone = (spot: HomeTourSpot): 'done' | 'ready' | 'neutral' => {
  if (spot.collected) {
    return 'done';
  }

  if (spot.distanceMeters <= STAMP_RADIUS_METERS) {
    return 'ready';
  }

  return 'neutral';
};

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.canvas,
  },
  content: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
    paddingBottom: spacing.xxxl,
    gap: spacing.md,
  },
  topbar: {
    flexDirection: 'row',
    gap: spacing.md,
    alignItems: 'flex-start',
  },
  brandBlock: {
    flex: 1,
    minWidth: 0,
    gap: spacing.xs,
  },
  miniMascot: {
    width: 56,
    height: 56,
    borderRadius: radius.lg,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroCard: {
    flexDirection: 'row',
    gap: spacing.lg,
    padding: spacing.lg,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.lg,
    shadowColor: '#0A0A0A',
    shadowOpacity: 0.05,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 6 },
    elevation: 2,
  },
  heroCopy: {
    flex: 1,
    minWidth: 0,
    flexShrink: 1,
    gap: spacing.sm,
  },
  heroTitle: {
    marginTop: spacing.xs / 2,
  },
  heroCardCompact: {
    flexDirection: 'column',
    gap: spacing.md,
    padding: spacing.md,
  },
  heroMetaRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  heroMetaItem: {
    flex: 1,
    minWidth: 0,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.sm,
    borderRadius: radius.md,
    backgroundColor: colors.surfaceSink,
    gap: 2,
  },
  heroMascotPanel: {
    width: 132,
    minWidth: 0,
    alignItems: 'center',
    gap: spacing.sm,
    alignSelf: 'center',
  },
  heroMascotPanelCompact: {
    width: '100%',
    flexDirection: 'row',
    alignSelf: 'stretch',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: spacing.md,
    paddingTop: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  heroMascotCircle: {
    width: 132,
    height: 132,
    borderRadius: 66,
    backgroundColor: colors.surfaceSink,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  heroMascotCircleCompact: {
    width: 108,
    height: 108,
    borderRadius: 54,
  },
  heroMascotNote: {
    alignItems: 'center',
    gap: 2,
  },
  heroMascotNoteCompact: {
    flex: 1,
    alignItems: 'flex-start',
    minWidth: 0,
    justifyContent: 'center',
  },
  sectionHead: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
    gap: spacing.sm,
  },
  spotList: {
    gap: spacing.sm,
  },
  spotPressable: {
    minWidth: 0,
  },
  spotCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.md,
    padding: spacing.md,
  },
  indexChip: {
    width: 46,
    height: 46,
    borderRadius: radius.full,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.brand,
  },
  indexChipPrimary: {
    backgroundColor: colors.brand,
  },
  indexChipSecondary: {
    backgroundColor: colors.locationDot,
  },
  indexChipNeutral: {
    backgroundColor: colors.stamp,
  },
  spotCopy: {
    flex: 1,
    minWidth: 0,
    gap: spacing.xs,
  },
  spotTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
  spotMetaRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
  },
  collectionCard: {
    padding: spacing.lg,
    gap: spacing.sm,
  },
  collectionBadges: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
  },
  goalCard: {
    padding: spacing.lg,
    gap: spacing.sm,
  },
  goalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: spacing.sm,
  },
  pressed: {
    opacity: 0.88,
  },
});
