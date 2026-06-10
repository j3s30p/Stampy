import Ionicons from '@expo/vector-icons/Ionicons';
import { useMemo, useState } from 'react';
import {
  Image,
  Linking,
  PanResponder,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { CurrentLocationStatus } from '@core/location';
import { STAMP_RADIUS_METERS } from '@shared/config';
import type { Coordinates } from '@shared/types';
import { AppText, Badge, Button, Surface, colors, radius, shadow, spacing } from '@shared/ui';
import type { MapSpotPin } from '../model';
import { KakaoMapWebView } from './KakaoMapWebView';

interface MapViewProps {
  readonly kakaoJsKey: string;
  readonly spots: readonly MapSpotPin[];
  readonly totalCount: number;
  readonly selectedSpotId: string | null;
  readonly currentLocation: Coordinates | null;
  readonly locationStatus: CurrentLocationStatus;
  readonly onSelectSpot?: (contentId: string) => void;
  readonly onOpenSpotDetail?: (contentId: string) => void;
  readonly onOpenStamp?: (contentId: string) => void;
}

export function MapView({
  kakaoJsKey,
  spots,
  totalCount,
  selectedSpotId,
  currentLocation,
  locationStatus,
  onSelectSpot,
  onOpenSpotDetail,
  onOpenStamp,
}: MapViewProps) {
  const [internalSelectedSpotId, setInternalSelectedSpotId] = useState<string | null>(
    selectedSpotId ?? spots[0]?.contentId ?? null,
  );
  const [activeFilter, setActiveFilter] = useState<MapFilter>('all');
  const [directionMessage, setDirectionMessage] = useState('GPS 위치 인증 후 수집 가능');
  const [mapErrorMessage, setMapErrorMessage] = useState<string | null>(null);
  const [sheetExpanded, setSheetExpanded] = useState(false);

  const effectiveSelectedSpotId = resolveEffectiveSelectedSpotId(
    spots,
    selectedSpotId,
    internalSelectedSpotId,
  );

  const selectedSpot = useMemo(() => {
    return resolveSelectedSpot(spots, effectiveSelectedSpotId);
  }, [effectiveSelectedSpotId, spots]);

  const filteredSpots = useMemo(() => filterSpots(spots, activeFilter), [activeFilter, spots]);
  const collectedCount = spots.filter((spot) => spot.collected).length;
  const displayTotalCount = Math.max(totalCount, spots.length, collectedCount, 1);
  const shouldShowFallbackMap = !kakaoJsKey.trim() || mapErrorMessage !== null;
  const sheetPanResponder = useMemo(
    () =>
      PanResponder.create({
        onMoveShouldSetPanResponder: (_, gestureState) => Math.abs(gestureState.dy) > 8,
        onPanResponderRelease: (_, gestureState) => {
          if (gestureState.dy < -20) {
            setSheetExpanded(true);
            return;
          }

          if (gestureState.dy > 20) {
            setSheetExpanded(false);
          }
        },
      }),
    [],
  );

  const handleSelectSpot = (contentId: string) => {
    setInternalSelectedSpotId(contentId);
    const nextSpot = spots.find((spot) => spot.contentId === contentId) ?? null;
    setDirectionMessage(nextSpot ? `${nextSpot.title} 선택됨` : 'GPS 위치 인증 후 수집 가능');
    onSelectSpot?.(contentId);
  };

  const handleOpenDirections = async () => {
    if (!selectedSpot) {
      return;
    }

    try {
      setDirectionMessage(`${selectedSpot.title} 카카오맵 열기`);
      await Linking.openURL(buildKakaoDirectionsUrl(selectedSpot));
    } catch {
      setDirectionMessage('카카오맵을 열지 못했습니다');
    }
  };

  return (
    <SafeAreaView style={styles.root} edges={['top', 'left', 'right']}>
      <View style={styles.header}>
        <View style={styles.logoRow}>
          <View style={styles.logoMark}>
            <Ionicons name="ribbon" size={16} color={colors.surface} />
          </View>
          <AppText variant="h2" tone="ink" numberOfLines={1}>
            Stampy
          </AppText>
        </View>
        <View style={styles.headerActions}>
          <Badge tone="brand" size="sm">
            도장 {collectedCount}/{displayTotalCount}
          </Badge>
          <Ionicons name="notifications-outline" size={20} color={colors.ink} />
        </View>
      </View>

      <View style={styles.mapArea}>
        {shouldShowFallbackMap ? (
          <FallbackMapStage
            selectedSpot={selectedSpot}
            filteredSpots={filteredSpots}
            mapErrorMessage={mapErrorMessage}
          />
        ) : (
          <KakaoMapWebView
            kakaoJsKey={kakaoJsKey}
            spots={spots}
            selectedSpotId={effectiveSelectedSpotId}
            currentLocation={currentLocation}
            onMarkerTap={handleSelectSpot}
            onMapReady={() => setMapErrorMessage(null)}
            onMapError={setMapErrorMessage}
          />
        )}

        <View style={styles.filterRow}>
          {mapFilters.map((filter) => (
            <Pressable
              key={filter.key}
              accessibilityRole="button"
              accessibilityLabel={`${filter.label} 스팟 보기`}
              accessibilityState={{ selected: activeFilter === filter.key }}
              onPress={() => setActiveFilter(filter.key)}
              style={({ pressed }) => [
                styles.filterChip,
                activeFilter === filter.key ? styles.filterChipActive : null,
                pressed ? styles.pressed : null,
              ]}
            >
              <AppText
                variant="captionBold"
                tone={activeFilter === filter.key ? 'onDark' : 'ink'}
                numberOfLines={1}
              >
                {filter.label}
              </AppText>
            </Pressable>
          ))}
        </View>

        <View style={styles.mapControls}>
          <IconButton
            icon="locate"
            color={colors.locationDot}
            label="현재 위치"
            onPress={() => setDirectionMessage(getLocationStatusLabel(locationStatus))}
          />
          <IconButton
            icon="filter"
            color={colors.ink}
            label="필터"
            onPress={() => setActiveFilter(activeFilter === 'all' ? 'uncollected' : 'all')}
          />
        </View>

        <View style={styles.locationPill}>
          <View style={styles.locationDot} />
          <AppText variant="captionBold" tone="ink" numberOfLines={1}>
            {getLocationStatusLabel(locationStatus)}
          </AppText>
        </View>

        {mapErrorMessage && !shouldShowFallbackMap ? (
          <View style={styles.mapError}>
            <AppText variant="captionBold" tone="ink" numberOfLines={2}>
              {mapErrorMessage}
            </AppText>
          </View>
        ) : null}
      </View>

      {selectedSpot ? (
        <View style={[styles.sheet, sheetExpanded ? styles.sheetExpanded : null]}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={sheetExpanded ? '지도 시트 접기' : '지도 시트 펼치기'}
            accessibilityState={{ expanded: sheetExpanded }}
            onPress={() => setSheetExpanded((expanded) => !expanded)}
            style={styles.sheetGrabberTouch}
            {...sheetPanResponder.panHandlers}
          >
            <View style={styles.sheetGrabber} />
          </Pressable>
          <View style={styles.sheetMain}>
            <PlaceThumb thumbnailUrl={selectedSpot.thumbnailUrl} />
            <View style={styles.sheetCopy}>
              <View style={styles.sheetTitleRow}>
                <AppText variant="h2" tone="ink" numberOfLines={1}>
                  {selectedSpot.title}
                </AppText>
                <Ionicons name="share-outline" size={18} color={colors.inkSubtle} />
              </View>
              <AppText variant="caption" tone="inkMuted" numberOfLines={2}>
                {selectedSpot.address} · 한국관광공사 인증 스팟
              </AppText>
              <View style={styles.badgeRow}>
                <Badge tone={getSpotStatusTone(selectedSpot)} size="sm">
                  {getSpotStatusLabel(selectedSpot)}
                </Badge>
                <Badge tone="neutral" size="sm">
                  {selectedSpot.distanceMeters}m · 도보 1분
                </Badge>
              </View>
            </View>
          </View>

          <Surface elevation="none" radius="md" style={styles.sheetNotice}>
            <AppText variant="caption" tone="inkSoft" numberOfLines={1}>
              {directionMessage}
            </AppText>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={`${selectedSpot.title} 상세 보기`}
              onPress={() => onOpenSpotDetail?.(selectedSpot.contentId)}
            >
              <AppText variant="captionBold" style={styles.detailText} numberOfLines={1}>
                상세 보기
              </AppText>
            </Pressable>
          </Surface>

          <View style={styles.actionRow}>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={`${selectedSpot.title} 카카오 길찾기`}
              onPress={handleOpenDirections}
              style={({ pressed }) => [styles.routeButton, pressed ? styles.pressed : null]}
            >
              <Ionicons name="navigate-outline" size={21} color={colors.ink} />
            </Pressable>
            <Button
              variant="primary"
              size="md"
              fullWidth
              onPress={() => onOpenStamp?.(selectedSpot.contentId)}
              accessibilityLabel={`${selectedSpot.title} 도장 찍기`}
            >
              도장 찍기
            </Button>
          </View>

          {sheetExpanded && filteredSpots.length > 0 ? (
            <View style={[styles.fallbackList, sheetExpanded ? styles.fallbackListExpanded : null]}>
              <View style={styles.fallbackListHeader}>
                <View style={styles.fallbackListHeaderCopy}>
                  <AppText variant="captionBold" tone="ink" numberOfLines={1}>
                    주변 스팟
                  </AppText>
                  <AppText variant="micro" tone="inkMuted" numberOfLines={1}>
                    아래로 내리면 다시 접을 수 있어요.
                  </AppText>
                </View>
                <View style={styles.fallbackListCount}>
                  <AppText variant="captionBold" tone="ink" numberOfLines={1}>
                    {filteredSpots.length}개
                  </AppText>
                </View>
              </View>

              <ScrollView
                showsVerticalScrollIndicator={sheetExpanded}
                scrollEnabled={sheetExpanded}
                style={sheetExpanded ? styles.fallbackListScroller : null}
                contentContainerStyle={styles.fallbackListContent}
              >
                {filteredSpots.map((spot, index) => {
                  const isSelected = spot.contentId === selectedSpot?.contentId;

                  return (
                    <Pressable
                      key={spot.contentId}
                      accessibilityRole="button"
                      accessibilityLabel={`${spot.title} 지도 선택`}
                      accessibilityState={{ selected: isSelected }}
                      onPress={() => handleSelectSpot(spot.contentId)}
                      style={({ pressed }) => [
                        styles.fallbackRow,
                        isSelected ? styles.fallbackRowSelected : null,
                        pressed ? styles.pressed : null,
                      ]}
                    >
                      <SpotListMark
                        index={index}
                        collected={spot.collected}
                        thumbnailUrl={spot.thumbnailUrl}
                      />

                      <View style={styles.fallbackRowCopy}>
                        <View style={styles.fallbackRowTitleLine}>
                          <AppText
                            variant="captionBold"
                            tone="ink"
                            style={styles.fallbackTitle}
                            numberOfLines={1}
                          >
                            {spot.title}
                          </AppText>
                          <Ionicons name="chevron-forward" size={16} color={colors.inkSubtle} />
                        </View>
                        <AppText variant="micro" tone="inkMuted" numberOfLines={1}>
                          {spot.distanceMeters}m · {getSpotStatusLabel(spot)}
                        </AppText>
                      </View>

                      <Badge tone={getSpotStatusTone(spot)} size="sm">
                        {isSelected ? '선택됨' : getSpotStatusBadgeLabel(spot)}
                      </Badge>
                    </Pressable>
                  );
                })}
              </ScrollView>
            </View>
          ) : null}
        </View>
      ) : null}
    </SafeAreaView>
  );
}

function FallbackMapStage({
  selectedSpot,
  filteredSpots,
  mapErrorMessage,
}: {
  readonly selectedSpot: MapSpotPin | null;
  readonly filteredSpots: readonly MapSpotPin[];
  readonly mapErrorMessage: string | null;
}) {
  const fallbackSpot = selectedSpot ?? filteredSpots[0] ?? null;
  const previewSpots = filteredSpots.slice(0, 3);
  const distanceLabel = fallbackSpot ? `${fallbackSpot.distanceMeters}m` : '0m';

  return (
    <View style={styles.emptyMap}>
      <View style={styles.fallbackBackdrop} />
      <View style={styles.fallbackGrid} />

      <View style={styles.fallbackBadge}>
        <Ionicons name="location-outline" size={13} color={colors.ink} />
        <AppText variant="micro" tone="ink" numberOfLines={1}>
          서울시청 기준
        </AppText>
      </View>

      <View style={styles.fallbackStatus}>
        <AppText variant="captionBold" tone="ink" numberOfLines={1}>
          Kakao 지도 대기 중
        </AppText>
        {mapErrorMessage ? (
          <AppText variant="micro" tone="inkMuted" numberOfLines={1}>
            {mapErrorMessage}
          </AppText>
        ) : null}
      </View>

      <View style={styles.fallbackRadiusRingOuter} />
      <View style={styles.fallbackRadiusRingInner} />
      <View style={styles.fallbackRadiusCore} />
      <View style={styles.fallbackRadiusLabel}>
        <AppText variant="micro" tone="ink" numberOfLines={1}>
          {STAMP_RADIUS_METERS}m 반경
        </AppText>
      </View>

      <View style={styles.fallbackTarget}>
        <Ionicons name="location-sharp" size={25} color={colors.brand} />
        <View style={styles.fallbackTargetCopy}>
          <AppText variant="captionBold" tone="ink" numberOfLines={1}>
            {fallbackSpot ? fallbackSpot.title : '선택된 스팟 없음'}
          </AppText>
          <AppText variant="micro" tone="inkMuted" numberOfLines={1}>
            {fallbackSpot ? distanceLabel : '스팟을 불러오면 표시됩니다'}
          </AppText>
        </View>
      </View>

      <View style={styles.fallbackSpotStrip}>
        {previewSpots.length > 0 ? (
          previewSpots.map((spot) => (
            <View key={spot.contentId} style={styles.fallbackSpotChip}>
              <View
                style={[
                  styles.fallbackSpotDot,
                  spot.collected ? styles.fallbackSpotDotCollected : null,
                ]}
              />
              <AppText variant="micro" tone="ink" numberOfLines={1} style={styles.fallbackSpotText}>
                {spot.title}
              </AppText>
            </View>
          ))
        ) : (
          <AppText variant="micro" tone="inkMuted" numberOfLines={1}>
            스팟을 불러오는 중
          </AppText>
        )}
      </View>
    </View>
  );
}

function IconButton({
  color,
  icon,
  label,
  onPress,
}: {
  readonly color: string;
  readonly icon: React.ComponentProps<typeof Ionicons>['name'];
  readonly label: string;
  readonly onPress: () => void;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      onPress={onPress}
      style={styles.iconButton}
    >
      <Ionicons name={icon} size={19} color={color} />
    </Pressable>
  );
}

function PlaceThumb({ thumbnailUrl }: { readonly thumbnailUrl?: string }) {
  return (
    <View style={styles.placeThumb}>
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
      <View style={styles.categoryPill}>
        <AppText variant="micro" tone="onDark" numberOfLines={1}>
          고궁
        </AppText>
      </View>
    </View>
  );
}

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
    <View style={styles.fallbackRowMark}>
      {thumbnailUrl ? (
        <Image
          source={{ uri: thumbnailUrl }}
          style={styles.fallbackRowMarkImage}
          resizeMode="cover"
        />
      ) : (
        <View
          style={[styles.fallbackRowMarkFallback, collected ? styles.fallbackRowMarkDone : null]}
        >
          <AppText variant="captionBold" tone="ink" numberOfLines={1}>
            {String(index + 1).padStart(2, '0')}
          </AppText>
        </View>
      )}
    </View>
  );
}

