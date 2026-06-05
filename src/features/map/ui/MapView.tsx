import { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { STAMP_RADIUS_METERS } from '@shared/config';

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
            <Text style={styles.brand}>주변 스탬프 지도</Text>
            <Text style={styles.brandCaption}>Kakao Map + 관광공사 API</Text>
          </View>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>⌕</Text>
          </View>
        </View>

        <View style={styles.mapShell}>
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
                <Text style={styles.pinText}>{getSpotIcon(index)}</Text>
              </Pressable>
            );
          })}

          <View style={styles.currentLocation}>
            <View style={styles.currentDot} />
            <Text style={styles.currentLocationText}>현재 위치</Text>
          </View>

          <View style={styles.mapHint}>
            <Text style={styles.mapHintText}>도장 가능한 스팟은 노란 핀으로 표시돼요</Text>
          </View>
        </View>

        {selectedSpot ? (
          <View style={styles.sheet}>
            <View style={styles.selectedRow}>
              <View style={styles.selectedText}>
                <Text style={styles.selectedLabel}>선택한 스팟</Text>
                <Text style={styles.selectedTitle}>{selectedSpot.title}</Text>
                <Text style={styles.selectedMeta}>
                  현재 위치에서 {selectedSpot.distanceMeters}m · 반경 {STAMP_RADIUS_METERS}m
                </Text>
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
                <Text
                  style={[
                    styles.statusBadgeText,
                    getSpotStatus(selectedSpot) === 'collected'
                      ? styles.statusBadgeTextDone
                      : getSpotStatus(selectedSpot) === 'ready'
                        ? styles.statusBadgeTextReady
                        : styles.statusBadgeTextPending,
                  ]}
                >
                  {getSpotStatusLabel(selectedSpot)}
                </Text>
              </View>
            </View>

            <View style={styles.actionRow}>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={`${selectedSpot.title} 상세 보기`}
                onPress={() => onOpenSpotDetail?.(selectedSpot.contentId)}
                style={({ pressed }) => [styles.secondaryButton, pressed ? styles.pressed : null]}
              >
                <Text style={styles.secondaryButtonText}>상세 보기</Text>
              </Pressable>

              <Pressable
                accessibilityRole="button"
                accessibilityLabel={`${selectedSpot.title} 도장 탭에서 찍기`}
                onPress={() => onOpenStamp?.(selectedSpot.contentId)}
                style={({ pressed }) => [styles.primaryButton, pressed ? styles.pressed : null]}
              >
                <Text style={styles.primaryButtonText}>도장 탭에서 찍기</Text>
              </Pressable>

              <Pressable
                accessibilityRole="button"
                accessibilityLabel={`${selectedSpot.title} 카카오 길찾기`}
                onPress={() => setDirectionMessage(`${selectedSpot.title} 카카오 길찾기 준비 중`)}
                style={({ pressed }) => [styles.secondaryButton, pressed ? styles.pressed : null]}
              >
                <Text style={styles.secondaryButtonText}>카카오 길찾기</Text>
              </Pressable>
            </View>

            <View style={styles.feedbackCard}>
              <Text style={styles.feedbackLabel}>선택 상태</Text>
              <Text style={styles.feedbackText}>{directionMessage}</Text>
            </View>
          </View>
        ) : null}

        <View style={styles.sectionHead}>
          <Text style={styles.sectionTitle}>스팟 목록</Text>
          <Text style={styles.sectionMeta}>홈과 도장 탭의 동일한 mock 데이터</Text>
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
                style={({ pressed }) => [
                  styles.listItem,
                  isSelected ? styles.listItemSelected : null,
                  pressed ? styles.pressed : null,
                ]}
              >
                <Text style={styles.listIndex}>{index + 1}</Text>
                <View style={styles.listText}>
                  <Text style={styles.listTitle}>{spot.title}</Text>
                  <Text style={styles.listMeta}>{spot.address}</Text>
                  <Text style={styles.listDistance}>{spot.distanceMeters}m 떨어짐</Text>
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
                  <Text
                    style={[
                      styles.statusBadgeText,
                      getSpotStatus(spot) === 'collected'
                        ? styles.statusBadgeTextDone
                        : getSpotStatus(spot) === 'ready'
                          ? styles.statusBadgeTextReady
                          : styles.statusBadgeTextPending,
                    ]}
                  >
                    {getSpotStatusLabel(spot)}
                  </Text>
                </View>
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
  root: { flex: 1, backgroundColor: '#EEF3F8' },
  content: { paddingHorizontal: 18, paddingTop: 8, paddingBottom: 28, gap: 14 },
  topbar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  brandBlock: { flex: 1, minWidth: 0, gap: 2 },
  brand: { color: '#172033', fontSize: 26, fontWeight: '900', letterSpacing: -0.6 },
  brandCaption: { color: '#657084', fontSize: 13 },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#173C35',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: { color: '#FFFFFF', fontSize: 18, fontWeight: '900' },
  mapShell: {
    height: 460,
    borderRadius: 24,
    backgroundColor: '#DCEBF3',
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
    backgroundColor: 'rgba(255,255,255,0.68)',
  },
  gridLineVertical: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: '48%',
    width: 2,
    backgroundColor: 'rgba(255,255,255,0.68)',
  },
  roadHorizontal: {
    position: 'absolute',
    left: -24,
    right: -24,
    top: '39%',
    height: 20,
    borderRadius: 999,
    backgroundColor: 'rgba(255,255,255,0.82)',
    transform: [{ rotate: '-16deg' }],
  },
  roadDiagonalOne: {
    position: 'absolute',
    width: 430,
    height: 18,
    left: -18,
    top: '64%',
    borderRadius: 999,
    backgroundColor: 'rgba(255,255,255,0.82)',
    transform: [{ rotate: '31deg' }],
  },
  roadDiagonalTwo: {
    position: 'absolute',
    width: 300,
    height: 16,
    left: 14,
    top: '18%',
    borderRadius: 999,
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
    backgroundColor: '#FFFFFF',
    shadowColor: '#0F172A',
    shadowOpacity: 0.16,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 6 },
    elevation: 2,
  },
  pinCollected: { borderColor: '#1D8F7B' },
  pinReady: { borderColor: '#E0A21A' },
  pinPending: { borderColor: '#94A3B8' },
  pinSelected: { backgroundColor: '#FFF4D8' },
  pinText: { fontSize: 16, transform: [{ rotate: '0deg' }] },
  currentLocation: {
    position: 'absolute',
    left: 18,
    bottom: 18,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#172033',
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  currentDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#6EA8FF',
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  currentLocationText: { color: '#FFFFFF', fontSize: 12, fontWeight: '800' },
  mapHint: {
    position: 'absolute',
    top: 16,
    left: 16,
    backgroundColor: 'rgba(255,255,255,0.9)',
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  mapHintText: { color: '#35526B', fontSize: 11, fontWeight: '800' },
  sheet: {
    backgroundColor: '#FFFFFF',
    borderRadius: 22,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E7EDF4',
    gap: 12,
  },
  selectedRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  selectedText: { flex: 1, minWidth: 0, gap: 4 },
  selectedLabel: { color: '#315D9A', fontSize: 12, fontWeight: '800' },
  selectedTitle: { color: '#172033', fontSize: 20, fontWeight: '900' },
  selectedMeta: { color: '#66717F', fontSize: 13, lineHeight: 18 },
  statusBadge: {
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  statusDone: { backgroundColor: '#E6F6EA' },
  statusReady: { backgroundColor: '#FFF3D5' },
  statusPending: { backgroundColor: '#E8EEF5' },
  statusBadgeText: { color: '#207A3C', fontSize: 11, fontWeight: '800' },
  statusBadgeTextDone: { color: '#207A3C' },
  statusBadgeTextReady: { color: '#8A6400' },
  statusBadgeTextPending: { color: '#48607A' },
  actionRow: { gap: 10 },
  primaryButton: {
    backgroundColor: '#173C35',
    borderRadius: 16,
    paddingVertical: 14,
    alignItems: 'center',
  },
  primaryButtonText: { color: '#FFFFFF', fontSize: 15, fontWeight: '900' },
  secondaryButton: {
    backgroundColor: '#EEF3F8',
    borderRadius: 16,
    paddingVertical: 14,
    alignItems: 'center',
  },
  secondaryButtonText: { color: '#173C35', fontSize: 15, fontWeight: '900' },
  feedbackCard: {
    backgroundColor: '#F8FBFD',
    borderRadius: 14,
    padding: 12,
    borderWidth: 1,
    borderColor: '#E7EDF4',
  },
  feedbackLabel: { color: '#66717F', fontSize: 12, fontWeight: '800' },
  feedbackText: { color: '#172033', fontSize: 14, fontWeight: '800', marginTop: 4 },
  sectionHead: { gap: 4 },
  sectionTitle: { color: '#172033', fontSize: 18, fontWeight: '900' },
  sectionMeta: { color: '#66717F', fontSize: 13 },
  list: { gap: 10 },
  listItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: '#E7EDF4',
  },
  listItemSelected: { borderColor: '#E0A21A', backgroundColor: '#FFFDF7' },
  listIndex: { width: 28, color: '#315D9A', fontSize: 16, fontWeight: '900', textAlign: 'center' },
  listText: { flex: 1, minWidth: 0, gap: 4 },
  listTitle: { color: '#172033', fontSize: 16, fontWeight: '900' },
  listMeta: { color: '#66717F', fontSize: 13, lineHeight: 18 },
  listDistance: { color: '#14806F', fontSize: 13, fontWeight: '800' },
  listBadge: {
    borderRadius: 999,
    paddingHorizontal: 9,
    paddingVertical: 5,
  },
  pressed: { opacity: 0.82 },
});
