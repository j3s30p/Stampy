import { useFocusEffect } from 'expo-router';
import { useCallback, useEffect, useRef } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';
import { STAMP_RADIUS_METERS } from '@shared/config';
import {
  AppText,
  Badge,
  Button,
  Mascot,
  Progress,
  StampDrop,
  Surface,
  colors,
  radius,
  spacing,
} from '@shared/ui';

export interface StampCandidate {
  readonly contentId: string;
  readonly title: string;
  readonly address: string;
  readonly distanceMeters: number;
  readonly collected: boolean;
}

export type StampLocationStatus = 'loading' | 'granted' | 'denied' | 'unavailable';

interface RecentStampItem {
  readonly contentId: string;
  readonly title: string;
  readonly collected: boolean;
}

interface StampViewProps {
  readonly candidate: StampCandidate | null;
  readonly collectedCount: number;
  readonly totalCount: number;
  readonly locationAvailable: boolean;
  readonly locationStatus: StampLocationStatus;
  readonly recentStamps?: readonly RecentStampItem[];
  readonly onCollect?: () => void;
}

export function StampView({
  candidate,
  collectedCount,
  totalCount,
  locationAvailable,
  locationStatus,
  recentStamps = [],
  onCollect,
}: StampViewProps) {
  const canVerify = candidate
    ? locationAvailable && candidate.distanceMeters <= STAMP_RADIUS_METERS && !candidate.collected
    : false;
  const progressPercent = totalCount > 0 ? Math.round((collectedCount / totalCount) * 100) : 0;
  const ctaLabel = getCtaLabel({ candidate, canVerify, locationAvailable, locationStatus });
  const latestStamps = recentStamps.filter((stamp) => stamp.collected).slice(0, 3);

  // Mascot pulse animation when CTA is ready
  const mascotScale = useSharedValue(1);
  // eslint-disable-next-line react-hooks/immutability -- SharedValue ref for animation in useEffect
  const mascotScaleRef = useRef(mascotScale);

  const mascotAnimStyle = useAnimatedStyle(() => ({
    transform: [{ scale: mascotScaleRef.current.value }],
  }));

  useEffect(() => {
    if (canVerify) {
      mascotScaleRef.current.value = withRepeat(
        withSequence(
          withTiming(1.03, { duration: 500 }),
          withTiming(1, { duration: 500 }),
          withTiming(1, { duration: 1000 }), // pause ~1s
        ),
        -1,
        false,
      );
    } else {
      mascotScaleRef.current.value = withSpring(1);
    }
  }, [canVerify]);

  // Hero entrance
  const heroOpacity = useSharedValue(0);
  const heroTranslateY = useSharedValue(8);
  // eslint-disable-next-line react-hooks/immutability -- SharedValue refs for entrance animation
  const heroOpacityRef = useRef(heroOpacity);
  // eslint-disable-next-line react-hooks/immutability -- SharedValue refs for entrance animation
  const heroTranslateYRef = useRef(heroTranslateY);

  const heroAnimStyle = useAnimatedStyle(() => ({
    opacity: heroOpacityRef.current.value,
    transform: [{ translateY: heroTranslateYRef.current.value }],
  }));

  useFocusEffect(
    useCallback(() => {
      heroOpacityRef.current.value = 0;
      heroTranslateYRef.current.value = 8;
      heroOpacityRef.current.value = withTiming(1, { duration: 350 });
      heroTranslateYRef.current.value = withTiming(0, { duration: 350 });
    }, []),
  );

  return (
    <SafeAreaView style={styles.root}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.topbar}>
          <View style={styles.brandBlock}>
            <AppText variant="h1">도장 찍기</AppText>
            <AppText variant="caption" tone="inkMuted">
              현장 인증 후 스탬프를 눌러요
            </AppText>
          </View>
        </View>

        {/* Summary card */}
        <Animated.View style={heroAnimStyle}>
          <Surface elevation="e1" radius="lg" style={styles.summaryCard}>
            <AppText variant="caption" tone="inkMuted">
              오늘 루트 수집 현황
            </AppText>
            <AppText variant="h1" style={styles.summaryValue}>
              {collectedCount} / {totalCount}
            </AppText>
            <Progress value={progressPercent} tone="reward" />
          </Surface>
        </Animated.View>

        {candidate ? (
          <Surface elevation="e1" radius="lg" style={styles.candidateCard}>
            <View style={styles.candidateRow}>
              <View style={styles.thumb}>
                <AppText style={styles.thumbText}>🏯</AppText>
              </View>
              <View style={styles.candidateText}>
                <AppText variant="micro" tone="brand" style={styles.cardLabel}>
                  현재 추천 인증 스팟
                </AppText>
                <AppText variant="h2">{candidate.title}</AppText>
                <AppText variant="caption" tone="inkMuted">
                  {candidate.address}
                </AppText>
              </View>
            </View>

            <View style={styles.badgeRow}>
              <Badge tone="neutral" size="sm">
                {locationAvailable ? 'GPS 확인' : 'GPS 대기'}
              </Badge>
              <Badge tone="neutral" size="sm">
                {candidate.distanceMeters}m
              </Badge>
              <Badge tone="neutral" size="sm">
                중복 없음
              </Badge>
            </View>

            {/* Stamp action shell */}
            <View style={styles.actionShell}>
              {/* Stamp handle */}
              <View style={styles.stampHandle} />

              {/* Stamp target circle with Mascot inside */}
              <View style={styles.stampTarget}>
                {canVerify ? (
                  <StampDrop onComplete={onCollect} />
                ) : (
                  <Animated.View style={mascotAnimStyle}>
                    <Mascot
                      size={80}
                      mood={candidate.collected ? 'happy' : locationAvailable ? 'sleeping' : 'sad'}
                    />
                  </Animated.View>
                )}
              </View>

              <AppText variant="h3" style={styles.actionTitle}>
                스탬프를 꾹 눌러주세요
              </AppText>
              <AppText variant="body" tone="inkMuted" style={styles.actionBody}>
                도장은 이 화면에서만 찍을 수 있어요. 지도와 상세 화면에서는 위치와 정보를
                확인합니다.
              </AppText>

              <Button
                variant="primary"
                size="lg"
                fullWidth
                disabled={!canVerify}
                onPress={onCollect}
                accessibilityLabel={`${candidate.title} 도장 찍기`}
              >
                {ctaLabel}
              </Button>
            </View>
          </Surface>
        ) : (
          <Surface elevation="none" radius="lg" style={styles.emptyCard}>
            <Mascot size={64} mood="sad" style={styles.emptyMascot} />
            <AppText variant="h3">추천 스팟이 없어요</AppText>
            <AppText variant="caption" tone="inkMuted">
              근처 스팟을 찾고 있어요
            </AppText>
          </Surface>
        )}

        <View style={styles.sectionHead}>
          <AppText variant="h2">최근 획득 도장</AppText>
          <AppText variant="caption" tone="brand">
            도장함 보기
          </AppText>
        </View>

        <View style={styles.miniGrid}>
          {latestStamps.length > 0 ? (
            latestStamps.map((stamp, index) => (
              <Surface key={stamp.contentId} elevation="e1" radius="md" style={styles.miniStamp}>
                <AppText style={styles.miniStampIcon}>{getRecentIcon(index)}</AppText>
                <AppText variant="micro" tone="inkMuted" style={styles.miniStampTitle}>
                  {stamp.title}
                </AppText>
              </Surface>
            ))
          ) : (
            <>
              <Surface elevation="e1" radius="md" style={styles.miniStamp}>
                <AppText style={styles.miniStampIcon}>🏯</AppText>
                <AppText variant="micro" tone="inkMuted" style={styles.miniStampTitle}>
                  경복궁
                </AppText>
              </Surface>
              <Surface elevation="e1" radius="md" style={styles.miniStamp}>
                <AppText style={styles.miniStampIcon}>🎪</AppText>
                <AppText variant="micro" tone="inkMuted" style={styles.miniStampTitle}>
                  봄빛 행사
                </AppText>
              </Surface>
              <Surface elevation="e1" radius="md" style={styles.miniStamp}>
                <AppText style={styles.miniStampIcon}>🌉</AppText>
                <AppText variant="micro" tone="inkMuted" style={styles.miniStampTitle}>
                  한강 야경
                </AppText>
              </Surface>
            </>
          )}
        </View>

        {/* Collection card — no gradient */}
        <Surface elevation="e1" radius="lg" style={styles.collectionCard}>
          <AppText variant="h3">서울 5대 궁궐 컬렉션</AppText>
          <Progress value={Math.min(60 + collectedCount * 6, 100)} tone="reward" />
          <View style={styles.badgeRow}>
            <Badge tone="neutral" size="sm">
              {Math.min(collectedCount + 2, 5)} / 5 완료
            </Badge>
            <Badge tone="reward" size="sm">
              완성까지 2개
            </Badge>
          </View>
        </Surface>
      </ScrollView>
    </SafeAreaView>
  );
}

