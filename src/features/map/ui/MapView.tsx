import { useMemo, useState } from 'react';
import { Linking, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { CurrentLocationStatus } from '@core/location';
import { STAMP_RADIUS_METERS } from '@shared/config';
import type { Coordinates } from '@shared/types';
import { AppText, Button, Surface, colors, radius, spacing } from '@shared/ui';
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
            <AppText variant="h1">주변 스탬프 지도</AppText>
            <AppText variant="caption" tone="inkMuted">
              Kakao Map + 관광공사 API · 위치 {locationStatus}
            </AppText>
          </View>
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
              <View style={styles.mapHint}>
                <AppText variant="micro" style={styles.mapHintText}>
                  파란 핀은 현재 위치, 붉은 핀은 선택된 스팟이에요
                </AppText>
              </View>
              {mapErrorMessage ? (
                <View style={styles.mapOverlay}>
                  <Surface elevation="e1" radius="md" style={styles.overlayCard}>
                    <AppText variant="h3">지도를 불러오지 못했어요</AppText>
                    <AppText variant="caption" tone="inkMuted">
                      {mapErrorMessage}
                    </AppText>
                  </Surface>
                </View>
              ) : null}
            </View>
          ) : (
            <Surface elevation="e1" radius="md" style={styles.emptyMapState}>
              <AppText variant="h3">지도 설정이 필요해요</AppText>
              <AppText variant="body" tone="inkMuted">
                EXPO_PUBLIC_KAKAO_JS_KEY가 없어서 Kakao Maps WebView를 띄울 수 없어요.
              </AppText>
            </Surface>
          )}
        </View>

        {selectedSpot ? (
          <Surface elevation="e1" radius="lg" style={styles.sheet}>
            <View style={styles.selectedRow}>
              <View style={styles.selectedText}>
                <AppText variant="micro" tone="brand">
                  선택한 스팟
                </AppText>
                <AppText variant="h2">{selectedSpot.title}</AppText>
                <AppText variant="caption" tone="inkMuted">
                  현재 위치에서 {selectedSpot.distanceMeters}m · 반경 {STAMP_RADIUS_METERS}m
                </AppText>
              </View>
              <View
                style={[
                  styles.statusBadge,
                  getSpotStatus(selectedSpot) === 'collected'
                    ? styles.statusDone
                    : getSpotStatus(selectedSpot) === 'ready'
                      ? styles.statusReady
                      : styles.statusPending,
                ]}
              >
                <AppText
                  variant="micro"
                  style={
                    getSpotStatus(selectedSpot) === 'collected'
                      ? styles.statusBadgeTextDone
                      : getSpotStatus(selectedSpot) === 'ready'
                        ? styles.statusBadgeTextReady
                        : styles.statusBadgeTextPending
                  }
                >
                  {getSpotStatusLabel(selectedSpot)}
                </AppText>
              </View>
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

            <View style={styles.feedbackCard}>
              <AppText variant="caption" tone="inkMuted">
                선택 상태
              </AppText>
              <AppText variant="bodyBold">{directionMessage}</AppText>
            </View>
          </Surface>
        ) : null}

        <View style={styles.sectionHead}>
          <AppText variant="h2">스팟 목록</AppText>
          <AppText variant="caption" tone="inkMuted">
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
                style={({ pressed }) => [pressed ? styles.pressed : null]}
              >
                <Surface
                  elevation="none"
                  radius="md"
                  style={[styles.listItem, isSelected ? styles.listItemSelected : null]}
                >
                  <AppText variant="h3" style={styles.listIndex}>
                    {index + 1}
                  </AppText>
                  <View style={styles.listText}>
                    <AppText variant="h3">{spot.title}</AppText>
                    <AppText variant="caption" tone="inkMuted">
                      {spot.address}
                    </AppText>
                    <AppText variant="caption" tone="brand" style={styles.listDistance}>
                      {spot.distanceMeters}m 떨어짐
                    </AppText>
                  </View>
                  <View
                    style={[
                      styles.listBadge,
                      status === 'collected'
                        ? styles.statusDone
                        : status === 'ready'
                          ? styles.statusReady
                          : styles.statusPending,
                    ]}
                  >
                    <AppText
                      variant="micro"
                      style={
                        status === 'collected'
                          ? styles.statusBadgeTextDone
                          : status === 'ready'
                            ? styles.statusBadgeTextReady
                            : styles.statusBadgeTextPending
                      }
                    >
                      {getSpotStatusLabel(spot)}
                    </AppText>
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
    return '도장 가능';
  }

  return '방문 전';
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
  root: { flex: 1, backgroundColor: colors.canvas },
  content: {
    paddingHorizontal: spacing.xl,
    paddingBottom: spacing.xxl,
    gap: spacing.lg,
    paddingTop: spacing.md,
  },
  topbar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: spacing.md,
  },
  brandBlock: {
    flex: 1,
    gap: spacing.xs,
  },
  mapShell: {
    gap: spacing.xs,
  },
  mapCanvas: {
    height: 310,
    overflow: 'hidden',
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surfaceSink,
    position: 'relative',
  },
  mapHint: {
    position: 'absolute',
    left: spacing.md,
    bottom: spacing.md,
    right: spacing.md,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: radius.full,
    backgroundColor: 'rgba(15, 23, 42, 0.72)',
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
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
  },
  overlayCard: {
    width: '100%',
    gap: spacing.xs,
  },
  emptyMapState: {
    minHeight: 310,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.lg,
    gap: spacing.sm,
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
    gap: spacing.xs,
  },
  statusBadge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: radius.full,
    alignSelf: 'flex-start',
  },
  statusDone: {
    backgroundColor: colors.brandSoft,
  },
  statusReady: {
    backgroundColor: colors.rewardSoft,
  },
  statusPending: {
    backgroundColor: colors.surfaceSink,
  },
  statusBadgeTextDone: {
    color: colors.brandInk,
  },
  statusBadgeTextReady: {
    color: '#9A6A00',
  },
  statusBadgeTextPending: {
    color: colors.inkMuted,
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
  listItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.md,
    padding: spacing.md,
    backgroundColor: colors.surface,
    borderRadius: radius.md,
  },
  listItemSelected: {
    borderWidth: 1,
    borderColor: colors.brandSoft,
  },
  listIndex: {
    width: 26,
    textAlign: 'center',
    color: colors.brand,
  },
  listText: {
    flex: 1,
    gap: spacing.xs,
  },
  listDistance: {
    marginTop: spacing.xs / 2,
  },
  listBadge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: radius.full,
  },
  pressed: {
    opacity: 0.8,
  },
});
