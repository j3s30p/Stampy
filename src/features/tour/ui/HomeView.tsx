import Ionicons from '@expo/vector-icons/Ionicons';
import { useState } from 'react';
import { Image, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { STAMP_RADIUS_METERS } from '@shared/config';
import type { Coordinates } from '@shared/types';
import { AppText, Badge, Gauge, Surface, colors, radius, spacing } from '@shared/ui';

export interface HomeTourSpot {
  readonly contentId: string;
  readonly title: string;
  readonly address: string;
  readonly theme: string;
  readonly distanceMeters: number;
  readonly verificationDistanceMeters: number | null;
  readonly collected: boolean;
  readonly location: Coordinates;
  readonly thumbnailUrl?: string;
  readonly imageUrls: readonly string[];
  readonly overview?: string;
  readonly homepage?: string;
  readonly telephone?: string;
  readonly contentTypeId?: string;
}

export interface HomeTourEvent {
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

interface HomeViewProps {
  readonly spots: readonly HomeTourSpot[];
  readonly events: readonly HomeTourEvent[];
  readonly collectedCount: number;
  readonly totalCount: number;
  readonly onSelectSpot?: (contentId: string) => void;
  readonly onSelectEvent?: (contentId: string) => void;
}

export function HomeView({
  spots,
  events = [],
  collectedCount,
  onSelectEvent,
  onSelectSpot,
  totalCount,
}: HomeViewProps) {
  const [activeContentMode, setActiveContentMode] = useState<HomeContentMode>('spot');
  const displayTotalCount = Math.max(totalCount, collectedCount, spots.length, 1);
  const progressPercent = Math.round((collectedCount / displayTotalCount) * 100);
  const recommendedSpotItem = pickRecommendedItem(spots.map(toRecommendedSpot));
  const recommendedEventItem = pickRecommendedItem(events.map(toRecommendedEvent));
  const recommendedItems = [recommendedSpotItem, recommendedEventItem].filter(
    (item): item is RecommendedHomeItem => item !== null,
  );
  const nearbySpotCount = Math.min(spots.length, 5);
  const recentSpots = spots.filter((spot) => spot.collected).slice(0, 3);
  const handleSelectReadyItem = (item: RecommendedHomeItem) => {
    if (item.kind === 'event') {
      onSelectEvent?.(item.contentId);
      return;
    }

    onSelectSpot?.(item.contentId);
  };

  return (
    <SafeAreaView style={styles.root} edges={['top', 'left', 'right']}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <View style={styles.logoRow}>
            <View style={styles.logoMark}>
              <Ionicons name="ribbon" size={16} color={colors.surface} />
            </View>
            <AppText variant="h2" tone="ink" numberOfLines={1}>
              Stampy
            </AppText>
          </View>
          <Ionicons name="notifications-outline" size={20} color={colors.ink} />
        </View>

        <AppText variant="h1" tone="ink" style={styles.greeting} numberOfLines={2}>
          안녕하세요, 재선님{'\n'}오늘은 종로에서 도장 모아볼까요?
        </AppText>

        <View style={styles.progressCard}>
          <View style={styles.progressHead}>
            <AppText variant="caption" style={styles.progressSub} numberOfLines={1}>
              서울 스탬프 투어
            </AppText>
            <AppText variant="captionBold" tone="onDark" numberOfLines={1}>
              도장 {collectedCount}/{displayTotalCount}
            </AppText>
          </View>
          <Gauge value={progressPercent} tone="reward" />
          <View style={styles.progressFoot}>
            <AppText variant="caption" style={styles.progressSub} numberOfLines={1}>
              다음 보상까지 도장 {Math.max(0, 5 - collectedCount)}개
            </AppText>
            <AppText variant="captionBold" style={styles.progressAction} numberOfLines={1}>
              컬렉션 보기
            </AppText>
          </View>
        </View>

        {recommendedItems.length > 0 ? (
          <Surface elevation="none" radius="lg" style={styles.readyCard}>
            <View style={styles.readyStateRow}>
              <View style={styles.readyDot} />
              <AppText variant="captionBold" style={styles.readyStateText} numberOfLines={1}>
                추천 스팟
              </AppText>
            </View>

            <View style={styles.readyList}>
              {recommendedItems.map((item) => (
                <RecommendedItemRow
                  key={`${item.kind}-${item.contentId}`}
                  item={item}
                  onPress={() => handleSelectReadyItem(item)}
                />
              ))}
            </View>
          </Surface>
        ) : null}

        <View style={styles.contentSwitcher}>
          <SegmentButton
            active={activeContentMode === 'spot'}
            count={nearbySpotCount}
            icon="image-outline"
            label="관광지"
            onPress={() => setActiveContentMode('spot')}
          />
          <SegmentButton
            active={activeContentMode === 'event'}
            count={events.length}
            icon="calendar-clear-outline"
            label="행사"
            onPress={() => setActiveContentMode('event')}
          />
        </View>

        {activeContentMode === 'event' ? (
          <>
            <SectionHead title="진행 중인 행사" action={`${events.length}개`} />
            <View style={styles.eventList}>
              {events.map((event) => (
                <Pressable
                  key={event.contentId}
                  accessibilityRole="button"
                  accessibilityLabel={`${event.title} 행사 상세 보기`}
                  accessibilityHint={`${formatEventPeriod(event)} · ${event.distanceMeters}m`}
                  onPress={() => onSelectEvent?.(event.contentId)}
                  style={({ pressed }) => [styles.spotPressable, pressed ? styles.pressed : null]}
                >
                  <Surface elevation="none" radius="md" style={styles.eventCard}>
                    <EventListMark thumbnailUrl={event.thumbnailUrl ?? event.imageUrls[0]} />

                    <View style={styles.spotCopy}>
                      <View style={styles.spotTitleRow}>
                        <AppText variant="h3" tone="ink" numberOfLines={1} style={styles.spotTitle}>
                          {event.title}
                        </AppText>
                        <Ionicons name="chevron-forward" size={16} color={colors.inkSubtle} />
                      </View>
                      <AppText variant="caption" tone="inkMuted" numberOfLines={1}>
                        {event.address}
                      </AppText>
                      <View style={styles.spotMetaRow}>
                        <Badge tone={event.collected ? 'done' : 'ready'} size="sm">
                          {event.collected ? '수집 완료' : getEventStatusLabel(event)}
                        </Badge>
                        <AppText variant="captionBold" tone="inkSoft" numberOfLines={1}>
                          {formatEventPeriod(event)} · {event.distanceMeters}m
                        </AppText>
                      </View>
                    </View>
                  </Surface>
                </Pressable>
              ))}
            </View>
          </>
        ) : (
          <>
            <SectionHead title="주변 관광지" action={`상위 ${nearbySpotCount}개`} />
            <View style={styles.spotList}>
              {spots.slice(0, nearbySpotCount).map((spot, index) => (
                <Pressable
                  key={spot.contentId}
                  accessibilityRole="button"
                  accessibilityLabel={`${spot.title} 상세 보기`}
                  accessibilityHint={`${getSpotStatusLabel(spot)} · ${spot.distanceMeters}m`}
                  onPress={() => onSelectSpot?.(spot.contentId)}
                  style={({ pressed }) => [styles.spotPressable, pressed ? styles.pressed : null]}
                >
                  <Surface elevation="none" radius="md" style={styles.spotCard}>
                    <SpotListMark
                      index={index}
                      collected={spot.collected}
                      thumbnailUrl={spot.thumbnailUrl}
                    />

                    <View style={styles.spotCopy}>
                      <View style={styles.spotTitleRow}>
                        <AppText variant="h3" tone="ink" numberOfLines={1} style={styles.spotTitle}>
                          {spot.title}
                        </AppText>
                        <Ionicons name="chevron-forward" size={16} color={colors.inkSubtle} />
                      </View>
                      <AppText variant="caption" tone="inkMuted" numberOfLines={1}>
                        {spot.address}
                      </AppText>
                      <View style={styles.spotMetaRow}>
                        <Badge tone={getSpotStatusTone(spot)} size="sm">
                          {getSpotStatusLabel(spot)}
                        </Badge>
                        <AppText variant="captionBold" tone="inkSoft" numberOfLines={1}>
                          {spot.distanceMeters}m
                        </AppText>
                      </View>
                    </View>
                  </Surface>
                </Pressable>
              ))}
            </View>
          </>
        )}

        <SectionHead title="최근 수집한 도장" action="6월" />
        <View style={styles.recentRow}>
          {(recentSpots.length > 0 ? recentSpots : spots.slice(0, 3)).map((spot, index) => (
            <Pressable
              key={spot.contentId}
              accessibilityRole="button"
              accessibilityLabel={`${spot.title} 상세 보기`}
              onPress={() => onSelectSpot?.(spot.contentId)}
              style={({ pressed }) => [styles.recentPressable, pressed ? styles.pressed : null]}
            >
              <Surface elevation="none" radius="md" style={styles.recentCard}>
                <StampMedallion label={getStampGlyph(index)} collected={spot.collected} />
                <AppText
                  variant="captionBold"
                  tone="ink"
                  numberOfLines={1}
                  style={styles.centerText}
                >
                  {spot.title}
                </AppText>
                <AppText variant="micro" tone="inkMuted" numberOfLines={1}>
                  {spot.collected ? '6월 수집' : `${spot.distanceMeters}m`}
                </AppText>
              </Surface>
            </Pressable>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function SectionHead({ title, action }: { readonly title: string; readonly action: string }) {
  return (
    <View style={styles.sectionHead}>
      <AppText variant="h3" tone="ink" numberOfLines={1}>
        {title}
      </AppText>
      <AppText variant="caption" tone="inkMuted" numberOfLines={1}>
        {action}
      </AppText>
    </View>
  );
}

const SegmentButton = ({
  active,
  count,
  icon,
  label,
  onPress,
}: {
  readonly active: boolean;
  readonly count: number;
  readonly icon: keyof typeof Ionicons.glyphMap;
  readonly label: string;
  readonly onPress: () => void;
}) => {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${label} 목록 보기`}
      accessibilityState={{ selected: active }}
      onPress={onPress}
      style={({ pressed }) => [
        styles.segmentButton,
        active ? styles.segmentButtonActive : null,
        pressed ? styles.pressed : null,
      ]}
    >
      <Ionicons name={icon} size={17} color={active ? colors.surface : colors.inkSoft} />
      <AppText
        variant="captionBold"
        tone={active ? 'onDark' : 'ink'}
        numberOfLines={1}
        style={styles.segmentLabel}
      >
        {label}
      </AppText>
      <View style={[styles.segmentCount, active ? styles.segmentCountActive : null]}>
        <AppText variant="micro" tone={active ? 'ink' : 'inkMuted'} numberOfLines={1}>
          {count}
        </AppText>
      </View>
    </Pressable>
  );
};

function RecommendedItemRow({
  item,
  onPress,
}: {
  readonly item: RecommendedHomeItem;
  readonly onPress: () => void;
}) {
  const canVerify =
    !item.collected &&
    item.verificationDistanceMeters !== null &&
    item.verificationDistanceMeters <= STAMP_RADIUS_METERS;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${item.kind === 'event' ? '행사' : '관광지'} ${item.title} 상세 보기`}
      onPress={onPress}
      style={({ pressed }) => [styles.readyRowPressable, pressed ? styles.pressed : null]}
    >
      <View style={styles.readyBody}>
        {item.kind === 'event' ? (
          <EventListMark thumbnailUrl={item.thumbnailUrl} />
        ) : (
          <PlaceThumb size={56} thumbnailUrl={item.thumbnailUrl} />
        )}
        <View style={styles.readyText}>
          <AppText variant="captionBold" style={styles.readyKindText} numberOfLines={1}>
            {item.kind === 'event' ? '행사' : '관광지'}
          </AppText>
          <AppText variant="h3" tone="ink" numberOfLines={1}>
            {item.title}
          </AppText>
          <AppText variant="captionBold" style={styles.readyDistance} numberOfLines={1}>
            {canVerify
              ? `${STAMP_RADIUS_METERS}m 안에 있어요 · ${item.distanceMeters}m`
              : `${item.distanceMeters}m · 가까이 이동 필요`}
          </AppText>
        </View>
        <Ionicons name="chevron-forward" size={18} color={colors.inkSubtle} />
      </View>
    </Pressable>
  );
}

function PlaceThumb({
  size,
  thumbnailUrl,
}: {
  readonly size: number;
  readonly thumbnailUrl?: string;
}) {
  return (
    <View style={[styles.placeThumb, { width: size, height: size, borderRadius: size * 0.22 }]}>
      {thumbnailUrl ? (
        <Image source={{ uri: thumbnailUrl }} style={styles.thumbImage} resizeMode="cover" />
      ) : (
        <>
          <View style={styles.thumbSky} />
          <View style={styles.thumbHill} />
          <View style={styles.thumbRoof} />
          <View style={styles.thumbWall} />
        </>
      )}
    </View>
  );
}

function EventListMark({ thumbnailUrl }: { readonly thumbnailUrl?: string }) {
  return (
    <View style={styles.eventMark}>
      {thumbnailUrl ? (
        <>
          <Image source={{ uri: thumbnailUrl }} style={styles.eventMarkImage} resizeMode="cover" />
          <View style={styles.eventImagePill}>
            <AppText variant="micro" tone="onDark" numberOfLines={1}>
              행사
            </AppText>
          </View>
        </>
      ) : (
        <View style={styles.eventMarkFallback}>
          <Ionicons name="calendar-clear-outline" size={18} color={colors.surface} />
          <AppText variant="micro" tone="onDark" numberOfLines={1}>
            행사
          </AppText>
        </View>
      )}
    </View>
  );
}

function StampMedallion({
  collected,
  label,
}: {
  readonly collected: boolean;
  readonly label: string;
}) {
  return (
    <View style={[styles.stampMedallion, collected ? styles.stampDone : styles.stampLocked]}>
      {collected ? (
        <AppText variant="h3" style={styles.stampDoneText} numberOfLines={1}>
          {label}
        </AppText>
      ) : (
        <Ionicons name="lock-closed" size={17} color={colors.inkSubtle} />
      )}
    </View>
  );
}

const getStampGlyph = (index: number) => ['村', '宮', '塔'][index % 3] ?? '印';

const formatEventPeriod = (event: HomeTourEvent) => {
  return `${formatCompactDate(event.startDate)}-${formatCompactDate(event.endDate)}`;
};

const formatCompactDate = (value: string) => {
  if (value.length !== 8) {
    return value;
  }

  return `${Number(value.slice(4, 6))}.${Number(value.slice(6, 8))}`;
};

const getEventStatusLabel = (event: HomeTourEvent) => {
  const today = getTodayCompactDate();

  if (today < event.startDate) {
    return '예정 행사';
  }

  if (today > event.endDate) {
    return '종료 행사';
  }

  return '진행 중';
};

const getTodayCompactDate = () => {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');

  return `${year}${month}${day}`;
};

function SpotListMark({
  collected,
  index,
  thumbnailUrl,
}: {
  readonly collected: boolean;
  readonly index: number;
  readonly thumbnailUrl?: string;
}) {
  return (
    <View style={styles.spotMark}>
      {thumbnailUrl ? (
        <Image source={{ uri: thumbnailUrl }} style={styles.spotMarkImage} resizeMode="cover" />
      ) : (
        <View style={[styles.spotMarkFallback, collected ? styles.spotMarkFallbackDone : null]}>
          <AppText variant="captionBold" tone={collected ? 'ink' : 'inkMuted'} numberOfLines={1}>
            {String(index + 1).padStart(2, '0')}
          </AppText>
        </View>
      )}
    </View>
  );
}

const getSpotStatusLabel = (spot: HomeTourSpot) => {
  if (spot.collected) {
    return '수집 완료';
  }

  if (
    spot.verificationDistanceMeters !== null &&
    spot.verificationDistanceMeters <= STAMP_RADIUS_METERS
  ) {
    return '지금 인증 가능';
  }

  return '이동 필요';
};

const getSpotStatusTone = (spot: HomeTourSpot): 'done' | 'ready' | 'neutral' => {
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

type HomeContentMode = 'event' | 'spot';

type RecommendedHomeItem = {
  readonly kind: HomeContentMode;
  readonly contentId: string;
  readonly title: string;
  readonly distanceMeters: number;
  readonly verificationDistanceMeters: number | null;
  readonly collected: boolean;
  readonly thumbnailUrl?: string;
};

const toRecommendedSpot = (spot: HomeTourSpot): RecommendedHomeItem => ({
  kind: 'spot',
  contentId: spot.contentId,
  title: spot.title,
  distanceMeters: spot.distanceMeters,
  verificationDistanceMeters: spot.verificationDistanceMeters,
  collected: spot.collected,
  thumbnailUrl: spot.thumbnailUrl ?? spot.imageUrls[0],
});

const toRecommendedEvent = (event: HomeTourEvent): RecommendedHomeItem => ({
  kind: 'event',
  contentId: event.contentId,
  title: event.title,
  distanceMeters: event.distanceMeters,
  verificationDistanceMeters: event.verificationDistanceMeters,
  collected: event.collected,
  thumbnailUrl: event.thumbnailUrl ?? event.imageUrls[0],
});

const pickRecommendedItem = (items: readonly RecommendedHomeItem[]): RecommendedHomeItem | null => {
  const sortedItems = [...items].sort((a, b) => a.distanceMeters - b.distanceMeters);

  return (
    sortedItems.find(
      (item) =>
        !item.collected &&
        item.verificationDistanceMeters !== null &&
        item.verificationDistanceMeters <= STAMP_RADIUS_METERS,
    ) ??
    sortedItems.find((item) => !item.collected) ??
    sortedItems[0] ??
    null
  );
};

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.canvas,
  },
  content: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
    paddingBottom: spacing.xxl,
    gap: spacing.md,
  },
  header: {
    minHeight: 38,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  logoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  logoMark: {
    width: 26,
    height: 26,
    borderRadius: radius.sm,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.brand,
  },
  greeting: {
    lineHeight: 28,
  },
  progressCard: {
    padding: spacing.lg,
    borderRadius: 18,
    gap: spacing.sm,
    backgroundColor: colors.ink,
  },
  progressHead: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
  progressSub: {
    color: '#AAB6C6',
  },
  progressAction: {
    color: '#FF9C73',
  },
  progressFoot: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
  readyCard: {
    padding: spacing.md,
    gap: spacing.sm,
    backgroundColor: colors.surface,
    borderWidth: 1.5,
    borderColor: colors.stamp,
  },
  readyStateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  readyDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.stamp,
  },
  readyStateText: {
    color: colors.stampInk,
  },
  readyList: {
    gap: spacing.xs,
  },
  readyRowPressable: {
    minWidth: 0,
  },
  readyBody: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  readyText: {
    flex: 1,
    minWidth: 0,
    gap: 1,
  },
  readyKindText: {
    color: colors.stampInk,
  },
  readyDistance: {
    color: colors.stampInk,
  },
  contentSwitcher: {
    flexDirection: 'row',
    gap: spacing.sm,
    padding: 4,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  segmentButton: {
    flex: 1,
    minWidth: 0,
    height: 44,
    borderRadius: radius.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    paddingHorizontal: spacing.sm,
  },
  segmentButtonActive: {
    backgroundColor: colors.ink,
  },
  segmentLabel: {
    flexShrink: 1,
  },
  segmentCount: {
    minWidth: 22,
    height: 22,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 5,
    backgroundColor: colors.surfaceSink,
  },
  segmentCountActive: {
    backgroundColor: colors.surface,
  },
  spotList: {
    gap: spacing.xs,
  },
  eventList: {
    gap: spacing.xs,
  },
  spotPressable: {
    minWidth: 0,
  },
  spotCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    padding: spacing.md,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  eventCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    padding: spacing.md,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: '#BFD6FF',
  },
  eventMark: {
    width: 56,
    height: 56,
    borderRadius: 14,
    overflow: 'hidden',
    backgroundColor: colors.locationDot,
  },
  eventMarkImage: {
    width: '100%',
    height: '100%',
  },
  eventImagePill: {
    position: 'absolute',
    left: 4,
    right: 4,
    bottom: 4,
    height: 18,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(19, 34, 51, 0.72)',
  },
  eventMarkFallback: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 2,
  },
  spotMark: {
    width: 56,
    height: 56,
    borderRadius: 14,
    overflow: 'hidden',
    backgroundColor: colors.surfaceSink,
  },
  spotMarkImage: {
    width: '100%',
    height: '100%',
  },
  spotMarkFallback: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F0E6D6',
  },
  spotMarkFallbackDone: {
    backgroundColor: '#E7F7EE',
  },
  spotCopy: {
    flex: 1,
    minWidth: 0,
    gap: 3,
  },
  spotTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  spotTitle: {
    flex: 1,
    minWidth: 0,
  },
  spotMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
  placeThumb: {
    flex: 0,
    overflow: 'hidden',
    backgroundColor: '#CFE0F5',
  },
  thumbImage: {
    width: '100%',
    height: '100%',
  },
  thumbSky: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#CFE0F5',
  },
  thumbHill: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: '40%',
    backgroundColor: '#7FA86E',
  },
  thumbRoof: {
    position: 'absolute',
    left: '18%',
    right: '18%',
    top: '34%',
    height: '18%',
    backgroundColor: '#3E5C46',
    transform: [{ rotate: '45deg' }],
  },
  thumbWall: {
    position: 'absolute',
    left: '28%',
    right: '28%',
    bottom: '18%',
    height: '22%',
    backgroundColor: '#B4543A',
  },
  sectionHead: {
    marginTop: spacing.xs,
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
  recentRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  recentPressable: {
    flex: 1,
    minWidth: 0,
  },
  recentCard: {
    minHeight: 114,
    alignItems: 'center',
    padding: spacing.sm,
    gap: spacing.xs,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  stampMedallion: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stampDone: {
    borderWidth: 2,
    borderColor: colors.stamp,
    backgroundColor: '#E7F7EE',
  },
  stampLocked: {
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderColor: '#B8C2D0',
    backgroundColor: colors.surfaceSink,
  },
  stampDoneText: {
    color: colors.stampInk,
  },
  centerText: {
    textAlign: 'center',
  },
  pressed: {
    opacity: 0.86,
  },
});
