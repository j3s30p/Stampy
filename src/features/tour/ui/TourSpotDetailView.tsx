import { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { STAMP_RADIUS_METERS } from '@shared/config';
import { AppText, Badge, Gradient, Surface, colors, radius, spacing } from '@shared/ui';
import type { GradientVariant } from '@shared/ui';
import type { HomeTourSpot } from './HomeView';

interface TourSpotDetailViewProps {
  readonly spot: HomeTourSpot | null;
  readonly onBack?: () => void;
  readonly onOpenStamp?: () => void;
  readonly onOpenDirections?: () => void;
}

export function TourSpotDetailView({
  spot,
  onBack,
  onOpenStamp,
  onOpenDirections,
}: TourSpotDetailViewProps) {
  const [message, setMessage] = useState('카카오 길찾기 준비 중');

  const gradientVariant = useMemo(() => getGradientVariant(spot?.theme), [spot?.theme]);

  const artColors = useMemo(() => getArtColors(spot?.theme), [spot?.theme]);

  if (!spot) {
    return (
      <SafeAreaView style={styles.root}>
        <View style={styles.emptyState}>
          <AppText variant="h1">선택된 관광지가 없습니다</AppText>
          <AppText variant="body" tone="inkSoft" style={styles.emptySubtitle}>
            홈, 지도, MY 화면의 카드에서 관광지를 골라보세요.
          </AppText>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="이전 화면으로 이동"
            onPress={onBack}
            style={({ pressed }) => [styles.secondaryButton, pressed ? styles.pressed : null]}
          >
            <AppText variant="bodyBold" style={styles.secondaryButtonText}>
              뒤로 가기
            </AppText>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  const intro = getIntroText(spot.title, spot.theme);

  return (
    <SafeAreaView style={styles.root}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Gradient variant={gradientVariant} style={styles.hero}>
          <View style={styles.heroTopRow}>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="이전 화면으로 이동"
              onPress={onBack}
              style={({ pressed }) => [styles.backButton, pressed ? styles.pressed : null]}
            >
              <AppText variant="h1" style={styles.backButtonText}>
                ‹
              </AppText>
            </Pressable>
            <View style={styles.heroBadge}>
              <AppText variant="caption" style={styles.heroBadgeText}>
                {getSpotStatusLabel(spot)}
              </AppText>
            </View>
          </View>

          <View style={styles.heroArtwork}>
            <View style={[styles.artCircle, { backgroundColor: artColors.primary }]} />
            <View style={[styles.artCircleSmall, { backgroundColor: artColors.secondary }]} />
            <AppText variant="display" tone="onDark" style={styles.heroArtworkLabel}>
              {spot.title}
            </AppText>
            <AppText variant="body" tone="onDark" style={styles.heroArtworkMeta}>
              {spot.theme}
            </AppText>
          </View>
        </Gradient>

        <Surface elevation="e1" style={styles.titleCard}>
          <AppText variant="display">{spot.title}</AppText>
          <View style={styles.badgeRow}>
            <Badge tone="neutral" size="md">
              {spot.theme}
            </Badge>
            <Badge tone={getStatusTone(spot)} size="md">
              {getSpotStatusLabel(spot)}
            </Badge>
          </View>
        </Surface>

        <View style={styles.infoGrid}>
          <Surface elevation="e1" radius="sm" style={styles.infoBox}>
            <AppText variant="h2">{spot.distanceMeters}m</AppText>
            <AppText variant="caption" tone="inkSoft">
              현재 거리
            </AppText>
          </Surface>
          <Surface elevation="e1" radius="sm" style={styles.infoBox}>
            <AppText variant="h2">+10</AppText>
            <AppText variant="caption" tone="inkSoft">
              획득 EXP
            </AppText>
          </Surface>
          <Surface elevation="e1" radius="sm" style={styles.infoBox}>
            <AppText variant="h2">1회</AppText>
            <AppText variant="caption" tone="inkSoft">
              획득 제한
            </AppText>
          </Surface>
        </View>

        <Surface elevation="e1" radius="xs" style={styles.card}>
          <AppText variant="h3">관광지 소개</AppText>
          <AppText variant="body" tone="inkSoft">
            {intro}
          </AppText>
        </Surface>

        <Surface elevation="e1" radius="xs" style={styles.card}>
          <AppText variant="h3">주소</AppText>
          <AppText variant="body" tone="inkSoft">
            {spot.address}
          </AppText>
        </Surface>

        <View style={styles.noticeCard}>
          <AppText variant="h3" style={styles.noticeTitle}>
            도장 인증 안내
          </AppText>
          <AppText variant="body" tone="inkSoft">
            실제 도장은 하단 가운데 도장 탭에서만 진행됩니다. 관광지 반경 {STAMP_RADIUS_METERS}m
            이내에서 도장 화면을 열면 인증할 수 있어요.
          </AppText>
        </View>

        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`${spot.title} 도장 화면으로 이동`}
          onPress={onOpenStamp}
          style={({ pressed }) => [styles.primaryButton, pressed ? styles.pressed : null]}
        >
          <AppText variant="bodyBold" style={styles.primaryButtonText}>
            도장 화면으로 이동
          </AppText>
        </Pressable>

        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`${spot.title} 카카오맵으로 길찾기`}
          onPress={() => {
            setMessage(`${spot.title} 길찾기 준비 중`);
            onOpenDirections?.();
          }}
          style={({ pressed }) => [styles.secondaryButton, pressed ? styles.pressed : null]}
        >
          <AppText variant="bodyBold" style={styles.secondaryButtonText}>
            카카오맵으로 길찾기
          </AppText>
        </Pressable>

        <Surface elevation="e1" radius="xs" style={styles.feedbackCard}>
          <AppText variant="caption" tone="inkSoft">
            선택 상태
          </AppText>
          <AppText variant="bodyBold">{message}</AppText>
        </Surface>
      </ScrollView>
    </SafeAreaView>
  );
}

const getIntroText = (title: string, theme: string) => {
  const introByTheme: Record<string, string> = {
    '궁궐 산책':
      '조선 왕조의 중심 궁궐로, 서울을 대표하는 역사 관광지입니다. 관광공사 API의 소개, 이미지, 주소 데이터를 기반으로 상세 정보를 제공합니다.',
    '골목 여행':
      '오래된 골목과 한옥 풍경이 이어지는 도심 산책 코스입니다. 걷는 재미와 사진 찍는 재미를 함께 담은 스팟으로 보여줍니다.',
    '도심 휴식':
      '도심 속 물길과 녹지, 산책 동선을 함께 즐길 수 있는 휴식형 스팟입니다. 짧게 들러도 분위기를 바꿔주는 곳으로 소개합니다.',
  };

  return introByTheme[theme] ?? `${title}는 여행 중 잠시 멈춰 보기 좋은 관광지입니다.`;
};

const getGradientVariant = (theme?: string): GradientVariant => {
  switch (theme) {
    case '궁궐 산책':
      return 'gold';
    case '골목 여행':
      return 'indigo';
    default:
      return 'brand';
  }
};

const getArtColors = (theme?: string) => {
  switch (theme) {
    case '궁궐 산책':
      return {
        primary: 'rgba(255, 255, 255, 0.16)',
        secondary: 'rgba(255, 255, 255, 0.28)',
      };
    case '골목 여행':
      return {
        primary: 'rgba(255, 255, 255, 0.18)',
        secondary: 'rgba(255, 221, 170, 0.28)',
      };
    default:
      return {
        primary: 'rgba(255, 255, 255, 0.14)',
        secondary: 'rgba(145, 232, 218, 0.3)',
      };
  }
};

const getSpotStatusLabel = (spot: HomeTourSpot) => {
  if (spot.collected) {
    return '수집 완료';
  }

  if (spot.distanceMeters <= STAMP_RADIUS_METERS) {
    return '도장 가능';
  }

  return '가까이 이동 필요';
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
  content: { paddingBottom: spacing.xxl },
  hero: {
    height: 290,
    paddingHorizontal: spacing.xxl,
    paddingTop: spacing.md,
    paddingBottom: spacing.xl,
  },
  heroTopRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.9)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  backButtonText: { color: colors.ink, marginTop: -3 },
  heroBadge: {
    backgroundColor: 'rgba(255,255,255,0.88)',
    borderRadius: radius.pill,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  heroBadgeText: { color: colors.ink },
  heroArtwork: {
    marginTop: 30,
    flex: 1,
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.18)',
    backgroundColor: 'rgba(255,255,255,0.08)',
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
  },
  artCircle: {
    position: 'absolute',
    width: 160,
    height: 160,
    borderRadius: 80,
    top: -28,
    right: -18,
  },
  artCircleSmall: {
    position: 'absolute',
    width: 106,
    height: 106,
    borderRadius: 53,
    bottom: -12,
    left: -10,
  },
  heroArtworkLabel: { letterSpacing: -0.6 },
  heroArtworkMeta: { opacity: 0.86, marginTop: 6 },
  titleCard: {
    marginTop: -20,
    borderTopLeftRadius: radius.xl,
    borderTopRightRadius: radius.xl,
    borderBottomLeftRadius: 0,
    borderBottomRightRadius: 0,
    paddingHorizontal: spacing.xxl,
    paddingTop: spacing.xl,
    paddingBottom: spacing.md,
    gap: spacing.sm + 2,
  },
  badgeRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  infoGrid: {
    paddingHorizontal: spacing.xxl,
    flexDirection: 'row',
    gap: spacing.sm + 2,
    marginBottom: spacing.md,
  },
  infoBox: {
    flex: 1,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.sm + 2,
    alignItems: 'center',
    gap: spacing.xs,
  },
  card: {
    marginHorizontal: spacing.xxl,
    padding: spacing.lg,
    marginBottom: spacing.md,
    gap: spacing.sm,
  },
  noticeCard: {
    backgroundColor: colors.successSoft,
    marginHorizontal: spacing.xxl,
    borderRadius: radius.xs,
    borderWidth: 1,
    borderColor: colors.success,
    padding: spacing.lg,
    marginBottom: spacing.md,
    gap: spacing.sm,
  },
  noticeTitle: { color: colors.success },
  primaryButton: {
    marginHorizontal: spacing.xxl,
    borderRadius: radius.lg,
    backgroundColor: colors.brand,
    height: 52,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  primaryButtonText: { color: colors.surface },
  secondaryButton: {
    marginHorizontal: spacing.xxl,
    borderRadius: radius.lg,
    backgroundColor: colors.surface,
    height: 52,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.brand,
    marginTop: spacing.sm + 2,
  },
  secondaryButtonText: { color: colors.brand },
  feedbackCard: {
    marginHorizontal: spacing.xxl,
    marginTop: spacing.md,
    padding: spacing.md,
    gap: spacing.xs,
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xxl,
    gap: spacing.md,
  },
  emptySubtitle: { textAlign: 'center' },
  pressed: { opacity: 0.85 },
});
