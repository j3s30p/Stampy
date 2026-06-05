import { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { STAMP_RADIUS_METERS } from '@shared/config';
import { AppText, Gradient, Surface, colors, radius, shadow, spacing } from '@shared/ui';

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
            <AppText variant="caption" tone="inkSoft">
              Kakao Map + 관광공사 API
            </AppText>
          </View>
          <View style={styles.avatar}>
            <AppText variant="h3" tone="onDark">
              ⌕
            </AppText>
          </View>
        </View>

        <Gradient variant="mapSky" style={styles.mapShell}>
          <View style={styles.gridLineHorizontal} />
          <View style={styles.gridLineVertical} />
          <View style={styles.roadHorizontal} />
          <View style={styles.roadDiagonalOne} />
          <View style={styles.roadDiagonalTwo} />

          {spots.map((spot, index) => {
            const pinPosition = pinPositions[index % pinPositions.length]!;
            const isSelected = spot.contentId === selectedSpot?.contentId;

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
                  getSpotStatus(spot) === 'collected'
                    ? styles.pinCollected
                    : getSpotStatus(spot) === 'ready'
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
              도장 가능한 스팟은 노란 핀으로 표시돼요
            </AppText>
          </View>
        </Gradient>

        {selectedSpot ? (
          <Surface elevation="e2" radius="lg" style={styles.sheet}>
            <View style={styles.selectedRow}>
              <View style={styles.selectedText}>
                <AppText variant="micro" tone="brand">
                  선택한 스팟
                </AppText>
                <AppText variant="h2">{selectedSpot.title}</AppText>
                <AppText variant="caption" tone="inkSoft">
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
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={`${selectedSpot.title} 상세 보기`}
                onPress={() => onOpenSpotDetail?.(selectedSpot.contentId)}
                style={({ pressed }) => [styles.secondaryButton, pressed ? styles.pressed : null]}
              >
                <AppText variant="bodyBold" style={styles.secondaryButtonText}>
                  상세 보기
                </AppText>
              </Pressable>

              <Pressable
                accessibilityRole="button"
                accessibilityLabel={`${selectedSpot.title} 도장 탭에서 찍기`}
                onPress={() => onOpenStamp?.(selectedSpot.contentId)}
                style={({ pressed }) => [styles.primaryButton, pressed ? styles.pressed : null]}
              >
                <AppText variant="bodyBold" style={styles.primaryButtonText}>
                  도장 탭에서 찍기
                </AppText>
              </Pressable>

              <Pressable
                accessibilityRole="button"
                accessibilityLabel={`${selectedSpot.title} 카카오 길찾기`}
                onPress={() => setDirectionMessage(`${selectedSpot.title} 카카오 길찾기 준비 중`)}
                style={({ pressed }) => [styles.secondaryButton, pressed ? styles.pressed : null]}
              >
                <AppText variant="bodyBold" style={styles.secondaryButtonText}>
                  카카오 길찾기
                </AppText>
              </Pressable>
            </View>

            <View style={styles.feedbackCard}>
              <AppText variant="caption" tone="inkSoft">
                선택 상태
              </AppText>
              <AppText variant="bodyBold">{directionMessage}</AppText>
            </View>
          </Surface>
        ) : null}

        <View style={styles.sectionHead}>
          <AppText variant="h2">스팟 목록</AppText>
          <AppText variant="caption" tone="inkSoft">
            홈과 도장 탭의 동일한 mock 데이터
          </AppText>
        </View>

        <View style={styles.list}>
          {spots.map((spot, index) => {
            const isSelected = spot.contentId === selectedSpot?.contentId;

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
                  elevation="e1"
                  radius="md"
                  style={[styles.listItem, isSelected ? styles.listItemSelected : null]}
                >
                  <AppText variant="h3" style={styles.listIndex}>
                    {index + 1}
                  </AppText>
                  <View style={styles.listText}>
                    <AppText variant="h3">{spot.title}</AppText>
                    <AppText variant="caption" tone="inkSoft">
                      {spot.address}
                    </AppText>
                    <AppText variant="caption" tone="brand" style={styles.listDistance}>
                      {spot.distanceMeters}m 떨어짐
                    </AppText>
                  </View>
                  <View
                    style={[
                      styles.listBadge,
                      getSpotStatus(spot) === 'collected'
                        ? styles.statusDone
                        : getSpotStatus(spot) === 'ready'
                          ? styles.statusReady
                          : styles.statusPending,
                    ]}
                  >
                    <AppText
                      variant="micro"
                      style={
                        getSpotStatus(spot) === 'collected'
                          ? styles.statusBadgeTextDone
                          : getSpotStatus(spot) === 'ready'
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
  root: { flex: 1, backgroundColor: colors.surfaceAlt },
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
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.brandDeep,
    alignItems: 'center',
    justifyContent: 'center',
  },
  mapShell: {
    height: 460,
    borderRadius: radius.xl,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#C7D9E4',
  },
  gridLineHorizontal: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: '52%',
    height: 2,
    backgroundColor: 'rgba(255,255,255,0.76)',
  },
  gridLineVertical: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: '48%',
    width: 2,
    backgroundColor: 'rgba(255,255,255,0.76)',
  },
  roadHorizontal: {
    position: 'absolute',
    left: -24,
    right: -24,
    top: '39%',
    height: 20,
    borderRadius: radius.pill,
    backgroundColor: 'rgba(255,255,255,0.82)',
    transform: [{ rotate: '-16deg' }],
  },
  roadDiagonalOne: {
    position: 'absolute',
    width: 430,
    height: 18,
    left: -18,
    top: '64%',
    borderRadius: radius.pill,
    backgroundColor: 'rgba(255,255,255,0.82)',
    transform: [{ rotate: '31deg' }],
  },
  roadDiagonalTwo: {
    position: 'absolute',
    width: 300,
    height: 16,
    left: 14,
    top: '18%',
    borderRadius: radius.pill,
    backgroundColor: 'rgba(255,255,255,0.72)',
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
    ...shadow.e2,
  },
  pinCollected: { borderColor: colors.success },
  pinReady: { borderColor: colors.warning },
  pinPending: { borderColor: colors.inkMuted },
  pinSelected: { backgroundColor: colors.goldSoft },
  pinText: { fontSize: 16 },
  currentLocation: {
    position: 'absolute',
    left: 18,
    bottom: 18,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.ink,
    borderRadius: radius.pill,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  currentDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#6EA8FF',
    borderWidth: 2,
    borderColor: colors.surface,
  },
  mapHint: {
    position: 'absolute',
    top: 16,
    left: 16,
    backgroundColor: 'rgba(255,255,255,0.9)',
    borderRadius: radius.pill,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  mapHintText: { color: colors.inkSoft },
  sheet: {
    padding: spacing.lg,
    gap: spacing.md,
  },
  selectedRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  selectedText: { flex: 1, minWidth: 0, gap: spacing.xs },
  statusBadge: {
    borderRadius: radius.pill,
    paddingHorizontal: spacing.sm + 2,
    paddingVertical: spacing.sm - 2,
  },
  statusDone: { backgroundColor: colors.successSoft },
  statusReady: { backgroundColor: colors.warningSoft },
  statusPending: { backgroundColor: colors.surfaceSink },
  statusBadgeTextDone: { color: colors.success },
  statusBadgeTextReady: { color: colors.warning },
  statusBadgeTextPending: { color: colors.inkSoft },
  actionRow: { gap: spacing.sm + 2 },
  primaryButton: {
    backgroundColor: colors.brand,
    borderRadius: radius.lg,
    height: 52,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryButtonText: { color: colors.surface },
  secondaryButton: {
    backgroundColor: colors.surfaceSink,
    borderRadius: radius.lg,
    height: 52,
    alignItems: 'center',
    justifyContent: 'center',
  },
  secondaryButtonText: { color: colors.brand },
  feedbackCard: {
    backgroundColor: colors.surfaceAlt,
    borderRadius: radius.xs,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
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
  listItemSelected: { borderColor: colors.warning, backgroundColor: '#FFFDF7' },
  listIndex: { width: 28, color: colors.brand, textAlign: 'center' },
  listText: { flex: 1, minWidth: 0, gap: spacing.xs },
  listDistance: { fontWeight: '800' },
  listBadge: {
    borderRadius: radius.pill,
    paddingHorizontal: spacing.sm + 1,
    paddingVertical: spacing.xs + 1,
  },
  pressed: { opacity: 0.85 },
});
