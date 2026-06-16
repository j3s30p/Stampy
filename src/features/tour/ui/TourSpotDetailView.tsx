import Ionicons from '@expo/vector-icons/Ionicons';
import { useState } from 'react';
import {
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
  useWindowDimensions,
  type NativeSyntheticEvent,
  type NativeScrollEvent,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { STAMP_RADIUS_METERS } from '@shared/config';
import { AppText, Badge, Button, Mascot, Surface, colors, radius, spacing } from '@shared/ui';
import type { HomeTourSpot } from './HomeView';

interface TourSpotDetailViewProps {
  readonly spot: HomeTourSpot | null;
  readonly canOpenDirections?: boolean;
  readonly onBack?: () => void;
  readonly onOpenStamp?: () => void;
  readonly onOpenDirections?: () => Promise<boolean>;
}

export function TourSpotDetailView({
  spot,
  canOpenDirections = false,
  onBack,
  onOpenStamp,
  onOpenDirections,
}: TourSpotDetailViewProps) {
  const { width } = useWindowDimensions();
  const [message, setMessage] = useState('길찾기와 도장 동선을 확인해 보세요.');

  const carouselWidth = Math.max(width - spacing.lg * 2, 0);
  const images = spot ? [...spot.imageUrls] : [];

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

  const intro = spot.overview ?? getIntroText(spot.title, spot.theme);
  const statusLabel = getSpotStatusLabel(spot);
  const handleOpenDirections = async () => {
    if (!canOpenDirections) {
      setMessage('현재 위치 확인 후 지도 길찾기를 사용할 수 있어요');
      return;
    }

    setMessage(`${spot.title} 카카오맵을 여는 중`);

    const opened = (await onOpenDirections?.()) ?? false;

    setMessage(
      opened
        ? `${spot.title} 지도에서 경로를 표시해요`
        : '현재 위치 확인 후 지도 길찾기를 사용할 수 있어요',
    );
  };

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

        <Surface elevation="e1" radius="lg" style={styles.heroCard}>
          <SpotImageCarousel
            key={spot.contentId}
            images={images}
            collected={spot.collected}
            width={carouselWidth}
          />

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
            상세 설명
          </AppText>
          <AppText variant="body" tone="inkSoft">
            {intro}
          </AppText>
        </Surface>

        {(spot.address || spot.telephone || spot.homepage) && (
          <Surface elevation="e1" radius="lg" style={styles.sectionCard}>
            <AppText variant="h3" tone="ink">
              관광지 정보
            </AppText>
            <View style={styles.detailList}>
              {spot.address ? <InfoRow label="주소" value={spot.address} /> : null}
              {spot.telephone ? <InfoRow label="전화" value={spot.telephone} /> : null}
              {spot.homepage ? <InfoRow label="홈페이지" value={spot.homepage} /> : null}
            </View>
          </Surface>
        )}

        <Surface elevation="e1" radius="lg" style={styles.noticeCard}>
          <Badge tone="brand" size="sm">
            도장 인증 안내
          </Badge>
          <AppText variant="body" tone="inkSoft">
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
            void handleOpenDirections();
          }}
          disabled={!canOpenDirections}
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

function InfoRow({ label, value }: { readonly label: string; readonly value: string }) {
  return (
    <View style={styles.infoRowItem}>
      <AppText variant="caption" tone="inkMuted" numberOfLines={1}>
        {label}
      </AppText>
      <AppText variant="body" tone="inkSoft">
        {value}
      </AppText>
    </View>
  );
}

function SpotImageCarousel({
  images,
  collected,
  width,
}: {
  readonly images: readonly string[];
  readonly collected: boolean;
  readonly width: number;
}) {
  const [activeImageIndex, setActiveImageIndex] = useState(0);

  const handleCarouselScrollEnd = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    if (width <= 0 || images.length <= 1) {
      return;
    }

    const nextIndex = Math.round(event.nativeEvent.contentOffset.x / width);
    setActiveImageIndex(Math.max(0, Math.min(nextIndex, images.length - 1)));
  };

  if (images.length === 0) {
    return (
      <View style={[styles.carouselFallback, { width }]}>
        <Mascot size={108} mood={collected ? 'happy' : 'sleeping'} />
      </View>
    );
  }

  return (
    <>
      <View style={styles.carouselShell}>
        <ScrollView
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          decelerationRate="fast"
          onMomentumScrollEnd={handleCarouselScrollEnd}
          contentContainerStyle={styles.carouselContent}
        >
          {images.map((imageUrl, index) => (
            <View key={`${imageUrl}-${index}`} style={[styles.carouselPage, { width }]}>
              <Image source={{ uri: imageUrl }} style={styles.carouselImage} resizeMode="cover" />
            </View>
          ))}
        </ScrollView>
      </View>

      {images.length > 1 ? (
        <View style={styles.indicatorRow} accessibilityRole="tablist">
          {images.map((_, index) => (
            <View
              key={`indicator-${index}`}
              style={[
                styles.indicatorDot,
                index === activeImageIndex ? styles.indicatorDotActive : null,
              ]}
              accessibilityRole="tab"
              accessibilityState={{ selected: index === activeImageIndex }}
            />
          ))}
        </View>
      ) : null}
    </>
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

  if (
    spot.verificationDistanceMeters !== null &&
    spot.verificationDistanceMeters <= STAMP_RADIUS_METERS
  ) {
    return '반경 안';
  }

  return '가까이 이동 필요';
};

const getStatusTone = (spot: HomeTourSpot): 'done' | 'ready' | 'neutral' => {
  if (spot.collected) {
    return 'done';
  }

  if (
    spot.verificationDistanceMeters !== null &&
    spot.verificationDistanceMeters <= STAMP_RADIUS_METERS
  ) {
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
    overflow: 'hidden',
    padding: 0,
  },
  carouselShell: {
    backgroundColor: colors.surfaceSink,
  },
  carouselContent: {
    alignItems: 'stretch',
  },
  carouselPage: {
    aspectRatio: 16 / 10,
  },
  carouselImage: {
    width: '100%',
    height: '100%',
    backgroundColor: colors.surfaceSink,
  },
  carouselFallback: {
    aspectRatio: 16 / 10,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surfaceSink,
  },
  indicatorRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: spacing.xs,
    paddingTop: spacing.sm,
  },
  indicatorDot: {
    width: 7,
    height: 7,
    borderRadius: radius.full,
    backgroundColor: colors.border,
  },
  indicatorDotActive: {
    backgroundColor: colors.ink,
    width: 18,
  },
  heroCopy: {
    gap: spacing.sm,
    padding: spacing.lg,
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
  detailList: {
    gap: spacing.sm,
  },
  infoRowItem: {
    gap: 2,
  },
  noticeCard: {
    padding: spacing.lg,
    gap: spacing.sm,
    backgroundColor: colors.brandSoft,
    borderWidth: 1,
    borderColor: colors.border,
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
