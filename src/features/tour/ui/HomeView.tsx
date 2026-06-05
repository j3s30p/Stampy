import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { STAMP_RADIUS_METERS } from '@shared/config';
import { AppText, Badge, Gradient, Surface, colors, radius, shadow, spacing } from '@shared/ui';

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

  return (
    <SafeAreaView style={styles.root}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.topbar}>
          <View style={styles.brandBlock}>
            <AppText variant="display" style={styles.brand}>
              스탬피
            </AppText>
            <AppText variant="caption" tone="inkSoft">
              오늘은 어디서 스탬프를 찍어볼까요?
            </AppText>
          </View>
          <View style={styles.avatar}>
            <AppText variant="h3" tone="onDark">
              J
            </AppText>
          </View>
        </View>

        <Gradient variant="brand" style={styles.hero}>
          <AppText variant="caption" tone="onDark" style={styles.heroLabel}>
            Lv.{level} 지역 탐험가
          </AppText>
          <AppText variant="display" tone="onDark" style={styles.heroTitle}>
            이번 주 2개만 더 찍으면{'\n'}서울 컬렉션 완성!
          </AppText>

          <View style={styles.progressBlock}>
            <View style={styles.progressRow}>
              <AppText variant="caption" tone="onDark" style={styles.progressText}>
                EXP {exp} / {nextExp}
              </AppText>
              <AppText variant="caption" tone="onDark" style={styles.progressText}>
                {Math.round((exp / nextExp) * 100)}%
              </AppText>
            </View>
            <View style={styles.progressTrack}>
              <View style={styles.progressFill} />
            </View>
          </View>
        </Gradient>

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
                  <AppText variant="caption" tone="inkSoft">
                    {spot.address} · 현재 위치에서 {spot.distanceMeters}m
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
          <View style={styles.collectionTrack}>
            <View style={styles.collectionFill} />
          </View>
          <View style={styles.collectionBadges}>
            <Badge tone="neutral" size="sm">
              {Math.min(collectedCount + 2, 5)} / 5 완료
            </Badge>
            <Badge tone="warning" size="sm">
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

const getStatusTone = (spot: HomeTourSpot): 'success' | 'warning' | 'neutral' => {
  if (spot.collected) {
    return 'success';
  }

  if (spot.distanceMeters <= STAMP_RADIUS_METERS) {
    return 'warning';
  }

  return 'neutral';
};

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.surfaceAlt },
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
  brand: { color: colors.ink },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.brandDeep,
    alignItems: 'center',
    justifyContent: 'center',
  },
  hero: {
    borderRadius: radius.xl,
    paddingHorizontal: spacing.xxl,
    paddingVertical: spacing.xl,
    overflow: 'hidden',
    ...shadow.e2,
  },
  heroLabel: { opacity: 0.85 },
  heroTitle: {
    marginTop: spacing.sm,
    lineHeight: 36,
  },
  progressBlock: { marginTop: spacing.md, gap: spacing.sm },
  progressRow: { flexDirection: 'row', justifyContent: 'space-between' },
  progressText: { opacity: 0.9 },
  progressTrack: {
    height: 8,
    borderRadius: radius.pill,
    backgroundColor: 'rgba(255,255,255,0.18)',
    overflow: 'hidden',
  },
  progressFill: {
    width: '62%',
    height: '100%',
    backgroundColor: colors.gold,
    borderRadius: radius.pill,
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
    borderRadius: radius.sm + 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  thumbPalace: { backgroundColor: colors.thumbPeach },
  thumbEvent: { backgroundColor: colors.thumbPink },
  thumbText: { fontSize: 24 },
  spotCopy: { flex: 1, minWidth: 0, gap: spacing.xs },
  badgeRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm - 2, marginTop: spacing.xs },
  collectionCard: {
    padding: spacing.lg,
    gap: spacing.sm + 2,
  },
  collectionTrack: {
    height: 8,
    backgroundColor: colors.surfaceSink,
    borderRadius: radius.pill,
    overflow: 'hidden',
  },
  collectionFill: {
    width: '60%',
    height: '100%',
    backgroundColor: colors.brand,
    borderRadius: radius.pill,
  },
  collectionBadges: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm - 2 },
  goalCard: {
    padding: spacing.lg,
    gap: spacing.sm - 2,
  },
});
