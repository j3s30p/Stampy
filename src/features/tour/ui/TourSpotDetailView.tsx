import Ionicons from '@expo/vector-icons/Ionicons';
import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View, useWindowDimensions } from 'react-native';
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
  const { width } = useWindowDimensions();
  const isCompactHero = width < 360;
  const [message, setMessage] = useState('길찾기와 도장 동선을 확인해 보세요.');

  if (!spot) {
    return (
      <SafeAreaView style={styles.root}>
        <View style={styles.emptyState}>
          <View style={styles.emptyMascotWrap}>
            <Mascot size={92} mood="sad" />
          </View>
          <AppText variant="h1" tone="ink" numberOfLines={1}>
            선택된 관광지가 없어요
          </AppText>
          <AppText variant="body" tone="inkMuted" style={styles.emptySubtitle} numberOfLines={2}>
            홈이나 지도에서 관광지를 선택하면 상세 정보가 열립니다.
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
        <View style={styles.heroTopRow}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="이전 화면으로 이동"
            onPress={onBack}
            style={({ pressed }) => [styles.backButton, pressed ? styles.pressed : null]}
          >
            <Ionicons name="chevron-back" size={20} color={colors.ink} />
          </Pressable>
          <Badge tone={getStatusTone(spot)} size="md">
            {statusLabel}
          </Badge>
        </View>

        <Surface
          elevation="e1"
          radius="lg"
          style={[styles.heroCard, isCompactHero ? styles.heroCardCompact : null]}
        >
          <View style={styles.heroCopy}>
            <Badge tone="brand" size="sm">
              관광지 상세
            </Badge>
            <AppText variant="display" tone="ink" numberOfLines={2}>
              {spot.title}
            </AppText>
            <AppText variant="body" tone="inkSoft" numberOfLines={2}>
              {spot.theme} · {spot.address}
            </AppText>
            <View style={styles.heroMetaRow}>
              <View style={styles.heroMetaItem}>
                <AppText variant="title" tone="ink">
                  {spot.distanceMeters}m
                </AppText>
                <AppText variant="caption" tone="inkMuted" numberOfLines={1}>
                  현재 거리
                </AppText>
              </View>
              <View style={styles.heroMetaItem}>
                <AppText variant="title" tone="ink">
                  +10
                </AppText>
                <AppText variant="caption" tone="inkMuted" numberOfLines={1}>
                  획득 EXP
                </AppText>
              </View>
            </View>
          </View>
          <View
            style={[styles.heroMascotWrap, isCompactHero ? styles.heroMascotWrapCompact : null]}
          >
            <View
              style={[
                styles.heroMascotCircle,
                isCompactHero ? styles.heroMascotCircleCompact : null,
              ]}
            >
              {spot.collected ? (
                <AppText variant="title" tone="brand">
                  ✓
                </AppText>
              ) : (
                <Mascot size={isCompactHero ? 92 : 108} mood="happy" />
              )}
            </View>
            <AppText
              variant="micro"
              tone="inkMuted"
              style={styles.heroMascotLabel}
              numberOfLines={1}
            >
              {spot.collected ? '수집 완료된 스탬프' : '도장 찍기 전'}
            </AppText>
          </View>
        </Surface>

        <View style={styles.infoRow}>
          <Surface elevation="e1" radius="md" style={styles.infoCard}>
            <AppText variant="h2" tone="ink" numberOfLines={1}>
              {spot.distanceMeters}m
            </AppText>
            <AppText variant="caption" tone="inkMuted">
              현재 거리
            </AppText>
          </Surface>
          <Surface elevation="e1" radius="md" style={styles.infoCard}>
            <AppText variant="h2" tone="ink" numberOfLines={1}>
              1회
            </AppText>
            <AppText variant="caption" tone="inkMuted">
              획득 제한
            </AppText>
          </Surface>
          <Surface elevation="e1" radius="md" style={styles.infoCard}>
            <AppText variant="h2" tone="ink" numberOfLines={1}>
              반경 {STAMP_RADIUS_METERS}m
            </AppText>
            <AppText variant="caption" tone="inkMuted">
              인증 기준
            </AppText>
          </Surface>
        </View>

        <Surface elevation="e1" radius="lg" style={styles.sectionCard}>
          <AppText variant="h3" tone="ink">
            관광지 소개
          </AppText>
          <AppText variant="body" tone="inkSoft" numberOfLines={3}>
            {intro}
          </AppText>
        </Surface>

        <Surface elevation="e1" radius="lg" style={styles.sectionCard}>
          <AppText variant="h3" tone="ink">
            주소
          </AppText>
          <AppText variant="body" tone="inkSoft" numberOfLines={3}>
            {spot.address}
          </AppText>
        </Surface>

        <Surface elevation="e1" radius="lg" style={styles.noticeCard}>
          <Badge tone="brand" size="sm">
            도장 인증 안내
          </Badge>
          <AppText variant="body" tone="inkSoft" numberOfLines={3}>
            실제 도장은 하단 가운데 도장 탭에서만 진행됩니다. 관광지 반경 {STAMP_RADIUS_METERS}m
            이내에서 도장 화면을 열면 인증할 수 있어요.
          </AppText>
        </Surface>

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

        <Surface elevation="none" radius="md" style={styles.feedbackCard}>
          <AppText variant="caption" tone="inkMuted">
            선택 상태
          </AppText>
          <AppText variant="bodyBold" tone="ink" numberOfLines={2}>
            {message}
          </AppText>
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
  heroTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: radius.full,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pressed: {
    opacity: 0.85,
  },
  heroCard: {
    flexDirection: 'row',
    gap: spacing.lg,
    padding: spacing.lg,
  },
  heroCopy: {
    flex: 1,
    minWidth: 0,
    flexShrink: 1,
    gap: spacing.sm,
  },
  heroCardCompact: {
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
    backgroundColor: colors.surfaceSink,
    borderRadius: radius.md,
    padding: spacing.sm,
    gap: 2,
  },
  heroMascotWrap: {
    width: 122,
    minWidth: 0,
    alignItems: 'center',
    gap: spacing.sm,
    alignSelf: 'center',
  },
  heroMascotWrapCompact: {
    width: 108,
  },
  heroMascotCircle: {
    width: 122,
    height: 122,
    borderRadius: 61,
    backgroundColor: colors.surfaceSink,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroMascotCircleCompact: {
    width: 108,
    height: 108,
    borderRadius: 54,
  },
  heroMascotLabel: {
    textAlign: 'center',
  },
  infoRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  infoCard: {
    flex: 1,
    minWidth: 0,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.sm,
    alignItems: 'center',
    gap: spacing.xs,
  },
  sectionCard: {
    padding: spacing.lg,
    gap: spacing.sm,
  },
  noticeCard: {
    padding: spacing.lg,
    gap: spacing.sm,
    backgroundColor: colors.brandSoft,
    borderWidth: 1,
    borderColor: '#F2C8B6',
  },
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
  emptyMascotWrap: {
    width: 128,
    height: 128,
    borderRadius: 64,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptySubtitle: {
    textAlign: 'center',
  },
});
