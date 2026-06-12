import Ionicons from '@expo/vector-icons/Ionicons';
import { useState } from 'react';
import {
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
  useWindowDimensions,
  type NativeScrollEvent,
  type NativeSyntheticEvent,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { STAMP_RADIUS_METERS } from '@shared/config';
import type { Coordinates } from '@shared/types';
import { AppText, Badge, Button, Surface, colors, radius, spacing } from '@shared/ui';

export interface EventDetailItem {
  readonly contentId: string;
  readonly title: string;
  readonly address: string;
  readonly distanceMeters: number;
  readonly verificationDistanceMeters: number | null;
  readonly collected: boolean;
  readonly location: Coordinates;
  readonly startDate: string;
  readonly endDate: string;
  readonly thumbnailUrl?: string;
  readonly imageUrls: readonly string[];
  readonly overview?: string;
  readonly homepage?: string;
  readonly telephone?: string;
  readonly contentTypeId?: string;
}

interface EventDetailViewProps {
  readonly event: EventDetailItem | null;
  readonly onBack?: () => void;
  readonly onOpenDirections?: () => void;
  readonly onOpenStamp?: () => void;
}

export function EventDetailView({
  event,
  onBack,
  onOpenDirections,
  onOpenStamp,
}: EventDetailViewProps) {
  const { width } = useWindowDimensions();
  const [message, setMessage] = useState('행사 기간과 도장 동선을 확인해 보세요.');

  const carouselWidth = Math.max(width - spacing.lg * 2, 0);
  const images = event
    ? event.imageUrls.length > 0
      ? [...event.imageUrls]
      : event.thumbnailUrl
        ? [event.thumbnailUrl]
        : []
    : [];

  if (!event) {
    return (
      <SafeAreaView style={styles.root}>
        <View style={styles.emptyState}>
          <View style={styles.emptyIconWrap}>
            <Ionicons name="ticket-outline" size={58} color={colors.inkSubtle} />
          </View>
          <AppText variant="h1" tone="ink" numberOfLines={1}>
            선택된 행사가 없어요
          </AppText>
          <AppText variant="body" tone="inkMuted" style={styles.emptySubtitle} numberOfLines={2}>
            홈이나 지도에서 행사를 선택하면 상세 정보가 열립니다.
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

  const intro = event.overview ?? getEventIntroText(event);
  const statusLabel = getEventStatusLabel(event);

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
          <Badge tone={event.collected ? 'done' : getEventStatusTone(event)} size="md">
            {event.collected ? '수집 완료' : statusLabel}
          </Badge>
        </View>

        <Surface elevation="e1" radius="lg" style={styles.heroCard}>
          <EventImageCarousel
            key={event.contentId}
            images={images}
            collected={event.collected}
            width={carouselWidth}
          />

          <View style={styles.heroCopy}>
            <Badge tone="brand" size="sm">
              행사 상세
            </Badge>
            <AppText variant="display" tone="ink" numberOfLines={2}>
              {event.title}
            </AppText>
            <AppText variant="body" tone="inkSoft" numberOfLines={2}>
              {formatEventPeriod(event)} · {event.address}
            </AppText>
            <View style={styles.heroMetaRow}>
              <View style={styles.heroMetaItem}>
                <AppText variant="title" tone="ink">
                  {event.distanceMeters}m
                </AppText>
                <AppText variant="caption" tone="inkMuted" numberOfLines={1}>
                  현재 거리
                </AppText>
              </View>
              <View style={styles.heroMetaItem}>
                <AppText variant="title" tone="ink">
                  {statusLabel}
                </AppText>
                <AppText variant="caption" tone="inkMuted" numberOfLines={1}>
                  행사 상태
                </AppText>
              </View>
            </View>
          </View>
        </Surface>

        <View style={styles.infoRow}>
          <Surface elevation="e1" radius="md" style={styles.infoCard}>
            <AppText variant="h2" tone="ink" numberOfLines={1}>
              {formatCompactDate(event.startDate)}
            </AppText>
            <AppText variant="caption" tone="inkMuted">
              시작일
            </AppText>
          </Surface>
          <Surface elevation="e1" radius="md" style={styles.infoCard}>
            <AppText variant="h2" tone="ink" numberOfLines={1}>
              {formatCompactDate(event.endDate)}
            </AppText>
            <AppText variant="caption" tone="inkMuted">
              종료일
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

        <Surface elevation="e1" radius="lg" style={styles.sectionCard}>
          <AppText variant="h3" tone="ink">
            행사 정보
          </AppText>
          <View style={styles.detailList}>
            <InfoRow label="기간" value={formatEventPeriod(event)} />
            {event.address ? <InfoRow label="주소" value={event.address} /> : null}
            {event.telephone ? <InfoRow label="전화" value={event.telephone} /> : null}
            {event.homepage ? <InfoRow label="홈페이지" value={event.homepage} /> : null}
          </View>
        </Surface>

        <Surface elevation="e1" radius="lg" style={styles.noticeCard}>
          <Badge tone="brand" size="sm">
            행사 도장 인증 안내
          </Badge>
          <AppText variant="body" tone="inkSoft">
            행사는 기간이 끝나기 전까지 도장 후보로 표시됩니다. 행사 장소 반경 {STAMP_RADIUS_METERS}
            m 이내에서 도장 화면을 열면 인증할 수 있어요.
          </AppText>
        </Surface>

        <Button
          variant="primary"
          size="lg"
          fullWidth
          onPress={onOpenStamp}
          accessibilityLabel={`${event.title} 행사 도장 화면으로 이동`}
        >
          행사 도장 화면으로 이동
        </Button>

        <Button
          variant="secondary"
          size="lg"
          fullWidth
          onPress={() => {
            setMessage(`${event.title} 길찾기 준비 중`);
            onOpenDirections?.();
          }}
          accessibilityLabel={`${event.title} 카카오맵으로 길찾기`}
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

function EventImageCarousel({
  collected,
  images,
  width,
}: {
  readonly collected: boolean;
  readonly images: readonly string[];
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
        <Ionicons
          name={collected ? 'checkmark-circle' : 'calendar-clear-outline'}
          size={82}
          color={collected ? colors.reward : colors.locationDot}
        />
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

const getEventIntroText = (event: EventDetailItem) => {
  return `${event.title}는 ${formatEventPeriod(event)} 기간 동안 진행되는 행사입니다. 행사 위치와 기간을 확인한 뒤 현장에서 도장을 인증할 수 있어요.`;
};

const formatEventPeriod = (event: EventDetailItem) => {
  return `${formatCompactDate(event.startDate)}-${formatCompactDate(event.endDate)}`;
};

const formatCompactDate = (value: string) => {
  if (value.length !== 8) {
    return value;
  }

  return `${Number(value.slice(4, 6))}.${Number(value.slice(6, 8))}`;
};

const getTodayCompactDate = () => {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');

  return `${year}${month}${day}`;
};

const getEventStatusLabel = (event: EventDetailItem) => {
  const today = getTodayCompactDate();

  if (today < event.startDate) {
    return '예정 행사';
  }

  if (today > event.endDate) {
    return '종료 행사';
  }

  return '진행 중';
};

const getEventStatusTone = (event: EventDetailItem): 'ready' | 'neutral' => {
  return getEventStatusLabel(event) === '진행 중' ? 'ready' : 'neutral';
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
    width: 18,
    backgroundColor: colors.ink,
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
  emptyIconWrap: {
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
