import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { STAMP_RADIUS_METERS } from '@shared/config';
import { AppText, Badge, Button, Mascot, Surface, colors, radius, spacing } from '@shared/ui';
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

  if (!spot) {
    return (
      <SafeAreaView style={styles.root}>
        <View style={styles.emptyState}>
          <Mascot size={80} mood="sad" style={styles.emptyMascot} />
          <AppText variant="h1">선택된 관광지가 없어요</AppText>
          <AppText variant="body" tone="inkMuted" style={styles.emptySubtitle}>
            홈, 지도, MY 화면의 카드에서 관광지를 골라보세요.
          </AppText>
          <Button
            variant="secondary"
            size="md"
            onPress={onBack}
            accessibilityLabel="이전 화면으로 이동"
          >
            뒤로 가기
          </Button>
        </View>
      </SafeAreaView>
    );
  }

  const intro = getIntroText(spot.title, spot.theme);
  const statusLabel = getSpotStatusLabel(spot);

  return (
    <SafeAreaView style={styles.root}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* Back + status row */}
        <View style={styles.heroTopRow}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="이전 화면으로 이동"
            onPress={onBack}
            style={({ pressed }) => [styles.backButton, pressed ? styles.pressed : null]}
          >
            <AppText variant="h2" style={styles.backButtonText}>
              ‹
            </AppText>
          </Pressable>
          <Badge tone={getStatusTone(spot)} size="md">
            {statusLabel}
          </Badge>
        </View>

        {/* Typographic hero — no gradient */}
        <View style={styles.heroBlock}>
          <AppText variant="display" tone="ink">
            {spot.title}
          </AppText>
          <AppText variant="body" tone="inkMuted">
            {spot.theme} · {spot.address}
          </AppText>
        </View>

        {/* Stamp preview circle */}
        <View style={styles.stampPreviewWrapper}>
          <View style={styles.stampPreview}>
            {spot.collected ? (
              <View style={styles.stampCollectedIcon}>
                <AppText variant="display" tone="onDark">
                  ✓
                </AppText>
              </View>
            ) : (
              <Mascot size={80} mood="happy" />
            )}
          </View>
          <AppText variant="caption" tone="inkMuted" style={styles.stampPreviewLabel}>
            {spot.collected ? '수집 완료된 스탬프' : '도장 찍기 전'}
          </AppText>
        </View>

        {/* Info grid */}
        <View style={styles.infoGrid}>
          <Surface elevation="e1" radius="sm" style={styles.infoBox}>
            <AppText variant="h2">{spot.distanceMeters}m</AppText>
            <AppText variant="caption" tone="inkMuted">
              현재 거리
            </AppText>
          </Surface>
          <Surface elevation="e1" radius="sm" style={styles.infoBox}>
            <AppText variant="h2">+10</AppText>
            <AppText variant="caption" tone="inkMuted">
              획득 EXP
            </AppText>
          </Surface>
          <Surface elevation="e1" radius="sm" style={styles.infoBox}>
            <AppText variant="h2">1회</AppText>
            <AppText variant="caption" tone="inkMuted">
              획득 제한
            </AppText>
          </Surface>
        </View>

        <Surface elevation="e1" radius="md" style={styles.card}>
          <AppText variant="h3">관광지 소개</AppText>
          <AppText variant="body" tone="inkSoft">
            {intro}
          </AppText>
        </Surface>

        <Surface elevation="e1" radius="md" style={styles.card}>
          <AppText variant="h3">주소</AppText>
          <AppText variant="body" tone="inkSoft">
            {spot.address}
          </AppText>
        </Surface>

        <Surface elevation="none" radius="md" style={styles.noticeCard}>
          <AppText variant="h3" style={styles.noticeTitle}>
            도장 인증 안내
          </AppText>
          <AppText variant="body" tone="inkSoft">
            실제 도장은 하단 가운데 도장 탭에서만 진행됩니다. 관광지 반경 {STAMP_RADIUS_METERS}m
            이내에서 도장 화면을 열면 인증할 수 있어요.
          </AppText>
        </Surface>

        {/* Primary CTA: brand red for stamp-related action */}
        <Button
          variant="primary"
          size="lg"
          fullWidth
          onPress={onOpenStamp}
          accessibilityLabel={`${spot.title} 도장 화면으로 이동`}
        >
          도장 화면으로 이동
        </Button>

        <Button
          variant="secondary"
          size="lg"
          fullWidth
          onPress={() => {
            setMessage(`${spot.title} 길찾기 준비 중`);
            onOpenDirections?.();
          }}
          accessibilityLabel={`${spot.title} 카카오맵으로 길찾기`}
        >
          카카오맵으로 길찾기
        </Button>

        <Surface elevation="none" radius="sm" style={styles.feedbackCard}>
          <AppText variant="caption" tone="inkMuted">
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

const getSpotStatusLabel = (spot: HomeTourSpot) => {
  if (spot.collected) {
    return '수집 완료';
  }

  if (spot.distanceMeters <= STAMP_RADIUS_METERS) {
    return '도장 가능';
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
  root: { flex: 1, backgroundColor: colors.canvas },
  content: {
    paddingHorizontal: spacing.xl,
    paddingBottom: spacing.xxl,
    gap: spacing.lg,
    paddingTop: spacing.md,
  },
  heroTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.surfaceSink,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  backButtonText: { color: colors.ink, marginTop: -3 },
  heroBlock: {
    gap: spacing.sm,
  },
  stampPreviewWrapper: {
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.lg,
  },
  stampPreview: {
    width: 160,
    height: 160,
    borderRadius: 80,
    borderWidth: 3,
    borderColor: colors.brand,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.canvas,
  },
  stampCollectedIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: colors.brand,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stampPreviewLabel: { textAlign: 'center' },
  infoGrid: {
    flexDirection: 'row',
    gap: spacing.sm + 2,
  },
  infoBox: {
    flex: 1,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.sm + 2,
    alignItems: 'center',
    gap: spacing.xs,
  },
  card: {
    padding: spacing.lg,
    gap: spacing.sm,
  },
  noticeCard: {
    backgroundColor: colors.brandSoft,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.brand,
    padding: spacing.lg,
    gap: spacing.sm,
  },
  noticeTitle: { color: colors.brandInk },
  feedbackCard: {
    padding: spacing.md,
    gap: spacing.xs,
    backgroundColor: colors.surfaceSink,
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xxl,
    gap: spacing.md,
  },
  emptyMascot: {
    transform: [{ rotate: '-8deg' }],
  },
  emptySubtitle: { textAlign: 'center' },
  pressed: { opacity: 0.85 },
});