const buildKakaoDirectionsUrl = (spot: MapSpotPin) => {
  const lat = spot.location.latitude;
  const lng = spot.location.longitude;
  return `https://map.kakao.com/link/to/${encodeURIComponent(spot.title)},${lat},${lng}`;
};

const getSpotStatusLabel = (spot: MapSpotPin) => {
  if (spot.collected) {
    return '수집 완료';
  }

  if (
    spot.verificationDistanceMeters !== null &&
    spot.verificationDistanceMeters <= STAMP_RADIUS_METERS
  ) {
    return `${STAMP_RADIUS_METERS}m 안에 있어요`;
  }

  return '인증 확인 필요';
};

const getSpotStatusBadgeLabel = (spot: MapSpotPin) => {
  if (spot.collected) {
    return '수집';
  }

  if (
    spot.verificationDistanceMeters !== null &&
    spot.verificationDistanceMeters <= STAMP_RADIUS_METERS
  ) {
    return '인증 가능';
  }

  return '이동 필요';
};

const getSpotStatusTone = (spot: MapSpotPin): 'done' | 'ready' | 'neutral' => {
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

const getLocationStatusLabel = (status: CurrentLocationStatus) => {
  switch (status) {
    case 'granted':
      return 'GPS 양호';
    case 'denied':
      return 'GPS 권한 필요';
    case 'loading':
      return 'GPS 확인 중';
    default:
      return 'GPS 확인 중';
  }
};

const resolveEffectiveSelectedSpotId = (
  spots: readonly MapSpotPin[],
  selectedSpotId: string | null,
  internalSelectedSpotId: string | null,
) => {
  const candidateSpotId = selectedSpotId ?? internalSelectedSpotId;

  if (candidateSpotId && spots.some((spot) => spot.contentId === candidateSpotId)) {
    return candidateSpotId;
  }

  return spots[0]?.contentId ?? null;
};

const resolveSelectedSpot = (spots: readonly MapSpotPin[], selectedSpotId: string | null) => {
  return spots.find((spot) => spot.contentId === selectedSpotId) ?? spots[0] ?? null;
};

type MapFilter = 'all' | 'palace' | 'uncollected';

const mapFilters: readonly { readonly key: MapFilter; readonly label: string }[] = [
  { key: 'all', label: '전체' },
  { key: 'palace', label: '고궁' },
  { key: 'uncollected', label: '미수집' },
];

const filterSpots = (spots: readonly MapSpotPin[], activeFilter: MapFilter) => {
  if (activeFilter === 'uncollected') {
    return spots.filter((spot) => !spot.collected);
  }

  if (activeFilter === 'palace') {
    return spots.filter((spot) => spot.title.includes('궁') || spot.title.includes('한옥'));
  }

  return spots;
};

const styles = StyleSheet.create({
  root: {
    flex: 1,
    position: 'relative',
    backgroundColor: colors.surface,
  },
  header: {
    minHeight: 48,
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.sm,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    backgroundColor: colors.surface,
    zIndex: 5,
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
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  mapArea: {
    flex: 1,
    minHeight: 360,
    position: 'relative',
    backgroundColor: colors.canvas,
  },
  emptyMap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xl,
    gap: spacing.sm,
    overflow: 'hidden',
  },
  fallbackBackdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#F5F1E8',
  },
  fallbackGrid: {
    ...StyleSheet.absoluteFillObject,
    opacity: 0.45,
    backgroundColor: 'transparent',
  },
  fallbackBadge: {
    position: 'absolute',
    top: spacing.md,
    left: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.sm,
    borderRadius: radius.full,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    zIndex: 2,
    ...shadow.e1,
  },
  fallbackStatus: {
    position: 'absolute',
    top: spacing.md,
    right: spacing.md,
    alignItems: 'flex-end',
    gap: 2,
    maxWidth: '52%',
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.sm,
    borderRadius: radius.md,
    backgroundColor: 'rgba(255,255,255,0.9)',
    borderWidth: 1,
    borderColor: colors.border,
    zIndex: 2,
  },
  fallbackRadiusRingOuter: {
    position: 'absolute',
    width: 198,
    height: 198,
    borderRadius: 99,
    top: '50%',
    left: '50%',
    marginLeft: -99,
    marginTop: -99,
    borderWidth: 1,
    borderColor: 'rgba(93, 117, 138, 0.26)',
    backgroundColor: 'rgba(255,255,255,0.3)',
  },
  fallbackRadiusRingInner: {
    position: 'absolute',
    width: 124,
    height: 124,
    borderRadius: 62,
    top: '50%',
    left: '50%',
    marginLeft: -62,
    marginTop: -62,
    borderWidth: 1,
    borderColor: 'rgba(94, 101, 164, 0.3)',
    backgroundColor: 'rgba(255,255,255,0.5)',
  },
  fallbackRadiusCore: {
    position: 'absolute',
    width: 18,
    height: 18,
    borderRadius: 9,
    top: '50%',
    left: '50%',
    marginLeft: -9,
    marginTop: -9,
    backgroundColor: colors.brand,
    borderWidth: 4,
    borderColor: 'rgba(255,255,255,0.9)',
  },
  fallbackRadiusLabel: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    marginLeft: -28,
    marginTop: 108,
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: radius.full,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  fallbackTarget: {
    position: 'absolute',
    left: spacing.lg,
    bottom: 96,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.sm,
    borderRadius: radius.md,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    ...shadow.e1,
  },
  fallbackTargetCopy: {
    minWidth: 0,
    gap: 1,
  },
  fallbackSpotStrip: {
    position: 'absolute',
    right: spacing.md,
    bottom: 96,
    gap: spacing.xs,
    alignItems: 'flex-end',
    maxWidth: '56%',
  },
  fallbackSpotChip: {
    minHeight: 28,
    maxWidth: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingVertical: 4,
    paddingHorizontal: spacing.sm,
    borderRadius: radius.full,
    backgroundColor: 'rgba(255,255,255,0.92)',
    borderWidth: 1,
    borderColor: colors.border,
  },
  fallbackSpotDot: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
    backgroundColor: colors.brand,
  },
  fallbackSpotDotCollected: {
    backgroundColor: colors.locationDot,
  },
  fallbackSpotText: {
    maxWidth: 120,
  },
  centerText: {
    textAlign: 'center',
  },
  filterRow: {
    position: 'absolute',
    top: spacing.md,
    left: spacing.md,
    flexDirection: 'row',
    gap: spacing.xs,
    zIndex: 3,
  },
  filterChip: {
    minHeight: 32,
    paddingHorizontal: spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radius.full,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  filterChipActive: {
    borderColor: colors.ink,
    backgroundColor: colors.ink,
  },
  mapControls: {
    position: 'absolute',
    top: spacing.md,
    right: spacing.md,
    gap: spacing.sm,
    zIndex: 3,
  },
  iconButton: {
    width: 38,
    height: 38,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    ...shadow.e1,
  },
  locationPill: {
    position: 'absolute',
    left: spacing.md,
    bottom: spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.sm,
    borderRadius: radius.full,
    backgroundColor: colors.surface,
    zIndex: 3,
    ...shadow.e1,
  },
  locationDot: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
    backgroundColor: colors.locationDot,
  },
  mapError: {
    position: 'absolute',
    left: spacing.md,
    right: spacing.md,
    bottom: spacing.xxxl,
    padding: spacing.sm,
    borderRadius: radius.md,
    backgroundColor: colors.surface,
    zIndex: 4,
  },
  sheet: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: 306,
    paddingTop: spacing.sm,
    paddingHorizontal: spacing.lg,
    paddingBottom: 78,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    borderTopWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    gap: spacing.md,
    zIndex: 6,
  },
  sheetExpanded: {
    height: '100%',
    borderTopLeftRadius: 0,
    borderTopRightRadius: 0,
    paddingTop: spacing.lg,
  },
  sheetGrabberTouch: {
    minHeight: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sheetGrabber: {
    width: 38,
    height: 4,
    borderRadius: 2,
    alignSelf: 'center',
    backgroundColor: colors.borderStrong,
  },
  sheetMain: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.md,
  },
  placeThumb: {
    width: 78,
    height: 78,
    borderRadius: 14,
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
    height: 32,
    backgroundColor: '#7FA86E',
  },
  thumbRoof: {
    position: 'absolute',
    left: 20,
    top: 30,
    width: 38,
    height: 38,
    backgroundColor: '#3E5C46',
    transform: [{ rotate: '45deg' }],
  },
  thumbWall: {
    position: 'absolute',
    left: 22,
    bottom: 16,
    width: 34,
    height: 16,
    backgroundColor: '#B4543A',
  },
  categoryPill: {
    position: 'absolute',
    top: 5,
    left: 5,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    backgroundColor: colors.brand,
  },
  sheetCopy: {
    flex: 1,
    minWidth: 0,
    gap: spacing.xs,
  },
  sheetTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
  badgeRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
    marginTop: spacing.xs,
  },
  sheetNotice: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
    backgroundColor: colors.canvas,
  },
  detailText: {
    color: colors.locationDot,
  },
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  routeButton: {
    width: 48,
    height: 48,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  fallbackList: {
    flexShrink: 1,
    gap: spacing.xs,
    paddingTop: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  fallbackListExpanded: {
    flex: 1,
    minHeight: 0,
  },
  fallbackListScroller: {
    flex: 1,
    minHeight: 0,
  },
  fallbackListContent: {
    gap: spacing.xs,
    paddingBottom: spacing.sm,
  },
  fallbackListHeader: {
    minHeight: 42,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.md,
  },
  fallbackListHeaderCopy: {
    flex: 1,
    minWidth: 0,
    gap: 2,
  },
  fallbackListCount: {
    minHeight: 28,
    paddingHorizontal: spacing.sm,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radius.full,
    backgroundColor: colors.surfaceSink,
  },
  fallbackRow: {
    minHeight: 58,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  fallbackRowSelected: {
    borderColor: colors.brand,
    backgroundColor: colors.brandSoft,
  },
  fallbackRowMark: {
    width: 40,
    height: 40,
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: colors.surfaceSink,
  },
  fallbackRowMarkImage: {
    width: '100%',
    height: '100%',
  },
  fallbackRowMarkFallback: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#EFE7D6',
  },
  fallbackRowMarkDone: {
    backgroundColor: '#E7F7EE',
  },
  fallbackRowCopy: {
    flex: 1,
    minWidth: 0,
    gap: 2,
  },
  fallbackRowTitleLine: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  fallbackDot: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
    backgroundColor: colors.brand,
  },
  fallbackTitle: {
    flex: 1,
    minWidth: 0,
  },
  pressed: {
    opacity: 0.86,
  },
});