const getRecentIcon = (index: number) => {
  if (index === 0) {
    return '🏯';
  }

  if (index === 1) {
    return '🎪';
  }

  return '🌉';
};

const getCtaLabel = ({
  candidate,
  canVerify,
  locationAvailable,
  locationStatus,
}: {
  readonly candidate: StampCandidate | null;
  readonly canVerify: boolean;
  readonly locationAvailable: boolean;
  readonly locationStatus: StampLocationStatus;
}) => {
  if (!candidate) {
    return '추천 스팟 없음';
  }

  if (candidate.collected) {
    return '이미 수집한 도장입니다';
  }

  if (canVerify) {
    return `${candidate.title} 도장 찍기`;
  }

  if (!locationAvailable) {
    return locationStatus === 'denied' ? '위치 권한을 허용하면 인증 가능' : '현재 위치 확인 중';
  }

  return `${STAMP_RADIUS_METERS}m 안으로 이동하면 인증 가능`;
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
  summaryCard: {
    padding: spacing.lg,
    gap: spacing.sm,
  },
  summaryValue: { fontSize: 24 },
  candidateCard: {
    padding: spacing.lg,
    gap: spacing.md,
  },
  candidateRow: { flexDirection: 'row', gap: spacing.md, alignItems: 'center' },
  thumb: {
    width: 64,
    height: 64,
    borderRadius: radius.sm + 4,
    backgroundColor: colors.brandSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  thumbText: { fontSize: 24 },
  candidateText: { flex: 1, minWidth: 0, gap: spacing.xs },
  cardLabel: { letterSpacing: 0.5 },
  badgeRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm - 2 },
  actionShell: {
    alignItems: 'center',
    backgroundColor: colors.canvas,
    borderRadius: radius.lg,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm + 2,
    paddingBottom: spacing.lg,
    borderWidth: 2,
    borderColor: colors.border,
    gap: spacing.md,
  },
  stampHandle: {
    width: 56,
    height: 36,
    borderRadius: 12,
    backgroundColor: colors.brand,
    marginBottom: -12,
  },
  stampTarget: {
    width: 178,
    height: 178,
    borderRadius: 89,
    backgroundColor: colors.canvas,
    borderWidth: 2,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionTitle: { textAlign: 'center' },
  actionBody: {
    textAlign: 'center',
  },
  emptyCard: {
    padding: spacing.xl,
    alignItems: 'center',
    gap: spacing.md,
  },
  emptyMascot: {
    transform: [{ rotate: '-8deg' }],
  },
  sectionHead: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'space-between',
  },
  miniGrid: { flexDirection: 'row', gap: spacing.sm },
  miniStamp: {
    flex: 1,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.sm,
    alignItems: 'center',
    gap: spacing.xs,
  },
  miniStampIcon: { fontSize: 22 },
  miniStampTitle: { textAlign: 'center' },
  collectionCard: {
    padding: spacing.lg,
    gap: spacing.sm + 2,
  },
});
