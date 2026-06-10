import Ionicons from '@expo/vector-icons/Ionicons';
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

interface HomeViewProps {
  readonly spots: readonly HomeTourSpot[];
  readonly collectedCount: number;
  readonly totalCount: number;
  readonly onSelectSpot?: (contentId: string) => void;
}

export function HomeView({ spots, collectedCount, onSelectSpot, totalCount }: HomeViewProps) {
  const displayTotalCount = Math.max(totalCount, collectedCount, spots.length, 1);
  const progressPercent = Math.round((collectedCount / displayTotalCount) * 100);
  const readySpot =
    spots.find(
      (spot) =>
        !spot.collected &&
        spot.verificationDistanceMeters !== null &&
        spot.verificationDistanceMeters <= STAMP_RADIUS_METERS,
    ) ??
    spots.find((spot) => !spot.collected) ??
    spots[0] ??
    null;
  const readySpotCanVerify = readySpot
    ? !readySpot.collected &&
      readySpot.verificationDistanceMeters !== null &&
      readySpot.verificationDistanceMeters <= STAMP_RADIUS_METERS
    : false;
  const nearbySpotCount = Math.min(spots.length, 5);
  const recentSpots = spots.filter((spot) => spot.collected).slice(0, 3);

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

        {readySpot ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={`${readySpot.title} 상세 보기`}
            onPress={() => onSelectSpot?.(readySpot.contentId)}
            style={({ pressed }) => [styles.readyPressable, pressed ? styles.pressed : null]}
          >
            <Surface elevation="none" radius="lg" style={styles.readyCard}>
              <View style={styles.readyStateRow}>
                <View style={styles.readyDot} />
                <AppText variant="captionBold" style={styles.readyStateText} numberOfLines={1}>
                  {readySpotCanVerify ? '지금 인증 가능' : '추천 스팟'}
                </AppText>
              </View>
              <View style={styles.readyBody}>
                <PlaceThumb size={56} thumbnailUrl={readySpot.thumbnailUrl} />
                <View style={styles.readyText}>
                  <AppText variant="h3" tone="ink" numberOfLines={1}>
                    {readySpot.title}
                  </AppText>
                  <AppText variant="captionBold" style={styles.readyDistance} numberOfLines={1}>
                    {readySpot.verificationDistanceMeters !== null &&
                    readySpot.verificationDistanceMeters <= STAMP_RADIUS_METERS
                      ? `${STAMP_RADIUS_METERS}m 안에 있어요 · ${readySpot.distanceMeters}m`
                      : `${readySpot.distanceMeters}m · 가까이 이동 필요`}
                  </AppText>
                </View>
                <View style={styles.readyButton}>
                  <AppText variant="captionBold" tone="onDark" numberOfLines={1}>
                    {readySpotCanVerify ? '도장 찍기' : '상세 보기'}
                  </AppText>
                </View>
              </View>
            </Surface>
          </Pressable>
        ) : null}

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
  readyPressable: {
    minWidth: 0,
  },
  readyCard: {
    padding: spacing.lg,
    gap: spacing.md,
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
  readyBody: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  readyText: {
    flex: 1,
    minWidth: 0,
    gap: 2,
  },
  readyDistance: {
    color: colors.stampInk,
  },
  readyButton: {
    flex: 0,
    minWidth: 82,
    height: 38,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.md,
    borderRadius: radius.md,
    backgroundColor: colors.brand,
  },
  spotList: {
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
