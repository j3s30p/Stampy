import { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { STAMP_RADIUS_METERS } from '@shared/config';
import { AppText, Button, Surface, colors, radius, shadow, spacing } from '@shared/ui';

export interface MapSpotPin {
  readonly contentId: string;
  readonly title: string;
  readonly address: string;
  readonly distanceMeters: number;
  readonly collected: boolean;
}

interface MapViewProps {
  readonly spots: readonly MapSpotPin[];
  readonly onOpenSpotDetail?: (contentId: string) => void;
  readonly onOpenStamp?: (contentId: string) => void;
}

export function MapView({ spots, onOpenSpotDetail, onOpenStamp }: MapViewProps) {
  const [selectedSpotId, setSelectedSpotId] = useState<string | null>(spots[0]?.contentId ?? null);
  const [directionMessage, setDirectionMessage] = useState('카카오 길찾기를 눌러 보세요');

  const selectedSpot = useMemo(() => {
    return spots.find((spot) => spot.contentId === selectedSpotId) ?? spots[0] ?? null;
  }, [selectedSpotId, spots]);

  const pinPositions = [
    { left: 18, top: 24 },
    { left: 56, top: 38 },
    { left: 28, top: 64 },
    { left: 68, top: 72 },
  ];

  return (
    <SafeAreaView style={styles.root}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.topbar}>
          <View style={styles.brandBlock}>
            <AppText variant="h1">주변 스탬프 지도</AppText>
            <AppText variant="caption" tone="inkMuted">
              Kakao Map + 관광공사 API
            </AppText>
          </View>
        </View>

        {/* Map shell — white canvas bg, border, no gradient */}
        <View style={styles.mapShell}>
          {/* Fake road lines */}
          <View style={styles.gridLineHorizontal} />
          <View style={styles.gridLineVertical} />
          <View style={styles.roadHorizontal} />
          <View style={styles.roadDiagonalOne} />
          <View style={styles.roadDiagonalTwo} />

          {spots.map((spot, index) => {
            const pinPosition = pinPositions[index % pinPositions.length]!;
            const isSelected = spot.contentId === selectedSpot?.contentId;
            const status = getSpotStatus(spot);

            return (
              <Pressable
                key={spot.contentId}
                accessibilityRole="button"
                accessibilityLabel={`${spot.title} 지도 핀 선택`}
                onPress={() => {
                  setSelectedSpotId(spot.contentId);
                  setDirectionMessage(`${spot.title} 선택됨`);
                }}
                style={[
                  styles.pin,
                  status === 'collected'
                    ? styles.pinCollected
                    : status === 'ready'
                      ? styles.pinReady
                      : styles.pinPending,
                  isSelected ? styles.pinSelected : null,
                  { left: `${pinPosition.left}%`, top: `${pinPosition.top}%` },
                ]}
              >
                <AppText style={styles.pinText}>{getSpotIcon(index)}</AppText>
              </Pressable>
            );
          })}

          <View style={styles.currentLocation}>
            <View style={styles.currentDot} />
            <AppText variant="micro" tone="onDark">
              현재 위치
            </AppText>
          </View>

          <View style={styles.mapHint}>
            <AppText variant="micro" style={styles.mapHintText}>
              도장 가능한 스팟은 빨간 핀으로 표시돼요
            </AppText>
          </View>
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
                onPress={() => setDirectionMessage(`${selectedSpot.title} 카카오 길찾기 준비 중`)}
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
                onPress={() => {
                  setSelectedSpotId(spot.contentId);
                  setDirectionMessage(`${spot.title} 선택됨`);
                }}
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

const getSpotIcon = (index: number) => {
  if (index === 0) {
    return '🏯';
  }

  if (index === 1) {
    return '🎪';
  }

  return '🌳';
};

const getSpotStatus = (spot: MapSpotPin) => {
  if (spot.collected) {
    return 'collected' as const;
  }

  if (spot.distanceMeters <= STAMP_RADIUS_METERS) {
    return 'ready' as const;
  }

  return 'outside' as const;
};

const getSpotStatusLabel = (spot: MapSpotPin) => {
  const status = getSpotStatus(spot);

  if (status === 'collected') {
    return '수집 완료';
  }

  if (status === 'ready') {
    return '도장 가능';
  }

  return '가까이 이동 필요';
};

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.canvas },
  content: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
    paddingBottom: spacing.xxxl,
    gap: spacing.md,
  },
  topbar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.md,
  },
  brandBlock: { flex: 1, minWidth: 0, gap: 2 },
  mapShell: {
    height: 460,
    borderRadius: radius.xl,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  gridLineHorizontal: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: '52%',
    height: 2,
    backgroundColor: colors.surfaceSink,
  },
  gridLineVertical: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: '48%',
    width: 2,
    backgroundColor: colors.surfaceSink,
  },
  roadHorizontal: {
    position: 'absolute',
    left: -24,
    right: -24,
    top: '39%',
    height: 20,
    borderRadius: radius.full,
    backgroundColor: colors.border,
    transform: [{ rotate: '-16deg' }],
  },
  roadDiagonalOne: {
    position: 'absolute',
    width: 430,
    height: 18,
    left: -18,
    top: '64%',
    borderRadius: radius.full,
    backgroundColor: colors.border,
    transform: [{ rotate: '31deg' }],
  },
  roadDiagonalTwo: {
    position: 'absolute',
    width: 300,
    height: 16,
    left: 14,
    top: '18%',
    borderRadius: radius.full,
    backgroundColor: colors.border,
    transform: [{ rotate: '64deg' }],
  },
  pin: {
    position: 'absolute',
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    backgroundColor: colors.surface,
    ...shadow.e1,
  },
  // collected = border ink
  pinCollected: { borderColor: colors.ink },
  // ready = border brand + bg brandSoft
  pinReady: { borderColor: colors.brand, backgroundColor: colors.brandSoft },
  // pending = border inkSubtle
  pinPending: { borderColor: colors.inkSubtle },
  pinSelected: { borderWidth: 3 },
  pinText: { fontSize: 16 },
  currentLocation: {
    position: 'absolute',
    left: 18,
    bottom: 18,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.ink,
    borderRadius: radius.full,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  currentDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: colors.locationDot,
    borderWidth: 2,
    borderColor: colors.surface,
  },
  mapHint: {
    position: 'absolute',
    top: 16,
    left: 16,
    backgroundColor: 'rgba(255,255,255,0.92)',
    borderRadius: radius.full,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
  },
  mapHintText: { color: colors.inkSoft },
  sheet: {
    padding: spacing.lg,
    gap: spacing.md,
  },
  selectedRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  selectedText: { flex: 1, minWidth: 0, gap: spacing.xs },
  statusBadge: {
    borderRadius: radius.full,
    paddingHorizontal: spacing.sm + 2,
    paddingVertical: spacing.sm - 2,
  },
  statusDone: { backgroundColor: colors.surfaceSink },
  statusReady: { backgroundColor: colors.brandSoft },
  statusPending: { backgroundColor: colors.surfaceSink },
  statusBadgeTextDone: { color: colors.inkSoft },
  statusBadgeTextReady: { color: colors.brandInk },
  statusBadgeTextPending: { color: colors.inkMuted },
  actionRow: { gap: spacing.sm + 2 },
  feedbackCard: {
    backgroundColor: colors.surfaceSink,
    borderRadius: radius.xs,
    padding: spacing.md,
    gap: spacing.xs,
  },
  sectionHead: { gap: spacing.xs },
  list: { gap: spacing.sm + 2 },
  listItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    padding: spacing.md,
  },
  listItemSelected: { borderColor: colors.borderStrong, backgroundColor: colors.brandSoft },
  listIndex: { width: 28, color: colors.brand, textAlign: 'center' },
  listText: { flex: 1, minWidth: 0, gap: spacing.xs },
  listDistance: { fontWeight: '800' },
  listBadge: {
    borderRadius: radius.full,
    paddingHorizontal: spacing.sm + 1,
    paddingVertical: spacing.xs + 1,
  },
  pressed: { opacity: 0.85 },
});
