import { useMemo, useState } from 'react';
import { Linking, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { CurrentLocationStatus } from '@core/location';
import { STAMP_RADIUS_METERS } from '@shared/config';
import type { Coordinates } from '@shared/types';
import { AppText, Badge, Button, Surface, colors, radius, spacing } from '@shared/ui';
import type { MapSpotPin } from '../model';
import { KakaoMapWebView } from './KakaoMapWebView';

interface MapViewProps {
  readonly kakaoJsKey: string;
  readonly spots: readonly MapSpotPin[];
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
  const [directionMessage, setDirectionMessage] = useState('카카오 길찾기를 눌러 보세요');
  const [mapErrorMessage, setMapErrorMessage] = useState<string | null>(null);

  const effectiveSelectedSpotId = resolveEffectiveSelectedSpotId(
    spots,
    selectedSpotId,
    internalSelectedSpotId,
  );

  const selectedSpot = useMemo(() => {
    return resolveSelectedSpot(spots, effectiveSelectedSpotId);
  }, [effectiveSelectedSpotId, spots]);

  const handleSelectSpot = (contentId: string) => {
    setInternalSelectedSpotId(contentId);
    const nextSpot = spots.find((spot) => spot.contentId === contentId) ?? null;
    setDirectionMessage(nextSpot ? `${nextSpot.title} 선택됨` : '카카오 길찾기를 눌러 보세요');
    onSelectSpot?.(contentId);
  };

  const handleOpenDirections = async () => {
    if (!selectedSpot) {
      return;
    }

    const url = buildKakaoDirectionsUrl(selectedSpot);

    try {
      setDirectionMessage(`${selectedSpot.title} 카카오맵 열기`);
      await Linking.openURL(url);
    } catch {
      setDirectionMessage('카카오맵을 열지 못했습니다');
    }
  };

  return (
    <SafeAreaView style={styles.root}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.topbar}>
          <View style={styles.brandBlock}>
            <AppText variant="micro" tone="brand" numberOfLines={1}>
              지도
            </AppText>
            <AppText variant="h1" tone="ink" numberOfLines={1}>
              주변 스탬프 지도
            </AppText>
            <AppText variant="caption" tone="inkMuted" numberOfLines={2}>
              Kakao WebView · 위치 상태 {locationStatus}
            </AppText>
          </View>
          <Badge tone="neutral" size="sm">
            {spots.length}곳
          </Badge>
        </View>

        <View style={styles.mapShell}>
          {kakaoJsKey.trim() ? (
            <View style={styles.mapCanvas}>
              <KakaoMapWebView
                kakaoJsKey={kakaoJsKey}
                spots={spots}
                selectedSpotId={effectiveSelectedSpotId}
                currentLocation={currentLocation}
                onMarkerTap={handleSelectSpot}
                onMapReady={() => setMapErrorMessage(null)}
                onMapError={setMapErrorMessage}
              />
              <View style={styles.mapChips}>
                <Badge tone="brand" size="sm">
                  Kakao WebView
                </Badge>
                <Badge tone="neutral" size="sm">
                  {getLocationStatusLabel(locationStatus)}
                </Badge>
              </View>
              <View style={styles.mapHint}>
                <AppText variant="micro" tone="onDark" style={styles.mapHintText} numberOfLines={2}>
                  파란 핀은 현재 위치, 붉은 핀은 선택된 스팟이에요.
                </AppText>
              </View>
              {mapErrorMessage ? (
                <View style={styles.mapOverlay}>
                  <Surface elevation="e1" radius="lg" style={styles.overlayCard}>
                    <AppText variant="h3" tone="ink" numberOfLines={1}>
                      지도를 불러오지 못했어요
                    </AppText>
                    <AppText variant="caption" tone="inkMuted" numberOfLines={3}>
                      {mapErrorMessage}
                    </AppText>
                  </Surface>
                </View>
              ) : null}
            </View>
          ) : (
            <Surface elevation="e1" radius="lg" style={styles.emptyMapState}>
              <AppText variant="h3" tone="ink" numberOfLines={1}>
                지도 설정이 필요해요
              </AppText>
              <AppText variant="body" tone="inkMuted" style={styles.emptyMapText} numberOfLines={3}>
                EXPO_PUBLIC_KAKAO_JS_KEY가 없어서 Kakao Maps WebView를 띄울 수 없어요.
              </AppText>
            </Surface>
          )}
        </View>

        {selectedSpot ? (
          <Surface elevation="e1" radius="lg" style={styles.sheet}>
            <View style={styles.selectedRow}>
              <View style={styles.selectedText}>
                <Badge tone="brand" size="sm">
                  선택한 스팟
                </Badge>
                <AppText variant="h2" tone="ink" numberOfLines={1}>
                  {selectedSpot.title}
                </AppText>
                <AppText variant="caption" tone="inkMuted" numberOfLines={2}>
                  현재 위치에서 {selectedSpot.distanceMeters}m · 반경 {STAMP_RADIUS_METERS}m
                </AppText>
              </View>
              <Badge tone={getSpotStatusTone(selectedSpot)} size="md">
                {getSpotStatusLabel(selectedSpot)}
              </Badge>
            </View>

            <View style={styles.actionRow}>
              <Button
                variant="primary"
                size="md"
                fullWidth
                onPress={() => onOpenStamp?.(selectedSpot.contentId)}
                accessibilityLabel={`${selectedSpot.title} 도장 탭에서 찍기`}
              >
                도장 탭에서 찍기
              </Button>

              <Button
                variant="secondary"
                size="md"
                fullWidth
                onPress={() => onOpenSpotDetail?.(selectedSpot.contentId)}
                accessibilityLabel={`${selectedSpot.title} 상세 보기`}
              >
                상세 보기
              </Button>

              <Button
                variant="ghost"
                size="md"
                fullWidth
                onPress={handleOpenDirections}
                accessibilityLabel={`${selectedSpot.title} 카카오 길찾기`}
              >
                카카오 길찾기
              </Button>
            </View>

            <Surface elevation="none" radius="md" style={styles.feedbackCard}>
              <AppText variant="caption" tone="inkMuted" numberOfLines={1}>
                선택 상태
              </AppText>
              <AppText variant="bodyBold" tone="ink" numberOfLines={2}>
                {directionMessage}
              </AppText>
            </Surface>
          </Surface>
        ) : null}

        <View style={styles.sectionHead}>
          <AppText variant="h2" tone="ink" numberOfLines={1}>
            스팟 목록
          </AppText>
          <AppText variant="caption" tone="inkMuted" numberOfLines={2}>
            홈과 도장 탭의 동일한 mock 데이터
          </AppText>
        </View>

        <View style={styles.list}>
          {spots.map((spot, index) => {
            const isSelected = spot.contentId === selectedSpot?.contentId;
            const status = getSpotStatus(spot);

            return (
              <Pressable
                key={spot.contentId}
                accessibilityRole="button"
                accessibilityLabel={`${spot.title} 지도 목록 선택`}
                onPress={() => handleSelectSpot(spot.contentId)}
                style={({ pressed }) => [styles.listPressable, pressed ? styles.pressed : null]}
              >
                <Surface
                  elevation="none"
                  radius="lg"
                  style={[styles.listItem, isSelected ? styles.listItemSelected : null]}
                >
                  <View style={styles.listIndexWrap}>
                    <AppText variant="captionBold" tone="ink" numberOfLines={1}>
                      {index + 1}
                    </AppText>
                  </View>
                  <View style={styles.listText}>
                    <AppText variant="h3" tone="ink" numberOfLines={1}>
                      {spot.title}
                    </AppText>
                    <AppText variant="caption" tone="inkMuted" numberOfLines={2}>
                      {spot.address}
                    </AppText>
                    <View style={styles.listMetaRow}>
                      <Badge tone="neutral" size="sm">
                        {spot.distanceMeters}m
                      </Badge>
                      <Badge
                        tone={
                          status === 'collected' ? 'done' : status === 'ready' ? 'ready' : 'neutral'
                        }
                        size="sm"
                      >
                        {getSpotStatusLabel(spot)}
                      </Badge>
                    </View>
                  </View>
                </Surface>
              </Pressable>
            );
          })}
        </View>
      </ScrollView>
    </SafeAreaView>
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

  if (spot.distanceMeters <= STAMP_RADIUS_METERS) {
    return '반경 안';
  }

  return '인증 확인 필요';
};

const getSpotStatus = (spot: MapSpotPin): 'collected' | 'ready' | 'pending' => {
  if (spot.collected) {
    return 'collected';
  }

  if (spot.distanceMeters <= STAMP_RADIUS_METERS) {
    return 'ready';
  }

  return 'pending';
};

const getSpotStatusTone = (spot: MapSpotPin): 'done' | 'ready' | 'neutral' => {
  if (spot.collected) {
    return 'done';
  }

  if (spot.distanceMeters <= STAMP_RADIUS_METERS) {
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

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.canvas,
  },
  content: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
    paddingBottom: spacing.xxxl,
    gap: spacing.lg,
  },
  topbar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: spacing.md,
  },
  brandBlock: {
    flex: 1,
    minWidth: 0,
    gap: spacing.xs,
  },
  mapShell: {
    gap: spacing.xs,
  },
  mapCanvas: {
    height: 330,
    overflow: 'hidden',
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surfaceSink,
    position: 'relative',
  },
  mapChips: {
    position: 'absolute',
    top: spacing.md,
    left: spacing.md,
    right: spacing.md,
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: spacing.sm,
    zIndex: 2,
  },
  mapHint: {
    position: 'absolute',
    left: spacing.md,
    right: spacing.md,
    bottom: spacing.md,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs + 1,
    borderRadius: radius.full,
    backgroundColor: 'rgba(17, 32, 51, 0.74)',
    zIndex: 2,
  },
  mapHintText: {
    color: colors.surface,
  },
  mapOverlay: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.lg,
    backgroundColor: 'rgba(255, 255, 255, 0.28)',
    zIndex: 3,
  },
  overlayCard: {
    width: '100%',
    gap: spacing.xs,
  },
  emptyMapState: {
    minHeight: 330,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.lg,
    gap: spacing.sm,
  },
  emptyMapText: {
    textAlign: 'center',
  },
  sheet: {
    gap: spacing.md,
    padding: spacing.lg,
  },
  selectedRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: spacing.md,
  },
  selectedText: {
    flex: 1,
    minWidth: 0,
    gap: spacing.xs,
  },
  actionRow: {
    gap: spacing.sm,
  },
  feedbackCard: {
    gap: spacing.xs,
  },
  sectionHead: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
  list: {
    gap: spacing.sm,
  },
  listPressable: {
    minWidth: 0,
  },
  listItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.md,
    padding: spacing.md,
    backgroundColor: colors.surface,
  },
  listItemSelected: {
    borderWidth: 1,
    borderColor: colors.borderStrong,
  },
  listIndexWrap: {
    width: 40,
    height: 40,
    borderRadius: radius.full,
    backgroundColor: colors.surfaceSink,
    alignItems: 'center',
    justifyContent: 'center',
  },
  listText: {
    flex: 1,
    minWidth: 0,
    gap: spacing.xs,
  },
  listMetaRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
  },
  pressed: {
    opacity: 0.82,
  },
});
