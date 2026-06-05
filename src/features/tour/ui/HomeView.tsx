import { useEffect, useRef } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';
import { STAMP_RADIUS_METERS } from '@shared/config';
import { AppText, Badge, Mascot, Progress, Surface, colors, radius, spacing } from '@shared/ui';

export interface HomeTourSpot {
  readonly contentId: string;
  readonly title: string;
  readonly address: string;
  readonly theme: string;
  readonly distanceMeters: number;
  readonly collected: boolean;
}

interface HomeViewProps {
  readonly spots: readonly HomeTourSpot[];
  readonly collectedCount: number;
  readonly onSelectSpot?: (contentId: string) => void;
}

export function HomeView({ spots, collectedCount, onSelectSpot }: HomeViewProps) {
  const topSpots = spots.slice(0, 2);
  const level = 3;
  const exp = 620;
  const nextExp = 1000;
  const progressPercent = Math.round((exp / nextExp) * 100);

  // Hero entrance animation
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

  useEffect(() => {
    heroOpacityRef.current.value = withTiming(1, { duration: 350 });
    heroTranslateYRef.current.value = withTiming(0, { duration: 350 });
  }, []);

  return (
    <SafeAreaView style={styles.root}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.topbar}>
          <View style={styles.brandBlock}>
            <AppText variant="h2" tone="ink">
              스탬피
            </AppText>
            <AppText variant="caption" tone="inkMuted">
              오늘은 어디서 스탬프를 찍어볼까요?
            </AppText>
          </View>
          <View style={styles.avatar}>
            <Mascot size={40} mood="happy" />
          </View>
        </View>

        {/* Hero block: typography-led, no gradient */}
        <Animated.View style={[styles.hero, heroAnimStyle]}>
          <AppText variant="micro" tone="brand">
            LV.{level} · 지역 탐험가
          </AppText>
          <AppText variant="display" tone="ink" style={styles.heroTitle}>
            이번 주{'\n'}2개만 더
          </AppText>
          <Progress value={progressPercent} tone="reward" />
          <View style={styles.heroFootRow}>
            <AppText variant="caption" tone="inkMuted">
              EXP {exp} / {nextExp}
            </AppText>
            <AppText variant="captionBold" tone="ink">
              {progressPercent}%
            </AppText>
          </View>
        </Animated.View>

        <View style={styles.sectionHead}>
          <AppText variant="h2">근처에서 찍을 수 있어요</AppText>
          <AppText variant="caption" tone="brand">
            지도 보기
          </AppText>
        </View>

        <View style={styles.nearbyList}>
          {topSpots.map((spot, index) => (
            <Pressable
              key={spot.contentId}
              accessibilityRole="button"
              accessibilityLabel={`${spot.title} 상세 보기`}
              onPress={() => onSelectSpot?.(spot.contentId)}
              style={({ pressed }) => [pressed ? styles.pressed : null]}
            >
              <Surface elevation="e1" radius="md" style={styles.spotCard}>
                <View style={[styles.thumb, getThumbStyle(index)]}>
                  <AppText style={styles.thumbText}>{getSpotIcon(index)}</AppText>
                </View>
                <View style={styles.spotCopy}>
                  <AppText variant="h3">{spot.title}</AppText>
                  <AppText variant="caption" tone="inkMuted">
                    {spot.address} · {spot.distanceMeters}m
                  </AppText>
                  <View style={styles.badgeRow}>
                    <Badge tone={getStatusTone(spot)} size="sm">
                      {getStatusLabel(spot)}
                    </Badge>
                    <Badge tone="neutral" size="sm">
                      {spot.theme}
                    </Badge>
                  </View>
                </View>
              </Surface>
            </Pressable>
          ))}
        </View>

        <View style={styles.sectionHead}>
          <AppText variant="h2">추천 컬렉션</AppText>
          <AppText variant="caption" tone="brand">
            전체
          </AppText>
        </View>

        <Surface elevation="e1" radius="lg" style={styles.collectionCard}>
          <AppText variant="h3">서울 5대 궁궐 컬렉션</AppText>
          <Progress value={60} tone="reward" />
          <View style={styles.collectionBadges}>
            <Badge tone="neutral" size="sm">
              {Math.min(collectedCount + 2, 5)} / 5 완료
            </Badge>
            <Badge tone="reward" size="sm">
              보상 +50EXP
            </Badge>
          </View>
        </Surface>

        <View style={styles.sectionHead}>
          <AppText variant="h2">오늘의 목표</AppText>
          <AppText variant="caption" tone="brand">
            {STAMP_RADIUS_METERS}m 반경
          </AppText>
        </View>

        <Surface elevation="e1" radius="lg" style={styles.goalCard}>
          <AppText variant="h3">근처 관광지 2곳에서 도장 수집</AppText>
          <AppText variant="body" tone="inkSoft">
            홈에서 스팟을 열고, 상세에서 도장 화면으로 이어가 보세요.
          </AppText>
        </Surface>
      </ScrollView>
    </SafeAreaView>
  );
}

const getThumbStyle = (index: number) => {
  if (index === 0) {
    return styles.thumbPalace;
  }

  return styles.thumbEvent;
};

const getSpotIcon = (index: number) => {
  if (index === 0) {
    return '🏯';
  }

  return '🎪';
};

const getStatusLabel = (spot: HomeTourSpot) => {
  if (spot.collected) {
    return '수집 완료';
  }

  if (spot.distanceMeters <= STAMP_RADIUS_METERS) {
    return '도장 가능';
  }

  return '방문 전';
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
  root: { flex: 1, backgroundColor: colors.canvas },
  content: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
    paddingBottom: spacing.xxxl,
    gap: spacing.md,
  },
  topbar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.md,
  },
  brandBlock: { flex: 1, minWidth: 0, gap: 2 },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
  },
  hero: {
    paddingVertical: spacing.xl,
    gap: spacing.sm + 2,
  },
  heroTitle: {
    marginTop: spacing.xs,
  },
  heroFootRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  sectionHead: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'space-between',
    marginTop: 2,
  },
  nearbyList: { gap: spacing.sm + 2 },
  spotCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    padding: spacing.md,
  },
  pressed: { opacity: 0.85 },
  thumb: {
    width: 64,
    height: 64,
    borderRadius: radius.sm + 4,
    alignItems: 'center',
    justifyContent: 'center',
  },
  thumbPalace: { backgroundColor: colors.brandSoft },
  thumbEvent: { backgroundColor: colors.surfaceSink },
  thumbText: { fontSize: 24 },
  spotCopy: { flex: 1, minWidth: 0, gap: spacing.xs },
  badgeRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm - 2, marginTop: spacing.xs },
  collectionCard: {
    padding: spacing.lg,
    gap: spacing.sm + 2,
  },
  collectionBadges: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm - 2 },
  goalCard: {
    padding: spacing.lg,
    gap: spacing.sm - 2,
  },
});
